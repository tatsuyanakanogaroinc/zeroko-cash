import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getGoogleSheetsService } from '@/lib/google-sheets';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// サーバーサイド用のSupabaseクライアント（RLS回避）
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// 精算処理対象のデータを取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all'; // expenses, invoices, subcontracts, all
    const status = searchParams.get('status') || 'approved'; // approved, settled, paid

    let result = {
      expenses: [],
      invoices: [],
      subcontracts: []
    };

    // 経費申請データ（承認済み・未精算）
    if (type === 'all' || type === 'expenses') {
      const expenseQuery = supabaseAdmin
        .from('expenses')
        .select(`
          *,
          users:users!left(id, name, email, department_id, departments:departments!left(*)),
          categories:categories!left(*),
          projects:projects!left(*),
          events:events!left(*),
          settled_by_user:users!expenses_settled_by_fkey(name)
        `)
        .order('created_at', { ascending: false });

      if (status === 'approved') {
        expenseQuery.eq('status', 'approved');
      } else if (status === 'settled') {
        expenseQuery.eq('status', 'settled');
      }

      const { data: expenses, error: expensesError } = await expenseQuery;
      if (expensesError) throw expensesError;
      result.expenses = expenses || [];
    }

    // 請求書払い申請データ（承認済み・未支払い）
    if (type === 'all' || type === 'invoices') {
      const invoiceQuery = supabaseAdmin
        .from('invoice_payments')
        .select(`
          *,
          users:users!left(id, name, email),
          categories:categories!left(*),
          departments:departments!left(*),
          projects:projects!left(*),
          events:events!left(*),
          paid_by_user:users!invoice_payments_paid_by_fkey(name)
        `)
        .order('created_at', { ascending: false });

      if (status === 'approved') {
        invoiceQuery.eq('status', 'approved');
      } else if (status === 'paid') {
        invoiceQuery.eq('status', 'paid');
      }

      const { data: invoices, error: invoicesError } = await invoiceQuery;
      if (invoicesError) throw invoicesError;
      result.invoices = invoices || [];
    }

    // 外注契約データ（承認済み・未支払い）
    if (type === 'all' || type === 'subcontracts') {
      const subcontractQuery = supabaseAdmin
        .from('subcontracts')
        .select(`
          *,
          categories:categories!left(*),
          projects:projects!left(*),
          events:events!left(*),
          paid_by_user:users!subcontracts_paid_by_fkey(name)
        `)
        .order('created_at', { ascending: false });

      if (status === 'approved') {
        subcontractQuery.in('status', ['active', 'completed', 'pending_payment']);
      } else if (status === 'paid') {
        subcontractQuery.eq('status', 'completed').not('paid_at', 'is', null);
      }

      const { data: subcontracts, error: subcontractsError } = await subcontractQuery;
      if (subcontractsError) throw subcontractsError;
      result.subcontracts = subcontracts || [];
    }

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('精算データ取得エラー:', error);
    return NextResponse.json(
      { error: 'データの取得に失敗しました', success: false },
      { status: 500 }
    );
  }
}

// 精算・支払い処理実行
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      type, // 'settle' or 'pay'
      targetType, // 'expense', 'invoice', 'subcontract'  
      targetId,
      amount,
      processedBy,
      notes
    } = body;

    if (!type || !targetType || !targetId || !processedBy) {
      return NextResponse.json(
        { error: '必要なパラメータが不足しています', success: false },
        { status: 400 }
      );
    }

    let updateResult;

    if (type === 'settle' && targetType === 'expense') {
      // 経費申請の精算処理
      updateResult = await supabaseAdmin
        .from('expenses')
        .update({
          status: 'settled',
          settled_at: new Date().toISOString(),
          settled_by: processedBy,
          settlement_amount: amount,
          settlement_notes: notes || null
        })
        .eq('id', targetId)
        .eq('status', 'approved'); // 承認済みのもののみ精算可能

    } else if (type === 'pay' && targetType === 'invoice') {
      // 請求書払い申請の支払い処理
      updateResult = await supabaseAdmin
        .from('invoice_payments')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          paid_by: processedBy,
          paid_amount: amount,
          payment_notes: notes || null
        })
        .eq('id', targetId)
        .eq('status', 'approved'); // 承認済みのもののみ支払い可能

    } else if (type === 'pay' && targetType === 'subcontract') {
      // 外注契約の支払い処理
      updateResult = await supabaseAdmin
        .from('subcontracts')
        .update({
          paid_at: new Date().toISOString(),
          paid_by: processedBy,
          paid_amount: amount,
          payment_notes: notes || null
        })
        .eq('id', targetId)
        .in('status', ['active', 'completed', 'pending_payment']); // 有効なステータスのもののみ支払い可能

    } else {
      return NextResponse.json(
        { error: '不正な処理タイプです', success: false },
        { status: 400 }
      );
    }

    if (updateResult?.error) {
      console.error('更新エラー:', updateResult.error);
      return NextResponse.json(
        { error: '処理の実行に失敗しました', success: false },
        { status: 500 }
      );
    }

    if (updateResult?.data?.length === 0) {
      return NextResponse.json(
        { error: '対象のレコードが見つからないか、処理済みです', success: false },
        { status: 404 }
      );
    }

    // スプレッドシートを更新
    try {
      const sheetsService = getGoogleSheetsService();
      const currentDate = new Date().toLocaleDateString('ja-JP');
      
      const updateData = {
        支払日: currentDate,
        ステータス: type === 'settle' ? '精算済み' : '支払い済み',
        備考: notes ? `${type === 'settle' ? '精算' : '支払い'}処理: ${notes}` : `${type === 'settle' ? '精算' : '支払い'}処理完了`
      };

      const sheetUpdated = await sheetsService.updateUnifiedExpenseInSheet(targetId, updateData);
      if (!sheetUpdated) {
        console.warn(`スプレッドシートの更新に失敗: ${targetId}`);
      }
    } catch (sheetError) {
      console.error('スプレッドシート更新エラー:', sheetError);
      // スプレッドシート更新の失敗は処理全体を止めない
    }

    const actionName = type === 'settle' ? '精算' : '支払い';
    return NextResponse.json({
      success: true,
      message: `${actionName}処理が完了しました`
    });

  } catch (error) {
    console.error('精算・支払い処理エラー:', error);
    return NextResponse.json(
      { error: '処理の実行中にエラーが発生しました', success: false },
      { status: 500 }
    );
  }
}
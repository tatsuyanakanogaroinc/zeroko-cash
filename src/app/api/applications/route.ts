import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// サーバーサイド用のSupabaseクライアント（RLS回避）
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function GET(request: NextRequest) {
  try {
    console.log('申請データAPI: データ取得開始');

    // 経費申請データを取得（関連データも含める）
    const { data: expenseData, error: expenseError } = await supabaseAdmin
      .from('expenses')
      .select(`
        *,
        events:events!left(*),
        categories:categories!left(*),
        users:users!left(department_id, departments:departments!left(*))
      `)
      .order('created_at', { ascending: false });

    // 請求書払い申請データを取得（関連データも含める）
    const { data: invoiceData, error: invoiceError } = await supabaseAdmin
      .from('invoice_payments')
      .select(`
        *,
        events:events!left(*),
        categories:categories!left(*),
        departments:departments!left(*),
        projects:projects!left(*)
      `)
      .order('created_at', { ascending: false });

    console.log('API経費データ:', { count: expenseData?.length || 0, error: expenseError });
    console.log('API請求書データ:', { count: invoiceData?.length || 0, error: invoiceError });

    if (expenseError) {
      console.error('経費データ取得エラー:', expenseError);
    }
    if (invoiceError) {
      console.error('請求書データ取得エラー:', invoiceError);
    }

    // データを正規化
    const normalizedExpenses = (expenseData || []).map(expense => ({
      ...expense,
      type: 'expense' as const,
      date: expense.expense_date,
      payment_method: expense.payment_method || 'personal_cash'
    }));

    const normalizedInvoices = (invoiceData || []).map(invoice => ({
      ...invoice,
      type: 'invoice' as const,
      date: invoice.invoice_date,
      payment_method: '請求書払い'
    }));

    // 統合してソート
    const combinedData = [...normalizedExpenses, ...normalizedInvoices]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    console.log('API統合データ:', combinedData.length, '件');

    return NextResponse.json({
      success: true,
      data: combinedData,
      expenses: expenseData?.length || 0,
      invoices: invoiceData?.length || 0
    });

  } catch (error) {
    console.error('申請データAPI エラー:', error);
    return NextResponse.json(
      { error: 'データの取得に失敗しました', success: false },
      { status: 500 }
    );
  }
}

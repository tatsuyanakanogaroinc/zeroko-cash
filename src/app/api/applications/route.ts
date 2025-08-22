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
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('Service Key存在確認:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

    // 経費申請データを取得（関連データも含める）
    const { data: expenseData, error: expenseError } = await supabaseAdmin
      .from('expenses')
      .select(`
        *,
        events:events!left(*),
        categories:categories!left(*),
        projects:projects!left(*),
        departments:departments!left(*),
        users:users!left(id, name, email)
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
        projects:projects!left(*),
        users:users!left(id, name, email)
      `)
      .order('created_at', { ascending: false });

    console.log('API経費データ:', { count: expenseData?.length || 0, error: expenseError });
    console.log('API請求書データ:', { count: invoiceData?.length || 0, error: invoiceError });
    
    // 取得したデータのサンプルを表示（デバッグ用）
    if (expenseData && expenseData.length > 0) {
      console.log('経費データサンプル:', {
        id: expenseData[0].id,
        department_id: expenseData[0].department_id,
        departments: expenseData[0].departments,
        user_id: expenseData[0].user_id
      });
    }

    if (expenseError) {
      console.error('経費データ取得エラー:', expenseError);
      // department_idフィールドが存在しないエラーをチェック
      if (expenseError.message && expenseError.message.includes('department_id')) {
        console.error('!!! マイグレーション必要 !!! expenses テーブルに department_id フィールドがありません');
      }
    }
    if (invoiceError) {
      console.error('請求書データ取得エラー:', invoiceError);
      if (invoiceError.message && invoiceError.message.includes('department_id')) {
        console.error('!!! マイグレーション必要 !!! invoice_payments テーブルに department_id フィールドがありません');
      }
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
    
    // マイグレーション関連エラーの特別処理
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('department_id') || errorMessage.includes('project_id')) {
      return NextResponse.json(
        { 
          error: 'データベースのマイグレーションが必要です。expenses/invoice_paymentsテーブルにdepartment_idフィールドがありません。', 
          success: false,
          migration_needed: true
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'データの取得に失敗しました', success: false },
      { status: 500 }
    );
  }
}

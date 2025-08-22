import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'ユーザーIDが必要です' }, { status: 400 });
    }

    console.log('ダッシュボードデータ取得開始:', { userId });

    // 経費申請データを取得（関連データも含める）
    const { data: expenses, error: expenseError } = await supabaseAdmin
      .from('expenses')
      .select(`
        *,
        events:events!left(*),
        categories:categories!left(*),
        departments:departments!left(*),
        projects:projects!left(*),
        users:users!left(id, name, email)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (expenseError) {
      console.error('経費申請データ取得エラー:', expenseError);
      return NextResponse.json({ error: '経費申請データの取得に失敗しました' }, { status: 500 });
    }

    // 請求書払い申請データを取得（関連データも含める）
    const { data: invoices, error: invoiceError } = await supabaseAdmin
      .from('invoice_payments')
      .select(`
        *,
        events:events!left(*),
        categories:categories!left(*),
        departments:departments!left(*),
        projects:projects!left(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (invoiceError) {
      console.error('請求書払い申請データ取得エラー:', invoiceError);
      return NextResponse.json({ error: '請求書払い申請データの取得に失敗しました' }, { status: 500 });
    }

    console.log('データ取得成功:', {
      expenses: expenses.length,
      invoices: invoices.length
    });

    // 経費申請データの正規化
    const normalizedExpenses = expenses.map(expense => ({
      ...expense,
      type: 'expense',
      date: expense.expense_date,
      payment_method: expense.payment_method || 'personal_cash',
      vendor_name: null,
      invoice_date: null,
      due_date: null
    }));

    // 請求書払い申請データの正規化
    const normalizedInvoices = invoices.map(invoice => ({
      ...invoice,
      type: 'invoice',
      date: invoice.invoice_date,
      payment_method: '請求書払い',
      expense_date: invoice.invoice_date,
      event_name: invoice.events?.name || null
    }));

    // 統合してソート（作成日時の降順）
    const combinedData = [...normalizedExpenses, ...normalizedInvoices]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({
      applications: combinedData,
      stats: {
        pending: combinedData.filter(app => app.status === 'pending').length,
        approved: combinedData.filter(app => app.status === 'approved').length,
        rejected: combinedData.filter(app => app.status === 'rejected').length,
        totalThisMonth: combinedData.reduce((sum, app) => sum + app.amount, 0)
      }
    });

  } catch (error) {
    console.error('ダッシュボードデータ取得エラー:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// サーバーサイドでサービスロールキーを使用
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function GET(request: Request) {
  try {
    // すべての経費データを取得
    const { data: expenses, error: expensesError } = await supabaseAdmin
      .from('expenses')
      .select(`
        *,
        users(name, department_id),
        categories(name),
        events(name)
      `)
      .order('created_at', { ascending: false });

    if (expensesError) {
      console.error('Expenses fetch error:', expensesError);
    }

    // すべての請求書データを取得
    const { data: invoicePayments, error: invoicesError } = await supabaseAdmin
      .from('invoice_payments')
      .select(`
        *,
        users(name, department_id),
        departments(name),
        projects(name),
        categories(name),
        events(name)
      `)
      .order('created_at', { ascending: false });

    if (invoicesError) {
      console.error('Invoice payments fetch error:', invoicesError);
    }

    // 部門ごとの集計
    const departmentExpenses: Record<string, number> = {};
    const projectExpenses: Record<string, number> = {};
    const eventExpenses: Record<string, number> = {};

    // 経費データを集計
    (expenses || []).forEach(expense => {
      if (expense.users?.department_id) {
        departmentExpenses[expense.users.department_id] = 
          (departmentExpenses[expense.users.department_id] || 0) + expense.amount;
      }
      if (expense.event_id) {
        eventExpenses[expense.event_id] = 
          (eventExpenses[expense.event_id] || 0) + expense.amount;
      }
    });

    // 請求書データを集計
    (invoicePayments || []).forEach(invoice => {
      if (invoice.department_id) {
        departmentExpenses[invoice.department_id] = 
          (departmentExpenses[invoice.department_id] || 0) + invoice.amount;
      }
      if (invoice.project_id) {
        projectExpenses[invoice.project_id] = 
          (projectExpenses[invoice.project_id] || 0) + invoice.amount;
      }
      if (invoice.event_id) {
        eventExpenses[invoice.event_id] = 
          (eventExpenses[invoice.event_id] || 0) + invoice.amount;
      }
    });

    return NextResponse.json({
      expenses: expenses || [],
      invoicePayments: invoicePayments || [],
      departmentExpenses,
      projectExpenses,
      eventExpenses
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

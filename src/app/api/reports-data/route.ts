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
    // マスタデータを並行して取得
    const [expensesResult, invoicesResult, departmentsResult, projectsResult, eventsResult, categoriesResult] = await Promise.all([
      // すべての経費データを取得
      supabaseAdmin
        .from('expenses')
        .select(`
          *,
          users(name, department_id),
          categories(name),
          events(name)
        `)
        .order('created_at', { ascending: false }),
      
      // すべての請求書データを取得
      supabaseAdmin
        .from('invoice_payments')
        .select(`
          *,
          users(name, department_id),
          departments(name),
          projects(name),
          categories(name),
          events(name)
        `)
        .order('created_at', { ascending: false }),
      
      // 部門データを取得
      supabaseAdmin
        .from('departments')
        .select('*')
        .order('name'),
      
      // プロジェクトデータを取得
      supabaseAdmin
        .from('projects')
        .select('*')
        .order('name'),
      
      // イベントデータを取得
      supabaseAdmin
        .from('events')
        .select('*')
        .order('name'),
      
      // カテゴリデータを取得
      supabaseAdmin
        .from('categories')
        .select('*')
        .order('name')
    ]);

    const { data: expenses, error: expensesError } = expensesResult;
    const { data: invoicePayments, error: invoicesError } = invoicesResult;
    const { data: departments, error: departmentsError } = departmentsResult;
    const { data: projects, error: projectsError } = projectsResult;
    const { data: events, error: eventsError } = eventsResult;
    const { data: categories, error: categoriesError } = categoriesResult;

    if (expensesError) {
      console.error('Expenses fetch error:', expensesError);
    }
    if (invoicesError) {
      console.error('Invoice payments fetch error:', invoicesError);
    }
    if (departmentsError) {
      console.error('Departments fetch error:', departmentsError);
    }
    if (projectsError) {
      console.error('Projects fetch error:', projectsError);
    }
    if (eventsError) {
      console.error('Events fetch error:', eventsError);
    }
    if (categoriesError) {
      console.error('Categories fetch error:', categoriesError);
    }

    // 各種集計
    const departmentExpenses: Record<string, number> = {};
    const projectExpenses: Record<string, number> = {};
    const eventExpenses: Record<string, number> = {};
    const categoryExpenses: Record<string, number> = {};

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
      if (expense.category_id) {
        categoryExpenses[expense.category_id] = 
          (categoryExpenses[expense.category_id] || 0) + expense.amount;
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
      if (invoice.category_id) {
        categoryExpenses[invoice.category_id] = 
          (categoryExpenses[invoice.category_id] || 0) + invoice.amount;
      }
    });

    return NextResponse.json({
      expenses: expenses || [],
      invoicePayments: invoicePayments || [],
      departments: departments || [],
      projects: projects || [],
      events: events || [],
      categories: categories || [],
      departmentExpenses,
      projectExpenses,
      eventExpenses,
      categoryExpenses
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

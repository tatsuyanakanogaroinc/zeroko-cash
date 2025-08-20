import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { calculateProratedAmountForDeletion } from '@/lib/recurring-payment-utils';

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
    const [expensesResult, invoicesResult, subcontractsResult, departmentsResult, projectsResult, eventsResult, categoriesResult] = await Promise.all([
      // 承認された経費データのみを取得
      supabaseAdmin
        .from('expenses')
        .select(`
          *,
          users(name, department_id),
          categories(name),
          events(name)
        `)
        .eq('status', 'approved')
        .order('created_at', { ascending: false }),
      
      // 承認された請求書データのみを取得
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
        .eq('status', 'approved')
        .order('created_at', { ascending: false }),
      
      // 外注データを取得（進行中・完了済み・支払い済みのもの）
      supabaseAdmin
        .from('subcontracts')
        .select(`
          *,
          departments(name),
          projects(name),
          events(name),
          categories(name),
          users!subcontracts_responsible_user_id_fkey(name, department_id)
        `)
        .in('status', ['active', 'completed', 'pending_payment'])
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
    const { data: subcontracts, error: subcontractsError } = subcontractsResult;
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
    if (subcontractsError) {
      console.error('Subcontracts fetch error:', subcontractsError);
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
      // 申請時に選択した部門に計上
      if (expense.department_id) {
        departmentExpenses[expense.department_id] = 
          (departmentExpenses[expense.department_id] || 0) + expense.amount;
      }
      
      // イベントに計上
      if (expense.event_id) {
        eventExpenses[expense.event_id] = 
          (eventExpenses[expense.event_id] || 0) + expense.amount;
        
        // 申請時の部門がない場合のみ、イベントに紐づく部門にも計上
        if (!expense.department_id) {
          const eventData = (events || []).find(event => event.id === expense.event_id);
          if (eventData?.department_id) {
            departmentExpenses[eventData.department_id] = 
              (departmentExpenses[eventData.department_id] || 0) + expense.amount;
          }
        }
      }
      
      // カテゴリに計上
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

    // 外注データを集計（レポート用：契約された全額を計上）
    (subcontracts || []).forEach(subcontract => {
      let amount = 0;

      if (subcontract.payment_type === 'recurring') {
        // 定期支払いの場合は総額を計上（契約ベース）
        amount = subcontract.total_amount || subcontract.contract_amount;
      } else {
        // 一回払いの場合
        if (subcontract.status === 'completed' || subcontract.status === 'pending_payment' || subcontract.status === 'active') {
          // すべてのステータスで契約額を計上（契約ベース）
          amount = subcontract.contract_amount;
        }
      }
      
      if (subcontract.department_id) {
        departmentExpenses[subcontract.department_id] = 
          (departmentExpenses[subcontract.department_id] || 0) + amount;
      }
      if (subcontract.project_id) {
        projectExpenses[subcontract.project_id] = 
          (projectExpenses[subcontract.project_id] || 0) + amount;
      }
      if (subcontract.event_id) {
        eventExpenses[subcontract.event_id] = 
          (eventExpenses[subcontract.event_id] || 0) + amount;
      }
      if (subcontract.category_id) {
        categoryExpenses[subcontract.category_id] = 
          (categoryExpenses[subcontract.category_id] || 0) + amount;
      }
    });

    return NextResponse.json({
      expenses: expenses || [],
      invoicePayments: invoicePayments || [],
      subcontracts: subcontracts || [],
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

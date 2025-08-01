import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');

    let query = supabaseAdmin
      .from('expenses')
      .select(`
        *,
        categories(name),
        events(name),
        users(name)
      `)
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      user_id,
      expense_date,
      amount,
      category_id,
      event_id,
      description,
      payment_method,
      department_id,
      project_id,
    } = body;

    // ユーザー情報を取得して部門IDを自動設定
    let finalDepartmentId = department_id;
    let finalProjectId = project_id;
    
    if (!finalDepartmentId) {
      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('department_id')
        .eq('id', user_id)
        .single();
      
      if (userData?.department_id) {
        finalDepartmentId = userData.department_id;
      }
    }

    const { data, error } = await supabaseAdmin
      .from('expenses')
      .insert({
        user_id,
        expense_date,
        amount,
        category_id,
        event_id,
        description,
        payment_method,
        department_id: finalDepartmentId,
        project_id: finalProjectId,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

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
      // department_id, project_id は expenses テーブルには存在しないため無視
    } = body;

    console.log('Creating expense:', {
      user_id,
      expense_date,
      amount,
      category_id,
      event_id,
      description,
      payment_method
    });
    
    // ユーザーが存在するかチェック
    const { data: existingUser, error: userCheckError } = await supabaseAdmin
      .from('users')
      .select('id, name, email')
      .eq('id', user_id)
      .single();
    
    console.log('User check result:', { existingUser, userCheckError });
    
    if (userCheckError || !existingUser) {
      console.error('User not found in database:', user_id);
      return NextResponse.json({ 
        error: `User not found: ${user_id}. Please log out and log in again.` 
      }, { status: 400 });
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

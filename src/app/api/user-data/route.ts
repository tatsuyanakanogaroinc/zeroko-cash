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
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    return await getUserData(userId);
  } catch (error) {
    console.error('GET API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId } = body;
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    return await getUserData(userId);
  } catch (error) {
    console.error('POST API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function getUserData(userId: string) {
  try {
    // ユーザー情報を取得
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('User fetch error:', userError);
      return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
    }

    // 経費データを取得
    const { data: expenses, error: expensesError } = await supabaseAdmin
      .from('expenses')
      .select(`
        *,
        categories(name),
        events(name)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (expensesError) {
      console.warn('Expenses fetch error:', expensesError);
    }

    // 請求書データを取得
    const { data: invoicePayments, error: invoicesError } = await supabaseAdmin
      .from('invoice_payments')
      .select(`
        *,
        departments(name),
        projects(name),
        categories(name),
        events(name)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (invoicesError) {
      console.warn('Invoice payments fetch error:', invoicesError);
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('getUserData error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

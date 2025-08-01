import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

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
    const { name, email, role, department_id } = body;

    const initial_password = Math.random().toString(36).slice(-8); // ランダムな8文字のパスワード生成
    
    // デフォルト値を設定
    const userToInsert = {
      name,
      email,
      role: role || 'user',
      department_id: department_id || null,
      password_changed: false,
      initial_password
    };

    console.log('Inserting user data:', userToInsert);
    
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert(userToInsert)
      .select()
      .single();

    if (error) {
      console.error('Supabase createUser error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      
      // より詳細なエラーメッセージを作成
      let errorMessage = 'ユーザーの作成に失敗しました';
      if (error.code === '23505') {
        errorMessage = 'このメールアドレスは既に使用されています';
      } else if (error.code === '23502') {
        errorMessage = '必須フィールドが不足しています';
      } else if (error.message) {
        errorMessage = `エラー: ${error.message}`;
      }
      
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'ユーザーデータの取得に失敗しました' }, { status: 500 });
    }

    // TODO: サーバーサイドでのメール送信は後で実装
    console.log(`ユーザー作成完了: ${data.email}, 初期パスワード: ${initial_password}`);

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', id)
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

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', id);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

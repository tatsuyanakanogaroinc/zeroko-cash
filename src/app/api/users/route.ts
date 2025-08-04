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

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, role, department_id } = body;

    // よりセキュアな初期パスワードを生成（12文字、英数字と記号を含む）
    const generateSecurePassword = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
      let password = '';
      for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return password;
    };
    const initial_password = generateSecurePassword();
    
    // まずSupabaseの認証システムにユーザーを作成
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: initial_password,
      email_confirm: true, // メール確認をスキップ
      user_metadata: {
        name,
        role: role || 'user'
      }
    });

    if (authError) {
      console.error('Supabase auth createUser error:', authError);
      let errorMessage = 'ユーザーの認証アカウント作成に失敗しました';
      if (authError.message.includes('already registered')) {
        errorMessage = 'このメールアドレスは既に登録されています';
      }
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }

    if (!authUser.user) {
      return NextResponse.json({ error: '認証ユーザーの作成に失敗しました' }, { status: 500 });
    }

    // 次にusersテーブルにユーザー情報を保存（auth.userのIDを使用）
    const userToInsert = {
      id: authUser.user.id, // 認証システムのUUIDを使用
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
      console.error('Supabase users table insert error:', error);
      
      // 認証ユーザーの作成に成功したが、usersテーブルへの挿入に失敗した場合、
      // 認証ユーザーも削除する（クリーンアップ）
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      
      // より詳細なエラーメッセージを作成
      let errorMessage = 'ユーザー情報の保存に失敗しました';
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
      // 同様にクリーンアップ
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      return NextResponse.json({ error: 'ユーザーデータの取得に失敗しました' }, { status: 500 });
    }

    console.log(`ユーザー作成完了: ${data.email}, 初期パスワード: ${initial_password}`);

    return NextResponse.json({
      ...data,
      initial_password // フロントエンドで表示するために初期パスワードを返す
    });
  } catch (error) {
    console.error('User creation error:', error);
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

    // まずusersテーブルから削除
    const { error: dbError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', id);
    
    if (dbError) {
      console.error('Database user deletion error:', dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    // 次に認証システムからも削除
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
    
    if (authError) {
      console.error('Auth user deletion error:', authError);
      // 認証ユーザーの削除に失敗しても、DBのユーザーは削除済みなので警告として継続
      console.warn('認証ユーザーの削除に失敗しましたが、ユーザー情報は削除されました');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('User deletion error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

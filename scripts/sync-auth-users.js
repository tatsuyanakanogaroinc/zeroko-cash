const { createClient } = require('@supabase/supabase-js');

// 環境変数を読み込み
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function syncAuthUsers() {
  console.log('🔍 認証ユーザーとデータベースの同期を開始...');

  try {
    // 1. Supabase Authの全ユーザーを取得
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('認証ユーザー取得エラー:', authError);
      return;
    }

    console.log(`📊 認証ユーザー数: ${authUsers.users.length}`);

    // 2. usersテーブルの全ユーザーを取得
    const { data: dbUsers, error: dbError } = await supabase
      .from('users')
      .select('*');

    if (dbError) {
      console.error('DBユーザー取得エラー:', dbError);
      return;
    }

    console.log(`📊 DBユーザー数: ${dbUsers.length}`);

    // 3. 認証ユーザーそれぞれについて、usersテーブルに存在するかチェック
    for (const authUser of authUsers.users) {
      const dbUser = dbUsers.find(u => u.id === authUser.id);
      
      if (!dbUser) {
        console.log(`❌ 認証ユーザーがDBに存在しません: ${authUser.id} (${authUser.email})`);
        
        // usersテーブルにユーザーを作成
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert({
            id: authUser.id,
            email: authUser.email,
            name: authUser.email.split('@')[0] || 'ユーザー',
            role: 'user',
            password_changed: true,
            created_at: authUser.created_at
          })
          .select()
          .single();

        if (insertError) {
          console.error(`❌ ユーザー作成失敗 ${authUser.id}:`, insertError);
        } else {
          console.log(`✅ ユーザー作成成功: ${newUser.name} (${newUser.email})`);
        }
      } else {
        console.log(`✅ ユーザー同期済み: ${dbUser.name} (${dbUser.email})`);
      }
    }

    // 4. 逆に、usersテーブルにあるが認証ユーザーにないものをチェック
    for (const dbUser of dbUsers) {
      const authUser = authUsers.users.find(u => u.id === dbUser.id);
      
      if (!authUser) {
        console.log(`⚠️  DBユーザーに対応する認証ユーザーがありません: ${dbUser.name} (${dbUser.email})`);
      }
    }

    console.log('✅ 同期完了');

  } catch (error) {
    console.error('同期エラー:', error);
  }
}

syncAuthUsers();

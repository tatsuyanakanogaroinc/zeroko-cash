require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase環境変数が設定されていません');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkAndResetAuth() {
  try {
    console.log('=== 中野達哉のアカウント情報確認 ===');
    
    // usersテーブルから情報を取得
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('name', '中野達哉')
      .single();
    
    if (userError) {
      console.error('ユーザー取得エラー:', userError);
      return;
    }
    
    console.log('📊 ユーザー情報:', userData);
    
    // Supabase Authから全ユーザーリストを取得して確認
    console.log('\n=== Supabase Auth確認 ===');
    const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('Authユーザーリスト取得エラー:', listError);
      return;
    }
    
    console.log(`📋 Auth内ユーザー数: ${authUsers.users.length}`);
    
    // 中野達哉のメールアドレスに一致するAuthユーザーを探す
    const targetAuthUser = authUsers.users.find(user => 
      user.email === userData.email || user.id === userData.id
    );
    
    if (!targetAuthUser) {
      console.log('❌ 対応するAuthユーザーが見つかりません');
      console.log('🔧 新しいAuthユーザーを作成します...');
      
      // 新しいパスワード
      const newPassword = 'Nakano2024!';
      
      // Authユーザーを新規作成
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: newPassword,
        email_confirm: true,
        user_metadata: {
          name: '中野達哉'
        }
      });
      
      if (createError) {
        console.error('❌ Authユーザー作成エラー:', createError);
        return;
      }
      
      console.log('✅ 新しいAuthユーザーを作成しました:', newUser.user.id);
      
      // usersテーブルのIDを更新
      const { error: updateError } = await supabase
        .from('users')
        .update({ id: newUser.user.id })
        .eq('name', '中野達哉');
      
      if (updateError) {
        console.error('❌ usersテーブル更新エラー:', updateError);
        return;
      }
      
      console.log('✅ usersテーブルのIDを更新しました');
      console.log('📧 メールアドレス:', userData.email);
      console.log('🔑 新しいパスワード:', newPassword);
      
    } else {
      console.log('✅ 対応するAuthユーザーが見つかりました:', targetAuthUser.id);
      
      // パスワードをリセット
      const newPassword = 'Nakano2024!';
      
      const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
        targetAuthUser.id,
        {
          password: newPassword
        }
      );
      
      if (updateError) {
        console.error('❌ パスワード更新エラー:', updateError);
        return;
      }
      
      console.log('✅ パスワードリセット完了');
      console.log('📧 メールアドレス:', userData.email);
      console.log('🔑 新しいパスワード:', newPassword);
    }
    
    console.log('\n⚠️  セキュリティのため、ログイン後すぐにパスワードを変更してください');
    
  } catch (error) {
    console.error('予期しないエラー:', error);
  }
}

checkAndResetAuth();

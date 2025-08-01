require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  console.error('Supabase環境変数が設定されていません');
  process.exit(1);
}

// 管理者用クライアント
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// 一般ユーザー用クライアント（ログインテスト用）
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

async function verifyLoginStatus() {
  try {
    console.log('=== Authユーザー詳細確認 ===');
    
    // 中野達哉のusersテーブル情報を取得
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('name', '中野達哉')
      .single();
    
    if (userError) {
      console.error('❌ ユーザー取得エラー:', userError);
      return;
    }
    
    console.log('📊 usersテーブル情報:', userData);
    
    // 対応するAuthユーザーを取得
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userData.id);
    
    if (authError) {
      console.error('❌ Authユーザー取得エラー:', authError);
      return;
    }
    
    console.log('🔐 Authユーザー情報:');
    console.log('  - ID:', authUser.user.id);
    console.log('  - Email:', authUser.user.email);
    console.log('  - Email確認済み:', authUser.user.email_confirmed_at ? '✅' : '❌');
    console.log('  - 作成日時:', authUser.user.created_at);
    console.log('  - 最終ログイン:', authUser.user.last_sign_in_at || 'なし');
    
    console.log('\n=== ログインテスト ===');
    
    // 実際にログインを試行
    const { data: loginData, error: loginError } = await supabaseClient.auth.signInWithPassword({
      email: userData.email,
      password: 'Nakano2024!'
    });
    
    if (loginError) {
      console.error('❌ ログインエラー:', loginError.message);
      
      // よくあるエラーの対処法を提示
      if (loginError.message.includes('Invalid login credentials')) {
        console.log('\n🔧 対処法:');
        console.log('1. パスワードを再設定します...');
        
        // パスワードを再設定
        const { error: resetError } = await supabaseAdmin.auth.admin.updateUserById(
          userData.id,
          {
            password: 'NewPass2024!',
            email_confirm: true
          }
        );
        
        if (resetError) {
          console.error('❌ パスワード再設定エラー:', resetError);
        } else {
          console.log('✅ パスワードを再設定しました');
          console.log('🔑 新しいパスワード: NewPass2024!');
          
          // 再度ログインテスト
          const { data: retryLogin, error: retryError } = await supabaseClient.auth.signInWithPassword({
            email: userData.email,
            password: 'NewPass2024!'
          });
          
          if (retryError) {
            console.error('❌ 再ログインもエラー:', retryError.message);
          } else {
            console.log('✅ 再ログイン成功!');
            console.log('👤 ログインユーザー:', retryLogin.user.email);
          }
        }
      }
    } else {
      console.log('✅ ログイン成功!');
      console.log('👤 ログインユーザー:', loginData.user.email);
    }
    
    // サインアウト
    await supabaseClient.auth.signOut();
    
  } catch (error) {
    console.error('予期しないエラー:', error);
  }
}

verifyLoginStatus();

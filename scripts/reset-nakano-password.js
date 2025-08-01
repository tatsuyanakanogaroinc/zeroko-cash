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

async function resetNakanoPassword() {
  try {
    console.log('中野達哉のアカウントパスワードをリセットしています...');
    
    // 新しいパスワードを生成
    const newPassword = 'TempPass2024!';
    
    // 中野達哉のユーザーIDを取得
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('name', '中野達哉')
      .single();
    
    if (userError) {
      console.error('ユーザー取得エラー:', userError);
      return;
    }
    
    console.log('対象ユーザー:', userData);
    
    // Supabase Authでパスワードを更新
    const { data: authData, error: authError } = await supabase.auth.admin.updateUserById(
      userData.id,
      {
        password: newPassword
      }
    );
    
    if (authError) {
      console.error('パスワード更新エラー:', authError);
      return;
    }
    
    console.log('✅ パスワードリセット完了');
    console.log('📧 メールアドレス:', userData.email);
    console.log('🔑 新しいパスワード:', newPassword);
    console.log('');
    console.log('⚠️  セキュリティのため、ログイン後すぐにパスワードを変更してください');
    
  } catch (error) {
    console.error('予期しないエラー:', error);
  }
}

resetNakanoPassword();

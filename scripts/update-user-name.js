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

async function updateUserName() {
  console.log('ユーザー名を更新中...');

  try {
    // t.nakano@ei-shin.com のユーザー名を「中野達哉」に更新
    const { data, error } = await supabase
      .from('users')
      .update({ name: '中野達哉' })
      .eq('email', 't.nakano@ei-shin.com')
      .select();

    if (error) {
      console.error('更新エラー:', error);
      return;
    }

    console.log('ユーザー名が正常に更新されました:');
    console.log(data);

    // 更新後の確認
    const { data: updatedUser, error: fetchError } = await supabase
      .from('users')
      .select('id, name, email, role')
      .eq('email', 't.nakano@ei-shin.com')
      .single();

    if (fetchError) {
      console.error('確認エラー:', fetchError);
      return;
    }

    console.log('\n=== 更新後のユーザー情報 ===');
    console.log('ID:', updatedUser.id);
    console.log('名前:', updatedUser.name);
    console.log('メール:', updatedUser.email);
    console.log('役割:', updatedUser.role);

  } catch (error) {
    console.error('処理エラー:', error);
  }
}

updateUserName();

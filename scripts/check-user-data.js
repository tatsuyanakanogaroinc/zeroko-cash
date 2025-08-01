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

async function checkUserData() {
  console.log('ユーザーデータを確認中...');

  try {
    // 全ユーザーを取得
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, role, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('エラー:', error);
      return;
    }

    console.log('\n=== 登録済みユーザー ===');
    if (users && users.length > 0) {
      users.forEach((user, index) => {
        console.log(`${index + 1}. ID: ${user.id}`);
        console.log(`   名前: ${user.name}`);
        console.log(`   メール: ${user.email}`);
        console.log(`   役割: ${user.role}`);
        console.log(`   作成日: ${user.created_at}`);
        console.log('');
      });
    } else {
      console.log('ユーザーが見つかりません。');
    }

    // 中野達哉を探す
    const nakanoUser = users?.find(u => 
      u.name?.includes('中野') || 
      u.name?.includes('達哉') || 
      u.email?.includes('nakano')
    );

    if (nakanoUser) {
      console.log('=== 中野達哉のユーザー情報 ===');
      console.log('ID:', nakanoUser.id);
      console.log('名前:', nakanoUser.name);
      console.log('メール:', nakanoUser.email);
      console.log('役割:', nakanoUser.role);
    } else {
      console.log('中野達哉のアカウントが見つかりません。');
    }

  } catch (error) {
    console.error('データベース接続エラー:', error);
  }
}

checkUserData();

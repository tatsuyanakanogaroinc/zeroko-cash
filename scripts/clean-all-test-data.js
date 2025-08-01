const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function cleanAllTestData() {
  console.log('🧹 全テストデータを削除しています...');
  console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('Service Role Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'あり' : 'なし');

  try {
    // 保護するユーザーのメールアドレス
    const protectedUserEmail = 'tatsuya.vito.nakano@gmail.com';
    
    // 保護するユーザーを取得
    const { data: protectedUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', protectedUserEmail)
      .single();

    if (userError) {
      console.error('保護ユーザーの取得エラー:', userError);
      return;
    }

    console.log(`保護ユーザー: ${protectedUser.name} (${protectedUser.email})`);

    // 1. 経費申請を削除
    console.log('1. 経費申請を削除中...');
    const { error: expensesError } = await supabase
      .from('expenses')
      .delete()
      .neq('user_id', protectedUser.id);
    
    if (expensesError) {
      console.error('経費削除エラー:', expensesError);
    } else {
      console.log('✓ 経費申請を削除しました');
    }

    // 2. 請求書支払いを削除
    console.log('2. 請求書支払いを削除中...');
    const { error: invoiceError } = await supabase
      .from('invoice_payments')
      .delete()
      .neq('user_id', protectedUser.id);
    
    if (invoiceError) {
      console.error('請求書削除エラー:', invoiceError);
    } else {
      console.log('✓ 請求書支払いを削除しました');
    }

    // 3. プロジェクトを削除
    console.log('3. プロジェクトを削除中...');
    const { error: projectsError } = await supabase
      .from('projects')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // ダミーID（実際には全削除）
    
    if (projectsError) {
      console.error('プロジェクト削除エラー:', projectsError);
    } else {
      console.log('✓ プロジェクトを削除しました');
    }

    // 4. イベントを削除
    console.log('4. イベントを削除中...');
    const { error: eventsError } = await supabase
      .from('events')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // ダミーID（実際には全削除）
    
    if (eventsError) {
      console.error('イベント削除エラー:', eventsError);
    } else {
      console.log('✓ イベントを削除しました');
    }

    // 5. 保護ユーザーの部門参照をクリア
    console.log('5. 保護ユーザーの部門参照をクリア中...');
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({ department_id: null })
      .eq('id', protectedUser.id);

    if (userUpdateError) {
      console.error('ユーザー更新エラー:', userUpdateError);
    } else {
      console.log('✓ 保護ユーザーの部門参照をクリアしました');
    }

    // 6. 他のユーザーを削除（保護ユーザー以外）
    console.log('6. テストユーザーを削除中...');
    const { error: deleteUsersError } = await supabase
      .from('users')
      .delete()
      .neq('email', protectedUserEmail);
    
    if (deleteUsersError) {
      console.error('ユーザー削除エラー:', deleteUsersError);
    } else {
      console.log('✓ テストユーザーを削除しました');
    }

    // 7. 部門をすべて削除（基本部門は後で再作成）
    console.log('7. 既存部門を削除中...');
    const { error: deptError } = await supabase
      .from('departments')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // ダミーID（実際には全削除）
    
    if (deptError) {
      console.error('部門削除エラー:', deptError);
    } else {
      console.log('✓ 既存部門を削除しました');
    }

    // 8. 基本部門を再作成
    console.log('8. 基本部門を作成中...');
    const basicDepartments = [
      { name: 'Marketing', budget: 1000000 },
      { name: 'Sales', budget: 800000 },
      { name: 'Coach', budget: 600000 },
      { name: 'Curriculum', budget: 500000 },
      { name: 'Back office', budget: 400000 },
      { name: 'Management', budget: 1200000 }
    ];

    const { error: createDeptError } = await supabase
      .from('departments')
      .insert(basicDepartments);

    if (createDeptError) {
      console.error('部門作成エラー:', createDeptError);
    } else {
      console.log('✓ 基本部門を作成しました');
    }

    // 9. 勘定科目以外のサンプルデータをクリア（カテゴリは保持）
    console.log('9. データベースクリーンアップ完了');

    console.log('🎉 全テストデータの削除が完了しました！');
    console.log('残存データ:');
    console.log(`- ユーザー: ${protectedUser.name} (${protectedUser.email})`);
    console.log('- 基本部門: Marketing, Sales, Coach, Curriculum, Back office, Management');
    console.log('- 勘定科目: 既存のものをそのまま保持');

  } catch (error) {
    console.error('予期しないエラー:', error);
  }
}

cleanAllTestData();

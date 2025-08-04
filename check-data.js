require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkData() {
  try {
    console.log('🔍 データベースの内容を確認中...\n');
    
    // 1. ユーザー一覧を確認
    console.log('=== ユーザー一覧 ===');
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('*');
    
    if (usersError) {
      console.error('ユーザー取得エラー:', usersError);
      return;
    }
    
    console.log('usersテーブルの構造:', Object.keys(users[0] || {}));
    users.forEach(user => {
      console.log(`- ${user.name || user.full_name || 'unnamed'} (${user.email}) - ID: ${user.id}`);
      console.log('  ユーザーのすべてのフィールド:', user);
    });
    
    console.log(`\n合計 ${users.length} ユーザー\n`);
    
    // 2. 経費申請データを確認
    console.log('=== 経費申請データ ===');
    const { data: expenses, error: expensesError } = await supabaseAdmin
      .from('expenses')
      .select('id, user_id, description, amount, status, created_at')
      .order('created_at', { ascending: false });
    
    if (expensesError) {
      console.error('経費申請取得エラー:', expensesError);
    } else {
      if (expenses.length === 0) {
        console.log('経費申請データがありません');
      } else {
        expenses.forEach(expense => {
          const user = users.find(u => u.id === expense.user_id);
          console.log(`- ${expense.description} (¥${expense.amount}) - ${expense.status} - ユーザー: ${user?.full_name || expense.user_id} - 作成日: ${expense.created_at}`);
        });
      }
      console.log(`\n合計 ${expenses.length} 経費申請\n`);
    }
    
    // 3. 請求書払い申請データを確認
    console.log('=== 請求書払い申請データ ===');
    const { data: invoices, error: invoicesError } = await supabaseAdmin
      .from('invoice_payments')
      .select('id, user_id, description, amount, status, created_at')
      .order('created_at', { ascending: false });
    
    if (invoicesError) {
      console.error('請求書払い申請取得エラー:', invoicesError);
    } else {
      if (invoices.length === 0) {
        console.log('請求書払い申請データがありません');
      } else {
        invoices.forEach(invoice => {
          const user = users.find(u => u.id === invoice.user_id);
          console.log(`- ${invoice.description} (¥${invoice.amount}) - ${invoice.status} - ユーザー: ${user?.full_name || invoice.user_id} - 作成日: ${invoice.created_at}`);
        });
      }
      console.log(`\n合計 ${invoices.length} 請求書払い申請\n`);
    }
    
    // 4. 認証ユーザー一覧を確認
    console.log('=== 認証システムのユーザー ===');
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      console.error('認証ユーザー取得エラー:', authError);
    } else {
      authUsers.users.forEach(authUser => {
        console.log(`- ${authUser.email} - ID: ${authUser.id} - 最終ログイン: ${authUser.last_sign_in_at}`);
      });
      console.log(`\n合計 ${authUsers.users.length} 認証ユーザー\n`);
    }
    
  } catch (error) {
    console.error('エラー:', error);
  }
}

checkData();

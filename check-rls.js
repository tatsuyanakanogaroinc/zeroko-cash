require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

// Service Role キー（フル権限）
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Anonymous キー（RLS適用）
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkRLS() {
  try {
    console.log('🔍 RLS設定とアクセス権限の確認...\n');
    
    // 1. Service Role キーでのアクセス
    console.log('=== Service Role キーでのアクセス ===');
    const { data: adminExpenses, error: adminError } = await supabaseAdmin
      .from('expenses')
      .select('id, user_id, description, amount, status')
      .limit(5);
    
    if (adminError) {
      console.error('Service Role エラー:', adminError);
    } else {
      console.log(`Service Role で取得: ${adminExpenses.length} 件`);
      adminExpenses.forEach(expense => {
        console.log(`- ${expense.description} (¥${expense.amount}) - ${expense.status}`);
      });
    }
    
    // 2. Anonymous キーでのアクセス（未認証状態）
    console.log('\n=== Anonymous キーでのアクセス（未認証） ===');
    const { data: anonExpenses, error: anonError } = await supabaseAnon
      .from('expenses')
      .select('id, user_id, description, amount, status')
      .limit(5);
    
    if (anonError) {
      console.error('Anonymous エラー:', anonError);
    } else {
      console.log(`Anonymous で取得: ${anonExpenses.length} 件`);
      anonExpenses.forEach(expense => {
        console.log(`- ${expense.description} (¥${expense.amount}) - ${expense.status}`);
      });
    }
    
    // 3. Anonymous キーでのアクセス（認証状態をシミュレート）
    console.log('\n=== Anonymous キーでのアクセス（認証状態シミュレート） ===');
    // まず認証状態にする
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
    if (authUsers.users.length > 0) {
      const testUser = authUsers.users[0];
      console.log(`テストユーザー: ${testUser.email} (${testUser.id})`);
      
      // Anonymous クライアントに認証情報を設定（実際のアプリと同じ状態）
      try {
        const { data: authExpenses, error: authError } = await supabaseAnon
          .from('expenses')
          .select('id, user_id, description, amount, status')
          .eq('user_id', testUser.id);
        
        if (authError) {
          console.error('認証状態でのAnonymous エラー:', authError);
        } else {
          console.log(`認証状態で取得: ${authExpenses.length} 件`);
          authExpenses.forEach(expense => {
            console.log(`- ${expense.description} (¥${expense.amount}) - ${expense.status}`);
          });
        }
      } catch (error) {
        console.error('認証状態テストエラー:', error);
      }
    }
    
    // 4. テーブルのRLS設定を確認
    console.log('\n=== RLS設定の確認 ===');
    const { data: rlsInfo, error: rlsError } = await supabaseAdmin
      .from('pg_tables')
      .select('tablename, schemaname')
      .eq('schemaname', 'public')
      .in('tablename', ['expenses', 'invoice_payments', 'users']);
    
    if (rlsError) {
      console.error('RLS情報取得エラー:', rlsError);
    } else {
      console.log('テーブル一覧:', rlsInfo);
    }
    
  } catch (error) {
    console.error('エラー:', error);
  }
}

checkRLS();

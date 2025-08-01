const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkCurrentData() {
  console.log('📊 現在のデータベース状況を確認中...');

  try {
    // ユーザー一覧
    console.log('\n👥 ユーザー一覧:');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');
    
    if (usersError) {
      console.error('ユーザー取得エラー:', usersError);
    } else {
      users.forEach(user => {
        console.log(`- ${user.name} (${user.email}) [ID: ${user.id}]`);
      });
    }

    // 部門一覧
    console.log('\n🏢 部門一覧:');
    const { data: departments, error: deptError } = await supabase
      .from('departments')
      .select('*');
    
    if (deptError) {
      console.error('部門取得エラー:', deptError);
    } else {
      departments.forEach(dept => {
        console.log(`- ${dept.name} (予算: ¥${dept.budget?.toLocaleString()}) [ID: ${dept.id}]`);
      });
    }

    // イベント一覧
    console.log('\n📅 イベント一覧:');
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*');
    
    if (eventsError) {
      console.error('イベント取得エラー:', eventsError);
    } else {
      console.log(`${events.length}個のイベント`);
      events.forEach(event => {
        console.log(`- ${event.name} [${event.start_date} - ${event.end_date}]`);
      });
    }

    // プロジェクト一覧
    console.log('\n💼 プロジェクト一覧:');
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*');
    
    if (projectsError) {
      console.error('プロジェクト取得エラー:', projectsError);
    } else {
      console.log(`${projects.length}個のプロジェクト`);
      projects.forEach(project => {
        console.log(`- ${project.name} (予算: ¥${project.budget?.toLocaleString()})`);
      });
    }

    // 経費申請一覧
    console.log('\n💰 経費申請一覧:');
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('*');
    
    if (expensesError) {
      console.error('経費取得エラー:', expensesError);
    } else {
      console.log(`${expenses.length}件の経費申請`);
    }

    // 請求書支払い一覧
    console.log('\n📄 請求書支払い一覧:');
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoice_payments')
      .select('*');
    
    if (invoicesError) {
      console.error('請求書取得エラー:', invoicesError);
    } else {
      console.log(`${invoices.length}件の請求書支払い`);
    }

  } catch (error) {
    console.error('予期しないエラー:', error);
  }
}

checkCurrentData();

const { createClient } = require('@supabase/supabase-js')

// 環境変数からSupabaseの設定を読み込み
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDatabase() {
  console.log('=== データベース状況確認 ===\n')
  
  // ユーザー数確認
  try {
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, name, role')
    
    if (usersError) {
      console.error('ユーザー取得エラー:', usersError)
    } else {
      console.log(`👥 ユーザー数: ${users.length}`)
      users.forEach(user => {
        console.log(`  - ${user.name} (${user.email}) [${user.role}] ID: ${user.id}`)
      })
    }
  } catch (error) {
    console.error('ユーザー確認エラー:', error)
  }
  
  console.log()
  
  // 部門数確認
  try {
    const { data: departments, error: depError } = await supabase
      .from('departments')
      .select('id, name, budget')
    
    if (depError) {
      console.error('部門取得エラー:', depError)
    } else {
      console.log(`部門数: ${departments.length}`)
      departments.forEach(dept => {
        console.log(`  - ${dept.name} (予算: ${dept.budget})`)
      })
    }
  } catch (error) {
    console.error('部門確認エラー:', error)
  }
  
  console.log()
  
  // プロジェクト数確認
  try {
    const { data: projects, error: projError } = await supabase
      .from('projects')
      .select('id, name, budget')
    
    if (projError) {
      console.error('プロジェクト取得エラー:', projError)
    } else {
      console.log(`プロジェクト数: ${projects.length}`)
      projects.forEach(proj => {
        console.log(`  - ${proj.name} (予算: ${proj.budget})`)
      })
    }
  } catch (error) {
    console.error('プロジェクト確認エラー:', error)
  }
  
  console.log()
  
  // イベント数確認
  try {
    const { data: events, error: eventError } = await supabase
      .from('events')
      .select('id, name, budget')
    
    if (eventError) {
      console.error('イベント取得エラー:', eventError)
    } else {
      console.log(`イベント数: ${events.length}`)
      events.forEach(event => {
        console.log(`  - ${event.name} (予算: ${event.budget})`)
      })
    }
  } catch (error) {
    console.error('イベント確認エラー:', error)
  }
  
  console.log()
  
  // カテゴリ数確認
  try {
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('id, name')
    
    if (catError) {
      console.error('カテゴリ取得エラー:', catError)
    } else {
      console.log(`カテゴリ数: ${categories.length}`)
      categories.forEach(cat => {
        console.log(`  - ${cat.name}`)
      })
    }
  } catch (error) {
    console.error('カテゴリ確認エラー:', error)
  }
}

checkDatabase()

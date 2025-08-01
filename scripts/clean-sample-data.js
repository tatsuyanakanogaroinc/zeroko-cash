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

// 保護するユーザーのメールアドレス
const PROTECTED_USER_EMAIL = 'tatsuya.vito.nakano@gmail.com'

async function cleanSampleData() {
  console.log('=== サンプルデータクリーンアップ開始 ===\n')
  
  try {
    // 1. 保護ユーザーのIDを取得
    const { data: protectedUser, error: userError } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('email', PROTECTED_USER_EMAIL)
      .single()
    
    if (userError || !protectedUser) {
      console.error('保護ユーザーが見つかりません:', userError)
      return
    }
    
    console.log(`✅ 保護ユーザー確認: ${protectedUser.name} (${protectedUser.email})`)
    console.log(`   ID: ${protectedUser.id}\n`)
    
    // 2. 外部キー制約を考慮して経費データを最初に削除
    console.log('💰 経費データを削除中...')
    const { data: deletedExpenses, error: deleteExpensesError } = await supabase
      .from('expenses')
      .delete()
      .gte('id', '00000000-0000-0000-0000-000000000000') // 全ての経費を削除
      .select('id')
    
    if (deleteExpensesError) {
      console.error('経費削除エラー:', deleteExpensesError)
    } else {
      console.log(`   削除された経費数: ${deletedExpenses?.length || 0}`)
    }
    
    console.log()
    
    // 3. サンプルユーザーを削除（保護ユーザー以外）
    console.log('📝 サンプルユーザーを削除中...')
    const { data: deletedUsers, error: deleteUsersError } = await supabase
      .from('users')
      .delete()
      .neq('email', PROTECTED_USER_EMAIL)
      .select('name, email')
    
    if (deleteUsersError) {
      console.error('ユーザー削除エラー:', deleteUsersError)
    } else {
      console.log(`   削除されたユーザー数: ${deletedUsers?.length || 0}`)
      deletedUsers?.forEach(user => {
        console.log(`   - ${user.name} (${user.email})`)
      })
    }
    
    console.log()
    
    // 4. 保護ユーザーの部門参照をnullに設定
    console.log('👤 保護ユーザーの部門参照を解除中...')
    const { error: updateUserError } = await supabase
      .from('users')
      .update({ department_id: null })
      .eq('id', protectedUser.id)
    
    if (updateUserError) {
      console.error('ユーザー部門参照解除エラー:', updateUserError)
    } else {
      console.log('   ✅ 保護ユーザーの部門参照を解除しました')
    }
    
    console.log()
    
    // 5. 部門を削除
    console.log('🏢 部門を削除中...')
    const { data: deletedDepartments, error: deleteDepartmentsError } = await supabase
      .from('departments')
      .delete()
      .gte('id', '00000000-0000-0000-0000-000000000000') // 全ての部門を削除
      .select('name')
    
    if (deleteDepartmentsError) {
      console.error('部門削除エラー:', deleteDepartmentsError)
    } else {
      console.log(`   削除された部門数: ${deletedDepartments?.length || 0}`)
      deletedDepartments?.forEach(dept => {
        console.log(`   - ${dept.name}`)
      })
    }
    
    console.log()
    
    // 5. プロジェクトを削除
    console.log('📊 プロジェクトを削除中...')
    const { data: deletedProjects, error: deleteProjectsError } = await supabase
      .from('projects')
      .delete()
      .gte('id', '00000000-0000-0000-0000-000000000000') // 全てのプロジェクトを削除
      .select('name')
    
    if (deleteProjectsError) {
      console.error('プロジェクト削除エラー:', deleteProjectsError)
    } else {
      console.log(`   削除されたプロジェクト数: ${deletedProjects?.length || 0}`)
      deletedProjects?.forEach(proj => {
        console.log(`   - ${proj.name}`)
      })
    }
    
    console.log()
    
    // 6. イベントを削除
    console.log('🎉 イベントを削除中...')
    const { data: deletedEvents, error: deleteEventsError } = await supabase
      .from('events')
      .delete()
      .gte('id', '00000000-0000-0000-0000-000000000000') // 全てのイベントを削除
      .select('name')
    
    if (deleteEventsError) {
      console.error('イベント削除エラー:', deleteEventsError)
    } else {
      console.log(`   削除されたイベント数: ${deletedEvents?.length || 0}`)
      deletedEvents?.forEach(event => {
        console.log(`   - ${event.name}`)
      })
    }
    
    console.log()
    
    // 7. カテゴリを削除
    console.log('📂 カテゴリを削除中...')
    const { data: deletedCategories, error: deleteCategoriesError } = await supabase
      .from('categories')
      .delete()
      .gte('id', '00000000-0000-0000-0000-000000000000') // 全てのカテゴリを削除
      .select('name')
    
    if (deleteCategoriesError) {
      console.error('カテゴリ削除エラー:', deleteCategoriesError)
    } else {
      console.log(`   削除されたカテゴリ数: ${deletedCategories?.length || 0}`)
      deletedCategories?.forEach(cat => {
        console.log(`   - ${cat.name}`)
      })
    }
    
    console.log()
    
    console.log('\n=== クリーンアップ完了 ===')
    console.log(`✅ 保護されたユーザー: ${protectedUser.name}`)
    console.log('✅ サンプルデータがクリーンアップされました')
    console.log('✅ 新しいクリーンな状態でアプリケーションを開始できます')
    
  } catch (error) {
    console.error('クリーンアップ中にエラーが発生しました:', error)
  }
}

// 確認プロンプト
console.log('⚠️  警告: このスクリプトはサンプルデータを削除します')
console.log(`✅ 保護されるユーザー: ${PROTECTED_USER_EMAIL}`)
console.log('❌ 削除されるデータ: その他全てのユーザー、全ての部門、プロジェクト、イベント、カテゴリ、経費')
console.log('')

const readline = require('readline')
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

rl.question('続行しますか？ (yes/no): ', (answer) => {
  if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
    cleanSampleData().finally(() => {
      rl.close()
    })
  } else {
    console.log('キャンセルされました。')
    rl.close()
  }
})

const { createClient } = require('@supabase/supabase-js')

// 環境変数からSupabaseの設定を読み込み
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase環境変数が設定されていません（管理者権限）')
  console.error('必要な環境変数: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// サービスロールキーを使用した管理者クライアント（RLSをバイパス）
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function restoreNakanoAccount() {
  console.log('=== 中野達哉アカウント復活開始 ===\n')
  
  try {
    // 1. まず経営部門のIDを取得
    console.log('1. 経営部門のID取得中...')
    const { data: departments, error: deptError } = await supabase
      .from('departments')
      .select('id, name')
      .eq('name', '経営')
      .single()
    
    if (deptError || !departments) {
      console.error('経営部門が見つかりません:', deptError)
      console.log('利用可能な部門を確認中...')
      
      const { data: allDepts } = await supabase
        .from('departments')
        .select('id, name')
      
      console.log('利用可能な部門:')
      allDepts?.forEach(dept => {
        console.log(`  - ${dept.name} (ID: ${dept.id})`)
      })
      return
    }
    
    console.log(`✅ 経営部門確認: ${departments.name} (ID: ${departments.id})`)
    
    // 2. 既存の中野達哉アカウントがあるかチェック
    console.log('\n2. 既存アカウントの確認中...')
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'tatsuya.vito.nakano@gmail.com')
      .single()
    
    if (existingUser) {
      console.log(`⚠️  既存のアカウントが見つかりました: ${existingUser.name}`)
      console.log(`   現在の権限: ${existingUser.role}`)
      console.log(`   現在の部門ID: ${existingUser.department_id}`)
      
      // 既存アカウントを更新
      console.log('\n3. 既存アカウントを更新中...')
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          name: '中野達哉',
          role: 'admin',
          department_id: departments.id,
          password_changed: true
        })
        .eq('id', existingUser.id)
        .select()
        .single()
      
      if (updateError) {
        console.error('アカウント更新エラー:', updateError)
        return
      }
      
      console.log('✅ アカウントが正常に更新されました')
      console.log(`   名前: ${updatedUser.name}`)
      console.log(`   メール: ${updatedUser.email}`)
      console.log(`   権限: ${updatedUser.role}`)
      console.log(`   部門ID: ${updatedUser.department_id}`)
      
    } else {
      // 新規アカウント作成
      console.log('\n3. 新規アカウント作成中...')
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          name: '中野達哉',
          email: 'tatsuya.vito.nakano@gmail.com',
          role: 'admin',
          department_id: departments.id,
          password_changed: true,
          initial_password: null // 管理者なので初期パスワードは不要
        })
        .select()
        .single()
      
      if (createError) {
        console.error('アカウント作成エラー:', createError)
        return
      }
      
      console.log('✅ 新規アカウントが正常に作成されました')
      console.log(`   名前: ${newUser.name}`)
      console.log(`   メール: ${newUser.email}`)
      console.log(`   権限: ${newUser.role}`)
      console.log(`   部門ID: ${newUser.department_id}`)
      console.log(`   ユーザーID: ${newUser.id}`)
    }
    
    // 4. 最終確認
    console.log('\n4. 最終確認中...')
    const { data: finalUser } = await supabase
      .from('users')
      .select(`
        id, name, email, role, department_id,
        departments(name)
      `)
      .eq('email', 'tatsuya.vito.nakano@gmail.com')
      .single()
    
    console.log('\n🎉 === アカウント復活完了 ===')
    console.log(`👤 ユーザー: ${finalUser.name}`)
    console.log(`📧 メール: ${finalUser.email}`)
    console.log(`👑 権限: ${finalUser.role} (管理者)`)
    console.log(`🏢 部門: ${finalUser.departments?.name || '未設定'}`)
    console.log(`🆔 ユーザーID: ${finalUser.id}`)
    console.log('\n✅ ログイン可能な状態です')
    
  } catch (error) {
    console.error('予期しないエラーが発生しました:', error)
  }
}

// 確認プロンプト
console.log('⚠️  以下の操作を実行します:')
console.log('✅ 中野達哉アカウントの復活（管理者権限）')
console.log('✅ 部門: 経営')
console.log('✅ メール: tatsuya.vito.nakano@gmail.com')
console.log('')

const readline = require('readline')
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

rl.question('続行しますか？ (yes/no): ', (answer) => {
  if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
    restoreNakanoAccount().finally(() => {
      rl.close()
    })
  } else {
    console.log('キャンセルされました。')
    rl.close()
  }
})

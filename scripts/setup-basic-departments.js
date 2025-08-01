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

// 保護するユーザーのメールアドレス
const PROTECTED_USER_EMAIL = 'tatsuya.vito.nakano@gmail.com'

async function setupBasicDepartments() {
  console.log('=== 基本部門セットアップ開始 ===\n')
  
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
    
    // 2. 保護ユーザーの部門参照をnullに設定
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
    
    // 3. 既存の全ての部門を削除
    console.log('🏢 既存部門を削除中...')
    const { data: deletedDepartments, error: deleteDepartmentsError } = await supabase
      .from('departments')
      .delete()
      .gte('id', '00000000-0000-0000-0000-000000000000')
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
    
    // 4. 既存のイベントを削除
    console.log('🎉 既存イベントを削除中...')
    const { data: deletedEvents, error: deleteEventsError } = await supabase
      .from('events')
      .delete()
      .gte('id', '00000000-0000-0000-0000-000000000000')
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
    
    // 5. 基本的な部門を追加
    console.log('🏢 基本部門を追加中...')
    
    const basicDepartments = [
      {
        name: 'マーケティング',
        budget: 800000
      },
      {
        name: 'セールス',
        budget: 1000000
      },
      {
        name: 'コーチ',
        budget: 500000
      },
      {
        name: 'カリキュラム',
        budget: 600000
      },
      {
        name: 'バックオフィス',
        budget: 400000
      },
      {
        name: '経営',
        budget: 1200000
      }
    ]
    
    const { data: insertedDepartments, error: insertDepartmentsError } = await supabase
      .from('departments')
      .insert(basicDepartments)
      .select()
    
    if (insertDepartmentsError) {
      console.error('部門追加エラー:', insertDepartmentsError)
    } else {
      console.log(`   追加された部門数: ${insertedDepartments?.length || 0}`)
      insertedDepartments?.forEach(dept => {
        console.log(`   - ${dept.name} (予算: ¥${dept.budget.toLocaleString()})`)
      })
    }
    
    console.log('\n=== セットアップ完了 ===')
    console.log(`✅ 保護されたユーザー: ${protectedUser.name}`)
    console.log('✅ 基本部門が設定されました')
    console.log('✅ 全てのイベントが削除されました')
    console.log('✅ クリーンな状態で運用開始できます')
    
  } catch (error) {
    console.error('セットアップ中にエラーが発生しました:', error)
  }
}

// 確認プロンプト
console.log('⚠️  警告: このスクリプトは以下を実行します')
console.log(`✅ 保護されるユーザー: ${PROTECTED_USER_EMAIL}`)
console.log('❌ 削除されるデータ: 既存の全部門、全イベント')
console.log('✅ 追加されるデータ: 基本部門（マーケティング、セールス、コーチ、カリキュラム、バックオフィス、経営）')
console.log('')

const readline = require('readline')
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

rl.question('続行しますか？ (yes/no): ', (answer) => {
  if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
    setupBasicDepartments().finally(() => {
      rl.close()
    })
  } else {
    console.log('キャンセルされました。')
    rl.close()
  }
})

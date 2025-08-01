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

async function completeCleanupAndSetup() {
  console.log('=== 完全クリーンアップと基本勘定科目設定 ===\n')
  
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
    
    // 3. 残りの部門を削除
    console.log('🏢 残りの部門を削除中...')
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
    
    // 4. 残りのイベントを削除
    console.log('🎉 残りのイベントを削除中...')
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
    
    // 5. 基本的な勘定科目（カテゴリ）を追加
    console.log('📂 基本勘定科目を追加中...')
    
    const basicCategories = [
      {
        name: '交通費',
        description: '電車、バス、タクシー、航空券などの交通費',
        requires_receipt: true
      },
      {
        name: '会議費',
        description: '会議室代、打ち合わせ時の飲食費など',
        requires_receipt: true
      },
      {
        name: '通信費',
        description: '電話代、インターネット代、携帯電話代など',
        requires_receipt: true
      },
      {
        name: '宿泊費',
        description: 'ホテル代、宿泊施設利用料など',
        requires_receipt: true
      },
      {
        name: '食事・接待費',
        description: '取引先との食事代、接待費など',
        requires_receipt: true
      },
      {
        name: '書籍・研修費',
        description: '業務関連書籍、セミナー参加費、研修費など',
        requires_receipt: true
      },
      {
        name: '事務用品',
        description: '文房具、オフィス用品など',
        requires_receipt: true
      },
      {
        name: 'ソフトウェア・ツール',
        description: 'アプリケーション購入費、SaaS利用料など',
        requires_receipt: true
      },
      {
        name: '広告・宣伝費',
        description: '広告出稿費、チラシ印刷代など',
        requires_receipt: true
      },
      {
        name: 'その他',
        description: '上記に該当しないその他の経費',
        requires_receipt: false
      }
    ]
    
    const { data: insertedCategories, error: insertCategoriesError } = await supabase
      .from('categories')
      .insert(basicCategories)
      .select()
    
    if (insertCategoriesError) {
      console.error('勘定科目追加エラー:', insertCategoriesError)
    } else {
      console.log(`   追加された勘定科目数: ${insertedCategories?.length || 0}`)
      insertedCategories?.forEach(cat => {
        console.log(`   - ${cat.name}`)
      })
    }
    
    console.log('\n=== クリーンアップと基本設定完了 ===')
    console.log(`✅ 保護されたユーザー: ${protectedUser.name}`)
    console.log('✅ 全ての部門・イベント・プロジェクトが削除されました')
    console.log('✅ 基本的な勘定科目が追加されました')
    console.log('✅ クリーンな状態でアプリケーションを開始できます')
    
  } catch (error) {
    console.error('処理中にエラーが発生しました:', error)
  }
}

// 確認プロンプト
console.log('⚠️  警告: このスクリプトは以下を実行します')
console.log(`✅ 保護されるユーザー: ${PROTECTED_USER_EMAIL}`)
console.log('❌ 削除されるデータ: 全ての部門、イベント、プロジェクト')
console.log('✅ 追加されるデータ: 基本的な勘定科目（10種類）')
console.log('')

const readline = require('readline')
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

rl.question('続行しますか？ (yes/no): ', (answer) => {
  if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
    completeCleanupAndSetup().finally(() => {
      rl.close()
    })
  } else {
    console.log('キャンセルされました。')
    rl.close()
  }
})

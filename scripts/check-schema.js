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

async function checkSchema() {
  console.log('=== データベーススキーマ確認 ===\n')
  
  try {
    // departmentsテーブルの構造を確認
    console.log('🏢 部門テーブル構造を確認中...')
    
    // 空のレコードを挿入してエラーメッセージからスキーマを推測
    const { error: deptInsertError } = await supabase
      .from('departments')
      .insert({})
      .select()
    
    if (deptInsertError) {
      console.log('部門テーブル挿入エラー（スキーマ確認用）:', deptInsertError)
    }
    
    console.log()
    
    // eventsテーブルの構造を確認
    console.log('🎉 イベントテーブル構造を確認中...')
    
    const { error: eventInsertError } = await supabase
      .from('events')
      .insert({})
      .select()
    
    if (eventInsertError) {
      console.log('イベントテーブル挿入エラー（スキーマ確認用）:', eventInsertError)
    }
    
    console.log()
    
    // projectsテーブルの構造を確認
    console.log('📊 プロジェクトテーブル構造を確認中...')
    
    const { error: projectInsertError } = await supabase
      .from('projects')
      .insert({})
      .select()
    
    if (projectInsertError) {
      console.log('プロジェクトテーブル挿入エラー（スキーマ確認用）:', projectInsertError)
    }
    
    console.log()
    
    // 実際のスキーマ情報を取得しようとする
    console.log('📋 詳細スキーマ情報を取得中...')
    
    // PostgreSQLの情報スキーマクエリを試す
    const { data: schemaData, error: schemaError } = await supabase
      .rpc('get_table_schema', { table_name: 'departments' })
    
    if (schemaError) {
      console.log('スキーマ取得エラー:', schemaError)
      
      // 代替方法: 既存のレコードの構造を見てみる
      console.log('\n代替方法: サンプルレコードでテスト挿入...')
      
      // 最小限のデータでテスト
      const testDepartment = {
        name: 'テスト部門',
        budget: 100000
      }
      
      const { error: testError } = await supabase
        .from('departments')
        .insert(testDepartment)
        .select()
      
      if (testError) {
        console.log('テスト挿入エラー:', testError)
        
        // responsible_user_id を試してみる
        console.log('\nresponsible_user_id を試してみる...')
        const testDepartment2 = {
          name: 'テスト部門2',
          responsible_user_id: 'd0ec4dac-a36d-454b-9ae6-da1ef6f7c55f',
          budget: 100000
        }
        
        const { error: testError2 } = await supabase
          .from('departments')
          .insert(testDepartment2)
          .select()
        
        if (testError2) {
          console.log('responsible_user_id テストエラー:', testError2)
        } else {
          console.log('✅ responsible_user_id が正しいフィールド名のようです')
        }
      } else {
        console.log('✅ manager_id は不要、name と budget のみで挿入可能')
      }
    }
    
  } catch (error) {
    console.error('スキーマ確認中にエラーが発生しました:', error)
  }
}

checkSchema()

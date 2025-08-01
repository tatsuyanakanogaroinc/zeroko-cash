const { createClient } = require('@supabase/supabase-js')

// 環境変数からSupabaseの設定を読み込み
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase環境変数が設定されていません')
  process.exit(1)
}

// サービスロールキーを使用した管理者クライアント（RLSをバイパス）
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function updateRLSPolicies() {
  console.log('=== RLSポリシー更新 ===\n')
  
  try {
    // SQLを実行してRLSポリシーを更新
    console.log('1. RLSポリシーを更新中...')
    
    // ユーザーテーブルのポリシーを更新
    const { error: userPolicyError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        -- 既存のポリシーを削除
        DROP POLICY IF EXISTS "Users can view own profile" ON users;
        DROP POLICY IF EXISTS "Users can update own profile" ON users;
        
        -- 新しいシンプルなポリシーを作成
        CREATE POLICY "Enable read access for authenticated users" ON users
        FOR SELECT USING (auth.uid() IS NOT NULL);
        
        CREATE POLICY "Enable update for users based on id" ON users
        FOR UPDATE USING (auth.uid()::text = id);
      `
    }).catch(() => {
      // RPCが存在しない場合は別の方法を試す
      console.log('RPC方式が利用できません。別の方法を試します...')
      return { error: 'RPC not available' }
    })
    
    if (userPolicyError) {
      console.log('⚠️  RLSポリシーの自動更新ができませんでした')
      console.log('Supabaseダッシュボードで手動で更新してください')
    } else {
      console.log('✅ RLSポリシー更新成功')
    }
    
    // 2. 追加のサンプルデータを作成
    console.log('\n2. 追加のサンプルデータを作成中...')
    
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', 'tatsuya.vito.nakano@gmail.com')
      .single()
    
    const { data: categories } = await supabaseAdmin
      .from('categories')
      .select('id, name')
    
    if (user && categories && categories.length > 0) {
      const sampleData = [
        {
          user_id: user.id,
          category_id: categories[0].id,
          amount: 15000,
          description: '会議費 - 顧客ミーティング',
          expense_date: '2025-01-10',
          payment_method: 'credit_card',
          status: 'approved'
        },
        {
          user_id: user.id,
          category_id: categories[0].id,
          amount: 8000,
          description: '交通費 - 出張（東京-大阪）',
          expense_date: '2025-01-15',
          payment_method: 'cash',
          status: 'pending'
        },
        {
          user_id: user.id,
          category_id: categories[0].id,
          amount: 3500,
          description: '書籍代 - 技術書購入',
          expense_date: '2025-01-20',
          payment_method: 'credit_card',
          status: 'approved'
        }
      ]
      
      const { data: newExpenses, error } = await supabaseAdmin
        .from('expenses')
        .insert(sampleData)
        .select()
      
      if (error) {
        console.error('サンプルデータ作成エラー:', error)
      } else {
        console.log(`✅ ${newExpenses.length}件のサンプル経費データを作成しました`)
      }
    }
    
    console.log('\n=== 完了 ===')
    console.log('ブラウザをリロードして、申請データが表示されることを確認してください')
    
  } catch (error) {
    console.error('予期しないエラーが発生しました:', error)
  }
}

updateRLSPolicies()

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

async function checkRLSAndData() {
  console.log('=== RLSポリシーとデータ確認 ===\n')
  
  try {
    // 1. 中野達哉のユーザー情報を取得
    console.log('1. 中野達哉のユーザー情報を確認中...')
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', 'tatsuya.vito.nakano@gmail.com')
      .single()
    
    if (userError) {
      console.error('ユーザー情報取得エラー:', userError)
      return
    }
    
    console.log('ユーザー情報:')
    console.log('- ID:', user.id)
    console.log('- 名前:', user.name)
    console.log('- 権限:', user.role)
    console.log('- 部門ID:', user.department_id)
    console.log('')
    
    // 2. 経費データの確認
    console.log('2. 経費データを確認中...')
    const { data: expenses, error: expenseError } = await supabaseAdmin
      .from('expenses')
      .select('*')
      .limit(5)
    
    if (expenseError) {
      console.error('経費データ取得エラー:', expenseError)
    } else {
      console.log(`経費データ: ${expenses.length}件取得`)
      if (expenses.length > 0) {
        console.log('サンプル:', expenses[0])
      }
    }
    console.log('')
    
    // 3. 請求書データの確認
    console.log('3. 請求書データを確認中...')
    const { data: invoices, error: invoiceError } = await supabaseAdmin
      .from('invoice_payments')
      .select('*')
      .limit(5)
    
    if (invoiceError) {
      console.error('請求書データ取得エラー:', invoiceError)
    } else {
      console.log(`請求書データ: ${invoices.length}件取得`)
      if (invoices.length > 0) {
        console.log('サンプル:', invoices[0])
      }
    }
    console.log('')
    
    // 4. サンプルデータを作成
    console.log('4. 中野達哉用のサンプルデータを作成中...')
    
    // カテゴリーを取得
    const { data: categories } = await supabaseAdmin
      .from('categories')
      .select('id, name')
      .limit(1)
    
    if (categories && categories.length > 0) {
      const sampleExpense = {
        user_id: user.id,
        category_id: categories[0].id,
        amount: 5000,
        description: 'テスト経費申請 - 中野達哉',
        expense_date: new Date().toISOString().split('T')[0],
        payment_method: 'credit_card',
        status: 'pending'
      }
      
      const { data: newExpense, error: createError } = await supabaseAdmin
        .from('expenses')
        .insert(sampleExpense)
        .select()
        .single()
      
      if (createError) {
        console.error('サンプルデータ作成エラー:', createError)
      } else {
        console.log('✅ サンプル経費データ作成成功:', newExpense.id)
      }
    }
    
  } catch (error) {
    console.error('予期しないエラーが発生しました:', error)
  }
}

checkRLSAndData()

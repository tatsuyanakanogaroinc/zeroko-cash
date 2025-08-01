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

async function checkSavedData() {
  console.log('=== Supabaseに保存されているデータの確認 ===\n')
  
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
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (expenseError) {
      console.error('経費データ取得エラー:', expenseError)
    } else {
      console.log(`経費データ: ${expenses.length}件`)
      if (expenses.length > 0) {
        console.log('\n最新の経費申請:')
        expenses.slice(0, 3).forEach((expense, index) => {
          console.log(`\n  ${index + 1}. ${expense.description}`)
          console.log(`     金額: ¥${expense.amount.toLocaleString()}`)
          console.log(`     日付: ${expense.expense_date}`)
          console.log(`     ステータス: ${expense.status}`)
          console.log(`     作成日時: ${expense.created_at}`)
        })
      }
    }
    console.log('')
    
    // 3. 請求書データの確認
    console.log('3. 請求書データを確認中...')
    const { data: invoices, error: invoiceError } = await supabaseAdmin
      .from('invoice_payments')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (invoiceError) {
      console.error('請求書データ取得エラー:', invoiceError)
    } else {
      console.log(`請求書データ: ${invoices.length}件`)
      if (invoices.length > 0) {
        console.log('\n最新の請求書払い申請:')
        invoices.slice(0, 3).forEach((invoice, index) => {
          console.log(`\n  ${index + 1}. ${invoice.description}`)
          console.log(`     金額: ¥${invoice.amount.toLocaleString()}`)
          console.log(`     ベンダー: ${invoice.vendor_name}`)
          console.log(`     請求日: ${invoice.invoice_date}`)
          console.log(`     支払期日: ${invoice.due_date}`)
          console.log(`     ステータス: ${invoice.status}`)
          console.log(`     作成日時: ${invoice.created_at}`)
        })
      }
    }
    
    console.log('\n=== 確認完了 ===')
    
  } catch (error) {
    console.error('予期しないエラーが発生しました:', error)
  }
}

checkSavedData()

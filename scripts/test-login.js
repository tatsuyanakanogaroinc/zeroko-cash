const { createClient } = require('@supabase/supabase-js')

// 環境変数からSupabaseの設定を読み込み
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testLogin() {
  console.log('=== ログインテスト開始 ===\n')
  
  try {
    // ログイン試行
    console.log('1. ログイン処理を実行中...')
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'tatsuya.vito.nakano@gmail.com',
      password: 'TempPass2024!'
    })
    
    if (error) {
      console.error('❌ ログインエラー:', error.message)
      console.error('エラー詳細:', error)
      return
    }
    
    console.log('✅ ログイン成功!')
    console.log('ユーザーID:', data.user.id)
    console.log('メールアドレス:', data.user.email)
    console.log('')
    
    // usersテーブルから情報を取得
    console.log('2. ユーザー情報を取得中...')
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single()
    
    if (userError) {
      console.error('❌ ユーザー情報取得エラー:', userError)
      return
    }
    
    console.log('✅ ユーザー情報取得成功!')
    console.log('名前:', userData.name)
    console.log('権限:', userData.role)
    console.log('部門ID:', userData.department_id)
    console.log('')
    
    // セッション情報
    console.log('3. セッション情報:')
    const { data: { session } } = await supabase.auth.getSession()
    console.log('セッション有効:', !!session)
    if (session) {
      console.log('アクセストークン取得:', !!session.access_token)
    }
    
  } catch (error) {
    console.error('予期しないエラーが発生しました:', error)
  }
}

testLogin()

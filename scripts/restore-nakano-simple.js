const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://fkwohcojtlkqzqfsxlew.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrd29oY29qdGxrcXpxZnN4bGV3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDAxOTc1OCwiZXhwIjoyMDY5NTk1NTU4fQ.yg2vFFIM16Yie0WqEKBdDhzpXpz5Su-gR6M_fN1R1pA'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function restoreNakanoAccount() {
  console.log('=== 中野達哉アカウント復活開始 ===\n')
  
  try {
    // 1. 経営部門のID取得
    console.log('1. 経営部門のID取得中...')
    const { data: dept, error: deptError } = await supabase
      .from('departments')
      .select('id, name')
      .eq('name', '経営')
      .single()
    
    if (deptError || !dept) {
      console.log('経営部門が見つかりません。利用可能な部門を確認中...')
      const { data: allDepts } = await supabase
        .from('departments')
        .select('id, name')
      
      console.log('利用可能な部門:')
      allDepts?.forEach(d => {
        console.log(`  - ${d.name} (ID: ${d.id})`)
      })
      return
    }
    
    console.log(`✅ 経営部門確認: ${dept.name} (ID: ${dept.id})`)
    
    // 2. 既存アカウント確認
    console.log('\n2. 既存アカウントの確認中...')
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'tatsuya.vito.nakano@gmail.com')
      .single()
    
    if (existingUser) {
      console.log(`⚠️  既存のアカウントが見つかりました: ${existingUser.name}`)
      
      // 既存アカウントを更新
      console.log('\n3. 既存アカウントを更新中...')
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          name: '中野達哉',
          role: 'admin',
          department_id: dept.id,
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
    } else {
      // 新規アカウント作成
      console.log('\n3. 新規アカウント作成中...')
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          name: '中野達哉',
          email: 'tatsuya.vito.nakano@gmail.com',
          role: 'admin',
          department_id: dept.id,
          password_changed: true,
          initial_password: null
        })
        .select()
        .single()
      
      if (createError) {
        console.error('アカウント作成エラー:', createError)
        return
      }
      
      console.log('✅ 新規アカウントが正常に作成されました')
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

restoreNakanoAccount()

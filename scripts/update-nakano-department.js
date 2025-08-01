const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function updateNakanoDepartment() {
  console.log('=== 中野達哉アカウント部門設定 ===\n')
  
  try {
    // 1. 経営部門のID取得
    console.log('1. 経営部門のID取得中...')
    const { data: dept, error: deptError } = await supabase
      .from('departments')
      .select('id, name')
      .eq('name', '経営')
      .single()
    
    if (deptError) {
      console.error('部門取得エラー:', deptError)
      
      // 利用可能な部門を表示
      console.log('\n利用可能な部門:')
      const { data: allDepts } = await supabase
        .from('departments')
        .select('id, name')
      
      if (allDepts) {
        allDepts.forEach(d => console.log(`  - ${d.name} (ID: ${d.id})`))
      }
      return
    }
    
    console.log(`✅ 経営部門確認: ${dept.name} (ID: ${dept.id})`)
    
    // 2. 現在のユーザー情報確認
    console.log('\n2. 現在のユーザー情報確認中...')
    const { data: currentUser } = await supabase
      .from('users')
      .select('id, name, email, role, department_id')
      .eq('email', 'tatsuya.vito.nakano@gmail.com')
      .single()
    
    if (!currentUser) {
      console.error('ユーザーが見つかりません')
      return
    }
    
    console.log(`現在の情報: ${currentUser.name} (${currentUser.role})`)
    console.log(`現在の部門ID: ${currentUser.department_id || '未設定'}`)
    
    // 3. 部門を経営に更新
    console.log('\n3. 部門を経営に更新中...')
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ 
        department_id: dept.id,
        role: 'admin' // 管理者権限も確実に設定
      })
      .eq('id', currentUser.id)
      .select('id, name, email, role, department_id')
      .single()
    
    if (updateError) {
      console.error('更新エラー:', updateError)
      return
    }
    
    console.log('✅ 更新完了')
    
    // 4. 最終確認（JOINでの確認）
    console.log('\n4. 最終確認中...')
    const { data: finalUser } = await supabase
      .from('users')
      .select(`
        id, name, email, role, department_id,
        departments!inner(name)
      `)
      .eq('email', 'tatsuya.vito.nakano@gmail.com')
      .single()
    
    console.log('\n🎉 === 中野達哉アカウント復活完了 ===')
    console.log(`👤 ユーザー: ${finalUser.name}`)
    console.log(`📧 メール: ${finalUser.email}`)
    console.log(`👑 権限: ${finalUser.role} (管理者)`)
    console.log(`🏢 部門: ${finalUser.departments.name}`)
    console.log(`🆔 ユーザーID: ${finalUser.id}`)
    console.log('\n✅ ログイン可能です！管理者権限で経営部門に所属しています。')
    
  } catch (error) {
    console.error('予期しないエラー:', error)
  }
}

updateNakanoDepartment()

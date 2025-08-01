import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// .env.localファイルから環境変数を読み取る
const envLocalPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf8')
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=')
    if (key && value) {
      process.env[key.trim()] = value.trim()
    }
  })
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase環境変数が設定されていません')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '設定済み' : '未設定')
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '設定済み' : '未設定')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// マスターデータの定義
const masterData = {
  departments: [
    { name: '経営', budget: 1000000 },
    { name: 'セールス', budget: 800000 },
    { name: 'マーケ', budget: 600000 },
    { name: 'コーチ', budget: 700000 },
    { name: 'カリキュラム', budget: 500000 },
    { name: 'バックオフィス', budget: 400000 }
  ],
  
  categories: [
    { name: '交通費' },
    { name: '宿泊費' },
    { name: '食事・接待費' },
    { name: '資料代' },
    { name: '通信費' },
    { name: '事務用品' },
    { name: '備品購入' },
    { name: 'ソフトウェア' },
    { name: '研修・セミナー' },
    { name: '広告・宣伝費' },
    { name: 'その他' }
  ],
  
  events: [
    { name: '新規事業立ち上げ', budget: 2000000, start_date: '2024-01-01', end_date: '2024-12-31' },
    { name: 'マーケティング強化', budget: 1500000, start_date: '2024-02-01', end_date: '2024-11-30' },
    { name: '社員研修プログラム', budget: 800000, start_date: '2024-04-01', end_date: '2024-10-31' },
    { name: 'システム刷新', budget: 3000000, start_date: '2024-01-15', end_date: '2024-12-31' }
  ],
  
  projects: [
    { name: 'Webサイトリニューアル', code: 'WEB001' },
    { name: '新商品開発', code: 'DEV001' },
    { name: '営業システム構築', code: 'SYS001' },
    { name: '採用強化プロジェクト', code: 'HR001' }
  ]
}

async function checkCurrentData() {
  console.log('📊 現在のデータベース状況を確認中...\n')
  
  const tables = ['users', 'departments', 'categories', 'events', 'projects']
  const currentData = {}
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*')
      if (error) {
        console.error(`❌ ${table}テーブル取得エラー:`, error.message)
        currentData[table] = []
      } else {
        currentData[table] = data || []
        console.log(`${table}: ${data?.length || 0}件`)
      }
    } catch (err) {
      console.error(`❌ ${table}確認エラー:`, err.message)
      currentData[table] = []
    }
  }
  
  console.log()
  return currentData
}

async function restoreMasterData() {
  console.log('🚀 マスターデータ復活処理を開始します...\n')
  
  const currentData = await checkCurrentData()
  
  // 1. マスターユーザーを復活
  console.log('👤 マスターユーザーを確認・復活中...')
  const existingMasterUser = currentData.users.find(u => u.email === 'tatsuya.vito.nakano@gmail.com')
  
  if (!existingMasterUser) {
    try {
      const { data: masterUser, error: userError } = await supabase
        .from('users')
        .insert({
          email: 'tatsuya.vito.nakano@gmail.com',
          name: '中野達也',
          role: 'admin',
          password_changed: true,
          initial_password: 'garo0122'
        })
        .select()
        .single()
      
      if (userError) {
        console.error('❌ マスターユーザー作成エラー:', userError.message)
      } else {
        console.log('✅ マスターユーザーを作成しました')
      }
    } catch (err) {
      console.error('❌ マスターユーザー作成中にエラー:', err.message)
    }
  } else {
    console.log('✅ マスターユーザーは既に存在します')
  }
  
  // 2. 部門データ復活
  console.log('\\n🏢 部門データを復活中...')
  for (const dept of masterData.departments) {
    const exists = currentData.departments.find(d => d.name === dept.name)
    if (!exists) {
      try {
        const { error } = await supabase.from('departments').insert(dept)
        if (error) {
          console.error(`❌ 部門「${dept.name}」作成エラー:`, error.message)
        } else {
          console.log(`✅ 部門「${dept.name}」を作成しました`)
        }
      } catch (err) {
        console.error(`❌ 部門「${dept.name}」作成中にエラー:`, err.message)
      }
    } else {
      console.log(`ℹ️  部門「${dept.name}」は既に存在します`)
    }
  }
  
  // 3. カテゴリデータ復活
  console.log('\\n📂 カテゴリデータを復活中...')
  for (const cat of masterData.categories) {
    const exists = currentData.categories.find(c => c.name === cat.name)
    if (!exists) {
      try {
        const { error } = await supabase.from('categories').insert(cat)
        if (error) {
          console.error(`❌ カテゴリ「${cat.name}」作成エラー:`, error.message)
        } else {
          console.log(`✅ カテゴリ「${cat.name}」を作成しました`)
        }
      } catch (err) {
        console.error(`❌ カテゴリ「${cat.name}」作成中にエラー:`, err.message)
      }
    } else {
      console.log(`ℹ️  カテゴリ「${cat.name}」は既に存在します`)
    }
  }
  
  // 4. イベントデータ復活
  console.log('\\n🎪 イベントデータを復活中...')
  for (const event of masterData.events) {
    const exists = currentData.events.find(e => e.name === event.name)
    if (!exists) {
      try {
        const { error } = await supabase.from('events').insert(event)
        if (error) {
          console.error(`❌ イベント「${event.name}」作成エラー:`, error.message)
        } else {
          console.log(`✅ イベント「${event.name}」を作成しました`)
        }
      } catch (err) {
        console.error(`❌ イベント「${event.name}」作成中にエラー:`, err.message)
      }
    } else {
      console.log(`ℹ️  イベント「${event.name}」は既に存在します`)
    }
  }
  
  // 5. プロジェクトデータ復活
  console.log('\\n🚧 プロジェクトデータを復活中...')
  for (const project of masterData.projects) {
    const exists = currentData.projects.find(p => p.name === project.name)
    if (!exists) {
      try {
        const { error } = await supabase.from('projects').insert(project)
        if (error) {
          console.error(`❌ プロジェクト「${project.name}」作成エラー:`, error.message)
        } else {
          console.log(`✅ プロジェクト「${project.name}」を作成しました`)
        }
      } catch (err) {
        console.error(`❌ プロジェクト「${project.name}」作成中にエラー:`, err.message)
      }
    } else {
      console.log(`ℹ️  プロジェクト「${project.name}」は既に存在します`)
    }
  }
  
  console.log('\\n🎉 マスターデータ復活処理が完了しました！')
  
  // 最終状況確認
  console.log('\\n📈 復活後のデータベース状況:')
  await checkCurrentData()
}

// スクリプト実行
restoreMasterData().catch(error => {
  console.error('❌ 復活処理中にエラーが発生しました:', error)
  process.exit(1)
})

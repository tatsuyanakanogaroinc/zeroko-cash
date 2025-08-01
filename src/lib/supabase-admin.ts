import { createClient } from '@supabase/supabase-js'
import type { Database } from './supabase'

// サーバーサイド専用：サービスロールキーを使用した管理者クライアント
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Supabase環境変数が設定されていません（管理者用）')
}

// サービスロールキーを使用したクライアント（RLSをバイパス）
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// 管理者専用操作の型定義
export type AdminUser = Database['public']['Tables']['users']['Row']
export type AdminDepartment = Database['public']['Tables']['departments']['Row']
export type AdminEvent = Database['public']['Tables']['events']['Row']
export type AdminCategory = Database['public']['Tables']['categories']['Row']
export type AdminProject = Database['public']['Tables']['projects']['Row']
export type AdminExpense = Database['public']['Tables']['expenses']['Row']
export type AdminInvoicePayment = Database['public']['Tables']['invoice_payments']['Row']

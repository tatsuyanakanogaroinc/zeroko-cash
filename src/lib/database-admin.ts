import { supabaseAdmin } from './supabase-admin'
import type { Database } from './supabase'

// 管理者権限でのデータベース操作（RLSをバイパス）
type User = Database['public']['Tables']['users']['Row']
type Department = Database['public']['Tables']['departments']['Row']
type Event = Database['public']['Tables']['events']['Row']
type Category = Database['public']['Tables']['categories']['Row']
type Project = Database['public']['Tables']['projects']['Row']
type Expense = Database['public']['Tables']['expenses']['Row']
type InvoicePayment = Database['public']['Tables']['invoice_payments']['Row']

// 管理者用ユーザーサービス
export const adminUserService = {
  async getAllUsers(): Promise<User[]> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async createUserWithAdmin(user: Database['public']['Tables']['users']['Insert']): Promise<User> {
    const initial_password = Math.random().toString(36).slice(-8)
    
    const userToInsert = {
      ...user,
      role: user.role || 'user',
      password_changed: false,
      initial_password
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .insert(userToInsert)
      .select()
      .single()

    if (error) {
      console.error('Admin createUser error:', error)
      throw new Error(`ユーザー作成エラー: ${error.message}`)
    }

    console.log(`管理者権限でユーザー作成: ${data.email}, 初期パスワード: ${initial_password}`)
    return data
  },

  async deleteUserWithAdmin(id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  async bulkDeleteUsers(ids: string[]): Promise<void> {
    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .in('id', ids)
    
    if (error) throw error
  }
}

// 管理者用部門サービス
export const adminDepartmentService = {
  async getAllDepartments(): Promise<Department[]> {
    const { data, error } = await supabaseAdmin
      .from('departments')
      .select('*')
      .order('name', { ascending: true })
    
    if (error) throw error
    return data || []
  },

  async bulkCreateDepartments(departments: Database['public']['Tables']['departments']['Insert'][]): Promise<Department[]> {
    const { data, error } = await supabaseAdmin
      .from('departments')
      .insert(departments)
      .select()
    
    if (error) throw error
    return data || []
  },

  async deleteAllDepartments(): Promise<Department[]> {
    const { data, error } = await supabaseAdmin
      .from('departments')
      .delete()
      .gte('id', '00000000-0000-0000-0000-000000000000')
      .select('name')
    
    if (error) throw error
    return data || []
  }
}

// 管理者用イベントサービス
export const adminEventService = {
  async getAllEvents(): Promise<Event[]> {
    const { data, error } = await supabaseAdmin
      .from('events')
      .select('*')
      .order('start_date', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async deleteAllEvents(): Promise<Event[]> {
    const { data, error } = await supabaseAdmin
      .from('events')
      .delete()
      .gte('id', '00000000-0000-0000-0000-000000000000')
      .select('name')
    
    if (error) throw error
    return data || []
  }
}

// 管理者用経費サービス
export const adminExpenseService = {
  async getAllExpenses(): Promise<Expense[]> {
    const { data, error } = await supabaseAdmin
      .from('expenses')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async deleteAllExpenses(): Promise<void> {
    const { error } = await supabaseAdmin
      .from('expenses')
      .delete()
      .gte('id', '00000000-0000-0000-0000-000000000000')
    
    if (error) throw error
  },

  async bulkDeleteExpenses(ids: string[]): Promise<void> {
    const { error } = await supabaseAdmin
      .from('expenses')
      .delete()
      .in('id', ids)
    
    if (error) throw error
  }
}

// 管理者用請求書支払いサービス
export const adminInvoicePaymentService = {
  async getAllInvoicePayments(): Promise<InvoicePayment[]> {
    const { data, error } = await supabaseAdmin
      .from('invoice_payments')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async deleteAllInvoicePayments(): Promise<void> {
    const { error } = await supabaseAdmin
      .from('invoice_payments')
      .delete()
      .gte('id', '00000000-0000-0000-0000-000000000000')
    
    if (error) throw error
  }
}

// 管理者用カテゴリサービス
export const adminCategoryService = {
  async getAllCategories(): Promise<Category[]> {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .order('name', { ascending: true })
    
    if (error) throw error
    return data || []
  }
}

// 管理者用プロジェクトサービス
export const adminProjectService = {
  async getAllProjects(): Promise<Project[]> {
    const { data, error } = await supabaseAdmin
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async deleteAllProjects(): Promise<void> {
    const { error } = await supabaseAdmin
      .from('projects')
      .delete()
      .gte('id', '00000000-0000-0000-0000-000000000000')
    
    if (error) throw error
  }
}

// 包括的なデータクリーンアップ
export const adminCleanupService = {
  async cleanupAllData(protectedUserEmail?: string): Promise<{
    deletedExpenses: number
    deletedInvoicePayments: number  
    deletedProjects: number
    deletedEvents: Event[]
    deletedDepartments: Department[]
    protectedUser?: User
  }> {
    console.log('🧹 管理者権限でデータクリーンアップを開始...')
    
    let protectedUser: User | undefined
    
    // 保護ユーザーの処理
    if (protectedUserEmail) {
      const { data } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', protectedUserEmail)
        .single()
      
      if (data) {
        protectedUser = data
        // 保護ユーザーの部門参照を解除
        await supabaseAdmin
          .from('users')
          .update({ department_id: null })
          .eq('id', data.id)
        console.log(`✅ 保護ユーザー: ${data.name} (部門参照解除)`)
      }
    }

    // 経費削除
    const { count: expenseCount } = await supabaseAdmin
      .from('expenses')
      .delete()
      .gte('id', '00000000-0000-0000-0000-000000000000')
      .select('*', { count: 'exact', head: true })

    // 請求書支払い削除
    const { count: invoiceCount } = await supabaseAdmin
      .from('invoice_payments')
      .delete()
      .gte('id', '00000000-0000-0000-0000-000000000000')
      .select('*', { count: 'exact', head: true })

    // プロジェクト削除
    const { count: projectCount } = await supabaseAdmin
      .from('projects')
      .delete()
      .gte('id', '00000000-0000-0000-0000-000000000000')
      .select('*', { count: 'exact', head: true })

    // イベント削除
    const deletedEvents = await adminEventService.deleteAllEvents()

    // 部門削除
    const deletedDepartments = await adminDepartmentService.deleteAllDepartments()

    console.log('✅ クリーンアップ完了')
    
    return {
      deletedExpenses: expenseCount || 0,
      deletedInvoicePayments: invoiceCount || 0,
      deletedProjects: projectCount || 0,
      deletedEvents,
      deletedDepartments,
      protectedUser
    }
  }
}

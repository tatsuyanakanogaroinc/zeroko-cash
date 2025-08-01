import { supabase } from './supabase'
import type { Database } from './supabase'

type User = Database['public']['Tables']['users']['Row']
type Department = Database['public']['Tables']['departments']['Row']
type Event = Database['public']['Tables']['events']['Row']
type Category = Database['public']['Tables']['categories']['Row']
type Expense = Database['public']['Tables']['expenses']['Row']

// ユーザー関連
export const userService = {
  async getUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async getUserById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async createUser(user: Database['public']['Tables']['users']['Insert']): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert(user)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateUser(id: string, user: Database['public']['Tables']['users']['Update']): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update(user)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async deleteUser(id: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// 部門関連
export const departmentService = {
  async getDepartments(): Promise<Department[]> {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .order('name', { ascending: true })
    
    if (error) throw error
    return data || []
  },

  async getDepartmentById(id: string): Promise<Department | null> {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async createDepartment(department: Database['public']['Tables']['departments']['Insert']): Promise<Department> {
    const { data, error } = await supabase
      .from('departments')
      .insert(department)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateDepartment(id: string, department: Database['public']['Tables']['departments']['Update']): Promise<Department> {
    const { data, error } = await supabase
      .from('departments')
      .update(department)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async deleteDepartment(id: string): Promise<void> {
    const { error } = await supabase
      .from('departments')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// イベント関連
export const eventService = {
  async getEvents(): Promise<Event[]> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('start_date', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async getEventById(id: string): Promise<Event | null> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async createEvent(event: Database['public']['Tables']['events']['Insert']): Promise<Event> {
    const { data, error } = await supabase
      .from('events')
      .insert(event)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateEvent(id: string, event: Database['public']['Tables']['events']['Update']): Promise<Event> {
    const { data, error } = await supabase
      .from('events')
      .update(event)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async deleteEvent(id: string): Promise<void> {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// 勘定科目関連
export const categoryService = {
  async getCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true })
    
    if (error) throw error
    return data || []
  },

  async getCategoryById(id: string): Promise<Category | null> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async createCategory(category: Database['public']['Tables']['categories']['Insert']): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .insert(category)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateCategory(id: string, category: Database['public']['Tables']['categories']['Update']): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .update(category)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async deleteCategory(id: string): Promise<void> {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// 経費関連
export const expenseService = {
  async getExpenses(): Promise<Expense[]> {
    const { data, error } = await supabase
      .from('expenses')
      .select(`
        *,
        users(name, email),
        categories(name),
        events(name)
      `)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async getExpenseById(id: string): Promise<Expense | null> {
    const { data, error } = await supabase
      .from('expenses')
      .select(`
        *,
        users(name, email),
        categories(name),
        events(name)
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async createExpense(expense: Database['public']['Tables']['expenses']['Insert']): Promise<Expense> {
    const { data, error } = await supabase
      .from('expenses')
      .insert(expense)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateExpense(id: string, expense: Database['public']['Tables']['expenses']['Update']): Promise<Expense> {
    const { data, error } = await supabase
      .from('expenses')
      .update(expense)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async deleteExpense(id: string): Promise<void> {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  async getExpensesByUser(userId: string): Promise<Expense[]> {
    const { data, error } = await supabase
      .from('expenses')
      .select(`
        *,
        categories(name),
        events(name)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async getExpensesByDepartment(departmentId: string): Promise<Expense[]> {
    const { data, error } = await supabase
      .from('expenses')
      .select(`
        *,
        users!inner(department_id),
        categories(name),
        events(name)
      `)
      .eq('users.department_id', departmentId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }
} 
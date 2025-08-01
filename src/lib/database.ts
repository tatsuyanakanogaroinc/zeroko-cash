import { supabase } from './supabase'
import type { Database } from './supabase'

type User = Database['public']['Tables']['users']['Row']
type Department = Database['public']['Tables']['departments']['Row']
type Event = Database['public']['Tables']['events']['Row']
type Category = Database['public']['Tables']['categories']['Row']
type Project = Database['public']['Tables']['projects']['Row']
type Expense = Database['public']['Tables']['expenses']['Row']
type InvoicePayment = Database['public']['Tables']['invoice_payments']['Row']

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
    const initial_password = Math.random().toString(36).slice(-8); // ランダムな8文字のパスワード生成
    
    // デフォルト値を設定
    const userToInsert = {
      ...user,
      role: user.role || 'user',
      password_changed: false,
      initial_password
    };

    console.log('Inserting user data:', userToInsert);
    
    const { data, error } = await supabase
      .from('users')
      .insert(userToInsert)
      .select()
      .single()

    if (error) {
      console.error('Supabase createUser error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      
      // より詳細なエラーメッセージを作成
      let errorMessage = 'ユーザーの作成に失敗しました';
      if (error.code === '23505') {
        errorMessage = 'このメールアドレスは既に使用されています';
      } else if (error.code === '23502') {
        errorMessage = '必須フィールドが不足しています';
      } else if (error.message) {
        errorMessage = `エラー: ${error.message}`;
      }
      
      throw new Error(errorMessage);
    }

    if (!data) {
      throw new Error('ユーザーデータの取得に失敗しました');
    }

// ユーザーにメール通知を送信
typeof window === 'undefined' && await sendAccountCreationEmail(
      data.email,
      data.name,
      initial_password,
      'https://yourapp.com/login'
    );

    return data as User;
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

// 請求書払い関連
export const invoicePaymentService = {
  async getInvoicePayments(): Promise<InvoicePayment[]> {
    const { data, error } = await supabase
      .from('invoice_payments')
      .select(`
        *,
        users(name, email),
        departments(name),
        projects(name),
        categories(name),
        events(name)
      `)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async getInvoicePaymentById(id: string): Promise<InvoicePayment | null> {
    const { data, error } = await supabase
      .from('invoice_payments')
      .select(`
        *,
        users(name, email),
        departments(name),
        projects(name),
        categories(name),
        events(name)
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async createInvoicePayment(invoice: Database['public']['Tables']['invoice_payments']['Insert']): Promise<InvoicePayment> {
    const { data, error } = await supabase
      .from('invoice_payments')
      .insert(invoice)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateInvoicePayment(id: string, invoice: Database['public']['Tables']['invoice_payments']['Update']): Promise<InvoicePayment> {
    const { data, error } = await supabase
      .from('invoice_payments')
      .update(invoice)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async deleteInvoicePayment(id: string): Promise<void> {
    const { error } = await supabase
      .from('invoice_payments')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// プロジェクト関連
export const projectService = {
  async getProjects(): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async getProjectById(id: string): Promise<Project | null> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async createProject(project: Database['public']['Tables']['projects']['Insert']): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .insert(project)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateProject(id: string, project: Database['public']['Tables']['projects']['Update']): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .update(project)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async deleteProject(id: string): Promise<void> {
    const { error } = await supabase
      .from('projects')
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
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 型定義
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          email: string
          department_id: string | null
          role: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          department_id?: string | null
          role?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          department_id?: string | null
          role?: string
          created_at?: string
        }
      }
      departments: {
        Row: {
          id: string
          name: string
          budget: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          budget?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          budget?: number
          created_at?: string
        }
      }
      events: {
        Row: {
          id: string
          name: string
          start_date: string
          end_date: string
          budget: number
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          start_date: string
          end_date: string
          budget?: number
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          start_date?: string
          end_date?: string
          budget?: number
          status?: string
          created_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          description: string | null
          requires_receipt: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          requires_receipt?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          requires_receipt?: boolean
          created_at?: string
        }
      }
      expenses: {
        Row: {
          id: string
          user_id: string
          category_id: string
          event_id: string | null
          amount: number
          description: string
          expense_date: string
          payment_method: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category_id: string
          event_id?: string | null
          amount: number
          description: string
          expense_date: string
          payment_method: string
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category_id?: string
          event_id?: string | null
          amount?: number
          description?: string
          expense_date?: string
          payment_method?: string
          status?: string
          created_at?: string
        }
      }
    }
  }
} 
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { userService } from '@/lib/database';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/supabase';
import type { UserRole } from '@/lib/permissions';

type User = Database['public']['Tables']['users']['Row'];

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isManager: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ローカルストレージからユーザー情報を復元
    const initializeUser = async () => {
      try {
        // ブラウザ環境でのみlocalStorageにアクセス
        if (typeof window !== 'undefined') {
          const storedUser = localStorage.getItem('currentUser');
          if (storedUser) {
            try {
              const parsedUser = JSON.parse(storedUser);
              setUser(parsedUser);
            } catch (e) {
              console.error('Failed to parse stored user:', e);
              localStorage.removeItem('currentUser');
              localStorage.removeItem('currentUserId');
            }
          }
        }
      } catch (error) {
        console.error('ユーザー初期化エラー:', error);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('currentUser');
          localStorage.removeItem('currentUserId');
        }
      } finally {
        setLoading(false);
      }
    };

    initializeUser();
  }, []);

const login = async (email: string, password: string) => {
  setLoading(true);
  try {
    const { error: authError, data: authData } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError || !authData.user) {
      throw authError || new Error('不明なエラー');
    }

    // 認証成功後、ユーザー情報を一時的に保存
    // TODO: RLSポリシーが修正されたら、usersテーブルから完全な情報を取得する
    const tempUser: User = {
      id: authData.user.id,
      email: authData.user.email || '',
      name: '中野達哉', // 一時的にハードコード
      role: 'admin' as const,
      department_id: '1867faf8-3732-4503-9dbb-59316ab062d8', // 経営部門ID
      initial_password: null,
      password_changed: true,
      created_at: new Date().toISOString()
    };

    setUser(tempUser);
    // ローカルストレージにユーザー情報を保存
    if (typeof window !== 'undefined') {
      localStorage.setItem('currentUser', JSON.stringify(tempUser));
      localStorage.setItem('currentUserId', tempUser.id);
    }
  } catch (error) {
    console.error('ログインエラー:', error);
    throw error; // エラーを再スロー
  } finally {
    setLoading(false);
  }
};

  const logout = () => {
    setUser(null);
    // ローカルストレージからユーザー情報を削除
    if (typeof window !== 'undefined') {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('currentUserId');
    }
    // Supabaseのセッションもクリア
    supabase.auth.signOut();
  };

  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager' || user?.role === 'admin';

  const value = {
    user,
    loading,
    isAdmin,
    isManager,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

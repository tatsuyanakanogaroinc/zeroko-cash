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
  console.log('ログイン処理開始:', { email });
  
  try {
    const { error: authError, data: authData } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    console.log('Supabase認証結果:', { error: authError, user: authData?.user?.id });

    if (authError) {
      console.error('Supabase認証エラー:', authError);
      throw new Error(authError.message || 'ログインに失敗しました');
    }

    if (!authData?.user) {
      throw new Error('認証データが取得できませんでした');
    }

    console.log('認証成功、ユーザー情報取得中...');
    
    // ユーザー情報をusersテーブルから取得
    try {
      const response = await fetch('/api/user-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: authData.user.id }),
      });

      if (response.ok) {
        const userData = await response.json();
        console.log('ユーザーデータ取得成功:', userData);
        
        setUser(userData);
        if (typeof window !== 'undefined') {
          localStorage.setItem('currentUser', JSON.stringify(userData));
          localStorage.setItem('currentUserId', userData.id);
        }
      } else {
        console.warn('ユーザーデータ取得失敗、一時的なユーザー情報を使用');
        // フォールバック: 一時的なユーザー情報を使用
        const tempUser: User = {
          id: authData.user.id,
          email: authData.user.email || '',
          name: 'ユーザー', // 一時的にデフォルト名
          role: 'user' as const,
          department_id: null,
          initial_password: null,
          password_changed: true,
          created_at: new Date().toISOString()
        };

        setUser(tempUser);
        if (typeof window !== 'undefined') {
          localStorage.setItem('currentUser', JSON.stringify(tempUser));
          localStorage.setItem('currentUserId', tempUser.id);
        }
      }
    } catch (userDataError) {
      console.error('ユーザーデータ取得エラー:', userDataError);
      // フォールバック処理
      const tempUser: User = {
        id: authData.user.id,
        email: authData.user.email || '',
        name: 'ユーザー',
        role: 'user' as const,
        department_id: null,
        initial_password: null,
        password_changed: true,
        created_at: new Date().toISOString()
      };

      setUser(tempUser);
      if (typeof window !== 'undefined') {
        localStorage.setItem('currentUser', JSON.stringify(tempUser));
        localStorage.setItem('currentUserId', tempUser.id);
      }
    }

    console.log('ログイン処理完了');
  } catch (error) {
    console.error('ログインエラー:', error);
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('currentUserId');
    }
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

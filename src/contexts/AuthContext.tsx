'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { userService } from '@/lib/database';
import type { Database } from '@/lib/supabase';

type User = Database['public']['Tables']['users']['Row'];

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isManager: boolean;
  login: (email: string) => Promise<void>;
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
          const storedUserId = localStorage.getItem('currentUserId');
          if (storedUserId) {
            const user = await userService.getUserById(storedUserId);
            if (user) {
              setUser(user);
            } else {
              // ストレージのユーザーIDが無効な場合はクリア
              localStorage.removeItem('currentUserId');
            }
          }
        }
      } catch (error) {
        console.error('ユーザー初期化エラー:', error);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('currentUserId');
        }
      } finally {
        setLoading(false);
      }
    };

    initializeUser();
  }, []);

  const login = async (email: string) => {
    setLoading(true);
    try {
      const users = await userService.getUsers();
      const foundUser = users.find(u => u.email === email);
      if (foundUser) {
        setUser(foundUser);
        // ローカルストレージにユーザーIDを保存
        if (typeof window !== 'undefined') {
          localStorage.setItem('currentUserId', foundUser.id);
        }
      } else {
        throw new Error('ユーザーが見つかりません');
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
      localStorage.removeItem('currentUserId');
    }
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

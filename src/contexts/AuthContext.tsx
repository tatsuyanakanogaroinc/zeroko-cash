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
    // 初期化時にデモユーザーをセット（実際の認証実装まで）
    const initializeUser = async () => {
      try {
        // 管理者ユーザーを取得（サンプルデータの伊藤三郎）
        const users = await userService.getUsers();
        const adminUser = users.find(u => u.role === 'admin') || users[0];
        setUser(adminUser);
      } catch (error) {
        console.error('ユーザー初期化エラー:', error);
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
      }
    } catch (error) {
      console.error('ログインエラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
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

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
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Supabaseセッションの状態を監視
    const initializeAuth = async () => {
      try {
        // 現在のセッションを確認
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('セッション取得エラー:', error)
          // エラーの場合はローカルストレージもクリア
          if (typeof window !== 'undefined') {
            localStorage.removeItem('currentUser')
            localStorage.removeItem('currentUserId')
          }
        } else if (session?.user) {
          // セッションが有効な場合はユーザー情報を取得
          console.log('有効なセッションが見つかりました:', session.user.id)
          await loadUserData(session.user.id)
        } else {
          // セッションがない場合は、ローカルストレージから復元を試行
          if (typeof window !== 'undefined') {
            const storedUser = localStorage.getItem('currentUser')
            if (storedUser) {
              try {
                const parsedUser = JSON.parse(storedUser)
                setUser(parsedUser)
                console.log('ローカルストレージからユーザー情報を復元しました')
              } catch (e) {
                console.error('ローカルストレージのユーザー情報が破損しています:', e)
                localStorage.removeItem('currentUser')
                localStorage.removeItem('currentUserId')
              }
            }
          }
        }
      } catch (error) {
        console.error('認証初期化エラー:', error)
      } finally {
        setLoading(false)
      }
    }

    // セッションの変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('認証状態変更:', event, session?.user?.id)
        
        if (event === 'SIGNED_IN' && session?.user) {
          await loadUserData(session.user.id)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          if (typeof window !== 'undefined') {
            localStorage.removeItem('currentUser')
            localStorage.removeItem('currentUserId')
          }
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          console.log('トークンが更新されました')
          // トークン更新時は現在のユーザー情報を保持
        }
      }
    )

    initializeAuth()

    // クリーンアップ
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // ユーザーデータを読み込む共通関数
  const loadUserData = async (userId: string) => {
    try {
      const response = await fetch('/api/user-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      })

      if (response.ok) {
        const userData = await response.json()
        console.log('ユーザーデータ取得成功:', userData)
        
        setUser(userData)
        if (typeof window !== 'undefined') {
          localStorage.setItem('currentUser', JSON.stringify(userData))
          localStorage.setItem('currentUserId', userData.id)
        }
      } else {
        console.warn('ユーザーデータ取得失敗、ダミーユーザーを作成中...')
        // ダミーユーザーを作成
        const tempUser: User = {
          id: userId,
          email: 'unknown@example.com',
          name: 'ユーザー',
          role: 'user' as const,
          department_id: null,
          initial_password: null,
          password_changed: true,
          created_at: new Date().toISOString()
        }

        setUser(tempUser)
        if (typeof window !== 'undefined') {
          localStorage.setItem('currentUser', JSON.stringify(tempUser))
          localStorage.setItem('currentUserId', tempUser.id)
        }
      }
    } catch (error) {
      console.error('ユーザーデータ読み込みエラー:', error)
    }
  }

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
        console.warn('ユーザーデータ取得失敗、再試行中...');
        // より詳細なエラー情報を取得
        const errorText = await response.text();
        console.error('API response error:', response.status, errorText);
        
        // フォールバック: 一時的なユーザー情報を使用
        const tempUser: User = {
          id: authData.user.id,
          email: authData.user.email || '',
          name: authData.user.user_metadata?.name || authData.user.email?.split('@')[0] || 'ユーザー',
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

  const refreshUser = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/user-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      });

      if (response.ok) {
        const userData = await response.json();
        console.log('ユーザーデータリフレッシュ成功:', userData);
        
        setUser(userData);
        if (typeof window !== 'undefined') {
          localStorage.setItem('currentUser', JSON.stringify(userData));
          localStorage.setItem('currentUserId', userData.id);
        }
      } else {
        console.error('ユーザーデータリフレッシュ失敗');
      }
    } catch (error) {
      console.error('ユーザーデータリフレッシュエラー:', error);
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
    refreshUser,
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

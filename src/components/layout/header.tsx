'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export function Header() {
  const { user, logout, refreshUser, loading } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const handleRefreshUser = async () => {
    await refreshUser();
  };

  if (!user) {
    return (
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">経費精算システム</h1>
          </div>
          <div className="text-sm text-gray-500">読み込み中...</div>
        </div>
      </header>
    );
  }

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900">経費精算システム</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">ようこそ、{user.name}さん</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefreshUser}
            disabled={loading}
            title="ユーザー情報を更新"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>
    </header>
  );
} 
'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export function Header() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
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
        </div>
      </div>
    </header>
  );
} 
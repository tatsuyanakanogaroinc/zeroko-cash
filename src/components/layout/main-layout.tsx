'use client';

import { useEffect } from 'react';
import { Header } from './header';
import { Sidebar } from './sidebar';
import { useMasterDataStore } from '@/lib/store';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { isLoaded, loadDataFromAPI } = useMasterDataStore();

  useEffect(() => {
    if (!isLoaded) {
      loadDataFromAPI();
    }
  }, [isLoaded, loadDataFromAPI]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex h-[calc(100vh-4rem)]">
        <Sidebar />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Home,
  Plus,
  List,
  BarChart3,
  Users,
  Settings,
  CheckCircle,
} from 'lucide-react';

const userMenuItems = [
  {
    title: 'ダッシュボード',
    href: '/dashboard',
    icon: Home,
  },
  {
    title: '経費申請',
    href: '/expenses/new',
    icon: Plus,
  },
  {
    title: '申請一覧',
    href: '/expenses',
    icon: List,
  },
  {
    title: 'レポート',
    href: '/reports',
    icon: BarChart3,
  },
];

const adminMenuItems = [
  {
    title: '承認管理',
    href: '/admin/approvals',
    icon: CheckCircle,
  },
  {
    title: 'ユーザー管理',
    href: '/admin/users',
    icon: Users,
  },
  {
    title: 'マスター設定',
    href: '/admin/settings',
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  
  // すべてのメニューアイテムを表示
  const menuItems = [...userMenuItems, ...adminMenuItems];

  return (
    <div className="flex h-full w-64 flex-col bg-gray-50">
      <div className="flex h-14 items-center border-b px-4">
        <span className="text-lg font-semibold">メニュー</span>
      </div>
      <div className="flex-1 overflow-auto py-4">
        <nav className="space-y-1 px-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={pathname === item.href ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start',
                    pathname === item.href && 'bg-gray-200'
                  )}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {item.title}
                </Button>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
} 
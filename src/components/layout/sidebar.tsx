'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { shouldShowNavItem, type UserRole } from '@/lib/permissions';
import { Button } from '@/components/ui/button';
import {
  BarChart3,
  Home,
  Plus,
  Settings,
  Users,
  CheckCircle,
  UserCircle,
  Receipt,
  Briefcase,
} from 'lucide-react';

interface MenuItem {
  title: string;
  href: string;
  icon: any;
  permissionKey: keyof typeof import('@/lib/permissions').navigationPermissions;
}

const menuItems: MenuItem[] = [
  {
    title: 'ダッシュボード',
    href: '/dashboard',
    icon: Home,
    permissionKey: 'shouldShowDashboard',
  },
  {
    title: '経費申請',
    href: '/expenses/new',
    icon: Plus,
    permissionKey: 'shouldShowExpenses',
  },
  {
    title: '請求書払い申請',
    href: '/invoice-payments/new',
    icon: Receipt,
    permissionKey: 'shouldShowInvoicePayments',
  },
  {
    title: 'レポート',
    href: '/reports',
    icon: BarChart3,
    permissionKey: 'shouldShowReports',
  },
  {
    title: '外注管理',
    href: '/subcontracts',
    icon: Briefcase,
    permissionKey: 'shouldShowSubcontracts',
  },
  {
    title: '申請管理',
    href: '/admin/approvals',
    icon: CheckCircle,
    permissionKey: 'shouldShowApprovals',
  },
  {
    title: 'ユーザー管理',
    href: '/admin/users',
    icon: Users,
    permissionKey: 'shouldShowUserManagement',
  },
  {
    title: 'マスター設定',
    href: '/admin/settings',
    icon: Settings,
    permissionKey: 'shouldShowMasterSettings',
  },
  {
    title: 'マイページ',
    href: '/profile',
    icon: UserCircle,
    permissionKey: 'shouldShowDashboard', // プロフィールは全ユーザーがアクセス可能
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  
  // 権限に基づいてメニューアイテムをフィルタリング
  const visibleMenuItems = menuItems.filter(item =>
    shouldShowNavItem(user, item.permissionKey)
  );

  return (
    <div className="flex h-full w-64 flex-col bg-gray-50">
      <div className="flex h-14 items-center border-b px-4">
        <span className="text-lg font-semibold">メニュー</span>
      </div>
      <div className="flex-1 overflow-auto py-4">
        <nav className="space-y-1 px-3">
          {visibleMenuItems.map((item) => {
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

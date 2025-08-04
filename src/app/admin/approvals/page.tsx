'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

interface Application {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  category_id: string;
  project_id?: string;
  department_id?: string;
  event_id?: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  type: 'expense' | 'invoice';
  payment_method: string;
  created_at: string;
}

export default function ApprovalsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchApplications = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/applications');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setApplications(data.data);
          }
        }
      } catch (error) {
        console.error('申請データの取得に失敗:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplications();
  }, [user]);

  if (isLoading) {
    return (
      <MainLayout>
        <div>読み込み中...</div>
      </MainLayout>
    );
  }

  const stats = {
    pending: applications.filter(app => app.status === 'pending').length,
    approved: applications.filter(app => app.status === 'approved').length,
    rejected: applications.filter(app => app.status === 'rejected').length,
    total: applications.length
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">申請管理</h1>
          <p className="text-gray-600">経費申請と請求書払い申請の管理を行います</p>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">承認待ち</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">承認済み</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.approved}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">却下</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.rejected}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">全申請</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
        </div>

        {/* 申請一覧 */}
        <Card>
          <CardHeader>
            <CardTitle>申請一覧</CardTitle>
            <CardDescription>
              {applications.length}件の申請があります
            </CardDescription>
          </CardHeader>
          <CardContent>
            {applications.length === 0 ? (
              <p className="text-gray-500">申請はありません</p>
            ) : (
              <div className="space-y-4">
                {applications.map((app) => (
                  <div key={app.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{app.description}</h3>
                        <p className="text-sm text-gray-500">¥{app.amount.toLocaleString()}</p>
                        <p className="text-sm text-gray-500">{app.date}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded ${
                        app.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        app.status === 'approved' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {app.status === 'pending' ? '承認待ち' : 
                         app.status === 'approved' ? '承認済み' : '却下'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

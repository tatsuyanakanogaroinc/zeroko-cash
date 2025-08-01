'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  DollarSign, 
  TrendingUp,
  FileText,
  AlertCircle
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { expenseService } from '@/lib/database';
import type { Database } from '@/lib/supabase';

export default function DashboardPage() {
  const [expenses, setExpenses] = useState<Database['public']['Tables']['expenses']['Row'][]>([]);
  const [loading, setLoading] = useState(true);
  
  // モックユーザーデータ
  const user = {
    name: 'テストユーザー',
    department: '開発部',
  };

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const data = await expenseService.getExpenses();
        setExpenses(data);
      } catch (error) {
        console.error('経費データの取得に失敗しました:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchExpenses();
  }, []);

  // 実データから統計を計算
  const stats = {
    pending: expenses.filter(e => e.status === 'pending').length,
    approved: expenses.filter(e => e.status === 'approved').length,
    rejected: expenses.filter(e => e.status === 'rejected').length,
    totalThisMonth: expenses.reduce((sum, e) => sum + e.amount, 0),
    budgetUsed: 75, // 仮の値（後で部門予算から計算）
  };

  // 最新の5件を取得
  const recentExpenses = expenses
    .slice(0, 5)
    .map(expense => ({
      id: expense.id,
      description: expense.description,
      amount: expense.amount,
      status: expense.status,
      date: expense.expense_date,
    }));

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />承認待ち</Badge>;
      case 'approved':
        return <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />承認済み</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />却下</Badge>;
      default:
        return <Badge variant="outline">不明</Badge>;
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">ダッシュボード</h1>
          <p className="text-gray-600">お疲れ様です、{user.name}さん</p>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">承認待ち</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">
                件の申請が承認待ちです
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">承認済み</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.approved}</div>
              <p className="text-xs text-muted-foreground">
                件が承認されています
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">今月の支出</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">¥{stats.totalThisMonth.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                今月の合計支出額
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">予算使用率</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.budgetUsed}%</div>
              <Progress value={stats.budgetUsed} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* 最近の申請 */}
        <Card>
          <CardHeader>
            <CardTitle>最近の申請</CardTitle>
            <CardDescription>
              最近の経費申請の状況です
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentExpenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <FileText className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium">{expense.description}</p>
                      <p className="text-sm text-gray-500">{expense.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="font-medium">¥{expense.amount.toLocaleString()}</span>
                    {getStatusBadge(expense.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* お知らせ */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="mr-2 h-5 w-5" />
              お知らせ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium">システムメンテナンスのお知らせ</p>
                  <p className="text-xs text-gray-500">2024年1月20日（土）22:00-24:00</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium">新しい機能が追加されました</p>
                  <p className="text-xs text-gray-500">領収書の一括アップロード機能</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
} 
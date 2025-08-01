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
import { expenseService, invoicePaymentService } from '@/lib/database';
import { useMasterDataStore } from '@/lib/store';
import type { Database } from '@/lib/supabase';

export default function DashboardPage() {
  const [expenses, setExpenses] = useState<Database['public']['Tables']['expenses']['Row'][]>([]);
  const [invoicePayments, setInvoicePayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // マスターデータストアから取得
  const { departments, projects } = useMasterDataStore();
  
  // モックユーザーデータ
  const user = {
    name: 'テストユーザー',
    department: '開発部',
  };
  
  // マスターデータから名前を取得する関数
  const getDepartmentName = (departmentId: string | null) => {
    if (!departmentId) return '未定';
    const dept = departments.find(d => d.id === departmentId);
    return dept?.name || '不明';
  };
  
  const getProjectName = (projectId: string | null) => {
    if (!projectId) return '未定';
    const project = projects.find(p => p.id === projectId);
    return project?.name || '不明';
  };
  
  const getEventName = (eventId: string | null) => {
    if (!eventId) return '未定';
    // TODO: イベントマスターから取得（現在はIDを表示）
    return eventId;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [expenseData, invoiceData] = await Promise.all([
          expenseService.getExpenses(),
          invoicePaymentService.getInvoicePayments().catch(() => []) // エラーの場合は空配列を返す
        ]);
        setExpenses(expenseData);
        setInvoicePayments(invoiceData);
      } catch (error) {
        console.error('データの取得に失敗しました:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
        </div>

        {/* 承認待ちの申請 */}
        <Card>
          <CardHeader>
            <CardTitle>承認待ちの申請</CardTitle>
            <CardDescription>
              承認待ちの経費申請一覧です
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {expenses.filter(e => e.status === 'pending').map(expense => (
                <div key={expense.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Clock className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="font-medium">{expense.description}</p>
                      <p className="text-sm text-gray-500">{expense.expense_date}</p>
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

        {/* 承認済み申請詳細 */}
        <Card>
          <CardHeader>
            <CardTitle>承認済みの申請詳細</CardTitle>
            <CardDescription>
              承認済みの経費申請の状況です
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {expenses.filter(e => e.status === 'approved').map(expense => (
                <div key={expense.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">{expense.description}</p>
                      <p className="text-sm text-gray-500">{expense.expense_date}</p>
                      <div className="flex gap-4 mt-1">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
部門: {getDepartmentName(expense.department_id)}
                        </span>
                        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
イベント: {getEventName(expense.event_id)}
                        </span>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
プロジェクト: {getProjectName(expense.project_id)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="font-medium">¥{expense.amount.toLocaleString()}</span>
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
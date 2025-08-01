'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import Link from 'next/link';
import { expenseService, invoicePaymentService } from '@/lib/database';
import { useMasterDataStore } from '@/lib/store';
import type { Database } from '@/lib/supabase';

export default function DashboardPage() {
  const [allApplications, setAllApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // マスターデータストアから取得
  const { departments, projects, categories } = useMasterDataStore();
  
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

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return '未定';
    const category = categories.find(c => c.id === categoryId);
    return category?.name || '不明';
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cash':
        return '現金';
      case 'credit_card':
        return 'クレジットカード';
      case 'bank_transfer':
        return '銀行振込';
      default:
        return method;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [expenseData, invoiceData] = await Promise.all([
          expenseService.getExpenses(),
          invoicePaymentService.getInvoicePayments().catch(() => [])
        ]);

        // 経費申請データの正規化
        const normalizedExpenses = expenseData.map(expense => ({
          ...expense,
          type: 'expense',
          date: expense.expense_date,
          payment_method: expense.payment_method || 'credit_card',
          vendor_name: null,
          invoice_date: null,
          due_date: null
        }));
        
        // 請求書払い申請データの正規化
        const normalizedInvoices = invoiceData.map(invoice => ({
          ...invoice,
          type: 'invoice',
          date: invoice.invoice_date,
          payment_method: '請求書払い',
          expense_date: invoice.invoice_date,
          event_name: invoice.events?.name || null
        }));
        
        // 統合してソート（作成日時の降順）
        const combinedData = [...normalizedExpenses, ...normalizedInvoices]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        setAllApplications(combinedData);
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
    pending: allApplications.filter(e => e.status === 'pending').length,
    approved: allApplications.filter(e => e.status === 'approved').length,
    rejected: allApplications.filter(e => e.status === 'rejected').length,
    totalThisMonth: allApplications.reduce((sum, e) => sum + e.amount, 0),
    budgetUsed: 75, // 仮の値（後で部門予算から計算）
  };

  // 最新の5件を取得
  const recentApplications = allApplications
    .slice(0, 5)
    .map(application => ({
      id: application.id,
      description: application.description,
      amount: application.amount,
      status: application.status,
      date: application.date,
      type: application.type,
      department_id: application.department_id,
      event_name: application.event_name,
      project_id: application.project_id,
      category_id: application.category_id,
      payment_method: application.payment_method,
      user_id: application.user_id,
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

        {/* 申請一覧 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle>申請一覧</CardTitle>
              <CardDescription>
                経費申請と請求書払い申請の履歴を確認できます
              </CardDescription>
            </div>
            <Link href="/expenses">
              <Button variant="outline" size="sm">
                すべて表示
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentApplications.map(application => (
                <div key={application.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                      {application.type === 'expense' ? ( 
                        <DollarSign className="h-5 w-5 text-green-500" />
                      ) : (
                        <FileText className="h-5 w-5 text-blue-500" />
                      )}
                      <div>
                        <p className="font-medium">{application.description}</p>
                        <p className="text-sm text-gray-500">{application.date}</p>
                        <div className="flex gap-2 mt-2 flex-wrap">
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            部門: {getDepartmentName(application.department_id)}
                          </span>
                          {application.event_name && (
                            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                              イベント: {application.event_name}
                            </span>
                          )}
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            プロジェクト: {getProjectName(application.project_id)}
                          </span>
                          <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                            勘定科目: {getCategoryName(application.category_id)}
                          </span>
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                            支払方法: {getPaymentMethodLabel(application.payment_method)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-medium text-lg">¥{application.amount.toLocaleString()}</span>
                      <div className="mt-1">
                        {getStatusBadge(application.status)}
                      </div>
                    </div>
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
              承認済みの申請の状況です
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {allApplications.filter(e => e.status === 'approved').slice(0, 5).map(application => (
                <div key={application.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">{application.description}</p>
                      <p className="text-sm text-gray-500">{application.date}</p>
                      <div className="flex gap-4 mt-1">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
部門: {getDepartmentName(application.department_id)}
                        </span>
                        {application.event_name && (
                          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
イベント: {application.event_name}
                          </span>
                        )}
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
プロジェクト: {getProjectName(application.project_id)}
                        </span>
                        <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
{application.type === 'expense' ? '経費申請' : '請求書払い'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="font-medium">¥{application.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
} 
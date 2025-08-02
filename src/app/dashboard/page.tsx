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
  AlertCircle,
  Trash2,
  RefreshCw,
  Edit
} from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { expenseService, invoicePaymentService } from '@/lib/database';
import { useMasterDataStore, useExpenseStore, useEventStore } from '@/lib/store';
import { supabase } from '@/lib/auth';

import { useAuth } from '@/contexts/AuthContext';
export default function DashboardPage() {
  const [allApplications, setAllApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // マスターデータストアから取得
  const { departments, projects, categories } = useMasterDataStore();
  const { expenses } = useExpenseStore();
  const { events } = useEventStore();
  
  const { user } = useAuth();
  
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
    const event = events.find(e => e.id === eventId);
    return event?.name || '不明';
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return '未定';
    const category = categories.find(c => c.id === categoryId);
    return category?.name || '不明';
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'personal_cash':
        return '自費現金';
      case 'personal_credit':
        return '自費クレカ';
      case 'company_cash':
        return '会社現金';
      case 'company_credit':
        return '会社クレカ';
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

  const fetchData = async () => {
    if (!user) return;
    
    try {
      // Supabaseから直接データを取得
      let { data: userFilteredExpenses, error: expenseError } = await supabase
        .from('expenses')
        .select("*, events:events!left(*)")
        .eq('user_id', user.id);

      let { data: userFilteredInvoices, error: invoiceError } = await supabase
        .from('invoice_payments')
        .select("*, events:events!left(*)")
        .eq('user_id', user.id);

      if (expenseError || invoiceError) {
        console.error('Supabaseエラー:', expenseError || invoiceError);
        return;
      }
      
      console.log('User info:', { id: user.id, name: user.name });
      console.log('User filtered expenses:', userFilteredExpenses.length);
      console.log('User filtered invoices:', userFilteredInvoices.length);

      // 経費申請データの正規化
      const normalizedExpenses = userFilteredExpenses.map(expense => ({
        ...expense,
        type: 'expense',
        date: expense.expense_date,
        payment_method: expense.payment_method || 'personal_cash',
        vendor_name: null,
        invoice_date: null,
        due_date: null
      }));
      
      // 請求書払い申請データの正規化
      const normalizedInvoices = userFilteredInvoices.map(invoice => ({
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

      console.log('統合データ:', combinedData.length, '件');
      console.log('統合データサンプル:', combinedData.slice(0, 2));
      setAllApplications(combinedData);
    } catch (error) {
      console.error('データの取得に失敗しました:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // ページがフォーカスされたときにデータを再取得
  useEffect(() => {
    const handleFocus = () => {
      fetchData();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user]);

  // 実データから統計を計算
  const stats = {
    pending: allApplications.filter(e => e.status === 'pending').length,
    approved: allApplications.filter(e => e.status === 'approved').length,
    rejected: allApplications.filter(e => e.status === 'rejected').length,
    totalThisMonth: allApplications.reduce((sum, e) => sum + e.amount, 0),
    budgetUsed: 75, // 仮の値（後で部門予算から計算）
  };

  // 全ての申請を表示
  const displayApplications = allApplications.map(application => ({
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
    comments: application.comments,
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

  // 申請編集機能
  const handleEditApplication = async (applicationId: string, type: 'expense' | 'invoice') => {
    const editUrl = type === 'expense' ? `/expenses/new?edit=${applicationId}` : `/invoice-payments/new?edit=${applicationId}`;
    window.location.href = editUrl;
  };

  // 申請削除機能
  const handleDeleteApplication = async (applicationId: string, type: 'expense' | 'invoice') => {
    if (!confirm(`この${type === 'expense' ? '経費申請' : '請求書払い申請'}を削除しますか？この操作は取り消せません。`)) {
      return;
    }

    try {
      const response = await fetch(`/api/applications/${applicationId}?type=${type}&userId=${user?.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        alert(`削除に失敗しました: ${data.error}`);
        return;
      }

      // 成功時にローカルの状態を更新
      setAllApplications(prev => prev.filter(app => app.id !== applicationId));
      alert(data.message);

    } catch (error) {
      console.error('削除エラー:', error);
      alert('削除に失敗しました。もう一度お試しください。');
    }
  };

  if (!user) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">ログイン情報を読み込み中...</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">ダッシュボード</h1>
            <p className="text-gray-600">あなたの申請状況を確認できます</p>
            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg inline-block">
              <p className="text-blue-800 font-medium">ユーザー名: {user.name}</p>
            </div>
          </div>
          <Button
            onClick={fetchData}
            disabled={loading}
            variant="outline"
            className="flex items-center gap-2 mt-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            データ更新
          </Button>
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
          <CardHeader>
            <CardTitle>申請一覧</CardTitle>
            <CardDescription>
              経費申請と請求書払い申請の履歴を確認できます
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-600">データを読み込み中...</div>
              </div>
            ) : displayApplications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>申請データがありません</p>
                <p className="text-sm mt-2">新しい申請を作成してください</p>
              </div>
            ) : (
              <div className="space-y-2">
                {displayApplications.map(application => (
                  <div key={application.id} className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-all duration-200 hover:border-gray-300">
                    {/* 完全に一行ですべての情報を表示 */}
                    <div className="flex items-center justify-between gap-4">
                      {/* 左側：すべての情報を一列に */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* タイプアイコン */}
                        <div className="flex-shrink-0">
                          {application.type === 'expense' ? (
                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                              <FileText className="w-3 h-3 text-blue-600" />
                            </div>
                          ) : (
                            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                              <DollarSign className="w-3 h-3 text-green-600" />
                            </div>
                          )}
                        </div>
                        
                        {/* 説明 */}
                        <div className="font-semibold text-gray-900 truncate min-w-0 max-w-xs">
                          {application.description}
                        </div>
                        
                        {/* 金額 */}
                        <div className="font-bold text-gray-900 flex-shrink-0">
                          ¥{application.amount.toLocaleString()}
                        </div>
                        
                        {/* 日付 */}
                        <div className="text-sm text-gray-600 flex-shrink-0">
                          {application.date}
                        </div>
                        
                        {/* 部門 */}
                        <div className="text-sm text-gray-600 flex-shrink-0">
                          {getDepartmentName(application.department_id)}
                        </div>
                        
                        {/* イベント */}
                        {application.event_name && (
                          <div className="text-sm text-gray-600 flex-shrink-0">
                            {application.event_name}
                          </div>
                        )}
                        
                        {/* プロジェクト */}
                        <div className="text-sm text-gray-600 flex-shrink-0">
                          {getProjectName(application.project_id)}
                        </div>
                        
                        {/* カテゴリ */}
                        <div className="text-sm text-gray-600 flex-shrink-0">
                          {getCategoryName(application.category_id)}
                        </div>
                        
                        {/* 支払方法 */}
                        <div className="text-sm text-gray-600 flex-shrink-0">
                          {getPaymentMethodLabel(application.payment_method)}
                        </div>
                        
                        {/* 却下理由（却下の場合のみ） */}
                        {application.status === 'rejected' && application.comments && (
                          <div className="text-sm text-red-600 flex-shrink-0 max-w-xs truncate" title={application.comments}>
                            却下: {application.comments}
                          </div>
                        )}
                      </div>
                      
                      {/* 右側：ステータス + アクションボタン */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* ステータス */}
                        <div>
                          {getStatusBadge(application.status)}
                        </div>
                        
                        {/* アクションボタン（承認待ちの場合のみ） */}
                        {application.status === 'pending' && (
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditApplication(application.id, application.type)}
                              className="h-7 px-2 text-blue-600 hover:text-white hover:bg-blue-600 border-blue-200 flex items-center gap-1"
                            >
                              <Edit className="w-3 h-3" />
                              編集
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteApplication(application.id, application.type)}
                              className="h-7 px-2 text-red-600 hover:text-white hover:bg-red-600 border-red-200 flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" />
                              削除
                            </Button>
                          </div>
                        )}
                      </div>
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
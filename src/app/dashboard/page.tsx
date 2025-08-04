'use client'
// Updated dashboard with clean list layout - force redeploy 2025-01-02
// Service key updated - security fix deployment

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
import { supabase } from '@/lib/supabase';

import { useAuth } from '@/contexts/AuthContext';
export default function DashboardPage() {
  const [allApplications, setAllApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // マスターデータストアから取得
  const { departments, projects, categories } = useMasterDataStore();
  const { expenses } = useExpenseStore();
  const { events } = useEventStore();
  
  const { user } = useAuth();
  
  // アプリケーションデータから直接関連情報を取得する関数
  const getDepartmentName = (application: any) => {
    // 経費申請の場合
    if (application.type === 'expense' && application.users?.departments) {
      return application.users.departments.name || '不明';
    }
    // 請求書払いの場合
    if (application.type === 'invoice' && application.departments) {
      return application.departments.name || '不明';
    }
    // フォールバック: ストアから検索
    if (application.department_id) {
      const dept = departments.find(d => d.id === application.department_id);
      return dept?.name || '不明';
    }
    return '未定';
  };
  
  const getProjectName = (application: any) => {
    if (application.projects) {
      return application.projects.name || '不明';
    }
    if (application.project_id) {
      const project = projects.find(p => p.id === application.project_id);
      return project?.name || '不明';
    }
    return '未定';
  };
  
  const getEventName = (application: any) => {
    if (application.events) {
      return application.events.name || '不明';
    }
    if (application.event_name) {
      return application.event_name;
    }
    if (application.event_id) {
      const event = events.find(e => e.id === application.event_id);
      return event?.name || '不明';
    }
    return '未定';
  };

  const getCategoryName = (application: any) => {
    if (application.categories) {
      return application.categories.name || '不明';
    }
    if (application.category_id) {
      const category = categories.find(c => c.id === application.category_id);
      return category?.name || '不明';
    }
    return '未定';
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
      console.log('=== ダッシュボード データ取得開始 ===');
      console.log('User info:', { id: user.id, name: user.name });
      
      // APIエンドポイント経由でデータを取得
      const response = await fetch('/api/dashboard-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API エラー:', errorData);
        throw new Error(errorData.error || 'データの取得に失敗しました');
      }

      const data = await response.json();
      console.log('API レスポンス:', data);
      console.log('取得したアプリケーション数:', data.applications.length);
      
      setAllApplications(data.applications);
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
              <div className="overflow-x-auto">
                {/* テーブルヘッダー */}
                <div className="grid grid-cols-12 gap-2 py-3 px-4 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-700 min-w-[1200px]">
                  <div className="col-span-1 text-center">申請日</div>
                  <div className="col-span-2">説明</div>
                  <div className="col-span-1 text-right">金額</div>
                  <div className="col-span-1 text-center">勘定科目</div>
                  <div className="col-span-1 text-center">部門</div>
                  <div className="col-span-1 text-center">イベント</div>
                  <div className="col-span-1 text-center">プロジェクト</div>
                  <div className="col-span-1 text-center">支払方法</div>
                  <div className="col-span-1 text-center">ステータス</div>
                  <div className="col-span-2 text-center">アクション</div>
                </div>
                
                {/* データ行 */}
                <div className="divide-y divide-gray-100">
                  {displayApplications.map((application, index) => {
                    const fullApplication = allApplications.find(app => app.id === application.id) || application;
                    return (
                      <div key={application.id} className="grid grid-cols-12 gap-2 py-4 px-4 hover:bg-gray-50 transition-colors text-sm min-w-[1200px]">
                        {/* 申請日 */}
                        <div className="col-span-1 text-center text-gray-600">
                          {application.date}
                        </div>
                        
                        {/* 説明 */}
                        <div className="col-span-2 font-medium text-gray-900">
                          <div className="truncate" title={application.description}>
                            {application.description}
                          </div>
                        </div>
                        
                        {/* 金額 */}
                        <div className="col-span-1 text-right font-bold text-gray-900">
                          ¥{application.amount.toLocaleString()}
                        </div>
                        
                        {/* 勘定科目（カテゴリ） */}
                        <div className="col-span-1 text-center text-gray-600">
                          <div className="truncate" title={getCategoryName(fullApplication)}>
                            {getCategoryName(fullApplication)}
                          </div>
                        </div>
                        
                        {/* 部門（カラー付き） */}
                        <div className="col-span-1 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            getDepartmentName(fullApplication) === '経営' 
                              ? 'bg-purple-100 text-purple-700' 
                              : getDepartmentName(fullApplication) === '開発'
                              ? 'bg-blue-100 text-blue-700'
                              : getDepartmentName(fullApplication) === '営業'
                              ? 'bg-green-100 text-green-700'
                              : getDepartmentName(fullApplication) === '人事'
                              ? 'bg-yellow-100 text-yellow-700'
                              : getDepartmentName(fullApplication) === '総務'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-700'
                          }`} title={getDepartmentName(fullApplication)}>
                            {getDepartmentName(fullApplication)}
                          </span>
                        </div>
                        
                        {/* イベント */}
                        <div className="col-span-1 text-center text-gray-600">
                          <div className="truncate" title={getEventName(fullApplication)}>
                            {getEventName(fullApplication)}
                          </div>
                        </div>
                        
                        {/* プロジェクト */}
                        <div className="col-span-1 text-center text-gray-600">
                          <div className="truncate" title={getProjectName(fullApplication)}>
                            {getProjectName(fullApplication)}
                          </div>
                        </div>
                        
                        {/* 支払方法 */}
                        <div className="col-span-1 text-center text-gray-600">
                          <div className="truncate" title={getPaymentMethodLabel(application.payment_method)}>
                            {getPaymentMethodLabel(application.payment_method)}
                          </div>
                        </div>
                        
                        {/* ステータス */}
                        <div className="col-span-1 flex justify-center">
                          {getStatusBadge(application.status)}
                        </div>
                        
                        {/* アクション */}
                        <div className="col-span-2 flex justify-center">
                          {application.status === 'pending' && (
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditApplication(application.id, application.type)}
                                className="h-7 px-2 text-blue-600 hover:text-white hover:bg-blue-600 border-blue-200"
                                title="編集"
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteApplication(application.id, application.type)}
                                className="h-7 px-2 text-red-600 hover:text-white hover:bg-red-600 border-red-200"
                                title="削除"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                        
                        {/* 却下理由（全幅表示） */}
                        {application.status === 'rejected' && application.comments && (
                          <div className="col-span-12 mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                            <strong>却下理由:</strong> {application.comments}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
} 
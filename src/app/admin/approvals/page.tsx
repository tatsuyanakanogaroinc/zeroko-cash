'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, XCircle, Clock, Eye, Edit, Trash2, Filter, FileImage, ChevronUp, ChevronDown, ChevronsUpDown, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMasterDataStore, useEventStore } from '@/lib/store';
import { EditApplicationModal } from '@/components/modals/EditApplicationModal';

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
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // ソート状態管理
  const [sortField, setSortField] = useState<keyof Application | 'userName' | 'departmentName' | 'categoryName' | 'projectName' | 'eventName' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // 月別フィルター状態管理
  const [monthFilter, setMonthFilter] = useState<string>('all');
  
  // 非承認ダイアログの状態
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectingApplication, setRejectingApplication] = useState<Application | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  
  // 編集モーダルの状態
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  
  const { user } = useAuth();
  const { categories, departments, projects, loadDataFromAPI: loadMasterData, isLoaded: masterDataLoaded } = useMasterDataStore();
  const { events, loadEventsFromAPI: loadEvents, isLoaded: eventsLoaded } = useEventStore();

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        // マスターデータの読み込み
        if (!masterDataLoaded) {
          await loadMasterData();
        }
        if (!eventsLoaded) {
          await loadEvents();
        }

        // ユーザーデータの取得
        const usersResponse = await fetch('/api/users');
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          if (usersData.success) {
            setUsers(usersData.data);
          }
        }

        // 申請データの取得
        const response = await fetch('/api/applications');
        if (response.ok) {
          const data = await response.json();
          console.log('申請データ:', data);
          if (data.success && data.data) {
            // データの正規化
            const normalizedData = data.data.map((item: any) => {
              console.log('申請アイテム:', item);
              return {
                ...item,
                date: item.date || item.expense_date || item.invoice_date,
                department_id: item.department_id || item.departments?.id,
                category_id: item.category_id || item.categories?.id,
                project_id: item.project_id || item.projects?.id,
                event_id: item.event_id || item.events?.id,
              };
            });
            console.log('正規化後のデータ:', normalizedData);
            setApplications(normalizedData);
          }
        }
      } catch (error) {
        console.error('データの取得に失敗:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, masterDataLoaded, eventsLoaded]);

  if (isLoading) {
    return (
      <MainLayout>
        <div>読み込み中...</div>
      </MainLayout>
    );
  }

  // ソート処理関数
  const handleSort = (field: keyof Application | 'userName' | 'departmentName' | 'categoryName' | 'projectName' | 'eventName') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // ソートアイコンコンポーネント
  const SortIcon = ({ field }: { field: keyof Application | 'userName' | 'departmentName' | 'categoryName' | 'projectName' | 'eventName' }) => {
    if (sortField !== field) {
      return <ChevronsUpDown className="w-4 h-4 ml-1 text-gray-400" />;
    }
    return sortDirection === 'asc' ? 
      <ChevronUp className="w-4 h-4 ml-1 text-blue-600" /> : 
      <ChevronDown className="w-4 h-4 ml-1 text-blue-600" />;
  };

  // データのソート処理
  const sortData = (data: Application[]) => {
    if (!sortField) return data;

    return [...data].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'userName':
          aValue = getUserName(a).toLowerCase();
          bValue = getUserName(b).toLowerCase();
          break;
        case 'departmentName':
          aValue = getDepartmentName(a).toLowerCase();
          bValue = getDepartmentName(b).toLowerCase();
          break;
        case 'categoryName':
          aValue = getCategoryName(a).toLowerCase();
          bValue = getCategoryName(b).toLowerCase();
          break;
        case 'projectName':
          aValue = getProjectName(a).toLowerCase();
          bValue = getProjectName(b).toLowerCase();
          break;
        case 'eventName':
          aValue = getEventName(a).toLowerCase();
          bValue = getEventName(b).toLowerCase();
          break;
        case 'date':
          aValue = new Date(a.date);
          bValue = new Date(b.date);
          break;
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'description':
          aValue = a.description.toLowerCase();
          bValue = b.description.toLowerCase();
          break;
        default:
          aValue = a[sortField as keyof Application];
          bValue = b[sortField as keyof Application];
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  // 月別の選択肢を生成
  const getAvailableMonths = () => {
    const months = new Set<string>();
    applications.forEach(app => {
      if (app.date) {
        const date = new Date(app.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        months.add(monthKey);
      }
    });
    return Array.from(months).sort().reverse(); // 新しい順に並べる
  };

  const availableMonths = getAvailableMonths();

  // フィルタリングとソート処理
  let baseFilteredApplications = activeTab === 'all' 
    ? applications 
    : applications.filter(app => app.status === activeTab);

  // 月別フィルターを適用
  if (monthFilter !== 'all') {
    baseFilteredApplications = baseFilteredApplications.filter(app => {
      if (!app.date) return false;
      const date = new Date(app.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      return monthKey === monthFilter;
    });
  }
  
  const filteredApplications = sortData(baseFilteredApplications);

  const stats = {
    pending: applications.filter(app => app.status === 'pending').length,
    approved: applications.filter(app => app.status === 'approved').length,
    rejected: applications.filter(app => app.status === 'rejected').length,
    total: applications.length
  };

  // ヘルパー関数 - ダッシュボードと同じパターンでデータアクセス
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
    return '-';
  };
  
  const getProjectName = (application: any) => {
    if (application.projects) {
      return application.projects.name || '不明';
    }
    if (application.project_id) {
      const project = projects.find(p => p.id === application.project_id);
      return project?.name || '不明';
    }
    return '-';
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
    return '-';
  };

  const getCategoryName = (application: any) => {
    if (application.categories) {
      return application.categories.name || '不明';
    }
    if (application.category_id) {
      const category = categories.find(c => c.id === application.category_id);
      return category?.name || '不明';
    }
    return '-';
  };

  const getUserName = (application: any) => {
    // APIから直接取得したユーザー情報を使用
    if (application.users?.name) {
      return application.users.name;
    }
    if (application.users?.email) {
      return application.users.email;
    }
    
    // フォールバック: user_idからユーザー一覧検索
    if (application.user_id) {
      const user = users.find(u => u.id === application.user_id);
      return user?.name || user?.email || '不明';
    }
    
    return '不明';
  };

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

  // 承認処理
  const handleApprove = async (application: Application) => {
    if (!user?.id) {
      alert('ユーザー情報が取得できません');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch(`/api/applications/${application.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'approve',
          type: application.type,
          userId: user.id,
          comments: ''
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        // アプリケーション一覧を更新
        setApplications(prev => prev.map(app => 
          app.id === application.id 
            ? { ...app, status: 'approved' as const }
            : app
        ));
        alert('申請を承認しました');
      } else {
        alert(data.error || '承認処理に失敗しました');
      }
    } catch (error) {
      console.error('承認処理エラー:', error);
      alert('承認処理中にエラーが発生しました');
    } finally {
      setIsProcessing(false);
    }
  };

  // 非承認ダイアログを開く
  const handleRejectStart = (application: Application) => {
    setRejectingApplication(application);
    setRejectReason('');
    setRejectDialogOpen(true);
  };

  // 非承認処理
  const handleReject = async () => {
    if (!rejectingApplication || !user?.id) {
      alert('申請またはユーザー情報が取得できません');
      return;
    }

    if (!rejectReason.trim()) {
      alert('却下理由を入力してください');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch(`/api/applications/${rejectingApplication.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'reject',
          type: rejectingApplication.type,
          userId: user.id,
          comments: rejectReason.trim()
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        // アプリケーション一覧を更新
        setApplications(prev => prev.map(app => 
          app.id === rejectingApplication.id 
            ? { ...app, status: 'rejected' as const, comments: rejectReason.trim() }
            : app
        ));
        alert('申請を却下しました');
        setRejectDialogOpen(false);
        setRejectingApplication(null);
        setRejectReason('');
      } else {
        alert(data.error || '却下処理に失敗しました');
      }
    } catch (error) {
      console.error('却下処理エラー:', error);
      alert('却下処理中にエラーが発生しました');
    } finally {
      setIsProcessing(false);
    }
  };

  // 申請編集機能（モーダル版）
  const handleEditApplication = (application: Application) => {
    console.log('Opening edit modal for:', application);
    setSelectedApplication(application);
    setEditModalOpen(true);
  };

  // モーダル編集成功時のコールバック
  const handleEditSuccess = () => {
    setEditModalOpen(false);
    setSelectedApplication(null);
    window.location.reload(); // データを再取得
  };

  // 削除権限のチェック
  const canDeleteApplication = (application: Application) => {
    if (!user) return false;
    
    const isOwner = application.user_id === user.id;
    const isAdmin = user.role === 'admin';
    
    // 申請者本人は承認待ちのみ削除可能
    if (isOwner && application.status === 'pending') return true;
    
    // 管理者はすべての申請を削除可能
    if (isAdmin) return true;
    
    return false;
  };

  // 申請削除機能
  const handleDeleteApplication = async (application: Application) => {
    if (!canDeleteApplication(application)) {
      alert('この申請を削除する権限がありません');
      return;
    }

    const typeLabel = application.type === 'expense' ? '経費申請' : '請求書払い申請';
    const statusText = application.status === 'pending' ? '承認待ち' : 
                      application.status === 'approved' ? '承認済み' : '却下済み';
    
    if (!confirm(`この${statusText}の${typeLabel}を削除しますか？この操作は取り消せません。`)) {
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch(`/api/applications/${application.id}?type=${application.type}&userId=${user?.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        // 全データを再取得して同期を確保
        const refreshResponse = await fetch('/api/applications');
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          if (refreshData.success && refreshData.data) {
            const normalizedData = refreshData.data.map((item: any) => ({
              ...item,
              date: item.date || item.expense_date || item.invoice_date,
              department_id: item.department_id || item.departments?.id,
              category_id: item.category_id || item.categories?.id,
              project_id: item.project_id || item.projects?.id,
              event_id: item.event_id || item.events?.id,
            }));
            setApplications(normalizedData);
          }
        }
        alert(`${typeLabel}を削除しました`);
      } else {
        alert(data.error || '削除に失敗しました');
      }
    } catch (error) {
      console.error('削除エラー:', error);
      alert('削除中にエラーが発生しました');
    } finally {
      setIsProcessing(false);
    }
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

        {/* 月別フィルター */}
        <div className="flex items-center gap-4 bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <Label htmlFor="month-filter" className="text-sm font-medium">月別フィルター:</Label>
          </div>
          <Select value={monthFilter} onValueChange={setMonthFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="月を選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全ての月</SelectItem>
              {availableMonths.map(month => {
                const [year, monthNum] = month.split('-');
                const monthName = `${year}年${monthNum}月`;
                return (
                  <SelectItem key={month} value={month}>
                    {monthName}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <div className="text-sm text-gray-500">
            {monthFilter !== 'all' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMonthFilter('all')}
              >
                フィルターをクリア
              </Button>
            )}
          </div>
        </div>

        {/* タブ付き申請一覧 */}
        <Card>
          <CardHeader>
            <CardTitle>申請一覧</CardTitle>
            <CardDescription>
              {filteredApplications.length}件の申請が表示されています
              {monthFilter !== 'all' && (
                <>
                  {' '}（
                  {(() => {
                    const [year, monthNum] = monthFilter.split('-');
                    return `${year}年${monthNum}月`;
                  })()}
                  でフィルター中）
                </>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="pending">承認待ち ({stats.pending})</TabsTrigger>
                <TabsTrigger value="approved">承認済み ({stats.approved})</TabsTrigger>
                <TabsTrigger value="rejected">却下 ({stats.rejected})</TabsTrigger>
                <TabsTrigger value="all">全て ({stats.total})</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50 select-none"
                        onClick={() => handleSort('date')}
                      >
                        <div className="flex items-center">
                          申請日
                          <SortIcon field="date" />
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50 select-none"
                        onClick={() => handleSort('userName')}
                      >
                        <div className="flex items-center">
                          申請者
                          <SortIcon field="userName" />
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50 select-none"
                        onClick={() => handleSort('description')}
                      >
                        <div className="flex items-center">
                          説明
                          <SortIcon field="description" />
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50 select-none"
                        onClick={() => handleSort('amount')}
                      >
                        <div className="flex items-center">
                          金額
                          <SortIcon field="amount" />
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50 select-none"
                        onClick={() => handleSort('categoryName')}
                      >
                        <div className="flex items-center">
                          勘定科目
                          <SortIcon field="categoryName" />
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50 select-none"
                        onClick={() => handleSort('departmentName')}
                      >
                        <div className="flex items-center">
                          部門
                          <SortIcon field="departmentName" />
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50 select-none"
                        onClick={() => handleSort('eventName')}
                      >
                        <div className="flex items-center">
                          イベント
                          <SortIcon field="eventName" />
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50 select-none"
                        onClick={() => handleSort('projectName')}
                      >
                        <div className="flex items-center">
                          プロジェクト
                          <SortIcon field="projectName" />
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50 select-none"
                        onClick={() => handleSort('status')}
                      >
                        <div className="flex items-center">
                          ステータス
                          <SortIcon field="status" />
                        </div>
                      </TableHead>
                      <TableHead>領収書</TableHead>
                      <TableHead>可否</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredApplications.map((application) => (
                      <TableRow key={application.id}>
                        <TableCell>{application.date}</TableCell>
                        <TableCell className="font-medium">{getUserName(application)}</TableCell>
                        <TableCell>{application.description}</TableCell>
                        <TableCell>¥{application.amount.toLocaleString()}</TableCell>
                        <TableCell>{getCategoryName(application)}</TableCell>
                        <TableCell>{getDepartmentName(application)}</TableCell>
                        <TableCell>{getEventName(application)}</TableCell>
                        <TableCell>{getProjectName(application)}</TableCell>
                        <TableCell>{getStatusBadge(application.status)}</TableCell>
                        <TableCell>
                          {(application as any).receipt_image ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                window.open((application as any).receipt_image, '_blank');
                              }}
                            >
                              <FileImage className="h-4 w-4" />
                            </Button>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            {application.status === 'pending' ? (
                              <>
                                <Button
                                  size="sm"
                                  disabled={isProcessing}
                                  onClick={() => handleApprove(application)}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  承認
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  disabled={isProcessing}
                                  onClick={() => handleRejectStart(application)}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  却下
                                </Button>
                              </>
                            ) : null}
                            
                            {/* 編集・削除ボタンを権限に応じて表示 */}
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isProcessing}
                              onClick={() => handleEditApplication(application)}
                              className="text-blue-600 hover:text-white hover:bg-blue-600 border-blue-200"
                              title="編集"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {canDeleteApplication(application) && (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={isProcessing}
                                onClick={() => handleDeleteApplication(application)}
                                className="text-red-600 hover:text-white hover:bg-red-600 border-red-200"
                                title={user?.role === 'admin' ? '削除（管理者権限）' : '削除'}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* 非承認理由入力ダイアログ */}
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>申請を却下しますか？</DialogTitle>
              <DialogDescription>
                {rejectingApplication && `${getUserName(rejectingApplication)}の申請「${rejectingApplication.description}」を却下します。却下理由を入力してください。`}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="rejectReason">却下理由 *</Label>
                <Textarea
                  id="rejectReason"
                  placeholder="却下理由を入力してください..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setRejectDialogOpen(false);
                  setRejectingApplication(null);
                  setRejectReason('');
                }}
                disabled={isProcessing}
              >
                キャンセル
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={isProcessing || !rejectReason.trim()}
              >
                {isProcessing ? '処理中...' : '却下する'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 編集モーダル */}
        <EditApplicationModal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedApplication(null);
          }}
          application={selectedApplication}
          onSuccess={handleEditSuccess}
        />
      </div>
    </MainLayout>
  );
}

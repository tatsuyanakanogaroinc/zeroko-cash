'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, Clock, Eye, Edit, Trash2, Filter, FileImage } from 'lucide-react';
import { useMasterDataStore, useEventStore } from '@/lib/store';
import { getApprovers } from '@/lib/approvers';
import { ApproverSetting } from '@/lib/types';
import { userService, expenseService, invoicePaymentService } from '@/lib/database';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// フロントエンド用のSupabaseクライアント
const supabase = createClient(supabaseUrl, supabaseAnonKey);
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
  event_name?: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  type: 'expense' | 'invoice';
  payment_method: string;
  created_at: string;
}

export default function ApprovalsPage() {
  const [allApplications, setAllApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<Application | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [comments, setComments] = useState('');
  const [editForm, setEditForm] = useState<Partial<Application>>({});
  const [approvers, setApprovers] = useState<ApproverSetting[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>('user');
  const [activeTab, setActiveTab] = useState('pending');
  const [isLoading, setIsLoading] = useState(true);
  
  // フィルター状態
  const [filters, setFilters] = useState({
    user: 'all',
    department: 'all',
    event: 'all',
    project: 'all', 
    category: 'all',
    searchTerm: ''
  });

  const { user } = useAuth();
  const { categories, departments, projects, loadDataFromAPI: loadMasterData, isLoaded: masterDataLoaded } = useMasterDataStore();
  const { events, loadEventsFromAPI: loadEvents, isLoaded: eventsLoaded } = useEventStore();

  useEffect(() => {
    const initializeData = async () => {
      try {
        // マスターデータを読み込み
        if (!masterDataLoaded) {
          console.log('マスターデータを読み込み中...');
          await loadMasterData();
        }
        
        // イベントデータを読み込み
        if (!eventsLoaded) {
          console.log('イベントデータを読み込み中...');
          await loadEvents();
        }
        
        const [approversData, usersData] = await Promise.all([
          getApprovers(),
          userService.getUsers()
        ]);
        
        setApprovers(approversData);
        setUsers(usersData);
        
        console.log('マスターデータ読み込み完了:');
        console.log('- カテゴリー:', categories.length, '件');
        console.log('- 部門:', departments.length, '件');
        console.log('- プロジェクト:', projects.length, '件');
        console.log('- イベント:', events.length, '件');
        console.log('- ユーザー:', usersData.length, '件');
        
        // 現在のユーザー情報を取得
        let currentUser = null;
        if (user) {
          setCurrentUserId(user.id);
          currentUser = usersData.find(u => u.id === user.id);
          setCurrentUserRole(currentUser?.role || 'user');
        }

        // APIエンドポイントから申請データを取得
        console.log('申請データを取得中...');
        console.log('Current user role:', currentUser?.role);
        console.log('Current user ID:', user?.id);
        
          try {
            const apiResponse = await fetch('/api/applications');
            if (apiResponse.ok) {
              const apiData = await apiResponse.json();
              console.log('APIからのデータ:', apiData);
              if (apiData.success && apiData.data) {
                console.log('データ取得成功:', apiData.data.length, '件');
                console.log('取得したデータのサンプル:', apiData.data[0]);
                
                // データ構造を正規化
                const normalizedData = apiData.data.map((item: any) => ({
                  ...item,
                  date: item.date || item.expense_date || item.invoice_date,
                  // その他の必要なフィールドがあれば追加
                }));
                
                console.log('正規化後のデータのサンプル:', normalizedData[0]);
                setAllApplications(normalizedData);
                setFilteredApplications(normalizedData);
              } else {
                console.warn('APIからデータを取得できませんでした:', apiData);
                setAllApplications([]);
                setFilteredApplications([]);
              }
            } else {
              console.error('API response not ok:', apiResponse.status, apiResponse.statusText);
              setAllApplications([]);
              setFilteredApplications([]);
            }
          } catch (apiError) {
            console.error('APIエンドポイントからのデータ取得に失敗:', apiError);
            setAllApplications([]);
            setFilteredApplications([]);
          }
      } catch (error) {
        console.error('データの取得に失敗しました:', error);
      }
    };

    initializeData();
  }, [user]);

  // フィルタリング処理
  useEffect(() => {
    let filtered = allApplications;

    // ステータスフィルター
    if (activeTab !== 'all') {
      filtered = filtered.filter(app => app.status === activeTab);
    }

    // その他のフィルター
    if (filters.user !== 'all') {
      filtered = filtered.filter(app => app.user_id === filters.user);
    }
    if (filters.department !== 'all') {
      filtered = filtered.filter(app => app.department_id === filters.department);
    }
    if (filters.event !== 'all') {
      filtered = filtered.filter(app => app.event_id === filters.event);
    }
    if (filters.project !== 'all') {
      filtered = filtered.filter(app => app.project_id === filters.project);
    }
    if (filters.category !== 'all') {
      filtered = filtered.filter(app => app.category_id === filters.category);
    }
    if (filters.searchTerm) {
      filtered = filtered.filter(app => 
        app.description.toLowerCase().includes(filters.searchTerm.toLowerCase())
      );
    }

    setFilteredApplications(filtered);
  }, [allApplications, activeTab, filters]);

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || '不明';
  };

  const getDepartmentName = (departmentId?: string) => {
    if (!departmentId) return '-';
    const department = departments.find(d => d.id === departmentId);
    return department?.name || '不明';
  };

  const getProjectName = (projectId?: string) => {
    if (!projectId) return '-';
    const project = projects.find(p => p.id === projectId);
    return project?.name || '-';
  };

  const getEventName = (eventId?: string) => {
    if (!eventId) return '-';
    const event = events.find(e => e.id === eventId);
    return event?.name || '-';
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.name || user?.email || '不明';
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

  const canApprove = (application: Application) => {
    // 管理者は全て承認可能
    if (currentUserRole === 'admin') return true;
    
    // マネージャーは全て承認可能
    if (currentUserRole === 'manager') return true;

    // 一般ユーザーは承認権限なし
    return false;
  };

  const canEdit = (application: Application) => {
    // 管理者とマネージャーは編集可能
    return currentUserRole === 'admin' || currentUserRole === 'manager';
  };

  const handleApprove = async (applicationId: string) => {
    try {
      const application = allApplications.find(app => app.id === applicationId);
      if (!application) return;

      const response = await fetch(`/api/applications/${applicationId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'approve',
          type: application.type,
          userId: currentUserId,
          comments: comments?.trim() || null
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '承認処理に失敗しました');
      }

      // ローカル状態を更新
      setAllApplications(prev => 
        prev.map(req => 
          req.id === applicationId 
            ? { ...req, status: 'approved' as const, comments: comments?.trim() || null }
            : req
        )
      );
      
      setComments('');
      setIsApprovalDialogOpen(false);
      alert(data.message);
    } catch (error) {
      console.error('承認処理エラー:', error);
      alert(error instanceof Error ? error.message : '承認処理に失敗しました');
    }
  };

  const handleReject = async (applicationId: string) => {
    try {
      const application = allApplications.find(app => app.id === applicationId);
      if (!application) return;

      // 却下時はコメント必須
      if (!comments?.trim()) {
        alert('却下の理由を入力してください');
        return;
      }

      const response = await fetch(`/api/applications/${applicationId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'reject',
          type: application.type,
          userId: currentUserId,
          comments: comments.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '却下処理に失敗しました');
      }

      // ローカル状態を更新
      setAllApplications(prev => 
        prev.map(req => 
          req.id === applicationId 
            ? { ...req, status: 'rejected' as const, comments: comments.trim() }
            : req
        )
      );
      
      setComments('');
      setIsRejectDialogOpen(false);
      alert(data.message);
    } catch (error) {
      console.error('却下処理エラー:', error);
      alert(error instanceof Error ? error.message : '却下処理に失敗しました');
    }
  };

  const handleEdit = async () => {
    try {
      if (!selectedRequest || !editForm) return;

      const tableName = selectedRequest.type === 'expense' ? 'expenses' : 'invoice_payments';
      const { error } = await supabase
        .from(tableName)
        .update(editForm)
        .eq('id', selectedRequest.id);

      if (error) throw error;

      // ローカル状態を更新
      setAllApplications(prev => 
        prev.map(req => 
          req.id === selectedRequest.id 
            ? { ...req, ...editForm }
            : req
        )
      );
      
      setIsEditDialogOpen(false);
      setEditForm({});
      alert('申請が更新されました');
    } catch (error) {
      console.error('更新処理エラー:', error);
      alert('更新処理に失敗しました');
    }
  };

  const handleDelete = async (applicationId: string, type: 'expense' | 'invoice') => {
    if (!confirm('この申請を削除しますか？この操作は取り消せません。')) {
      return;
    }

    try {
      const response = await fetch(`/api/applications/${applicationId}?type=${type}&userId=${currentUserId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        alert(`削除に失敗しました: ${data.error}`);
        return;
      }

      // ローカル状態を更新
      setAllApplications(prev => prev.filter(app => app.id !== applicationId));
      alert(data.message);
    } catch (error) {
      console.error('削除エラー:', error);
      alert('削除に失敗しました');
    }
  };

  const stats = {
    pending: allApplications.filter(app => app.status === 'pending').length,
    approved: allApplications.filter(app => app.status === 'approved').length,
    rejected: allApplications.filter(app => app.status === 'rejected').length,
    total: allApplications.length
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
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">承認待ち</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">承認済み</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.approved}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">却下</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.rejected}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">全申請</CardTitle>
              <Filter className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
        </div>

        {/* フィルター */}
        <Card>
          <CardHeader>
            <CardTitle>フィルター</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <Label>検索</Label>
                <Input
                  placeholder="説明で検索..."
                  value={filters.searchTerm}
                  onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                />
              </div>
              
              <div>
                <Label>ユーザー</Label>
                <Select value={filters.user} onValueChange={(value) => setFilters(prev => ({ ...prev, user: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全ユーザー</SelectItem>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>{user.name || user.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>部門</Label>
                <Select value={filters.department} onValueChange={(value) => setFilters(prev => ({ ...prev, department: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部門</SelectItem>
                    {departments.map(dept => (
                      <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>イベント</Label>
                <Select value={filters.event} onValueChange={(value) => setFilters(prev => ({ ...prev, event: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全イベント</SelectItem>
                    {events.map(event => (
                      <SelectItem key={event.id} value={event.id}>{event.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>プロジェクト</Label>
                <Select value={filters.project} onValueChange={(value) => setFilters(prev => ({ ...prev, project: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全プロジェクト</SelectItem>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>勘定科目</Label>
                <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全科目</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* タブ付き申請一覧 */}
        <Card>
          <CardHeader>
            <CardTitle>申請一覧</CardTitle>
            <CardDescription>
              {filteredApplications.length}件の申請が表示されています
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
                      <TableHead>申請者</TableHead>
                      <TableHead>部門</TableHead>
                      <TableHead>説明</TableHead>
                      <TableHead>イベント</TableHead>
                      <TableHead>プロジェクト</TableHead>
                      <TableHead>勘定科目</TableHead>
                      <TableHead>金額</TableHead>
                      <TableHead>申請日</TableHead>
                      <TableHead>ステータス</TableHead>
                      <TableHead>領収書</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredApplications.map((application) => (
                      <TableRow key={application.id}>
                        <TableCell className="font-medium">{getUserName(application.user_id)}</TableCell>
                        <TableCell>{getDepartmentName(application.department_id)}</TableCell>
                        <TableCell>{application.description}</TableCell>
                        <TableCell>{getEventName(application.event_id)}</TableCell>
                        <TableCell>{getProjectName(application.project_id)}</TableCell>
                        <TableCell>{getCategoryName(application.category_id)}</TableCell>
                        <TableCell>¥{application.amount.toLocaleString()}</TableCell>
                        <TableCell>{application.date}</TableCell>
                        <TableCell>{getStatusBadge(application.status)}</TableCell>
                        <TableCell>
                          {(application as any).receipt_image ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // 領収書画像を新しいタブで表示
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
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedRequest(application);
                                setIsDetailDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            {canEdit(application) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedRequest(application);
                                  setEditForm(application);
                                  setIsEditDialogOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}

                            {application.status === 'pending' && canApprove(application) && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedRequest(application);
                                    setApprovalAction('approve');
                                    setComments(''); // 承認時はコメントをクリア
                                    setIsApprovalDialogOpen(true);
                                  }}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                  承認
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedRequest(application);
                                    setApprovalAction('reject');
                                    setComments(''); // 却下時はコメントをクリア
                                    setIsRejectDialogOpen(true);
                                  }}
                                >
                                  <XCircle className="h-4 w-4" />
                                  却下
                                </Button>
                              </>
                            )}

                            {(currentUserRole === 'admin' || application.status === 'pending') && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(application.id, application.type)}
                                className="text-red-600 hover:text-red-700"
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

        {/* 詳細ダイアログ */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>申請詳細</DialogTitle>
              <DialogDescription>
                申請の詳細情報を確認できます
              </DialogDescription>
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">申請者</Label>
                    <p>{getUserName(selectedRequest.user_id)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">申請日</Label>
                    <p>{selectedRequest.date}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">部門</Label>
                    <p>{getDepartmentName(selectedRequest.department_id)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">ステータス</Label>
                    <div>{getStatusBadge(selectedRequest.status)}</div>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-sm font-medium">説明</Label>
                    <p>{selectedRequest.description}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">金額</Label>
                    <p>¥{selectedRequest.amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">支払方法</Label>
                    <p>{selectedRequest.payment_method}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">勘定科目</Label>
                    <p>{getCategoryName(selectedRequest.category_id)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">プロジェクト</Label>
                    <p>{getProjectName(selectedRequest.project_id)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">イベント</Label>
                    <p>{getEventName(selectedRequest.event_id)}</p>
                  </div>
                  {selectedRequest.comments && (
                    <div className="col-span-2">
                      <Label className="text-sm font-medium">コメント</Label>
                      <p>{selectedRequest.comments}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
                閉じる
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 編集ダイアログ */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>申請編集</DialogTitle>
              <DialogDescription>
                申請内容を編集できます
              </DialogDescription>
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>説明</Label>
                    <Input
                      value={editForm.description || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>金額</Label>
                    <Input
                      type="number"
                      value={editForm.amount || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label>勘定科目</Label>
                    <Select 
                      value={editForm.category_id || ''} 
                      onValueChange={(value) => setEditForm(prev => ({ ...prev, category_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>プロジェクト</Label>
                    <Select 
                      value={editForm.project_id || ''} 
                      onValueChange={(value) => setEditForm(prev => ({ ...prev, project_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">なし</SelectItem>
                        {projects.map(project => (
                          <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>部門</Label>
                    <Select 
                      value={editForm.department_id || ''} 
                      onValueChange={(value) => setEditForm(prev => ({ ...prev, department_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">なし</SelectItem>
                        {departments.map(dept => (
                          <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>イベント</Label>
                    <Select 
                      value={editForm.event_id || ''} 
                      onValueChange={(value) => setEditForm(prev => ({ ...prev, event_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">なし</SelectItem>
                        {events.map(event => (
                          <SelectItem key={event.id} value={event.id}>{event.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                キャンセル
              </Button>
              <Button onClick={handleEdit}>
                更新
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 承認ダイアログ */}
        <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>申請を承認</DialogTitle>
              <DialogDescription>
                この申請を承認します。コメントは任意です。
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="approval-comments">コメント（任意）</Label>
                <Textarea
                  id="approval-comments"
                  placeholder="承認に関するコメントがあれば入力してください"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsApprovalDialogOpen(false)}>
                キャンセル
              </Button>
              <Button
                onClick={() => selectedRequest && handleApprove(selectedRequest.id)}
              >
                承認する
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 却下ダイアログ */}
        <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>申請を却下</DialogTitle>
              <DialogDescription>
                この申請を却下します。却下理由は必須です。
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reject-comments">却下理由（必須）</Label>
                <Textarea
                  id="reject-comments"
                  placeholder="却下の理由を具体的に入力してください"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={4}
                  className={!comments?.trim() ? 'border-red-300' : ''}
                />
                {!comments?.trim() && (
                  <p className="text-sm text-red-600">却下理由の入力は必須です</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
                キャンセル
              </Button>
              <Button
                variant="destructive"
                onClick={() => selectedRequest && handleReject(selectedRequest.id)}
                disabled={!comments?.trim()}
              >
                却下する
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}

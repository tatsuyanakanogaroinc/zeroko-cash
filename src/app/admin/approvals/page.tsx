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
import { supabase } from '@/lib/auth';
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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [comments, setComments] = useState('');
  const [editForm, setEditForm] = useState<Partial<Application>>({});
  const [approvers, setApprovers] = useState<ApproverSetting[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>('user');
  const [activeTab, setActiveTab] = useState('pending');
  
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
  const { categories, departments, projects } = useMasterDataStore();
  const { events } = useEventStore();

  useEffect(() => {
    const initializeData = async () => {
      try {
        const [approversData, usersData] = await Promise.all([
          getApprovers(),
          userService.getUsers()
        ]);
        
        setApprovers(approversData);
        setUsers(usersData);
        
        // 現在のユーザー情報を取得
        if (user) {
          setCurrentUserId(user.id);
          const currentUser = usersData.find(u => u.id === user.id);
          setCurrentUserRole(currentUser?.role || 'user');
        }

        // 統合データの取得
        const [expenseData, invoiceData] = await Promise.all([
          expenseService.getExpenses(),
          invoicePaymentService.getInvoicePayments().catch(() => [])
        ]);

        // 経費申請データの正規化
        const normalizedExpenses = expenseData.map(expense => ({
          ...expense,
          type: 'expense' as const,
          date: expense.expense_date,
          payment_method: expense.payment_method || 'personal_cash'
        }));

        // 請求書払い申請データの正規化
        const normalizedInvoices = invoiceData.map(invoice => ({
          ...invoice,
          type: 'invoice' as const,
          date: invoice.invoice_date,
          payment_method: '請求書払い',
          event_name: invoice.events?.name || null
        }));

        // 統合してソート（作成日時の降順）
        const combinedData = [...normalizedExpenses, ...normalizedInvoices]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        setAllApplications(combinedData);
        setFilteredApplications(combinedData);
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

      // APIエンドポイントを呼び出してデータベースを更新
      const tableName = application.type === 'expense' ? 'expenses' : 'invoice_payments';
      const { error } = await supabase
        .from(tableName)
        .update({ 
          status: 'approved',
          comments: comments || null,
          approved_by: currentUserId,
          approved_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      if (error) throw error;

      // ローカル状態を更新
      setAllApplications(prev => 
        prev.map(req => 
          req.id === applicationId 
            ? { ...req, status: 'approved' as const, comments }
            : req
        )
      );
      
      setComments('');
      setIsApprovalDialogOpen(false);
      alert('申請が承認されました');
    } catch (error) {
      console.error('承認処理エラー:', error);
      alert('承認処理に失敗しました');
    }
  };

  const handleReject = async (applicationId: string) => {
    try {
      const application = allApplications.find(app => app.id === applicationId);
      if (!application) return;

      // APIエンドポイントを呼び出してデータベースを更新
      const tableName = application.type === 'expense' ? 'expenses' : 'invoice_payments';
      const { error } = await supabase
        .from(tableName)
        .update({ 
          status: 'rejected',
          comments: comments || null,
          approved_by: currentUserId,
          approved_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      if (error) throw error;

      // ローカル状態を更新
      setAllApplications(prev => 
        prev.map(req => 
          req.id === applicationId 
            ? { ...req, status: 'rejected' as const, comments }
            : req
        )
      );
      
      setComments('');
      setIsApprovalDialogOpen(false);
      alert('申請が却下されました');
    } catch (error) {
      console.error('却下処理エラー:', error);
      alert('却下処理に失敗しました');
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
                                    setIsApprovalDialogOpen(true);
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

        {/* 承認/却下ダイアログ */}
        <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>承認・却下</DialogTitle>
              <DialogDescription>
                コメントを入力して承認または却下してください
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="comments">コメント</Label>
                <Textarea
                  id="comments"
                  placeholder="コメントを入力してください（任意）"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsApprovalDialogOpen(false)}>
                キャンセル
              </Button>
              <Button
                variant="destructive"
                onClick={() => selectedRequest && handleReject(selectedRequest.id)}
              >
                却下
              </Button>
              <Button
                onClick={() => selectedRequest && handleApprove(selectedRequest.id)}
              >
                承認
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}

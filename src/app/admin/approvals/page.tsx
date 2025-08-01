'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import { useMasterDataStore } from '@/lib/store';
import { getApprovers } from '@/lib/approvers';
import { ApproverSetting } from '@/lib/types';
import { userService, expenseService, invoicePaymentService } from '@/lib/database';
import { supabase } from '@/lib/auth';

interface ApprovalRequest {
  id: string;
  expense_id: string;
  user_name: string;
  description: string;
  amount: number;
  category_id: string;
  project_id?: string;
  event_name?: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  department_id?: string; // 部門ID
  event_id?: string; // イベントID
}

export default function ApprovalsPage() {
  const [allApplications, setAllApplications] = useState<any[]>([]);

  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [comments, setComments] = useState('');
  const [approvers, setApprovers] = useState<ApproverSetting[]>([]);
  const [users, setUsers] = useState<any[]>([]); // ユーザー一覧も取得する想定
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const { categories, getProjectById } = useMasterDataStore();

  useEffect(() => {
    getApprovers().then(setApprovers).catch(console.error);
    userService.getUsers().then(setUsers).catch(console.error);

    // 統合データの取得
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
      }
    };

    fetchData();

    // Supabase Authから現在のユーザーIDを取得
    const user = supabase.auth.getUser().then(res => setCurrentUserId(res.data.user?.id || null));
  }, []);

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || '不明';
  };

  const getProjectName = (projectId?: string) => {
    if (!projectId) return '-';
    const project = getProjectById(projectId);
    return project ? `${project.name} (${project.code})` : '-';
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

  const handleApprove = (requestId: string) => {
    setAllApplications(prev => 
      prev.map(req => 
        req.id === requestId 
          ? { ...req, status: 'approved' as const, comments }
          : req
      )
    );
    setComments('');
    setIsApprovalDialogOpen(false);
  };

  const handleReject = (requestId: string) => {
    setAllApplications(prev => 
      prev.map(req => 
        req.id === requestId 
          ? { ...req, status: 'rejected' as const, comments }
          : req
      )
    );
    setComments('');
    setIsApprovalDialogOpen(false);
  };

  // 承認者名を取得する関数
  // ユーザー名を取得する関数
  const getUserName = (userId: string) => {
    if (!userId) return '不明';
    const user = users.find(u => u.id === userId);
    return user?.name || user?.email || '不明';
  };

  const getApproverName = (request: any) => {
    const approver =
      approvers.find(a =>
        (a.department_id && request.department_id && a.department_id === request.department_id) ||
        (a.event_id && request.event_id && a.event_id === request.event_id) ||
        (a.project_id && request.project_id && a.project_id === request.project_id)
      );
    if (!approver) return '-';
    const user = users.find(u => u.id === approver.user_id);
    return user ? user.name : approver.user_id;
  };

  const pendingRequests = allApplications.filter(req => req.status === 'pending');

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">申請管理</h1>
          <p className="text-gray-600">経費申請と請求書払い申請の承認を管理します</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">承認待ち</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingRequests.length}</div>
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
              <div className="text-2xl font-bold">
                {allApplications.filter(req => req.status === 'approved').length}
              </div>
              <p className="text-xs text-muted-foreground">
                件が承認されています
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">却下</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {allApplications.filter(req => req.status === 'rejected').length}
              </div>
              <p className="text-xs text-muted-foreground">
                件が却下されています
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>承認待ち一覧</CardTitle>
            <CardDescription>
              承認待ちの申請一覧です
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>申請者</TableHead>
                  <TableHead>説明</TableHead>
                  <TableHead>イベント</TableHead>
                  <TableHead>カテゴリ</TableHead>
                  <TableHead>プロジェクト</TableHead>
                  <TableHead>金額</TableHead>
                  <TableHead>申請日</TableHead>
                  <TableHead>承認者</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingRequests.map((request) => {
                  const approver = approvers.find(a =>
                    (a.department_id && request.department_id && a.department_id === request.department_id) ||
                    (a.event_id && request.event_id && a.event_id === request.event_id) ||
                    (a.project_id && request.project_id && a.project_id === request.project_id)
                  );
                  const isMyApproval = approver?.user_id === currentUserId;
                  return (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{getUserName(request.user_id)}</TableCell>
                      <TableCell>{request.description}</TableCell>
                      <TableCell>
                        {request.event_name ? (
                          <Badge variant="outline" className="text-xs">
                            {request.event_name}
                          </Badge>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>{getCategoryName(request.category_id)}</TableCell>
                      <TableCell>{getProjectName(request.project_id)}</TableCell>
                      <TableCell>¥{request.amount.toLocaleString()}</TableCell>
                      <TableCell>{request.date}</TableCell>
                      <TableCell>{getApproverName(request)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(request);
                              setIsDetailDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(request);
                              setIsApprovalDialogOpen(true);
                            }}
                            disabled={!isMyApproval}
                          >
                            <CheckCircle className="h-4 w-4" />
                            承認
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(request);
                              setIsApprovalDialogOpen(true);
                            }}
                            disabled={!isMyApproval}
                          >
                            <XCircle className="h-4 w-4" />
                            却下
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* 詳細ダイアログ */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent>
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
                    <Label className="text-sm font-medium">説明</Label>
                    <p>{selectedRequest.description}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">金額</Label>
                    <p>¥{selectedRequest.amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">カテゴリ</Label>
                    <p>{getCategoryName(selectedRequest.category_id)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">プロジェクト</Label>
                    <p>{getProjectName(selectedRequest.project_id)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">イベント</Label>
                    <p>{selectedRequest.event_name || '-'}</p>
                  </div>
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
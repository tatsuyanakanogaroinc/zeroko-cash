'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Filter, Download } from 'lucide-react';
import { useMasterDataStore, useExpenseStore, useEventStore } from '@/lib/store';
import { expenseService, userService, invoicePaymentService } from '@/lib/database';
import type { Database } from '@/lib/supabase';

export default function ExpensesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [allApplications, setAllApplications] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // グローバルストアからマスターデータを取得
  const { categories, departments, projects } = useMasterDataStore();
  const { events } = useEventStore();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // すべてのユーザーを取得
        const usersData = await userService.getUsers();
        setUsers(usersData);

        // すべての経費と請求書データを取得
        const [expenseData, invoiceData] = await Promise.all([
          expenseService.getExpenses().catch(() => []),
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
          due_date: null,
          event_name: null
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">承認待ち</Badge>;
      case 'approved':
        return <Badge variant="default">承認済み</Badge>;
      case 'rejected':
        return <Badge variant="destructive">却下</Badge>;
      case 'draft':
        return <Badge variant="outline">下書き</Badge>;
      case 'paid':
        return <Badge variant="default">支払済み</Badge>;
      default:
        return <Badge variant="outline">不明</Badge>;
    }
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

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || '不明';
  };

  const getDepartmentName = (departmentId: string) => {
    const department = departments.find(d => d.id === departmentId);
    return department?.name || '不明';
  };

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || '不明';
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.name || user?.email || '不明';
  };

  const filteredApplications = allApplications.filter((application) => {
    const matchesSearch = application.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (application.vendor_name && application.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || application.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || application.category_id === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">申請一覧</h1>
            <p className="text-gray-600">経費申請と請求書払い申請の履歴を確認できます</p>
          </div>
          <Link href="/expenses/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              新規申請
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>フィルター</CardTitle>
            <CardDescription>
              申請を検索・フィルターできます
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">検索</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="説明で検索..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status-filter">ステータス</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="ステータスを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    <SelectItem value="pending">承認待ち</SelectItem>
                    <SelectItem value="approved">承認済み</SelectItem>
                    <SelectItem value="rejected">却下</SelectItem>
                    <SelectItem value="draft">下書き</SelectItem>
                    <SelectItem value="paid">支払済み</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category-filter">勘定科目</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="勘定科目を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>&nbsp;</Label>
                <Button variant="outline" className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  CSV出力
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>申請一覧</CardTitle>
            <CardDescription>
              {filteredApplications.length}件の申請が見つかりました
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>申請日</TableHead>
                  <TableHead>申請ユーザー</TableHead>
                  <TableHead>部門</TableHead>
                  <TableHead>プロジェクト</TableHead>
                  <TableHead>説明</TableHead>
                  <TableHead>イベント</TableHead>
                  <TableHead>勘定科目</TableHead>
                  <TableHead>金額</TableHead>
                  <TableHead>支払方法</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications.map((application) => (
                  <TableRow key={application.id}>
                    <TableCell>{application.date}</TableCell>
                    <TableCell>{getUserName(application.user_id)}</TableCell>
                    <TableCell>
                      {application.department_id ? (
                        <Badge variant="outline" className="text-xs">
                          {getDepartmentName(application.department_id)}
                        </Badge>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {application.project_id ? (
                        <Badge variant="outline" className="text-xs">
                          {getProjectName(application.project_id)}
                        </Badge>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{application.description}</TableCell>
                    <TableCell>
                      {application.event_name ? (
                        <Badge variant="outline" className="text-xs">
                          {application.event_name}
                        </Badge>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>{getCategoryName(application.category_id)}</TableCell>
                    <TableCell>¥{application.amount.toLocaleString()}</TableCell>
                    <TableCell>{getPaymentMethodLabel(application.payment_method)}</TableCell>
                    <TableCell>{getStatusBadge(application.status)}</TableCell>
                    <TableCell>
                      <Link href={`/expenses/${application.id}`}>
                        <Button variant="outline" size="sm">
                          詳細
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
} 
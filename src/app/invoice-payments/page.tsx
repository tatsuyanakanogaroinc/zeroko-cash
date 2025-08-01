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
import { useMasterDataStore } from '@/lib/store';
import { invoicePaymentService, userService } from '@/lib/database';
import type { Database } from '@/lib/supabase';

export default function InvoicePaymentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [invoicePayments, setInvoicePayments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // グローバルストアからマスターデータを取得
  const { categories, departments, projects } = useMasterDataStore();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [invoiceData, userData] = await Promise.all([
          invoicePaymentService.getInvoicePayments(),
          userService.getUsers()
        ]);
        setInvoicePayments(invoiceData);
        setUsers(userData);
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

  const filteredInvoicePayments = invoicePayments.filter((invoice) => {
    const matchesSearch = invoice.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.vendor_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || invoice.category_id === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">請求書払い一覧</h1>
            <p className="text-gray-600">請求書払い申請の履歴を確認できます</p>
          </div>
          <Link href="/invoice-payments/new">
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
                    placeholder="説明・ベンダー名で検索..."
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
            <CardTitle>請求書払い一覧</CardTitle>
            <CardDescription>
              {filteredInvoicePayments.length}件の申請が見つかりました
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>請求日</TableHead>
                  <TableHead>申請ユーザー</TableHead>
                  <TableHead>部門</TableHead>
                  <TableHead>プロジェクト</TableHead>
                  <TableHead>ベンダー名</TableHead>
                  <TableHead>説明</TableHead>
                  <TableHead>イベント</TableHead>
                  <TableHead>勘定科目</TableHead>
                  <TableHead>金額</TableHead>
                  <TableHead>支払期日</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoicePayments.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>{invoice.invoice_date}</TableCell>
                    <TableCell>{getUserName(invoice.user_id)}</TableCell>
                    <TableCell>
                      {invoice.department_id ? (
                        <Badge variant="outline" className="text-xs">
                          {getDepartmentName(invoice.department_id)}
                        </Badge>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {invoice.project_id ? (
                        <Badge variant="outline" className="text-xs">
                          {getProjectName(invoice.project_id)}
                        </Badge>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{invoice.vendor_name}</TableCell>
                    <TableCell>{invoice.description}</TableCell>
                    <TableCell>
                      {invoice.event_name ? (
                        <Badge variant="outline" className="text-xs">
                          {invoice.event_name}
                        </Badge>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>{getCategoryName(invoice.category_id)}</TableCell>
                    <TableCell>¥{invoice.amount.toLocaleString()}</TableCell>
                    <TableCell>{invoice.due_date}</TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell>
                      <Link href={`/invoice-payments/${invoice.id}`}>
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

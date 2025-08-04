'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, Clock, Eye, Edit, Trash2, Filter, FileImage } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMasterDataStore, useEventStore } from '@/lib/store';

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

  // フィルタリングされた申請
  const filteredApplications = activeTab === 'all' 
    ? applications 
    : applications.filter(app => app.status === activeTab);

  const stats = {
    pending: applications.filter(app => app.status === 'pending').length,
    approved: applications.filter(app => app.status === 'approved').length,
    rejected: applications.filter(app => app.status === 'rejected').length,
    total: applications.length
  };

  // ヘルパー関数 - ダッシュボードと同じパターンでデータアクセス
  const getDepartmentName = (application: any) => {
    console.log('部門名取得:', {
      type: application.type,
      department_id: application.department_id,
      users: application.users,
      departments: application.departments,
      application: application
    });
    
    // 経費申請の場合
    if (application.type === 'expense' && application.users?.departments) {
      const name = application.users.departments.name || '不明';
      console.log('経費申請部門名:', name);
      return name;
    }
    // 請求書払いの場合
    if (application.type === 'invoice' && application.departments) {
      const name = application.departments.name || '不明';
      console.log('請求書部門名:', name);
      return name;
    }
    // フォールバック: ストアから検索
    if (application.department_id) {
      const dept = departments.find(d => d.id === application.department_id);
      const name = dept?.name || '不明';
      console.log('フォールバック部門名:', name, 'dept:', dept);
      return name;
    }
    console.log('部門名が見つからない');
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

  const getUserName = (userId: string) => {
    if (!userId) return '不明';
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
                        <TableCell>{getDepartmentName(application)}</TableCell>
                        <TableCell>{application.description}</TableCell>
                        <TableCell>{getEventName(application)}</TableCell>
                        <TableCell>{getProjectName(application)}</TableCell>
                        <TableCell>{getCategoryName(application)}</TableCell>
                        <TableCell>¥{application.amount.toLocaleString()}</TableCell>
                        <TableCell>{application.date}</TableCell>
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
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // 詳細表示の処理を後で追加
                                console.log('詳細表示:', application.id);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            
                            {application.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    // 承認処理を後で追加
                                    console.log('承認:', application.id);
                                  }}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                  承認
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => {
                                    // 却下処理を後で追加
                                    console.log('却下:', application.id);
                                  }}
                                >
                                  <XCircle className="h-4 w-4" />
                                  却下
                                </Button>
                              </>
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
      </div>
    </MainLayout>
  );
}

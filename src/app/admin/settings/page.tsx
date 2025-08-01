'use client';

import { useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Users, Calendar, FileText } from 'lucide-react';
import { useMasterDataStore } from '@/lib/store';
import { useEffect } from 'react';

// ApproverSetting型をインポート
import { ApproverSetting, User, Department, Project } from '@/lib/types';
import { getApprovers, addApprover, updateApprover, deleteApprover } from '@/lib/approvers';

interface Event {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  budget: number;
  description?: string;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('departments');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [dialogType, setDialogType] = useState<'department' | 'event' | 'category'>('department');

  // 承認者設定用のモックデータ
  const [approvers, setApprovers] = useState<ApproverSetting[]>([
    { id: '1', department_id: '1', user_id: '550e8400-e29b-41d4-a716-446655440010', created_at: '2024-06-01' },
    { id: '2', event_id: '1', user_id: '550e8400-e29b-41d4-a716-446655440011', created_at: '2024-06-01' },
    { id: '3', project_id: '1', user_id: '550e8400-e29b-41d4-a716-446655440012', created_at: '2024-06-01' },
  ]);
  // ユーザー・部門・イベント・プロジェクトのモック（本来はAPIから取得）
  const users: User[] = [
    { id: '550e8400-e29b-41d4-a716-446655440010', email: 'tanaka@example.com', name: '田中太郎', department: '1', role: 'user', created_at: '', updated_at: '' },
    { id: '550e8400-e29b-41d4-a716-446655440011', email: 'sato@example.com', name: '佐藤花子', department: '2', role: 'user', created_at: '', updated_at: '' },
    { id: '550e8400-e29b-41d4-a716-446655440012', email: 'suzuki@example.com', name: '鈴木一郎', department: '3', role: 'user', created_at: '', updated_at: '' },
  ];

  const { 
    categories, 
    departments, 
    addCategory, 
    updateCategory, 
    deleteCategory,
    setDepartments,
    projects // ← 追加
  } = useMasterDataStore();

  // イベントデータ（モック）
  const [events, setEvents] = useState<Event[]>([
    {
      id: '1',
      name: '東京展示会2024',
      start_date: '2024-01-15',
      end_date: '2024-01-17',
      budget: 50000,
      description: '東京ビッグサイトでの展示会',
      status: 'active',
      created_at: '2024-01-01',
    },
    {
      id: '2',
      name: '大阪商談会',
      start_date: '2024-01-20',
      end_date: '2024-01-22',
      budget: 30000,
      description: '大阪での商談会',
      status: 'active',
      created_at: '2024-01-01',
    },
    {
      id: '3',
      name: '名古屋セミナー',
      start_date: '2024-01-25',
      end_date: '2024-01-26',
      budget: 15000,
      description: '名古屋でのセミナー',
      status: 'active',
      created_at: '2024-01-01',
    }
  ]);

  const handleAddDepartment = (data: any) => {
    const newDepartment = {
      ...data,
      id: (departments.length + 1).toString(),
      created_at: new Date().toISOString().split('T')[0]
    };
    setDepartments([...departments, newDepartment]);
    setIsAddDialogOpen(false);
  };

  const handleAddEvent = (data: any) => {
    const newEvent = {
      ...data,
      id: (events.length + 1).toString(),
      created_at: new Date().toISOString().split('T')[0]
    };
    setEvents([...events, newEvent]);
    setIsAddDialogOpen(false);
  };

  const handleAddCategory = (data: any) => {
    const newCategory = {
      ...data,
      id: (categories.length + 1).toString(),
      created_at: new Date().toISOString().split('T')[0]
    };
    addCategory(newCategory);
    setIsAddDialogOpen(false);
  };

  const handleEditItem = (item: any, type: 'department' | 'event' | 'category') => {
    setEditingItem(item);
    setDialogType(type);
    setIsAddDialogOpen(true);
  };

  const handleDeleteItem = (id: string, type: 'department' | 'event' | 'category') => {
    if (type === 'department') {
      setDepartments(departments.filter(dept => dept.id !== id));
    } else if (type === 'event') {
      setEvents(events.filter(event => event.id !== id));
    } else if (type === 'category') {
      deleteCategory(id);
    }
  };

  // Approver追加用state
  const [newApprover, setNewApprover] = useState<{ type: 'department' | 'event' | 'project'; refId: string; userId: string }>({ type: 'department', refId: '', userId: '' });

  useEffect(() => {
    // 初回マウント時にSupabaseから承認者設定を取得
    getApprovers().then(setApprovers).catch(console.error);
  }, []);

  // Approver追加ハンドラ
  const handleAddApprover = async () => {
    if (!newApprover.refId || !newApprover.userId) return;
    const base = {
      department_id: newApprover.type === 'department' ? newApprover.refId : undefined,
      event_id: newApprover.type === 'event' ? newApprover.refId : undefined,
      project_id: newApprover.type === 'project' ? newApprover.refId : undefined,
      user_id: newApprover.userId,
    };
    try {
      const created = await addApprover(base);
      setApprovers([...approvers, created]);
      setNewApprover({ type: 'department', refId: '', userId: '' });
    } catch (e) {
      alert('追加に失敗しました');
    }
  };

  // Approver編集用state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingApprover, setEditingApprover] = useState<ApproverSetting | null>(null);

  // Approver削除ハンドラ
  const handleDeleteApprover = async (id: string) => {
    try {
      await deleteApprover(id);
      setApprovers(approvers.filter(a => a.id !== id));
    } catch (e) {
      alert('削除に失敗しました');
    }
  };

  // Approver編集開始
  const handleEditApprover = (a: ApproverSetting) => {
    setEditingApprover(a);
    setIsEditDialogOpen(true);
  };

  // Approver編集保存
  const handleSaveEditApprover = async (updated: ApproverSetting) => {
    try {
      const saved = await updateApprover(updated.id, updated);
      setApprovers(approvers.map(a => a.id === updated.id ? saved : a));
      setIsEditDialogOpen(false);
      setEditingApprover(null);
    } catch (e) {
      alert('更新に失敗しました');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">アクティブ</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800">完了</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">キャンセル</Badge>;
      default:
        return <Badge variant="outline">不明</Badge>;
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">マスター設定</h1>
            <p className="text-gray-600">部門、イベント、勘定科目の管理を行います</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="departments" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              部門管理
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              イベント管理
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              勘定科目管理
            </TabsTrigger>
            <TabsTrigger value="approvers" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              承認者設定
            </TabsTrigger>
          </TabsList>

          <TabsContent value="departments" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>部門一覧</CardTitle>
                  <CardDescription>
                    {departments.length}個の部門が登録されています
                  </CardDescription>
                </div>
                <Dialog open={isAddDialogOpen && dialogType === 'department'} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => {
                      setDialogType('department');
                      setEditingItem(null);
                      setIsAddDialogOpen(true);
                    }}>
                      <Plus className="mr-2 h-4 w-4" />
                      部門追加
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingItem ? '部門を編集' : '部門を追加'}</DialogTitle>
                      <DialogDescription>
                        新しい部門を追加します
                      </DialogDescription>
                    </DialogHeader>
                    <DepartmentForm 
                      onSubmit={handleAddDepartment}
                      editingItem={editingItem}
                    />
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {departments.map((department) => (
                    <div key={department.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">{department.name}</h3>
                        <p className="text-sm text-gray-500">
                          予算: ¥{department.budget.toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditItem(department, 'department')}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteItem(department.id, 'department')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>イベント一覧</CardTitle>
                  <CardDescription>
                    {events.length}個のイベントが登録されています
                  </CardDescription>
                </div>
                <Dialog open={isAddDialogOpen && dialogType === 'event'} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => {
                      setDialogType('event');
                      setEditingItem(null);
                      setIsAddDialogOpen(true);
                    }}>
                      <Plus className="mr-2 h-4 w-4" />
                      イベント追加
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingItem ? 'イベントを編集' : 'イベントを追加'}</DialogTitle>
                      <DialogDescription>
                        新しいイベントを追加します
                      </DialogDescription>
                    </DialogHeader>
                    <EventForm 
                      onSubmit={handleAddEvent}
                      editingItem={editingItem}
                    />
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {events.map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">{event.name}</h3>
                        <p className="text-sm text-gray-500">
                          {event.start_date} - {event.end_date}
                        </p>
                        <p className="text-sm text-gray-500">
                          予算: ¥{event.budget.toLocaleString()}
                        </p>
                        {event.description && (
                          <p className="text-sm text-gray-500">{event.description}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(event.status)}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditItem(event, 'event')}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteItem(event.id, 'event')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>勘定科目一覧</CardTitle>
                  <CardDescription>
                    {categories.length}個の勘定科目が登録されています
                  </CardDescription>
                </div>
                <Dialog open={isAddDialogOpen && dialogType === 'category'} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => {
                      setDialogType('category');
                      setEditingItem(null);
                      setIsAddDialogOpen(true);
                    }}>
                      <Plus className="mr-2 h-4 w-4" />
                      勘定科目追加
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingItem ? '勘定科目を編集' : '勘定科目を追加'}</DialogTitle>
                      <DialogDescription>
                        新しい勘定科目を追加します
                      </DialogDescription>
                    </DialogHeader>
                    <CategoryForm 
                      onSubmit={handleAddCategory}
                      editingItem={editingItem}
                    />
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categories.map((category) => (
                    <div key={category.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">{category.name}</h3>
                        <p className="text-sm text-gray-500">{category.description}</p>
                                                 <div className="flex items-center space-x-2 mt-2">
                           <span className="text-xs text-gray-500">領収書:</span>
                           <input
                             type="checkbox"
                             checked={category.requires_receipt}
                             disabled
                             className="h-4 w-4"
                           />
                         </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditItem(category, 'category')}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteItem(category.id, 'category')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="approvers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>承認者設定</CardTitle>
                <CardDescription>部門・イベント・プロジェクトごとに承認者を設定できます</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex gap-2">
                  <select
                    className="border rounded px-2 py-1"
                    value={newApprover.type}
                    onChange={e => setNewApprover({ ...newApprover, type: e.target.value as any, refId: '' })}
                  >
                    <option value="department">部門</option>
                    <option value="event">イベント</option>
                    <option value="project">プロジェクト</option>
                  </select>
                  <select
                    className="border rounded px-2 py-1"
                    value={newApprover.refId}
                    onChange={e => setNewApprover({ ...newApprover, refId: e.target.value })}
                  >
                    <option value="">選択</option>
                    {newApprover.type === 'department' && departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    {newApprover.type === 'event' && events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    {newApprover.type === 'project' && projects?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <select
                    className="border rounded px-2 py-1"
                    value={newApprover.userId}
                    onChange={e => setNewApprover({ ...newApprover, userId: e.target.value })}
                  >
                    <option value="">承認者選択</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                  <Button onClick={handleAddApprover}>追加</Button>
                </div>
                <table className="w-full border">
                  <thead>
                    <tr>
                      <th className="border px-2 py-1">種別</th>
                      <th className="border px-2 py-1">対象名</th>
                      <th className="border px-2 py-1">承認者</th>
                      <th className="border px-2 py-1">作成日</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvers.map(a => {
                      let type = '-';
                      let name = '-';
                      if (a.department_id) {
                        type = '部門';
                        name = departments.find(d => d.id === a.department_id)?.name || '-';
                      } else if (a.event_id) {
                        type = 'イベント';
                        name = events.find(e => e.id === a.event_id)?.name || '-';
                      } else if (a.project_id) {
                        type = 'プロジェクト';
                        name = projects?.find(p => p.id === a.project_id)?.name || '-';
                      }
                      const user = users.find(u => u.id === a.user_id)?.name || '-';
                      return (
                        <tr key={a.id}>
                          <td className="border px-2 py-1">{type}</td>
                          <td className="border px-2 py-1">{name}</td>
                          <td className="border px-2 py-1">{user}</td>
                          <td className="border px-2 py-1">
                            {a.created_at.split('T')[0]}
                            <Button size="sm" variant="outline" onClick={() => handleEditApprover(a)}>編集</Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteApprover(a.id)}>削除</Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* 編集ダイアログ */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>承認者設定の編集</DialogTitle>
          </DialogHeader>
          {editingApprover && (
            <div className="space-y-2">
              <select
                className="border rounded px-2 py-1 w-full"
                value={editingApprover.department_id ? 'department' : editingApprover.event_id ? 'event' : 'project'}
                onChange={e => {
                  const type = e.target.value as 'department' | 'event' | 'project';
                  setEditingApprover({
                    ...editingApprover,
                    department_id: type === 'department' ? editingApprover.department_id || '' : undefined,
                    event_id: type === 'event' ? editingApprover.event_id || '' : undefined,
                    project_id: type === 'project' ? editingApprover.project_id || '' : undefined,
                  });
                }}
              >
                <option value="department">部門</option>
                <option value="event">イベント</option>
                <option value="project">プロジェクト</option>
              </select>
              <select
                className="border rounded px-2 py-1 w-full"
                value={editingApprover.department_id || editingApprover.event_id || editingApprover.project_id || ''}
                onChange={e => {
                  const type = editingApprover.department_id ? 'department' : editingApprover.event_id ? 'event' : 'project';
                  setEditingApprover({
                    ...editingApprover,
                    department_id: type === 'department' ? e.target.value : undefined,
                    event_id: type === 'event' ? e.target.value : undefined,
                    project_id: type === 'project' ? e.target.value : undefined,
                  });
                }}
              >
                <option value="">選択</option>
                {editingApprover.department_id && departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                {editingApprover.event_id && events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
                {editingApprover.project_id && projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select
                className="border rounded px-2 py-1 w-full"
                value={editingApprover.user_id}
                onChange={e => setEditingApprover({ ...editingApprover, user_id: e.target.value })}
              >
                <option value="">承認者選択</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>キャンセル</Button>
                <Button onClick={() => editingApprover && handleSaveEditApprover(editingApprover)}>保存</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}

// 部門フォーム
function DepartmentForm({ onSubmit, editingItem }: { onSubmit: (data: any) => void; editingItem: any }) {
  const [formData, setFormData] = useState({
    name: editingItem?.name || '',
    manager_id: editingItem?.manager_id || '',
    budget: editingItem?.budget || 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="dept-name">部門名</Label>
        <Input
          id="dept-name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="dept-manager">管理者ID</Label>
        <Input
          id="dept-manager"
          value={formData.manager_id}
          onChange={(e) => setFormData({ ...formData, manager_id: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="dept-budget">予算</Label>
        <Input
          id="dept-budget"
          type="number"
          value={formData.budget}
          onChange={(e) => setFormData({ ...formData, budget: parseInt(e.target.value) })}
          required
        />
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="submit">
          {editingItem ? '更新' : '追加'}
        </Button>
      </div>
    </form>
  );
}

// イベントフォーム
function EventForm({ onSubmit, editingItem }: { onSubmit: (data: any) => void; editingItem: any }) {
  const [formData, setFormData] = useState({
    name: editingItem?.name || '',
    start_date: editingItem?.start_date || '',
    end_date: editingItem?.end_date || '',
    budget: editingItem?.budget || 0,
    description: editingItem?.description || '',
    status: editingItem?.status || 'active'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="event-name">イベント名</Label>
        <Input
          id="event-name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="event-start">開始日</Label>
          <Input
            id="event-start"
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="event-end">終了日</Label>
          <Input
            id="event-end"
            type="date"
            value={formData.end_date}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            required
          />
        </div>
      </div>
      <div>
        <Label htmlFor="event-budget">予算</Label>
        <Input
          id="event-budget"
          type="number"
          value={formData.budget}
          onChange={(e) => setFormData({ ...formData, budget: parseInt(e.target.value) })}
          required
        />
      </div>
      <div>
        <Label htmlFor="event-description">説明</Label>
        <Textarea
          id="event-description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="event-status">ステータス</Label>
        <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">アクティブ</SelectItem>
            <SelectItem value="completed">完了</SelectItem>
            <SelectItem value="cancelled">キャンセル</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="submit">
          {editingItem ? '更新' : '追加'}
        </Button>
      </div>
    </form>
  );
}

// 勘定科目フォーム
function CategoryForm({ onSubmit, editingItem }: { onSubmit: (data: any) => void; editingItem: any }) {
  const [formData, setFormData] = useState({
    name: editingItem?.name || '',
    description: editingItem?.description || '',
    requires_receipt: editingItem?.requires_receipt || false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="category-name">勘定科目名</Label>
        <Input
          id="category-name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="category-description">説明</Label>
        <Textarea
          id="category-description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>
             <div className="flex items-center space-x-2">
         <input
           type="checkbox"
           id="category-receipt"
           checked={formData.requires_receipt}
           onChange={(e) => setFormData({ ...formData, requires_receipt: e.target.checked })}
           className="h-4 w-4"
         />
         <Label htmlFor="category-receipt">領収書必須</Label>
       </div>
      <div className="flex justify-end space-x-2">
        <Button type="submit">
          {editingItem ? '更新' : '追加'}
        </Button>
      </div>
    </form>
  );
} 
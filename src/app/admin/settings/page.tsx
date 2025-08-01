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
import { Plus, Edit, Trash2, Users, Calendar, FileText, Briefcase } from 'lucide-react';
import { useMasterDataStore } from '@/lib/store';
import { useEffect } from 'react';
import { departmentService, projectService, userService } from '@/lib/database';
import { toast } from 'sonner';

// Remove ApproverSetting related imports
// import { ApproverSetting, User, Department, Project } from '@/lib/types';
// import { getApprovers, addApprover, updateApprover, deleteApprover } from '@/lib/approvers';

interface Event {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  budget: number;
  department_id: string;
  description?: string;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('departments');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [dialogType, setDialogType] = useState<'department' | 'event' | 'project' | 'category'>('department');
  const [users, setUsers] = useState<any[]>([]);

  const { 
    categories, 
    departments, 
    addCategory, 
    updateCategory, 
    deleteCategory,
    setDepartments,
    setProjects,
    projects
  } = useMasterDataStore();

  // ユーザー一覧を取得
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const userData = await userService.getUsers();
        setUsers(userData);
      } catch (error) {
        console.error('ユーザー取得エラー:', error);
      }
    };
    loadUsers();
  }, []);

  // 責任者名を取得するヘルパー関数
  const getResponsibleUserName = (userId: string | null | undefined): string => {
    if (!userId) return '未設定';
    const user = users.find(u => u.id === userId);
    return user ? user.name : '不明';
  };

  // イベントデータ（モック）
  const [events, setEvents] = useState<Event[]>([
    {
      id: '1',
      name: '東京展示会2024',
      start_date: '2024-01-15',
      end_date: '2024-01-17',
      budget: 50000,
      department_id: '1',
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
      department_id: '2',
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
      department_id: '3',
      description: '名古屋でのセミナー',
      status: 'active',
      created_at: '2024-01-01',
    }
  ]);

  const handleAddDepartment = async (data: any) => {
    try {
      const newDepartment = await departmentService.createDepartment(data);
      setDepartments([...departments, newDepartment]);
      setIsAddDialogOpen(false);
      toast.success('部門を追加しました');
    } catch (error) {
      console.error('部門追加エラー:', error);
      toast.error('部門の追加に失敗しました');
    }
  };

  // 部署データをロード
  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const depts = await departmentService.getDepartments();
        setDepartments(depts);
      } catch (error) {
        console.error('部署取得エラー:', error);
        toast.error('部署データの取得に失敗しました');
      }
    };
    loadDepartments();
  }, [setDepartments]);

  // プロジェクトデータをロード
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const projs = await projectService.getProjects();
        setProjects(projs);
      } catch (error) {
        console.error('プロジェクト取得エラー:', error);
        toast.error('プロジェクトデータの取得に失敗しました');
      }
    };
    loadProjects();
  }, [setProjects]);
  const validateBudget = (budget: number, departmentBudget: number): boolean => {
    return budget >= 0 && budget <= departmentBudget;
  };

  const handleAddProject = async (data: any) => {
    const department = departments.find(dep => dep.id === data.department_id);
    if (!department) {
      toast.error('選択した部門が見つかりません');
      return;
    }
    if (!validateBudget(data.budget, department.budget)) {
      toast.error(`プロジェクト予算が部門予算を超えています (¥${department.budget.toLocaleString()})`);
      return;
    }
    try {
      const newProject = await projectService.createProject(data);
      setProjects([...projects, newProject]);
      setIsAddDialogOpen(false);
      toast.success('プロジェクトを追加しました');
    } catch (error) {
      console.error('プロジェクト追加エラー:', error);
      toast.error('プロジェクトの追加に失敗しました');
    }
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

  // Remove all approver-related code

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
            <TabsTrigger value="projects" className="flex items-center space-x-2">
              <Briefcase className="h-4 w-4" />
              プロジェクト管理
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
                          予算: ¥{(department.budget || 0).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-500">
                          責任者: {getResponsibleUserName(department.responsible_user_id)}
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
                          予算: ¥{(event.budget || 0).toLocaleString()}
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

          <TabsContent value="projects" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>プロジェクト一覧</CardTitle>
                  <CardDescription>
                    {projects.length}個のプロジェクトが登録されています
                  </CardDescription>
                </div>
                <Dialog open={isAddDialogOpen && dialogType === 'project'} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => {
                      setDialogType('project');
                      setEditingItem(null);
                      setIsAddDialogOpen(true);
                    }}>
                      <Plus className="mr-2 h-4 w-4" />
                      プロジェクト追加
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingItem ? 'プロジェクトを編集' : 'プロジェクトを追加'}</DialogTitle>
                      <DialogDescription>
                        新しいプロジェクトを追加します
                      </DialogDescription>
                    </DialogHeader>
                    <ProjectForm 
                      onSubmit={handleAddProject}
                      editingItem={editingItem}
                    />
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {projects.map((project) => (
                    <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">{project.name}</h3>
                        <p className="text-sm text-gray-500">
                          {project.start_date} - {project.end_date || '予定なし'}
                        </p>
                        <p className="text-sm text-gray-500">
                          予算: ¥{(project.budget || 0).toLocaleString()}
                        </p>
                        {project.description && (
                          <p className="text-sm text-gray-500">{project.description}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(project.status)}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditItem(project, 'project')}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteItem(project.id, 'project')}
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

        </Tabs>
      </div>

    </MainLayout>
  );
}

// 部門フォーム
function DepartmentForm({ onSubmit, editingItem }: { onSubmit: (data: any) => void; editingItem: any }) {
  const [formData, setFormData] = useState({
    name: editingItem?.name || '',
    responsible_user_id: editingItem?.responsible_user_id || '',
    budget: editingItem?.budget || 0
  });
  const [users, setUsers] = useState<any[]>([]);

  // ユーザー一覧を取得
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const userData = await userService.getUsers();
        setUsers(userData);
      } catch (error) {
        console.error('ユーザー取得エラー:', error);
      }
    };
    loadUsers();
  }, []);

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
        <Label htmlFor="dept-responsible">責任者</Label>
        <Select 
          value={formData.responsible_user_id} 
          onValueChange={(value) => setFormData({ ...formData, responsible_user_id: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="責任者を選択" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">選択しない</SelectItem>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.name} ({user.email})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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

// プロジェクトフォーム
function ProjectForm({ onSubmit, editingItem }: { onSubmit: (data: any) => void; editingItem: any }) {
  const [formData, setFormData] = useState({
    name: editingItem?.name || '',
    description: editingItem?.description || '',
    budget: editingItem?.budget || 0,
    start_date: editingItem?.start_date || '',
    end_date: editingItem?.end_date || '',
    status: editingItem?.status || 'active'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="project-name">プロジェクト名</Label>
        <Input
          id="project-name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="project-description">説明</Label>
        <Textarea
          id="project-description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="project-budget">予算</Label>
        <Input
          id="project-budget"
          type="number"
          value={formData.budget}
          onChange={(e) => setFormData({ ...formData, budget: parseInt(e.target.value) || 0 })}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="project-start">開始日</Label>
          <Input
            id="project-start"
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="project-end">終了日（予定）</Label>
          <Input
            id="project-end"
            type="date"
            value={formData.end_date}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="project-status">ステータス</Label>
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

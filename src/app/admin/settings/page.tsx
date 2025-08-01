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
import { departmentService, projectService, userService, eventService } from '@/lib/database';
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


  // イベントデータ
  const [events, setEvents] = useState<Event[]>([]);

  const handleAddDepartment = async (data: any) => {
    if (editingItem) {
      // 部門の更新
      try {
        const response = await fetch('/api/departments', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...data, id: editingItem.id }),
        });
        
        if (!response.ok) {
          throw new Error('部門の編集に失敗しました');
        }
        
        const updatedDepartment = await response.json();
        setDepartments(departments.map(dep => dep.id === updatedDepartment.id ? updatedDepartment : dep));
        setIsAddDialogOpen(false);
        setEditingItem(null);
        toast.success('部門を編集しました');
      } catch (error) {
        console.error('部門編集エラー:', error);
        toast.error('部門の編集に失敗しました');
      }
    } else {
      // 新規追加
      try {
        const response = await fetch('/api/departments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
        
        if (!response.ok) {
          throw new Error('部門の追加に失敗しました');
        }
        
        const newDepartment = await response.json();
        setDepartments([...departments, newDepartment]);
        setIsAddDialogOpen(false);
        toast.success('部門を追加しました');
      } catch (error) {
        console.error('部門追加エラー:', error);
        toast.error('部門の追加に失敗しました');
      }
    }
  };

  // 部署データをロード
  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const response = await fetch('/api/departments');
        if (!response.ok) throw new Error('取得失敗');
        const depts = await response.json();
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
        const response = await fetch('/api/projects');
        if (!response.ok) throw new Error('取得失敗');
        const projs = await response.json();
        setProjects(projs);
      } catch (error) {
        console.error('プロジェクト取得エラー:', error);
        toast.error('プロジェクトデータの取得に失敗しました');
      }
    };
    loadProjects();
  }, [setProjects]);

  // イベントデータをロード
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const response = await fetch('/api/events');
        if (!response.ok) throw new Error('取得失敗');
        const evts = await response.json();
        setEvents(evts);
      } catch (error) {
        console.error('イベント取得エラー:', error);
        toast.error('イベントデータの取得に失敗しました');
      }
    };
    loadEvents();
  }, []);
  const validateBudget = (budget: number, departmentBudget: number): boolean => {
    return budget >= 0 && budget <= departmentBudget;
  };

  const handleAddProject = async (data: any) => {
    // 部門予算の検証
    if (data.department_id && data.department_id !== 'none') {
      const department = departments.find(dep => dep.id === data.department_id);
      if (!department) {
        toast.error('選択した部門が見つかりません');
        return;
      }
      if (!validateBudget(data.budget, department.budget)) {
        toast.error(`プロジェクト予算が部門予算を超えています (¥${department.budget.toLocaleString()})`);
        return;
      }
    }

    if (editingItem) {
      // プロジェクトの更新
      try {
        const response = await fetch('/api/projects', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...data, id: editingItem.id }),
        });
        
        if (!response.ok) {
          throw new Error('プロジェクトの編集に失敗しました');
        }
        
        const updatedProject = await response.json();
        setProjects(projects.map(proj => proj.id === updatedProject.id ? updatedProject : proj));
        setIsAddDialogOpen(false);
        setEditingItem(null);
        toast.success('プロジェクトを編集しました');
      } catch (error) {
        console.error('プロジェクト編集エラー:', error);
        toast.error('プロジェクトの編集に失敗しました');
      }
    } else {
      // 新規追加
      try {
        const response = await fetch('/api/projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
        
        if (!response.ok) {
          throw new Error('プロジェクトの追加に失敗しました');
        }
        
        const newProject = await response.json();
        setProjects([...projects, newProject]);
        setIsAddDialogOpen(false);
        toast.success('プロジェクトを追加しました');
      } catch (error) {
        console.error('プロジェクト追加エラー:', error);
        toast.error('プロジェクトの追加に失敗しました');
      }
    }
  };

  const handleAddEvent = async (data: any) => {
    if (editingItem) {
      // イベントの更新
      try {
        const response = await fetch('/api/events', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...data, id: editingItem.id }),
        });
        
        if (!response.ok) {
          throw new Error('イベントの編集に失敗しました');
        }
        
        const updatedEvent = await response.json();
        setEvents(events.map(evt => evt.id === updatedEvent.id ? updatedEvent : evt));
        setIsAddDialogOpen(false);
        setEditingItem(null);
        toast.success('イベントを編集しました');
      } catch (error) {
        console.error('イベント編集エラー:', error);
        toast.error('イベントの編集に失敗しました');
      }
    } else {
      // 新規追加
      try {
        const response = await fetch('/api/events', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
        
        if (!response.ok) {
          throw new Error('イベントの追加に失敗しました');
        }
        
        const newEvent = await response.json();
        setEvents([...events, newEvent]);
        setIsAddDialogOpen(false);
        toast.success('イベントを追加しました');
      } catch (error) {
        console.error('イベント追加エラー:', error);
        toast.error('イベントの追加に失敗しました');
      }
    }
  };

  const handleAddCategory = async (data: any) => {
    if (editingItem) {
      // 勘定科目の更新
      try {
        const response = await fetch('/api/categories', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...data, id: editingItem.id }),
        });
        
        if (!response.ok) {
          throw new Error('勘定科目の編集に失敗しました');
        }
        
        const updatedCategory = await response.json();
        updateCategory(editingItem.id, updatedCategory);
        setIsAddDialogOpen(false);
        setEditingItem(null);
        toast.success('勘定科目を編集しました');
      } catch (error) {
        console.error('勘定科目編集エラー:', error);
        toast.error('勘定科目の編集に失敗しました');
      }
    } else {
      // 新規追加
      try {
        const response = await fetch('/api/categories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
        
        if (!response.ok) {
          throw new Error('勘定科目の追加に失敗しました');
        }
        
        const newCategory = await response.json();
        addCategory(newCategory);
        setIsAddDialogOpen(false);
        toast.success('勘定科目を追加しました');
      } catch (error) {
        console.error('勘定科目追加エラー:', error);
        toast.error('勘定科目の追加に失敗しました');
      }
    }
  };

  const handleEditItem = (item: any, type: 'department' | 'event' | 'category' | 'project') => {
    setEditingItem(item);
    setDialogType(type);
    setIsAddDialogOpen(true);
  };

  const checkDependencies = async (id: string, type: 'department' | 'event' | 'category' | 'project') => {
    try {
      const response = await fetch(`/api/${type}s/dependencies?id=${id}`);
      if (response.ok) {
        const dependencies = await response.json();
        return dependencies;
      }
    } catch (error) {
      console.error('依存関係チェックエラー:', error);
    }
    return null;
  };

  const handleDeleteItem = async (id: string, type: 'department' | 'event' | 'category' | 'project') => {
    // 依存関係をチェック
    const dependencies = await checkDependencies(id, type);
    if (dependencies && (dependencies.expenses > 0 || dependencies.projects > 0 || dependencies.events > 0)) {
      let message = `この${type === 'department' ? '部門' : type === 'event' ? 'イベント' : type === 'category' ? '勘定科目' : 'プロジェクト'}は以下のデータで使用されているため削除できません:\n`;
      if (dependencies.expenses > 0) message += `- ${dependencies.expenses}件の経費申請\n`;
      if (dependencies.projects > 0) message += `- ${dependencies.projects}件のプロジェクト\n`;
      if (dependencies.events > 0) message += `- ${dependencies.events}件のイベント\n`;
      toast.error(message);
      return;
    }

    if (type === 'department') {
      try {
        const response = await fetch(`/api/departments?id=${id}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error('部門の削除に失敗しました');
        }
        
        setDepartments(departments.filter(dept => dept.id !== id));
        toast.success('部門を削除しました');
      } catch (error) {
        console.error('部門削除エラー:', error);
        toast.error('部門の削除に失敗しました');
      }
    } else if (type === 'event') {
      try {
        const response = await fetch(`/api/events?id=${id}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error('イベントの削除に失敗しました');
        }
        
        setEvents(events.filter(event => event.id !== id));
        toast.success('イベントを削除しました');
      } catch (error) {
        console.error('イベント削除エラー:', error);
        toast.error('イベントの削除に失敗しました');
      }
    } else if (type === 'category') {
      try {
        const response = await fetch(`/api/categories?id=${id}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error('勘定科目の削除に失敗しました');
        }
        
        deleteCategory(id);
        toast.success('勘定科目を削除しました');
      } catch (error) {
        console.error('勘定科目削除エラー:', error);
        toast.error('勘定科目の削除に失敗しました');
      }
    } else if (type === 'project') {
      try {
        const response = await fetch(`/api/projects?id=${id}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error('プロジェクトの削除に失敗しました');
        }
        
        setProjects(projects.filter(proj => proj.id !== id));
        toast.success('プロジェクトを削除しました');
      } catch (error) {
        console.error('プロジェクト削除エラー:', error);
        toast.error('プロジェクトの削除に失敗しました');
      }
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
                      departments={departments}
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
                      departments={departments}
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
function EventForm({ onSubmit, editingItem, departments }: { onSubmit: (data: any) => void; editingItem: any; departments: any[] }) {
  const [formData, setFormData] = useState({
    name: editingItem?.name || '',
    description: editingItem?.description || '',
    budget: editingItem?.budget || 0,
    start_date: editingItem?.start_date || '',
    end_date: editingItem?.end_date || '',
    status: editingItem?.status || 'active',
    department_id: editingItem?.department_id || ''
  });
  const [budgetError, setBudgetError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 数値の検証
    if (isNaN(formData.budget) || formData.budget < 0) {
      setBudgetError('有効な予算金額を入力してください');
      return;
    }
    
    // 部門の予算制限チェック（「部門なし」以外の場合）
    if (formData.department_id && formData.department_id !== 'none' && formData.budget > 0) {
      const selectedDepartment = departments.find(dept => dept.id === formData.department_id);
      if (selectedDepartment && formData.budget > selectedDepartment.budget) {
        setBudgetError(`予算が部門の上限（¥${selectedDepartment.budget.toLocaleString()}）を超えています`);
        return;
      }
    }
    
    setBudgetError('');
    
    // データを整形してから送信
    const submitData = {
      ...formData,
      budget: Number(formData.budget) || 0,
      department_id: formData.department_id === 'none' ? null : formData.department_id
    };
    
    onSubmit(submitData);
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
        <Label htmlFor="event-department">部門</Label>
        <Select value={formData.department_id} onValueChange={(value) => setFormData({ ...formData, department_id: value })}>
          <SelectTrigger>
            <SelectValue placeholder="部門を選択" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">部門なし</SelectItem>
            {departments.map((dept) => (
              <SelectItem key={dept.id} value={dept.id}>
                {dept.name} (予算: ¥{dept.budget.toLocaleString()})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="event-budget">予算</Label>
        <Input
          id="event-budget"
          type="number"
          value={formData.budget}
          onChange={(e) => setFormData({ ...formData, budget: e.target.value === '' ? 0 : parseInt(e.target.value) || 0 })}
          required
        />
        {budgetError && (
          <p className="text-sm text-red-600 mt-1">{budgetError}</p>
        )}
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
function ProjectForm({ onSubmit, editingItem, departments }: { onSubmit: (data: any) => void; editingItem: any; departments: any[] }) {
  const [formData, setFormData] = useState({
    name: editingItem?.name || '',
    description: editingItem?.description || '',
    budget: editingItem?.budget || 0,
    start_date: editingItem?.start_date || '',
    end_date: editingItem?.end_date || '',
    status: editingItem?.status || 'active',
    department_id: editingItem?.department_id || ''
  });
  const [budgetError, setBudgetError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 数値の検証
    if (isNaN(formData.budget) || formData.budget < 0) {
      setBudgetError('有効な予算金額を入力してください');
      return;
    }
    
    // 部門の予算制限チェック（「部門なし」以外の場合）
    if (formData.department_id && formData.department_id !== 'none' && formData.budget > 0) {
      const selectedDepartment = departments.find(dept => dept.id === formData.department_id);
      if (selectedDepartment && formData.budget > selectedDepartment.budget) {
        setBudgetError(`予算が部門の上限（¥${selectedDepartment.budget.toLocaleString()}）を超えています`);
        return;
      }
    }
    
    setBudgetError('');
    
    // データを整形してから送信
    const submitData = {
      ...formData,
      budget: Number(formData.budget) || 0,
      department_id: formData.department_id === 'none' ? null : formData.department_id
    };
    
    onSubmit(submitData);
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
        <Label htmlFor="project-department">部門</Label>
        <Select value={formData.department_id} onValueChange={(value) => setFormData({ ...formData, department_id: value })}>
          <SelectTrigger>
            <SelectValue placeholder="部門を選択" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">部門なし</SelectItem>
            {departments.map((dept) => (
              <SelectItem key={dept.id} value={dept.id}>
                {dept.name} (予算: ¥{dept.budget.toLocaleString()})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
        {budgetError && (
          <p className="text-sm text-red-600 mt-1">{budgetError}</p>
        )}
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

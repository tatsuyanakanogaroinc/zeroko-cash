'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Edit, Trash2, UserPlus, Copy, Eye, EyeOff } from 'lucide-react';
import { userService, departmentService } from '@/lib/database';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'user';
  department: string;
  status: 'active' | 'inactive';
  avatar?: string;
}

interface Department {
  id: string;
  name: string;
  budget: number;
  created_at: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [createdUserInfo, setCreatedUserInfo] = useState<{email: string, password: string} | null>(null);
  const [isShowPasswordDialogOpen, setIsShowPasswordDialogOpen] = useState(false);

  // モックデータ
  const mockUsers: User[] = [
    {
      id: '1',
      name: '田中太郎',
      email: 'tanaka@example.com',
      role: 'admin',
      department: '経営企画部',
      status: 'active'
    },
    {
      id: '2',
      name: '佐藤花子',
      email: 'sato@example.com',
      role: 'manager',
      department: '営業部',
      status: 'active'
    },
    {
      id: '3',
      name: '鈴木一郎',
      email: 'suzuki@example.com',
      role: 'user',
      department: '開発部',
      status: 'active'
    },
    {
      id: '4',
      name: '高橋美咲',
      email: 'takahashi@example.com',
      role: 'manager',
      department: '人事部',
      status: 'inactive'
    }
  ];

  // 部署の初期化
  const initializeDepartments = async () => {
    try {
      const existingDepartments = await departmentService.getDepartments();
      
      // 既存の部署がない場合、初期部署を作成
      if (existingDepartments.length === 0) {
        const initialDepartments = [
          { name: '経営', budget: 1000000 },
          { name: 'セールス', budget: 500000 },
          { name: 'マーケ', budget: 300000 },
          { name: 'コーチ', budget: 200000 },
          { name: 'カリキュラム', budget: 150000 },
          { name: 'バックオフィス', budget: 100000 }
        ];
        
        for (const dept of initialDepartments) {
          await departmentService.createDepartment(dept);
        }
        
        toast.success('部署マスターを初期化しました');
      }
      
      // 部署リストを更新
      const updatedDepartments = await departmentService.getDepartments();
      setDepartments(updatedDepartments);
    } catch (error) {
      console.error('部署初期化エラー:', error);
      toast.error('部署の初期化に失敗しました');
    }
  };

  useEffect(() => {
    setUsers(mockUsers);
    initializeDepartments();
  }, []);

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'manager':
        return 'bg-blue-100 text-blue-800';
      case 'user':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    return status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  };

  const handleAddUser = async (userData: any) => {
    try {
      console.log('Creating user with data:', userData);
      
      // 部署情報を取得
      const selectedDepartment = departments.find(dept => dept.id === userData.departmentId);
      
      // 実際のデータベースにユーザーを作成
      const newUser = await userService.createUser({
        name: userData.name,
        email: userData.email,
        role: userData.role,
        department_id: userData.departmentId || null
      });
      
      // 初期パスワード情報を保存（実際の実装では、この情報は作成直後のみ表示される）
      setCreatedUserInfo({
        email: newUser.email,
        password: newUser.initial_password || 'パスワード取得エラー'
      });
      
      // ユーザーリストを更新
      const updatedUsers = await userService.getUsers();
      setUsers(updatedUsers);
      
      setIsAddDialogOpen(false);
      setIsShowPasswordDialogOpen(true);
      
      toast.success('ユーザーを追加し、初期パスワードを設定しました');
    } catch (error) {
      console.error('ユーザー作成エラー:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('ユーザーの作成に失敗しました');
      }
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(users.filter(user => user.id !== userId));
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">ユーザー管理</h1>
            <p className="text-gray-600">システムユーザーの管理を行います</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                ユーザー追加
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>ユーザーを追加</DialogTitle>
                <DialogDescription>
                  新しいユーザーをシステムに追加します
                </DialogDescription>
              </DialogHeader>
              <AddUserForm onSubmit={handleAddUser} />
            </DialogContent>
          </Dialog>
        </div>

        {/* 検索バー */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="ユーザー名、メールアドレス、部署で検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* ユーザー一覧 */}
        <Card>
          <CardHeader>
            <CardTitle>ユーザー一覧</CardTitle>
            <CardDescription>
              {filteredUsers.length}人のユーザーが登録されています
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">{user.name}</h3>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      <p className="text-sm text-gray-500">{user.department}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getRoleBadgeColor(user.role)}>
                      {user.role === 'admin' ? '管理者' : user.role === 'manager' ? 'マネージャー' : 'ユーザー'}
                    </Badge>
                    <Badge className={getStatusBadgeColor(user.status)}>
                      {user.status === 'active' ? 'アクティブ' : '非アクティブ'}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditUser(user)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteUser(user.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 初期パスワード表示ダイアログ */}
        {createdUserInfo && (
          <Dialog open={isShowPasswordDialogOpen} onOpenChange={setIsShowPasswordDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>ユーザー作成完了</DialogTitle>
                <DialogDescription>
                  新しいユーザーが作成されました。以下の情報をユーザーに共有してください。
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Eye className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">重要な情報</span>
                  </div>
                  <p className="text-sm text-yellow-700">
                    この画面を閉じると、初期パスワードは二度と表示されません。必ずユーザーに共有してください。
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <Label className="text-sm font-medium">メールアドレス</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Input value={createdUserInfo.email} readOnly className="bg-gray-50" />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(createdUserInfo.email);
                          toast.success('メールアドレスをコピーしました');
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">初期パスワード</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Input value={createdUserInfo.password} readOnly className="bg-gray-50 font-mono" />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(createdUserInfo.password);
                          toast.success('初期パスワードをコピーしました');
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      ユーザーは初回ログイン時にパスワードの変更を求められます。
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button
                    onClick={() => {
                      setIsShowPasswordDialogOpen(false);
                      setCreatedUserInfo(null);
                    }}
                  >
                    確認しました
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* 編集ダイアログ */}
        {editingUser && (
          <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>ユーザーを編集</DialogTitle>
                <DialogDescription>
                  ユーザー情報を編集します
                </DialogDescription>
              </DialogHeader>
              <EditUserForm user={editingUser} onSubmit={(updatedUser) => {
                setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
                setEditingUser(null);
              }} />
            </DialogContent>
          </Dialog>
        )}
      </div>
    </MainLayout>
  );
}

// ユーザー追加フォーム
function AddUserForm({ onSubmit }: { onSubmit: (user: Omit<User, 'id'>) => void }) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'user' as 'admin' | 'manager' | 'user',
    department: '',
    departmentId: '',
    status: 'active' as 'active' | 'inactive'
  });

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const depts = await departmentService.getDepartments();
        setDepartments(depts);
      } catch (error) {
        console.error('部署取得エラー:', error);
        toast.error('部署情報の取得に失敗しました');
      }
    };
    loadDepartments();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">名前</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="email">メールアドレス</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
      </div>
      <div>
<Label htmlFor="role">権限</Label>
        <Select value={formData.role} onValueChange={(value: 'admin' | 'manager' | 'user') => setFormData({ ...formData, role: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="user">ユーザー</SelectItem>
            <SelectItem value="manager">マネージャー</SelectItem>
            <SelectItem value="admin">管理者</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="department">部署</Label>
        <Select value={formData.departmentId} onValueChange={(value) => setFormData({ ...formData, departmentId: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {departments.map((dept) => (
              <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="status">ステータス</Label>
        <Select value={formData.status} onValueChange={(value: 'active' | 'inactive') => setFormData({ ...formData, status: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">アクティブ</SelectItem>
            <SelectItem value="inactive">非アクティブ</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="submit">追加</Button>
      </div>
    </form>
  );
}

// ユーザー編集フォーム
function EditUserForm({ user, onSubmit }: { user: User; onSubmit: (user: User) => void }) {
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    status: user.status
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...user, ...formData });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="edit-name">名前</Label>
        <Input
          id="edit-name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="edit-email">メールアドレス</Label>
        <Input
          id="edit-email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="edit-role">権限</Label>
        <Select value={formData.role} onValueChange={(value: 'admin' | 'manager' | 'user') => setFormData({ ...formData, role: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="user">ユーザー</SelectItem>
            <SelectItem value="manager">マネージャー</SelectItem>
            <SelectItem value="admin">管理者</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="edit-department">部署</Label>
        <Input
          id="edit-department"
          value={formData.department}
          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="edit-status">ステータス</Label>
        <Select value={formData.status} onValueChange={(value: 'active' | 'inactive') => setFormData({ ...formData, status: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">アクティブ</SelectItem>
            <SelectItem value="inactive">非アクティブ</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="submit">更新</Button>
      </div>
    </form>
  );
} 
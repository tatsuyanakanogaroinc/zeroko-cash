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
import { Plus, Search, Edit, Trash2, UserPlus } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'user';
  department: string;
  status: 'active' | 'inactive';
  avatar?: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

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

  useEffect(() => {
    setUsers(mockUsers);
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

  const handleAddUser = (userData: Omit<User, 'id'>) => {
    const newUser: User = {
      ...userData,
      id: (users.length + 1).toString()
    };
    setUsers([...users, newUser]);
    setIsAddDialogOpen(false);
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
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'user' as 'admin' | 'manager' | 'user',
    department: '',
    status: 'active' as 'active' | 'inactive'
  });

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
        <Input
          id="department"
          value={formData.department}
          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
          required
        />
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
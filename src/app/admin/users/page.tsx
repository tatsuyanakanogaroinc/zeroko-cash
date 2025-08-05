'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { useAuth } from '@/contexts/AuthContext';
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
  const router = useRouter();
  const { user: currentUser, loading, isAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [createdUserInfo, setCreatedUserInfo] = useState<{email: string, password: string} | null>(null);
  const [isShowPasswordDialogOpen, setIsShowPasswordDialogOpen] = useState(false);

  // 認証チェック
  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login');
      return;
    }
    
    if (!loading && currentUser && !isAdmin) {
      toast.error('管理者権限が必要です');
      router.push('/dashboard');
      return;
    }
  }, [currentUser, loading, isAdmin, router]);

  // ローディング中または認証チェック中は表示しない
  if (loading || !currentUser || !isAdmin) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">読み込み中...</p>
        </div>
      </MainLayout>
    );
  }


  // 部署の初期化
  const initializeDepartments = async () => {
    try {
      const response = await fetch('/api/departments');
      if (!response.ok) throw new Error('部署取得失敗');
      const existingDepartments = await response.json();
      
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
          const createResponse = await fetch('/api/departments', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(dept),
          });
          if (!createResponse.ok) throw new Error('部署作成失敗');
        }
        
        toast.success('部署マスターを初期化しました');
      }
      
      // 部署リストを更新
      const updatedResponse = await fetch('/api/departments');
      if (!updatedResponse.ok) throw new Error('部署取得失敗');
      const updatedDepartments = await updatedResponse.json();
      setDepartments(updatedDepartments);
    } catch (error) {
      console.error('部署初期化エラー:', error);
      toast.error('部署の初期化に失敗しました');
    }
  };

  // ユーザーデータをロード
  const loadUsers = useCallback(async (depts?: Department[]) => {
    try {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('ユーザー取得失敗');
      const usersData = await response.json();
      console.log('Loaded users:', usersData);
      
      // 部門リストを取得（引数で渡されたものまたは現在のstate）
      const availableDepartments = depts || departments;
      
      // データベースのユーザーをUIで表示する形式に変換
      const formattedUsers = usersData.map(user => {
        // 部門名を取得（department_idから部門名を検索）
        const departmentName = user.department_id 
          ? availableDepartments.find(dept => dept.id === user.department_id)?.name || '未設定'
          : '未設定';
        
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role as 'admin' | 'manager' | 'user',
          department: departmentName,
          status: 'active' as 'active' | 'inactive' // デフォルトでactive
        };
      });
      
      setUsers(formattedUsers);
    } catch (error) {
      console.error('ユーザー取得エラー:', error);
      toast.error('ユーザーデータの取得に失敗しました');
      // エラーハンドリング
      setUsers([]);
    }
  }, [departments]);

  useEffect(() => {
    const loadData = async () => {
      await initializeDepartments();
      // 部門データが読み込まれた後にユーザーを読み込む
      const response = await fetch('/api/departments');
      if (response.ok) {
        const depts = await response.json();
        await loadUsers(depts);
      }
    };
    loadData();
  }, []); // 依存配列を空にして初回のみ実行

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
      
      // APIを使ってユーザーを作成
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: userData.name,
          email: userData.email,
          role: userData.role,
          department_id: userData.departmentId || null
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'ユーザー作成に失敗しました');
      }
      
      const newUser = await response.json();
      
      // 初期パスワード情報を保存（実際の実装では、この情報は作成直後のみ表示される）
      setCreatedUserInfo({
        email: newUser.email,
        password: newUser.initial_password || 'パスワード取得エラー'
      });
      
      // ユーザーリストを更新（現在の部門情報を使用）
      await loadUsers(departments);
      
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

const handleDeleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/users?id=${userId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('ユーザー削除に失敗しました');
      }
      
      setUsers(users.filter(user => user.id !== userId));
      toast.success('ユーザーが成功的に削除されました');
    } catch (error) {
      console.error('ユーザー削除エラー:', error);
      toast.error('ユーザーの削除中にエラーが発生しました');
    }
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
                
                <div className="space-y-4">
                  {/* 一括コピー */}
                  <div>
                    <Label className="text-sm font-medium">ログイン情報（一括コピー）</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Input 
                        value={`メール: ${createdUserInfo.email} | パスワード: ${createdUserInfo.password}`}
                        readOnly 
                        className="bg-blue-50 font-mono text-sm" 
                      />
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => {
                          const copyText = `メールアドレス: ${createdUserInfo.email}\n初期パスワード: ${createdUserInfo.password}`;
                          if (navigator.clipboard && window.isSecureContext) {
                            navigator.clipboard.writeText(copyText).then(() => {
                              toast.success('ログイン情報をコピーしました');
                            }).catch(() => {
                              // フォールバック処理
                              const textArea = document.createElement('textarea');
                              textArea.value = copyText;
                              document.body.appendChild(textArea);
                              textArea.select();
                              document.execCommand('copy');
                              document.body.removeChild(textArea);
                              toast.success('ログイン情報をコピーしました');
                            });
                          } else {
                            // フォールバック処理
                            const textArea = document.createElement('textarea');
                            textArea.value = copyText;
                            document.body.appendChild(textArea);
                            textArea.select();
                            document.execCommand('copy');
                            document.body.removeChild(textArea);
                            toast.success('ログイン情報をコピーしました');
                          }
                        }}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        一括コピー
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">メールアドレス</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Input value={createdUserInfo.email} readOnly className="bg-gray-50" />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (navigator.clipboard && window.isSecureContext) {
                              navigator.clipboard.writeText(createdUserInfo.email).then(() => {
                                toast.success('メールアドレスをコピーしました');
                              }).catch(() => {
                                const textArea = document.createElement('textarea');
                                textArea.value = createdUserInfo.email;
                                document.body.appendChild(textArea);
                                textArea.select();
                                document.execCommand('copy');
                                document.body.removeChild(textArea);
                                toast.success('メールアドレスをコピーしました');
                              });
                            } else {
                              const textArea = document.createElement('textarea');
                              textArea.value = createdUserInfo.email;
                              document.body.appendChild(textArea);
                              textArea.select();
                              document.execCommand('copy');
                              document.body.removeChild(textArea);
                              toast.success('メールアドレスをコピーしました');
                            }
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
                            if (navigator.clipboard && window.isSecureContext) {
                              navigator.clipboard.writeText(createdUserInfo.password).then(() => {
                                toast.success('初期パスワードをコピーしました');
                              }).catch(() => {
                                const textArea = document.createElement('textarea');
                                textArea.value = createdUserInfo.password;
                                document.body.appendChild(textArea);
                                textArea.select();
                                document.execCommand('copy');
                                document.body.removeChild(textArea);
                                toast.success('初期パスワードをコピーしました');
                              });
                            } else {
                              const textArea = document.createElement('textarea');
                              textArea.value = createdUserInfo.password;
                              document.body.appendChild(textArea);
                              textArea.select();
                              document.execCommand('copy');
                              document.body.removeChild(textArea);
                              toast.success('初期パスワードをコピーしました');
                            }
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
        const response = await fetch('/api/departments');
        if (!response.ok) throw new Error('部署取得失敗');
        const depts = await response.json();
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
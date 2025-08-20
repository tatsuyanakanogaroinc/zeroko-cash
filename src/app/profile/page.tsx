'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { User, Lock, Mail, Building, Calendar, Save, Edit } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { departmentService, userService } from '@/lib/database';
import { toast } from 'sonner';

interface Department {
  id: string;
  name: string;
  budget: number;
  created_at: string;
}

export default function ProfilePage() {
  const { user, loading, refreshUser } = useAuth();
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    department_id: user?.department_id || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name,
        email: user.email,
        department_id: user.department_id || '',
      });
    }
  }, [user]);

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const deps = await departmentService.getDepartments();
        setDepartments(deps);
      } catch (error) {
        console.error('部署情報の取得に失敗しました:', error);
      }
    };
    loadDepartments();
  }, []);

  const getUserDepartment = () => {
    if (!user?.department_id) return null;
    return departments.find(dept => dept.id === user.department_id);
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'admin':
        return '管理者';
      case 'manager':
        return 'マネージャー';
      case 'accountant':
        return '経理担当';
      case 'user':
        return 'ユーザー';
      default:
        return role;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'manager':
        return 'bg-blue-100 text-blue-800';
      case 'accountant':
        return 'bg-green-100 text-green-800';
      case 'user':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setProfileLoading(true);
    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: user.id,
          name: profileData.name,
          email: profileData.email,
          department_id: profileData.department_id || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'プロフィールの更新に失敗しました');
      }
      
      // 認証コンテキストを更新
      await refreshUser();
      
      toast.success('プロフィールを更新しました');
      setIsEditing(false);
    } catch (error) {
      console.error('プロフィール更新エラー:', error);
      toast.error(error instanceof Error ? error.message : 'プロフィールの更新に失敗しました');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('新しいパスワードと確認用パスワードが一致しません');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('パスワードは6文字以上で入力してください');
      return;
    }

    setProfileLoading(true);
    try {
      // 実際の実装では、パスワード変更のAPIを呼び出す
      // ここではデモとして成功メッセージを表示
      toast.success('パスワードを変更しました');
      setIsChangePasswordOpen(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('パスワード変更エラー:', error);
      toast.error('パスワードの変更に失敗しました');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setProfileData({
        name: user.name,
        email: user.email,
        department_id: user.department_id || '',
      });
    }
    setIsEditing(false);
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  if (!user) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">ユーザー情報を読み込んでいます...</p>
        </div>
      </MainLayout>
    );
  }

  const department = getUserDepartment();

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">マイページ</h1>
            <p className="text-gray-600">プロフィール情報の確認・編集を行います</p>
          </div>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">プロフィール</TabsTrigger>
            <TabsTrigger value="security">セキュリティ</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>基本情報</CardTitle>
                <CardDescription>
                  アカウントの基本情報を確認・編集できます
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-start space-x-8">
                  {/* アバター */}
                  <div className="flex flex-col items-center space-y-4">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} />
                      <AvatarFallback className="text-2xl">{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <Badge className={getRoleBadgeColor(user.role)}>
                      {getRoleName(user.role)}
                    </Badge>
                  </div>

                  {/* プロフィール情報 */}
                  <div className="flex-1">
                    {isEditing ? (
                      <form onSubmit={handleProfileUpdate} className="space-y-4">
                        <div>
                          <Label htmlFor="name">名前</Label>
                          <Input
                            id="name"
                            value={profileData.name}
                            onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">メールアドレス</Label>
                          <Input
                            id="email"
                            type="email"
                            value={profileData.email}
                            onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="department">部署</Label>
                          <select
                            id="department"
                            value={profileData.department_id}
                            onChange={(e) => setProfileData({ ...profileData, department_id: e.target.value })}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="">部署を選択してください</option>
                            {departments.map((dept) => (
                              <option key={dept.id} value={dept.id}>
                                {dept.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex space-x-2">
                          <Button type="submit" disabled={profileLoading}>
                            <Save className="mr-2 h-4 w-4" />
                            {profileLoading ? '保存中...' : '保存'}
                          </Button>
                          <Button type="button" variant="outline" onClick={handleCancel}>
                            キャンセル
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-500">名前</Label>
                            <p className="mt-1 text-lg">{user.name}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-500">メールアドレス</Label>
                            <p className="mt-1 text-lg">{user.email}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-500">部署</Label>
                            <p className="mt-1 text-lg">{department?.name || '未設定'}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-500">権限</Label>
                            <p className="mt-1 text-lg">{getRoleName(user.role)}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-500">登録日</Label>
                            <p className="mt-1 text-lg">
                              {new Date(user.created_at).toLocaleDateString('ja-JP')}
                            </p>
                          </div>
                        </div>
                        <div className="pt-4">
                          <Button onClick={() => setIsEditing(true)}>
                            <Edit className="mr-2 h-4 w-4" />
                            編集
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>パスワード</CardTitle>
                <CardDescription>
                  アカウントのセキュリティを保護するため、定期的にパスワードを変更することをお勧めします
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Lock className="mr-2 h-4 w-4" />
                      パスワードを変更
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>パスワードの変更</DialogTitle>
                      <DialogDescription>
                        セキュリティ向上のため、強力なパスワードを設定してください
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                      <div>
                        <Label htmlFor="current-password">現在のパスワード</Label>
                        <Input
                          id="current-password"
                          type="password"
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="new-password">新しいパスワード</Label>
                        <Input
                          id="new-password"
                          type="password"
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="confirm-password">新しいパスワード（確認）</Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          required
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setIsChangePasswordOpen(false)}>
                          キャンセル
                        </Button>
                        <Button type="submit" disabled={profileLoading}>
                          {profileLoading ? '変更中...' : '変更する'}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>アカウント情報</CardTitle>
                <CardDescription>
                  アカウントに関する詳細情報
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-500">メールアドレス:</span>
                    <span className="text-sm">{user.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-500">アカウント作成日:</span>
                    <span className="text-sm">
                      {new Date(user.created_at).toLocaleDateString('ja-JP', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-500">ユーザーID:</span>
                    <span className="text-sm font-mono">{user.id}</span>
                  </div>
                  {department && (
                    <div className="flex items-center space-x-2">
                      <Building className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-500">所属部署:</span>
                      <span className="text-sm">{department.name}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}

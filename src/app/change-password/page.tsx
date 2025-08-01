'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    if (password.length < 8) {
      errors.push('パスワードは8文字以上である必要があります');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('大文字を1文字以上含める必要があります');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('小文字を1文字以上含める必要があります');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('数字を1文字以上含める必要があります');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('特殊文字を1文字以上含める必要があります');
    }
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    // バリデーション
    const validationErrors: string[] = [];
    
    if (!passwordData.currentPassword) {
      validationErrors.push('現在のパスワードを入力してください');
    }
    
    if (!passwordData.newPassword) {
      validationErrors.push('新しいパスワードを入力してください');
    } else {
      const passwordErrors = validatePassword(passwordData.newPassword);
      validationErrors.push(...passwordErrors);
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      validationErrors.push('新しいパスワードと確認用パスワードが一致しません');
    }
    
    if (passwordData.currentPassword === passwordData.newPassword) {
      validationErrors.push('新しいパスワードは現在のパスワードと異なる必要があります');
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      // 実際の実装では、ここでパスワード変更APIを呼び出す
      await new Promise(resolve => setTimeout(resolve, 1000)); // シミュレーション
      
      toast.success('パスワードが正常に変更されました');
      router.push('/dashboard');
    } catch (error) {
      console.error('パスワード変更エラー:', error);
      toast.error('パスワードの変更に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const getPasswordStrength = (password: string) => {
    const errors = validatePassword(password);
    const strength = Math.max(0, 5 - errors.length);
    return {
      score: strength,
      label: ['非常に弱い', '弱い', '普通', '強い', '非常に強い'][strength],
      color: ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'][strength]
    };
  };

  const passwordStrength = getPasswordStrength(passwordData.newPassword);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center space-x-2">
            <AlertCircle className="h-6 w-6 text-yellow-600" />
            <span>パスワード変更が必要です</span>
          </CardTitle>
          <CardDescription>
            セキュリティ向上のため、初回ログイン時にパスワードの変更をお願いします。
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 現在のパスワード */}
            <div>
              <Label htmlFor="current-password">現在のパスワード</Label>
              <div className="relative mt-1">
                <Input
                  id="current-password"
                  type={showPasswords.current ? 'text' : 'password'}
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => togglePasswordVisibility('current')}
                >
                  {showPasswords.current ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* 新しいパスワード */}
            <div>
              <Label htmlFor="new-password">新しいパスワード</Label>
              <div className="relative mt-1">
                <Input
                  id="new-password"
                  type={showPasswords.new ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => togglePasswordVisibility('new')}
                >
                  {showPasswords.new ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              
              {/* パスワード強度インジケーター */}
              {passwordData.newPassword && (
                <div className="mt-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600">{passwordStrength.label}</span>
                  </div>
                </div>
              )}
            </div>

            {/* 確認用パスワード */}
            <div>
              <Label htmlFor="confirm-password">パスワード確認</Label>
              <div className="relative mt-1">
                <Input
                  id="confirm-password"
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => togglePasswordVisibility('confirm')}
                >
                  {showPasswords.confirm ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* パスワード要件 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h4 className="text-sm font-medium text-blue-800 mb-2">パスワード要件:</h4>
              <ul className="text-xs text-blue-700 space-y-1">
                <li className="flex items-center space-x-2">
                  <CheckCircle className={`h-3 w-3 ${passwordData.newPassword.length >= 8 ? 'text-green-500' : 'text-gray-400'}`} />
                  <span>8文字以上</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className={`h-3 w-3 ${/[A-Z]/.test(passwordData.newPassword) ? 'text-green-500' : 'text-gray-400'}`} />
                  <span>大文字を含む</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className={`h-3 w-3 ${/[a-z]/.test(passwordData.newPassword) ? 'text-green-500' : 'text-gray-400'}`} />
                  <span>小文字を含む</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className={`h-3 w-3 ${/[0-9]/.test(passwordData.newPassword) ? 'text-green-500' : 'text-gray-400'}`} />
                  <span>数字を含む</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className={`h-3 w-3 ${/[!@#$%^&*(),.?":{}|<>]/.test(passwordData.newPassword) ? 'text-green-500' : 'text-gray-400'}`} />
                  <span>特殊文字を含む</span>
                </li>
              </ul>
            </div>

            {/* エラー表示 */}
            {errors.length > 0 && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  <ul className="list-disc list-inside space-y-1">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* 送信ボタン */}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'パスワード変更中...' : 'パスワードを変更'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

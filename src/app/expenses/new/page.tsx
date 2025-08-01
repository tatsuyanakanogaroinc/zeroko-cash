'use client';

import { useState, useEffect } from 'react';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { expenseFormSchema, type ExpenseFormData } from '@/lib/validations';
import { Upload, X, FileText } from 'lucide-react';
import { useMasterDataStore, useExpenseStore } from '@/lib/store';
import { getApprovers } from '@/lib/approvers';
import { supabase } from '@/lib/supabase';
import { userService } from '@/lib/database';

export default function NewExpensePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [sortedCategories, setSortedCategories] = useState<any[]>([]);
  const [availableEvents, setAvailableEvents] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      payment_method: 'personal_cash',
    },
  });

  const watchedAmount = watch('amount');
  const watchedCategoryId = watch('category_id');

  // グローバルストアからデータを取得
  const { categories, getActiveProjects, departments, getCategoriesByUsage } = useMasterDataStore();
  const { addExpense } = useExpenseStore();
  const activeProjects = getActiveProjects();

  // 選択中の勘定科目で領収書が必須かどうかチェック
  const selectedCategory = sortedCategories.find(cat => cat.id === watchedCategoryId);
  const isReceiptRequired = selectedCategory?.requires_receipt || false;

  // 勘定科目を使用頻度順で取得
  React.useEffect(() => {
    const loadSortedCategories = async () => {
      try {
        const sorted = await getCategoriesByUsage();
        setSortedCategories(sorted);
      } catch (error) {
        console.error('Error loading sorted categories:', error);
        setSortedCategories(categories);
      }
    };
    loadSortedCategories();
  }, [categories, getCategoriesByUsage]);

  // 実データのイベントを取得
  React.useEffect(() => {
    const loadEvents = async () => {
      try {
        const response = await fetch('/api/events');
        if (response.ok) {
          const eventsData = await response.json();
          setAvailableEvents(eventsData);
        } else {
          // フォールバック用のモックデータ
          setAvailableEvents([
            { id: '1', name: '東京展示会2024', start_date: '2024-01-15', end_date: '2024-01-17' },
            { id: '2', name: '大阪商談会', start_date: '2024-01-20', end_date: '2024-01-22' },
            { id: '3', name: '名古屋セミナー', start_date: '2024-01-25', end_date: '2024-01-26' },
            { id: '4', name: '福岡研修', start_date: '2024-02-01', end_date: '2024-02-03' },
          ]);
        }
      } catch (error) {
        console.error('Error loading events:', error);
        setAvailableEvents([]);
      }
    };
    loadEvents();
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatAmount = (value: string) => {
    const numValue = value.replace(/[^\d]/g, '');
    return numValue ? parseInt(numValue).toLocaleString() : '';
  };

  const onSubmit = async (data: ExpenseFormData) => {
    setIsLoading(true);
    try {
      // マスター設定で領収書が必須の場合はチェック
      if (isReceiptRequired && uploadedFiles.length === 0) {
        alert('この勘定科目では領収書のアップロードが必須です。');
        setIsLoading(false);
        return;
      }
      
      // ログインユーザー情報取得
      const userRes = await supabase.auth.getUser();
      if (!userRes.data.user) {
        throw new Error('ユーザー情報が取得できません');
      }
      
      // Supabaseに経費データを保存
      const expenseData = {
        user_id: userRes.data.user.id,
        expense_date: data.expense_date.toISOString().split('T')[0],
        amount: data.amount,
        category_id: data.category_id,
        description: data.description,
        payment_method: data.payment_method || 'personal_cash',
        status: 'pending',
        event_id: data.event_id === 'none' ? null : data.event_id,
        department_id: data.department_id || null,
        project_id: data.project_id || null,
      };

      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expenseData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '経費申請の送信に失敗しました');
      }

      const newExpense = await response.json();

      console.log('経費申請がSupabaseに保存されました:', newExpense);
      
      // 申請完了ページに遷移（申請内容を含む）
      const params = new URLSearchParams({
        type: 'expense',
        amount: data.amount.toString(),
        description: data.description
      });
      router.push(`/application-success?${params.toString()}`);
    } catch (error) {
      console.error('申請エラー:', error);
      alert('申請の送信に失敗しました。もう一度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">経費申請</h1>
          <p className="text-gray-600">新しい経費申請を作成します</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>基本情報</CardTitle>
              <CardDescription>
                経費の基本情報を入力してください
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expense_date">支出日 *</Label>
                  <Input
                    id="expense_date"
                    type="date"
                    {...register('expense_date', {
                      setValueAs: (value) => new Date(value),
                    })}
                  />
                  {errors.expense_date && (
                    <p className="text-sm text-red-500">{errors.expense_date.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">金額 *</Label>
                  <Input
                    id="amount"
                    type="text"
                    placeholder="1,000"
                    {...register('amount', {
                      setValueAs: (value) => parseInt(value.replace(/[^\d]/g, '')),
                    })}
                    onChange={(e) => {
                      const formatted = formatAmount(e.target.value);
                      e.target.value = formatted;
                    }}
                  />
                  {errors.amount && (
                    <p className="text-sm text-red-500">{errors.amount.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category_id">勘定科目 *</Label>
                  <Select onValueChange={(value) => setValue('category_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="勘定科目を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {sortedCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category_id && (
                    <p className="text-sm text-red-500">{errors.category_id.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department_id">部門 *</Label>
                  <Select onValueChange={(value) => setValue('department_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="部門を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((department) => (
                        <SelectItem key={department.id} value={department.id}>
                          {department.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.department_id && (
                    <p className="text-sm text-red-500">{errors.department_id.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="event_id">イベント</Label>
                  <Select onValueChange={(value) => setValue('event_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="イベントを選択（任意）" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">イベントなし</SelectItem>
                      {availableEvents.map((event) => (
                        <SelectItem key={event.id} value={event.id}>
                          {event.name} ({event.start_date} - {event.end_date})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="project_id">プロジェクト</Label>
                  <Select onValueChange={(value) => setValue('project_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="プロジェクトを選択（任意）" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeProjects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name} ({project.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_method">支払方法 *</Label>
                <Select onValueChange={(value) => setValue('payment_method', value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="支払方法を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal_cash">自費現金</SelectItem>
                    <SelectItem value="personal_credit">自費クレカ</SelectItem>
                    <SelectItem value="company_cash">会社現金</SelectItem>
                    <SelectItem value="company_credit">会社クレカ</SelectItem>
                  </SelectContent>
                </Select>
                {errors.payment_method && (
                  <p className="text-sm text-red-500">{errors.payment_method.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">詳細説明 *</Label>
                <Textarea
                  id="description"
                  placeholder="経費の詳細を入力してください"
                  {...register('description')}
                  rows={4}
                />
                {errors.description && (
                  <p className="text-sm text-red-500">{errors.description.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>領収書{isReceiptRequired && ' *'}</CardTitle>
              <CardDescription>
                領収書の画像をアップロードしてください（JPG、PNG、PDF）
                {isReceiptRequired && <span className="text-red-500 font-medium">（この勘定科目では領収書が必須です）</span>}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <Label htmlFor="file-upload" className="cursor-pointer">
                      <span className="text-blue-600 hover:text-blue-500">
                        ファイルを選択
                      </span>
                      またはドラッグ&ドロップ
                    </Label>
                    <Input
                      id="file-upload"
                      type="file"
                      multiple
                      accept=".jpg,.jpeg,.png,.pdf"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    最大5MBまで、複数ファイル可
                  </p>
                </div>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <Label>アップロード済みファイル</Label>
                  <div className="space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{file.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </Badge>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  申請中...
                </div>
              ) : (
                '申請する'
              )}
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
} 
'use client';

import { useState, useEffect, Suspense } from 'react';
import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, X, FileText } from 'lucide-react';
import { useMasterDataStore } from '@/lib/store';
import { invoicePaymentService } from '@/lib/database';
import { supabase } from '@/lib/supabase';
import { userService } from '@/lib/database';
import { useAuth } from '@/contexts/AuthContext';

// バリデーションスキーマ
const invoicePaymentSchema = z.object({
  description: z.string().min(1, '詳細説明は必須です'),
  amount: z.number().min(1, '金額は1円以上で入力してください'),
  invoice_date: z.date({ required_error: '請求日は必須です' }),
  due_date: z.date({ required_error: '支払期日は必須です' }),
  vendor_name: z.string().min(1, 'ベンダー名は必須です'),
  category_id: z.string().min(1, '勘定科目は必須です'),
  department_id: z.string().min(1, '部門は必須です'),
  project_id: z.string().optional(),
  event_id: z.string().optional(),
});

type InvoicePaymentFormData = z.infer<typeof invoicePaymentSchema>;

function NewInvoicePaymentForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [sortedCategories, setSortedCategories] = useState<any[]>([]);
  const [availableEvents, setAvailableEvents] = useState<any[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingInvoicePaymentId, setEditingInvoicePaymentId] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // AuthContextからユーザー情報を取得
  const { user } = useAuth();

  // 編集モードかどうかチェック
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId) {
      setIsEditMode(true);
      setEditingInvoicePaymentId(editId);
      console.log('請求書編集モード:', editId);
      loadInvoicePaymentForEdit(editId);
    }
  }, [searchParams]);

  // 編集用に既存の請求書データを読み込み
  const loadInvoicePaymentForEdit = async (invoicePaymentId: string) => {
    try {
      const response = await fetch(`/api/invoice-payments/${invoicePaymentId}`);
      if (response.ok) {
        const invoicePayment = await response.json();
        console.log('請求書編集用データ読み込み:', invoicePayment);
        
        // 日付を適切にフォーマット
        const invoiceDate = new Date(invoicePayment.invoice_date);
        const dueDate = new Date(invoicePayment.due_date);
        
        // フォームに既存データを設定
        setValue('invoice_date', invoiceDate);
        setValue('due_date', dueDate);
        setValue('amount', invoicePayment.amount);
        setValue('vendor_name', invoicePayment.vendor_name);
        setValue('category_id', invoicePayment.category_id);
        setValue('department_id', invoicePayment.department_id || '');
        setValue('project_id', invoicePayment.project_id || '');
        setValue('event_id', invoicePayment.event_id || 'none');
        setValue('description', invoicePayment.description);
      } else {
        console.error('請求書データの読み込みに失敗しました');
        alert('編集対象の請求書データが見つかりません。');
      }
    } catch (error) {
      console.error('請求書編集用データの読み込みエラー:', error);
      alert('請求書編集用データの読み込みに失敗しました。');
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<InvoicePaymentFormData>({
    resolver: zodResolver(invoicePaymentSchema),
  });

  const watchedAmount = watch('amount');
  const watchedCategoryId = watch('category_id');

  // グローバルストアからデータを取得
  const { categories, getActiveProjects, departments, getCategoriesByUsage } = useMasterDataStore();
  const activeProjects = getActiveProjects();

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

  const onSubmit = async (data: InvoicePaymentFormData) => {
    setIsLoading(true);
    try {
      // ユーザー情報の確認
      if (!user?.id) {
        throw new Error('ユーザー情報が取得できません。ログインし直してください。');
      }
      
      console.log('請求書払い申請を送信中:', { userId: user.id, userName: user.name });

      // 請求書払い申請データを作成
      const invoicePaymentData = {
        user_id: user.id,
        description: data.description,
        amount: data.amount,
        invoice_date: data.invoice_date.toISOString().split('T')[0],
        due_date: data.due_date.toISOString().split('T')[0],
        vendor_name: data.vendor_name,
        category_id: data.category_id,
        department_id: data.department_id,
        project_id: data.project_id || null,
        event_id: data.event_id || null,
        status: 'pending' as const,
      };

      console.log('請求書払い申請データ:', invoicePaymentData);
      console.log('アップロードファイル:', uploadedFiles);
      
      const url = isEditMode && editingInvoicePaymentId 
        ? `/api/invoice-payments/${editingInvoicePaymentId}` 
        : '/api/invoice-payments';
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoicePaymentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '請求書支払い申請の送信に失敗しました');
      }

      const newInvoicePayment = await response.json();
      
      // 申請成功ページにリダイレクト（申請内容を含む）
      const params = new URLSearchParams({
        type: 'invoice',
        amount: data.amount.toString(),
        description: data.description
      });
      router.push(`/application-success?${params.toString()}`);
    } catch (error) {
      console.error('申請エラー:', error);
      alert('請求書払い申請の作成に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">
            {isEditMode ? '請求書払い申請の編集' : '請求書払い申請'}
          </h1>
          <p className="text-gray-600">
            {isEditMode ? '請求書払い申請の内容を編集します' : '新しい請求書払い申請を作成します'}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>基本情報</CardTitle>
              <CardDescription>
                請求書払いの基本情報を入力してください
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invoice_date">請求日 *</Label>
                  <Input
                    id="invoice_date"
                    type="date"
                    value={watch('invoice_date') ? 
                      new Date(watch('invoice_date')).toISOString().split('T')[0] : 
                      ''
                    }
                    onChange={(e) => setValue('invoice_date', new Date(e.target.value))}
                  />
                  {errors.invoice_date && (
                    <p className="text-sm text-red-500">{errors.invoice_date.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="due_date">支払期日 *</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={watch('due_date') ? 
                      new Date(watch('due_date')).toISOString().split('T')[0] : 
                      ''
                    }
                    onChange={(e) => setValue('due_date', new Date(e.target.value))}
                  />
                  {errors.due_date && (
                    <p className="text-sm text-red-500">{errors.due_date.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">金額 *</Label>
                  <Input
                    id="amount"
                    type="text"
                    placeholder="1,000"
                    value={watch('amount') ? watch('amount').toLocaleString() : ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^\d]/g, '');
                      const numValue = value ? parseInt(value) : 0;
                      setValue('amount', numValue);
                      const formatted = formatAmount(e.target.value);
                      e.target.value = formatted;
                    }}
                  />
                  {errors.amount && (
                    <p className="text-sm text-red-500">{errors.amount.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vendor_name">ベンダー名 *</Label>
                  <Input
                    id="vendor_name"
                    placeholder="株式会社〇〇"
                    {...register('vendor_name')}
                  />
                  {errors.vendor_name && (
                    <p className="text-sm text-red-500">{errors.vendor_name.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category_id">勘定科目 *</Label>
                  <Select onValueChange={(value) => setValue('category_id', value)} value={watch('category_id')}>
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
                  <Select onValueChange={(value) => setValue('department_id', value)} value={watch('department_id')}>
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
                  <Label htmlFor="project_id">プロジェクト</Label>
                  <Select onValueChange={(value) => setValue('project_id', value)} value={watch('project_id')}>
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

                <div className="space-y-2">
                  <Label htmlFor="event_id">イベント</Label>
                  <Select onValueChange={(value) => setValue('event_id', value)} value={watch('event_id')}>
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">詳細説明 *</Label>
                <Textarea
                  id="description"
                  placeholder="請求書払いの詳細を入力してください"
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
              <CardTitle>請求書</CardTitle>
              <CardDescription>
                請求書の画像をアップロードしてください（JPG、PNG、PDF）
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

// Loading component for Suspense fallback
function InvoicePaymentFormSkeleton() {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">請求書払い申請</h1>
          <p className="text-gray-600">新しい請求書払い申請を作成します</p>
        </div>
        <div className="animate-pulse">
          <div className="bg-gray-200 h-96 rounded-lg mb-6"></div>
          <div className="bg-gray-200 h-64 rounded-lg"></div>
        </div>
      </div>
    </MainLayout>
  );
}

export default function NewInvoicePaymentPage() {
  return (
    <Suspense fallback={<InvoicePaymentFormSkeleton />}>
      <NewInvoicePaymentForm />
    </Suspense>
  );
}

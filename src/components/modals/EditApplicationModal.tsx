'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMasterDataStore } from '@/lib/store';

// バリデーションスキーマ
const editApplicationSchema = z.object({
  description: z.string().min(1, '説明は必須です'),
  amount: z.number().min(1, '金額は1円以上で入力してください'),
  expense_date: z.string().min(1, '日付は必須です'),
  category_id: z.string().min(1, '勘定科目を選択してください'),
  department_id: z.string().optional(),
  project_id: z.string().optional(),
  event_id: z.string().optional(),
  payment_method: z.string().min(1, '支払い方法を選択してください'),
});

type EditApplicationFormData = z.infer<typeof editApplicationSchema>;

interface Application {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: 'expense' | 'invoice';
  category_id?: string;
  department_id?: string;
  project_id?: string;
  event_name?: string;
  payment_method?: string;
}

interface EditApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: Application | null;
  onSuccess: () => void;
}

export const EditApplicationModal: React.FC<EditApplicationModalProps> = ({
  isOpen,
  onClose,
  application,
  onSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [availableEvents, setAvailableEvents] = useState<any[]>([]);
  
  const { categories, departments, getActiveProjects } = useMasterDataStore();
  const activeProjects = getActiveProjects();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<EditApplicationFormData>({
    resolver: zodResolver(editApplicationSchema),
    defaultValues: {
      payment_method: 'personal_cash',
    },
  });

  const watchedAmount = watch('amount');

  // イベントデータを取得
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const response = await fetch('/api/events');
        if (response.ok) {
          const eventsData = await response.json();
          setAvailableEvents(eventsData);
        }
      } catch (error) {
        console.error('Error loading events:', error);
        setAvailableEvents([]);
      }
    };
    loadEvents();
  }, []);

  // アプリケーションデータをフォームに設定
  useEffect(() => {
    if (application && isOpen) {
      console.log('Setting form data:', application);
      
      // 安全に日付をフォーマット
      let formattedDate;
      try {
        const date = new Date(application.date);
        if (isNaN(date.getTime())) {
          formattedDate = new Date().toISOString().split('T')[0];
        } else {
          formattedDate = date.toISOString().split('T')[0];
        }
      } catch (error) {
        console.warn('日付のパースに失敗:', error);
        formattedDate = new Date().toISOString().split('T')[0];
      }

      reset({
        description: application.description || '',
        amount: Number(application.amount) || 0,
        expense_date: formattedDate,
        category_id: application.category_id || '',
        department_id: application.department_id || '',
        project_id: application.project_id || '',
        event_id: application.event_name || 'none',
        payment_method: application.payment_method || 'personal_cash',
      });
    }
  }, [application, isOpen, reset]);

  // 金額のフォーマット
  const formatAmount = (value: string) => {
    const numValue = value.replace(/[^\d]/g, '');
    return numValue ? parseInt(numValue).toLocaleString() : '';
  };

  const onSubmit = async (data: EditApplicationFormData) => {
    if (!application) return;

    setIsLoading(true);
    try {
      const endpoint = application.type === 'expense' 
        ? `/api/expenses/${application.id}` 
        : `/api/invoice-payments/${application.id}`;

      const requestData = {
        ...data,
        user_id: application.user_id || application.users?.id,
        event_id: data.event_id === 'none' ? null : data.event_id,
      };

      console.log('Sending update request:', requestData);

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '更新に失敗しました');
      }

      alert('申請が正常に更新されました');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Update error:', error);
      alert(`更新に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!application) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {application.type === 'expense' ? '経費申請' : '請求書払い申請'}の編集
          </DialogTitle>
          <DialogDescription>
            申請内容を編集してください。
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* 説明 */}
          <div className="space-y-2">
            <Label htmlFor="description">説明 *</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="経費の詳細を入力してください"
              className="min-h-[80px]"
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          {/* 金額 */}
          <div className="space-y-2">
            <Label htmlFor="amount">金額 *</Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-500">¥</span>
              <Input
                id="amount"
                type="text"
                className="pl-8"
                placeholder="0"
                value={watchedAmount ? formatAmount(watchedAmount.toString()) : ''}
                onChange={(e) => {
                  const numValue = e.target.value.replace(/[^\d]/g, '');
                  setValue('amount', numValue ? parseInt(numValue) : 0);
                }}
              />
            </div>
            {errors.amount && (
              <p className="text-sm text-red-600">{errors.amount.message}</p>
            )}
          </div>

          {/* 日付 */}
          <div className="space-y-2">
            <Label htmlFor="expense_date">日付 *</Label>
            <Input
              id="expense_date"
              type="date"
              {...register('expense_date')}
            />
            {errors.expense_date && (
              <p className="text-sm text-red-600">{errors.expense_date.message}</p>
            )}
          </div>

          {/* 勘定科目 */}
          <div className="space-y-2">
            <Label htmlFor="category_id">勘定科目 *</Label>
            <Select
              value={watch('category_id') || ''}
              onValueChange={(value) => setValue('category_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="勘定科目を選択してください" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category_id && (
              <p className="text-sm text-red-600">{errors.category_id.message}</p>
            )}
          </div>

          {/* 部門 */}
          <div className="space-y-2">
            <Label htmlFor="department_id">部門</Label>
            <Select
              value={watch('department_id') || ''}
              onValueChange={(value) => setValue('department_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="部門を選択してください" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">選択なし</SelectItem>
                {departments.map((department) => (
                  <SelectItem key={department.id} value={department.id}>
                    {department.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* プロジェクト */}
          <div className="space-y-2">
            <Label htmlFor="project_id">プロジェクト</Label>
            <Select
              value={watch('project_id') || ''}
              onValueChange={(value) => setValue('project_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="プロジェクトを選択してください" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">選択なし</SelectItem>
                {activeProjects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* イベント */}
          <div className="space-y-2">
            <Label htmlFor="event_id">イベント</Label>
            <Select
              value={watch('event_id') || 'none'}
              onValueChange={(value) => setValue('event_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="イベントを選択してください" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">選択なし</SelectItem>
                {availableEvents.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 支払い方法 */}
          <div className="space-y-2">
            <Label htmlFor="payment_method">支払い方法 *</Label>
            <Select
              value={watch('payment_method') || 'personal_cash'}
              onValueChange={(value) => setValue('payment_method', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="支払い方法を選択してください" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="personal_cash">個人立替（現金）</SelectItem>
                <SelectItem value="personal_card">個人立替（カード）</SelectItem>
                <SelectItem value="company_card">法人カード</SelectItem>
                <SelectItem value="bank_transfer">銀行振込</SelectItem>
              </SelectContent>
            </Select>
            {errors.payment_method && (
              <p className="text-sm text-red-600">{errors.payment_method.message}</p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? '更新中...' : '更新'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

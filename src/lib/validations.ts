import { z } from 'zod';

export const expenseFormSchema = z.object({
  expense_date: z.date().refine((date) => date, '支出日を選択してください'),
  amount: z.number().min(1, '金額は1円以上で入力してください'),
  category_id: z.string().min(1, 'カテゴリを選択してください'),
  department_id: z.string().optional(),
  project_id: z.string().optional(),
  event_id: z.string().optional().refine((val) => val !== 'none', {
    message: 'イベントを選択してください',
    params: { invalid_type_error: 'イベントを選択してください' }
  }),
  description: z.string().min(1, '詳細説明は必須です'),
  payment_method: z.enum(['personal_cash', 'personal_credit', 'company_cash', 'company_credit']),
});

export const userSchema = z.object({
  name: z.string().min(1, '名前を入力してください'),
  email: z.string().email('有効なメールアドレスを入力してください'),
  department: z.string().min(1, '部門を選択してください'),
  role: z.enum(['user', 'manager', 'admin', 'accountant']),
});

export type ExpenseFormData = z.infer<typeof expenseFormSchema>;
export type UserFormData = z.infer<typeof userSchema>; 
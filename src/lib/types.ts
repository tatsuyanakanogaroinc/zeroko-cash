export interface User {
  id: string;
  email: string;
  name: string;
  department: string;
  role: 'user' | 'manager' | 'admin' | 'accountant' | 'contractor';
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  name: string;
  budget: number;
  responsible_user_id?: string;
  created_at: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  description?: string;
  requires_receipt: boolean;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  code: string;
  department_id: string;
  responsible_user_id?: string;
  status: 'active' | 'completed' | 'suspended';
  created_at: string;
}

export interface Event {
  id: string;
  name: string;
  department_id: string;
  start_date: string;
  end_date: string;
  budget: number;
  responsible_user_id?: string;
  status: 'active' | 'completed';
  description?: string;
  created_at: string;
}

export interface Expense {
  id: string;
  user_id: string;
  expense_date: string;
  amount: number;
  category_id: string;
  project_id?: string;
  description: string;
  payment_method: 'personal_cash' | 'personal_credit' | 'company_cash' | 'company_credit';
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'paid';
  created_at: string;
  updated_at: string;
}

export interface Receipt {
  id: string;
  expense_id: string;
  file_url: string;
  file_name: string;
  file_size: number;
  uploaded_at: string;
}

export interface Approval {
  id: string;
  expense_id: string;
  manager_id: string; // approver_id -> manager_id
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  approved_at?: string;
  created_at: string;
}

export interface ExpenseWithDetails extends Expense {
  user: User;
  category: ExpenseCategory;
  project?: Project;
  receipts: Receipt[];
  approvals: Approval[];
}

export interface ApproverSetting {
  id: string;
  department_id?: string;
  event_id?: string;
  project_id?: string;
  user_id: string;
  created_at: string;
} 
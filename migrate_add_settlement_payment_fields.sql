-- 精算・支払い処理機能用フィールド追加マイグレーション
-- Supabase SQL Editorで実行してください

-- 1. expensesテーブルにステータスを拡張（settled: 精算済み）
ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_status_check;
ALTER TABLE expenses ADD CONSTRAINT expenses_status_check 
  CHECK (status IN ('pending', 'approved', 'rejected', 'settled'));

-- 2. expensesテーブルに精算関連フィールドを追加
ALTER TABLE expenses 
  ADD COLUMN IF NOT EXISTS settled_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS settled_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS settlement_amount INTEGER,
  ADD COLUMN IF NOT EXISTS settlement_notes TEXT;

-- 3. invoice_paymentsテーブルに支払い関連フィールドを追加
ALTER TABLE invoice_payments 
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS paid_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS payment_notes TEXT;

-- 4. subcontractsテーブルに支払い関連フィールドを追加
ALTER TABLE subcontracts 
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS paid_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS payment_notes TEXT;

-- 5. インデックス追加
CREATE INDEX IF NOT EXISTS idx_expenses_settled_at ON expenses(settled_at);
CREATE INDEX IF NOT EXISTS idx_expenses_settled_by ON expenses(settled_by);
CREATE INDEX IF NOT EXISTS idx_invoice_payments_paid_at ON invoice_payments(paid_at);
CREATE INDEX IF NOT EXISTS idx_invoice_payments_paid_by ON invoice_payments(paid_by);
CREATE INDEX IF NOT EXISTS idx_subcontracts_paid_at ON subcontracts(paid_at);
CREATE INDEX IF NOT EXISTS idx_subcontracts_paid_by ON subcontracts(paid_by);

-- 6. コメント追加
COMMENT ON COLUMN expenses.settled_at IS '精算日時';
COMMENT ON COLUMN expenses.settled_by IS '精算処理者のユーザーID';
COMMENT ON COLUMN expenses.settlement_amount IS '実際の精算金額';
COMMENT ON COLUMN expenses.settlement_notes IS '精算時のメモ';

COMMENT ON COLUMN invoice_payments.paid_at IS '支払い日時';
COMMENT ON COLUMN invoice_payments.paid_by IS '支払い処理者のユーザーID';
COMMENT ON COLUMN invoice_payments.paid_amount IS '実際の支払い金額';
COMMENT ON COLUMN invoice_payments.payment_notes IS '支払い時のメモ';

COMMENT ON COLUMN subcontracts.paid_at IS '支払い日時';
COMMENT ON COLUMN subcontracts.paid_by IS '支払い処理者のユーザーID';
COMMENT ON COLUMN subcontracts.paid_amount IS '実際の支払い金額';
COMMENT ON COLUMN subcontracts.payment_notes IS '支払い時のメモ';

-- 7. RLSポリシーの更新（管理者のみが精算・支払い処理可能）
-- 注意: 実際の管理者判定ロジックに合わせて調整してください

-- expenses: 管理者が精算処理を実行可能
CREATE POLICY IF NOT EXISTS "Admins can settle expenses" ON expenses
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- invoice_payments: 管理者が支払い処理を実行可能  
CREATE POLICY IF NOT EXISTS "Admins can process payments" ON invoice_payments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- subcontracts: 管理者が支払い処理を実行可能
CREATE POLICY IF NOT EXISTS "Admins can process subcontract payments" ON subcontracts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );
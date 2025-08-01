-- 請求書払いテーブル作成用SQL
-- Supabase SQL Editorで実行してください

-- 請求書払いテーブル作成
CREATE TABLE IF NOT EXISTS invoice_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL,
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  vendor_name VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'paid')),
  receipt_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_invoice_payments_user_id ON invoice_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_invoice_payments_status ON invoice_payments(status);
CREATE INDEX IF NOT EXISTS idx_invoice_payments_invoice_date ON invoice_payments(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoice_payments_due_date ON invoice_payments(due_date);
CREATE INDEX IF NOT EXISTS idx_invoice_payments_category_id ON invoice_payments(category_id);
CREATE INDEX IF NOT EXISTS idx_invoice_payments_department_id ON invoice_payments(department_id);
CREATE INDEX IF NOT EXISTS idx_invoice_payments_project_id ON invoice_payments(project_id);
CREATE INDEX IF NOT EXISTS idx_invoice_payments_event_id ON invoice_payments(event_id);

-- 更新時間の自動更新トリガー関数
CREATE OR REPLACE FUNCTION update_invoice_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガー作成
DROP TRIGGER IF EXISTS trigger_update_invoice_payments_updated_at ON invoice_payments;
CREATE TRIGGER trigger_update_invoice_payments_updated_at
  BEFORE UPDATE ON invoice_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_payments_updated_at();

-- Row Level Security (RLS) を有効化
ALTER TABLE invoice_payments ENABLE ROW LEVEL SECURITY;

-- ポリシー作成
-- ユーザーは自分の請求書払い申請のみ表示可能
CREATE POLICY "Users can view own invoice payments" ON invoice_payments
  FOR SELECT USING (auth.uid() = user_id);

-- ユーザーは自分の請求書払い申請を作成可能
CREATE POLICY "Users can insert own invoice payments" ON invoice_payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ユーザーは自分の請求書払い申請を更新可能（draft/pendingステータスのみ）
CREATE POLICY "Users can update own invoice payments" ON invoice_payments
  FOR UPDATE USING (auth.uid() = user_id AND status IN ('draft', 'pending'));

-- 管理者は全ての請求書払い申請を表示・更新可能
-- TODO: ユーザーのロール管理システムに合わせて調整してください

-- コメント追加
COMMENT ON TABLE invoice_payments IS '請求書払い申請テーブル';
COMMENT ON COLUMN invoice_payments.id IS 'プライマリキー';
COMMENT ON COLUMN invoice_payments.user_id IS '申請者のユーザーID';
COMMENT ON COLUMN invoice_payments.department_id IS '部門ID';
COMMENT ON COLUMN invoice_payments.project_id IS 'プロジェクトID';
COMMENT ON COLUMN invoice_payments.category_id IS '勘定科目ID';
COMMENT ON COLUMN invoice_payments.event_id IS 'イベントID';
COMMENT ON COLUMN invoice_payments.amount IS '請求金額';
COMMENT ON COLUMN invoice_payments.description IS '説明';
COMMENT ON COLUMN invoice_payments.invoice_date IS '請求日';
COMMENT ON COLUMN invoice_payments.due_date IS '支払期日';
COMMENT ON COLUMN invoice_payments.vendor_name IS 'ベンダー名';
COMMENT ON COLUMN invoice_payments.status IS 'ステータス: draft, pending, approved, rejected, paid';
COMMENT ON COLUMN invoice_payments.receipt_url IS '請求書画像URL';
COMMENT ON COLUMN invoice_payments.created_at IS '作成日時';
COMMENT ON COLUMN invoice_payments.updated_at IS '更新日時';

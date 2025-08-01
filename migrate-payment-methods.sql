-- データベースのpayment_method制約を新しい値に更新するマイグレーション

-- 既存の制約を削除
ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_payment_method_check;

-- 新しい制約を追加
ALTER TABLE expenses ADD CONSTRAINT expenses_payment_method_check 
CHECK (payment_method IN ('personal_cash', 'personal_credit', 'company_cash', 'company_credit'));

-- 既存データを新しい値に更新（必要に応じて）
UPDATE expenses 
SET payment_method = CASE 
  WHEN payment_method = 'cash' THEN 'personal_cash'
  WHEN payment_method = 'credit_card' THEN 'personal_credit'
  WHEN payment_method = 'bank_transfer' THEN 'company_cash'
  ELSE payment_method
END
WHERE payment_method IN ('cash', 'credit_card', 'bank_transfer');

-- 確認用クエリ
SELECT DISTINCT payment_method FROM expenses;

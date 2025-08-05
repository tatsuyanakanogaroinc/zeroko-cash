-- 外注テーブルに定期支払い対応フィールドを追加

-- 支払いタイプフィールドを追加
ALTER TABLE subcontracts 
ADD COLUMN IF NOT EXISTS payment_type VARCHAR(20) NOT NULL DEFAULT 'one_time' 
CHECK (payment_type IN ('one_time', 'recurring'));

-- 定期支払い関連フィールドを追加
ALTER TABLE subcontracts 
ADD COLUMN IF NOT EXISTS recurring_frequency VARCHAR(20) 
CHECK (recurring_frequency IN ('monthly', 'quarterly', 'semi_annually', 'annually'));

ALTER TABLE subcontracts 
ADD COLUMN IF NOT EXISTS recurring_day INTEGER 
CHECK (recurring_day >= 1 AND recurring_day <= 31);

ALTER TABLE subcontracts 
ADD COLUMN IF NOT EXISTS payment_count INTEGER;

ALTER TABLE subcontracts 
ADD COLUMN IF NOT EXISTS total_amount INTEGER;

-- 既存データの更新（一時払いとして設定）
UPDATE subcontracts 
SET 
  payment_type = 'one_time',
  total_amount = contract_amount
WHERE payment_type IS NULL OR total_amount IS NULL;

-- インデックスの追加
CREATE INDEX IF NOT EXISTS idx_subcontracts_payment_type ON subcontracts(payment_type);
CREATE INDEX IF NOT EXISTS idx_subcontracts_recurring_frequency ON subcontracts(recurring_frequency);

-- 制約の追加：定期支払いの場合は必須フィールドをチェック
ALTER TABLE subcontracts 
ADD CONSTRAINT check_recurring_fields 
CHECK (
  (payment_type = 'one_time') OR 
  (payment_type = 'recurring' AND recurring_frequency IS NOT NULL AND recurring_day IS NOT NULL AND payment_count IS NOT NULL)
);

-- コメントの追加
COMMENT ON COLUMN subcontracts.payment_type IS '支払いタイプ: one_time(一時払い), recurring(定期支払い)';
COMMENT ON COLUMN subcontracts.recurring_frequency IS '定期支払い頻度: monthly(毎月), quarterly(四半期), semi_annually(半年), annually(年次)';
COMMENT ON COLUMN subcontracts.recurring_day IS '支払い日: 1-31の値（月末の場合は31を設定）';
COMMENT ON COLUMN subcontracts.payment_count IS '支払い回数';
COMMENT ON COLUMN subcontracts.total_amount IS '総支払い額（contract_amount × payment_count）';

-- サンプルデータの追加（定期支払いの例）
INSERT INTO subcontracts (
  contractor_name, 
  contract_title, 
  description, 
  contract_amount, 
  total_amount,
  start_date, 
  end_date, 
  department_id, 
  category_id, 
  responsible_user_id, 
  payment_type,
  recurring_frequency,
  recurring_day,
  payment_count,
  status
) VALUES
  (
    'クラウドサービス株式会社', 
    'SaaSシステム利用料', 
    '経費管理システムのクラウド利用料（月額）',
    50000, 
    600000, -- 50,000 × 12回
    '2024-04-01', 
    '2025-03-31', 
    '1867faf8-3732-4503-9dbb-59316ab062d8', -- 経営部門
    '99541235-34b7-4e3b-9a47-924b4998ff64', -- 通信費カテゴリ
    '26b66ccc-f81f-46e2-bed4-1d2e8cf69889', -- 中野達哉
    'recurring',
    'monthly',
    25, -- 毎月25日支払い
    12, -- 12回支払い
    'active'
  ),
  (
    'セキュリティ監査法人', 
    '四半期セキュリティ監査', 
    'システムセキュリティの定期監査',
    200000, 
    800000, -- 200,000 × 4回
    '2024-01-01', 
    '2024-12-31', 
    '1867faf8-3732-4503-9dbb-59316ab062d8', -- 経営部門
    '99541235-34b7-4e3b-9a47-924b4998ff64', -- 通信費カテゴリ
    '26b66ccc-f81f-46e2-bed4-1d2e8cf69889', -- 中野達哉
    'recurring',
    'quarterly',
    15, -- 四半期末月の15日支払い
    4, -- 4回支払い
    'active'
  )
ON CONFLICT (id) DO NOTHING;
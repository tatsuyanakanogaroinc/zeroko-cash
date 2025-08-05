-- 外注管理テーブルの作成
CREATE TABLE IF NOT EXISTS subcontracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- 基本情報
  contractor_name VARCHAR(100) NOT NULL,
  contract_title VARCHAR(200) NOT NULL,
  description TEXT,
  
  -- 金額・期間
  contract_amount INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  payment_date DATE,
  
  -- 分類
  department_id UUID REFERENCES departments(id),
  project_id UUID REFERENCES projects(id),
  event_id UUID REFERENCES events(id),
  category_id UUID REFERENCES categories(id),
  
  -- 管理情報
  responsible_user_id UUID REFERENCES users(id) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'pending_payment')),
  
  -- 作成・更新情報
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 制約: 少なくとも1つの分類（部門、プロジェクト、イベント）が必要
  CONSTRAINT at_least_one_assignment CHECK (
    department_id IS NOT NULL OR 
    project_id IS NOT NULL OR 
    event_id IS NOT NULL
  )
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_subcontracts_department_id ON subcontracts(department_id);
CREATE INDEX IF NOT EXISTS idx_subcontracts_project_id ON subcontracts(project_id);
CREATE INDEX IF NOT EXISTS idx_subcontracts_event_id ON subcontracts(event_id);
CREATE INDEX IF NOT EXISTS idx_subcontracts_category_id ON subcontracts(category_id);
CREATE INDEX IF NOT EXISTS idx_subcontracts_responsible_user_id ON subcontracts(responsible_user_id);
CREATE INDEX IF NOT EXISTS idx_subcontracts_status ON subcontracts(status);
CREATE INDEX IF NOT EXISTS idx_subcontracts_start_date ON subcontracts(start_date);
CREATE INDEX IF NOT EXISTS idx_subcontracts_end_date ON subcontracts(end_date);
CREATE INDEX IF NOT EXISTS idx_subcontracts_payment_date ON subcontracts(payment_date);

-- 更新時間の自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_subcontracts_updated_at BEFORE UPDATE
    ON subcontracts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- サンプルデータの挿入
INSERT INTO subcontracts (
  contractor_name, 
  contract_title, 
  description, 
  contract_amount, 
  start_date, 
  end_date, 
  department_id, 
  category_id, 
  responsible_user_id, 
  status
) VALUES
  (
    'デザインスタジオABC', 
    'Webサイトリニューアルデザイン', 
    'コーポレートサイトのUI/UXデザイン作成',
    500000, 
    '2024-02-01', 
    '2024-03-31', 
    '550e8400-e29b-41d4-a716-446655440002', -- マーケティング部門
    '550e8400-e29b-41d4-a716-446655440022', -- 書籍代カテゴリ（仮）
    '550e8400-e29b-41d4-a716-446655440011', -- 佐藤花子
    'active'
  ),
  (
    'システム開発株式会社', 
    '経費管理システム機能拡張', 
    '新機能の開発とテスト',
    800000, 
    '2024-01-15', 
    '2024-04-30', 
    '550e8400-e29b-41d4-a716-446655440006', -- 経営管理部門
    '550e8400-e29b-41d4-a716-446655440023', -- 通信費カテゴリ（仮）
    '550e8400-e29b-41d4-a716-446655440015', -- 伊藤三郎
    'active'
  ),
  (
    'イベント企画合同会社', 
    '東京展示会2024会場設営', 
    '展示会会場の設営・撤去作業',
    150000, 
    '2024-01-14', 
    '2024-01-18', 
    '550e8400-e29b-41d4-a716-446655440001', -- セールス部門
    '550e8400-e29b-41d4-a716-446655440025', -- 会場費
    '550e8400-e29b-41d4-a716-446655440010', -- 田中太郎
    'completed'
  )
ON CONFLICT (id) DO NOTHING;
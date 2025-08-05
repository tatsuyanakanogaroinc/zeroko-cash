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

-- サンプルデータの挿入（実際のSupabaseデータに基づく）
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
    '8fa88cf1-ea4f-4794-84b2-3959912731dc', -- マーケティング部門
    '99541235-34b7-4e3b-9a47-924b4998ff64', -- 通信費カテゴリ
    '26b66ccc-f81f-46e2-bed4-1d2e8cf69889', -- 中野達哉
    'active'
  ),
  (
    'システム開発株式会社', 
    '経費管理システム機能拡張', 
    '新機能の開発とテスト',
    800000, 
    '2024-01-15', 
    '2024-04-30', 
    '1867faf8-3732-4503-9dbb-59316ab062d8', -- 経営部門
    '99541235-34b7-4e3b-9a47-924b4998ff64', -- 通信費カテゴリ
    '26b66ccc-f81f-46e2-bed4-1d2e8cf69889', -- 中野達哉
    'active'
  ),
  (
    'イベント企画合同会社', 
    '展示会会場設営', 
    '展示会会場の設営・撤去作業',
    150000, 
    '2024-01-14', 
    '2024-01-18', 
    'c8f2202c-7501-4b68-9b5f-f46dfddc2515', -- セールス部門
    'd4f0a2e9-74ae-4e06-812b-d42861b089c0', -- 会議費カテゴリ
    '26b66ccc-f81f-46e2-bed4-1d2e8cf69889', -- 中野達哉
    'completed'
  )
ON CONFLICT (id) DO NOTHING;
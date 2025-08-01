-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Departments table (先に作成)
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL,
  budget INTEGER DEFAULT 0,
  responsible_user_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table (departmentsの後に作成)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  department_id UUID REFERENCES departments(id),
  role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'manager', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events table (部門に所属)
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  department_id UUID REFERENCES departments(id) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  budget INTEGER DEFAULT 0,
  responsible_user_id UUID REFERENCES users(id),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL,
  description TEXT,
  requires_receipt BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  category_id UUID REFERENCES categories(id) NOT NULL,
  event_id UUID REFERENCES events(id),
  amount INTEGER NOT NULL,
  description TEXT NOT NULL,
  expense_date DATE NOT NULL,
  payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('cash', 'credit_card', 'bank_transfer')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) NOT NULL,
  department_id UUID REFERENCES departments(id),
  responsible_user_id UUID REFERENCES users(id),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'suspended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Approvers table
CREATE TABLE IF NOT EXISTS approvers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID REFERENCES departments(id),
  event_id UUID REFERENCES events(id),
  project_id UUID REFERENCES projects(id),
  user_id UUID REFERENCES users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(department_id, event_id, project_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category_id ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_event_id ON expenses(event_id);

-- Insert sample departments
INSERT INTO departments (id, name, budget) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'セールス', 1000000),
  ('550e8400-e29b-41d4-a716-446655440002', 'マーケティング', 800000),
  ('550e8400-e29b-41d4-a716-446655440003', 'カリキュラム', 600000),
  ('550e8400-e29b-41d4-a716-446655440004', 'コーチ', 500000),
  ('550e8400-e29b-41d4-a716-446655440005', 'バックオフィス', 400000),
  ('550e8400-e29b-41d4-a716-446655440006', '経営管理', 1200000)
ON CONFLICT (id) DO NOTHING;

-- Insert sample users
INSERT INTO users (id, name, email, department_id, role) VALUES
  ('550e8400-e29b-41d4-a716-446655440010', '田中太郎', 'tanaka@example.com', '550e8400-e29b-41d4-a716-446655440001', 'user'),
  ('550e8400-e29b-41d4-a716-446655440011', '佐藤花子', 'sato@example.com', '550e8400-e29b-41d4-a716-446655440002', 'user'),
  ('550e8400-e29b-41d4-a716-446655440012', '鈴木一郎', 'suzuki@example.com', '550e8400-e29b-41d4-a716-446655440003', 'user'),
  ('550e8400-e29b-41d4-a716-446655440013', '高橋美咲', 'takahashi@example.com', '550e8400-e29b-41d4-a716-446655440004', 'user'),
  ('550e8400-e29b-41d4-a716-446655440014', '山田次郎', 'yamada@example.com', '550e8400-e29b-41d4-a716-446655440005', 'user'),
  ('550e8400-e29b-41d4-a716-446655440015', '伊藤三郎', 'ito@example.com', '550e8400-e29b-41d4-a716-446655440006', 'admin')
ON CONFLICT (id) DO NOTHING;

-- Insert sample categories
INSERT INTO categories (id, name, description, requires_receipt) VALUES
  ('550e8400-e29b-41d4-a716-446655440020', '交通費', '電車、バス、タクシーなどの交通費', true),
  ('550e8400-e29b-41d4-a716-446655440021', '会議費', '会議室代、飲食費など', true),
  ('550e8400-e29b-41d4-a716-446655440022', '書籍代', '業務関連の書籍購入費', false),
  ('550e8400-e29b-41d4-a716-446655440023', '通信費', '電話代、インターネット代など', true),
  ('550e8400-e29b-41d4-a716-446655440024', '宿泊費', '出張時の宿泊費', true),
  ('550e8400-e29b-41d4-a716-446655440025', '会場費', 'イベント会場費', true)
ON CONFLICT (id) DO NOTHING;

-- Insert sample events
INSERT INTO events (id, name, start_date, end_date, budget, status) VALUES
  ('550e8400-e29b-41d4-a716-446655440030', '東京展示会2024', '2024-01-15', '2024-01-17', 50000, 'active'),
  ('550e8400-e29b-41d4-a716-446655440031', '大阪商談会', '2024-01-20', '2024-01-22', 30000, 'active'),
  ('550e8400-e29b-41d4-a716-446655440032', '名古屋セミナー', '2024-01-25', '2024-01-26', 15000, 'active')
ON CONFLICT (id) DO NOTHING;

-- Insert sample expenses
INSERT INTO expenses (id, user_id, category_id, event_id, amount, description, expense_date, payment_method, status) VALUES
  ('550e8400-e29b-41d4-a716-446655440040', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440030', 2500, '東京展示会への交通費', '2024-01-15', 'cash', 'approved'),
  ('550e8400-e29b-41d4-a716-446655440041', '550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440030', 8000, '東京展示会での会議費', '2024-01-14', 'credit_card', 'approved'),
  ('550e8400-e29b-41d4-a716-446655440042', '550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440022', NULL, 3500, '業務書籍購入', '2024-01-13', 'cash', 'pending'),
  ('550e8400-e29b-41d4-a716-446655440043', '550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440031', 12000, '大阪商談会での通信費', '2024-01-12', 'bank_transfer', 'approved')
ON CONFLICT (id) DO NOTHING; 

---

## 現状まとめ

- **DBスキーマ**  
  承認者設定用のテーブルは未実装。  
  部門（departments）、イベント（events）、プロジェクト（projects）は存在。

- **型定義**  
  `Approval`型はあるが、どの単位で誰が承認者かを管理する仕組みは未実装。

- **管理画面UI**  
  部門・イベント・勘定科目の管理UIはあるが、承認者設定UIは未実装。

---

## やるべきこと

### 1. DBスキーマ設計
- `approvers` テーブルを新設し、  
  - `department_id`  
  - `event_id`  
  - `project_id`  
  - `user_id`（承認者）  
  を持たせる（いずれか1つがNULL以外）

### 2. 型定義追加
- `ApproverSetting`型を追加

### 3. 管理画面UI
- 「承認者設定」タブを追加し、  
  部門・イベント・プロジェクトごとに承認者を追加・編集できるUIを作成

---

## まずはDBスキーマ案

```sql
<code_block_to_apply_changes_from>
```
- 1レコードで「どの単位の誰が承認者か」を表現
- 例えば `department_id` だけ値が入っていれば「その部門の承認者」

---

この設計で進めてよいかご確認いただき、OKなら
- DBスキーマ追加
- 型定義追加
- 管理画面UIの設計・実装

の順で進めます。  
ご要望・修正点があれば教えてください。 
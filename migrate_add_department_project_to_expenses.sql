-- マイグレーション: expensesテーブルにdepartment_idとproject_idカラムを追加
-- 実行日: 2025-08-20
-- 目的: 経費申請で選択された部門とプロジェクト情報を保存できるようにする

-- 1. department_idカラムを追加
ALTER TABLE expenses 
ADD COLUMN department_id UUID REFERENCES departments(id);

-- 2. project_idカラムを追加  
ALTER TABLE expenses 
ADD COLUMN project_id UUID REFERENCES projects(id);

-- 3. パフォーマンス向上のためのインデックスを追加
CREATE INDEX IF NOT EXISTS idx_expenses_department_id ON expenses(department_id);
CREATE INDEX IF NOT EXISTS idx_expenses_project_id ON expenses(project_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_department ON expenses(user_id, department_id);

-- 4. 既存データに対する部門の自動設定（ユーザーのデフォルト部門を使用）
-- 注意: 既存データがある場合のみ実行が必要
UPDATE expenses 
SET department_id = (
  SELECT u.department_id 
  FROM users u 
  WHERE u.id = expenses.user_id
)
WHERE department_id IS NULL;

-- 5. 確認用クエリ（実際のマイグレーション実行時はコメントアウト）
-- SELECT 
--   e.id, 
--   e.description, 
--   u.name as user_name,
--   d.name as department_name,
--   p.name as project_name
-- FROM expenses e
-- LEFT JOIN users u ON e.user_id = u.id
-- LEFT JOIN departments d ON e.department_id = d.id  
-- LEFT JOIN projects p ON e.project_id = p.id
-- ORDER BY e.created_at DESC
-- LIMIT 10;

-- マイグレーション完了
-- 次の作業: 
-- 1. TypeScript型定義の更新 (src/lib/supabase.ts)
-- 2. API エンドポイントの更新 (src/app/api/expenses/route.ts)
-- 3. フロントエンドフォームの更新 (src/app/expenses/new/page.tsx)
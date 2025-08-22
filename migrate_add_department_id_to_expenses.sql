-- 経費申請テーブルに部門IDフィールドを追加
-- 申請時に選択された部門を保存するため
-- 実行方法: Supabase Dashboard > SQL Editor で実行

BEGIN;

-- 1. expenses テーブルに department_id を追加
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'expenses' 
        AND column_name = 'department_id'
    ) THEN
        ALTER TABLE expenses 
        ADD COLUMN department_id UUID REFERENCES departments(id);
        
        CREATE INDEX IF NOT EXISTS idx_expenses_department_id ON expenses(department_id);
        
        RAISE NOTICE 'department_id column added to expenses table';
    ELSE
        RAISE NOTICE 'department_id column already exists in expenses table';
    END IF;
END $$;

-- 2. expenses テーブルに project_id を追加（もし存在しない場合）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'expenses' 
        AND column_name = 'project_id'
    ) THEN
        ALTER TABLE expenses 
        ADD COLUMN project_id UUID REFERENCES projects(id);
        
        CREATE INDEX IF NOT EXISTS idx_expenses_project_id ON expenses(project_id);
        
        RAISE NOTICE 'project_id column added to expenses table';
    ELSE
        RAISE NOTICE 'project_id column already exists in expenses table';
    END IF;
END $$;

-- 3. invoice_payments テーブルも確認して必要に応じて追加
DO $$
BEGIN
    -- invoice_payments テーブルに department_id が存在しない場合のみ追加
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'invoice_payments' 
        AND column_name = 'department_id'
    ) THEN
        ALTER TABLE invoice_payments 
        ADD COLUMN department_id UUID REFERENCES departments(id);
        
        CREATE INDEX IF NOT EXISTS idx_invoice_payments_department_id ON invoice_payments(department_id);
        
        RAISE NOTICE 'department_id column added to invoice_payments table';
    ELSE
        RAISE NOTICE 'department_id column already exists in invoice_payments table';
    END IF;
END $$;

-- 4. invoice_payments テーブルに project_id を追加（もし存在しない場合）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'invoice_payments' 
        AND column_name = 'project_id'
    ) THEN
        ALTER TABLE invoice_payments 
        ADD COLUMN project_id UUID REFERENCES projects(id);
        
        CREATE INDEX IF NOT EXISTS idx_invoice_payments_project_id ON invoice_payments(project_id);
        
        RAISE NOTICE 'project_id column added to invoice_payments table';
    ELSE
        RAISE NOTICE 'project_id column already exists in invoice_payments table';
    END IF;
END $$;

-- 5. コメントを追加
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'expenses' 
        AND column_name = 'department_id'
    ) THEN
        COMMENT ON COLUMN expenses.department_id IS '申請時に選択された部門ID（申請者の所属部門とは異なる場合がある）';
        COMMENT ON COLUMN expenses.project_id IS '申請に関連するプロジェクトID';
    END IF;
END $$;

COMMIT;

-- 確認用クエリ（実行後に確認）
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name IN ('expenses', 'invoice_payments') 
-- AND column_name IN ('department_id', 'project_id')
-- ORDER BY table_name, column_name;
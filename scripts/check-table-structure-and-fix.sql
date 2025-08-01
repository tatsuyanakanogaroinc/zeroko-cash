-- 1. テーブルの構造を確認
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_name IN ('users', 'expenses', 'invoice_payments')
    AND column_name IN ('id', 'user_id')
ORDER BY 
    table_name, ordinal_position;

-- 2. データ型を確認後、適切なポリシーを作成
-- まず既存ポリシーをすべて削除
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE tablename IN ('users', 'expenses', 'invoice_payments')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- 3. シンプルで動作確実なポリシーを作成
-- usersテーブル: 認証されたユーザーは全員読める
CREATE POLICY "allow_authenticated_read" ON users
FOR SELECT TO authenticated
USING (true);

-- expensesテーブル: 認証されたユーザーは全員読める（開発中の一時的措置）
CREATE POLICY "allow_authenticated_read" ON expenses
FOR SELECT TO authenticated
USING (true);

-- invoice_paymentsテーブル: 認証されたユーザーは全員読める（開発中の一時的措置）
CREATE POLICY "allow_authenticated_read" ON invoice_payments
FOR SELECT TO authenticated
USING (true);

-- 4. RLSを有効化
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_payments ENABLE ROW LEVEL SECURITY;

-- 5. 結果を確認
SELECT 
    tablename,
    policyname,
    cmd,
    roles
FROM pg_policies
WHERE tablename IN ('users', 'expenses', 'invoice_payments')
ORDER BY tablename;

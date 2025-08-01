-- 1. まず既存のRLSポリシーを確認
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename IN ('users', 'expenses', 'invoice_payments');

-- 2. usersテーブルの既存ポリシーを削除
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can view all users" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "authenticated_users_read_all" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;

-- 3. 新しいシンプルなポリシーを作成
-- 認証されたユーザーは全てのユーザー情報を読める
CREATE POLICY "authenticated_users_read_all" ON users
FOR SELECT
TO authenticated
USING (true);

-- ユーザーは自分の情報のみ更新できる（UUID型にキャスト）
CREATE POLICY "users_update_own" ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id::uuid);

-- 4. expensesテーブルのポリシーを修正
DROP POLICY IF EXISTS "Users can view own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can create own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can update own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can delete own expenses" ON expenses;
DROP POLICY IF EXISTS "authenticated_read_all_expenses" ON expenses;
DROP POLICY IF EXISTS "users_manage_own_expenses" ON expenses;

-- 認証されたユーザーは全ての経費を見られる（一時的な措置）
CREATE POLICY "authenticated_read_all_expenses" ON expenses
FOR SELECT
TO authenticated
USING (true);

-- ユーザーは自分の経費のみ作成・更新・削除できる（UUID型として比較）
CREATE POLICY "users_manage_own_expenses" ON expenses
FOR ALL
TO authenticated
USING (auth.uid() = user_id::uuid)
WITH CHECK (auth.uid() = user_id::uuid);

-- 5. invoice_paymentsテーブルのポリシーを修正
DROP POLICY IF EXISTS "Users can view own invoice_payments" ON invoice_payments;
DROP POLICY IF EXISTS "Users can create own invoice_payments" ON invoice_payments;
DROP POLICY IF EXISTS "Users can update own invoice_payments" ON invoice_payments;
DROP POLICY IF EXISTS "Users can delete own invoice_payments" ON invoice_payments;
DROP POLICY IF EXISTS "authenticated_read_all_invoices" ON invoice_payments;
DROP POLICY IF EXISTS "users_manage_own_invoices" ON invoice_payments;

-- 認証されたユーザーは全ての請求書を見られる（一時的な措置）
CREATE POLICY "authenticated_read_all_invoices" ON invoice_payments
FOR SELECT
TO authenticated
USING (true);

-- ユーザーは自分の請求書のみ作成・更新・削除できる（UUID型として比較）
CREATE POLICY "users_manage_own_invoices" ON invoice_payments
FOR ALL
TO authenticated
USING (auth.uid() = user_id::uuid)
WITH CHECK (auth.uid() = user_id::uuid);

-- 6. RLSが有効になっていることを確認
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_payments ENABLE ROW LEVEL SECURITY;

-- 7. ポリシーが正しく設定されたか確認
SELECT tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename IN ('users', 'expenses', 'invoice_payments')
ORDER BY tablename, policyname;

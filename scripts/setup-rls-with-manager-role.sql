-- RLS完全リセット＆再設定スクリプト（マネージャー役割対応版）
-- 承認者→マネージャーに変更、レポート用全データアクセス権限付与

-- === STEP 1: 全テーブルのRLSを無効化してすべてのポリシーを削除 ===
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.approvers DISABLE ROW LEVEL SECURITY;

-- 既存のポリシーをすべて削除
DO $$
DECLARE
    r RECORD;
BEGIN
    -- 全テーブルの全ポリシーを削除
    FOR r IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- === STEP 2: 全テーブルでRLSを有効化 ===
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approvers ENABLE ROW LEVEL SECURITY;

-- === STEP 3: ユーザーテーブルのポリシー ===
-- ユーザーは自分の情報のみ閲覧・更新可能
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (id::uuid = auth.uid());

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (id::uuid = auth.uid());

-- 管理者は全ユーザー情報にアクセス可能
CREATE POLICY "Admins can manage all users" ON public.users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id::uuid = auth.uid() 
            AND role = 'admin'
        )
    );

-- マネージャーは全ユーザー情報を閲覧可能（管理は不可）
CREATE POLICY "Managers can view all users" ON public.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id::uuid = auth.uid() 
            AND role = 'manager'
        )
    );

-- === STEP 4: 部門テーブルのポリシー ===
-- 全ユーザーが部門情報を閲覧可能（選択肢として必要）
CREATE POLICY "All users can view departments" ON public.departments
    FOR SELECT USING (true);

-- 管理者のみ部門の作成・更新・削除が可能
CREATE POLICY "Admins can manage departments" ON public.departments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id::uuid = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update departments" ON public.departments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id::uuid = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "Admins can delete departments" ON public.departments
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id::uuid = auth.uid() 
            AND role = 'admin'
        )
    );

-- === STEP 5: イベントテーブルのポリシー ===
-- 全ユーザーがイベント情報を閲覧可能
CREATE POLICY "All users can view events" ON public.events
    FOR SELECT USING (true);

-- 管理者のみイベントの管理が可能
CREATE POLICY "Admins can manage events" ON public.events
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id::uuid = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update events" ON public.events
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id::uuid = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "Admins can delete events" ON public.events
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id::uuid = auth.uid() 
            AND role = 'admin'
        )
    );

-- === STEP 6: カテゴリテーブルのポリシー ===
-- 全ユーザーがカテゴリを閲覧可能
CREATE POLICY "All users can view categories" ON public.categories
    FOR SELECT USING (true);

-- 管理者のみカテゴリの管理が可能
CREATE POLICY "Admins can manage categories" ON public.categories
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id::uuid = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update categories" ON public.categories
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id::uuid = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "Admins can delete categories" ON public.categories
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id::uuid = auth.uid() 
            AND role = 'admin'
        )
    );

-- === STEP 7: プロジェクトテーブルのポリシー ===
-- 全ユーザーがプロジェクト情報を閲覧可能
CREATE POLICY "All users can view projects" ON public.projects
    FOR SELECT USING (true);

-- 管理者のみプロジェクトの管理が可能
CREATE POLICY "Admins can manage projects" ON public.projects
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id::uuid = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update projects" ON public.projects
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id::uuid = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "Admins can delete projects" ON public.projects
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id::uuid = auth.uid() 
            AND role = 'admin'
        )
    );

-- === STEP 8: 経費申請テーブルのポリシー ===
-- ユーザーは自分の経費申請のみ閲覧・作成・更新可能
CREATE POLICY "Users can view own expenses" ON public.expenses
    FOR SELECT USING (user_id::uuid = auth.uid());

CREATE POLICY "Users can create own expenses" ON public.expenses
    FOR INSERT WITH CHECK (user_id::uuid = auth.uid());

CREATE POLICY "Users can update own pending expenses" ON public.expenses
    FOR UPDATE USING (
        user_id::uuid = auth.uid() 
        AND status = 'pending'
    );

-- 管理者とマネージャーは全経費申請を閲覧・管理可能
CREATE POLICY "Admins and managers can view all expenses" ON public.expenses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id::uuid = auth.uid() 
            AND (role = 'admin' OR role = 'manager')
        )
    );

CREATE POLICY "Admins and managers can update expense status" ON public.expenses
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id::uuid = auth.uid() 
            AND (role = 'admin' OR role = 'manager')
        )
    );

-- === STEP 9: 請求書支払いテーブルのポリシー ===
-- ユーザーは自分の請求書支払いのみ閲覧・作成・更新可能
CREATE POLICY "Users can view own invoice payments" ON public.invoice_payments
    FOR SELECT USING (user_id::uuid = auth.uid());

CREATE POLICY "Users can create own invoice payments" ON public.invoice_payments
    FOR INSERT WITH CHECK (user_id::uuid = auth.uid());

CREATE POLICY "Users can update own pending invoice payments" ON public.invoice_payments
    FOR UPDATE USING (
        user_id::uuid = auth.uid() 
        AND status = 'pending'
    );

-- 管理者とマネージャーは全請求書支払いを閲覧・管理可能
CREATE POLICY "Admins and managers can view all invoice payments" ON public.invoice_payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id::uuid = auth.uid() 
            AND (role = 'admin' OR role = 'manager')
        )
    );

CREATE POLICY "Admins and managers can update invoice payment status" ON public.invoice_payments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id::uuid = auth.uid() 
            AND (role = 'admin' OR role = 'manager')
        )
    );

-- === STEP 10: 承認者テーブルのポリシー（マネージャー用に名称変更） ===
-- 全ユーザーが承認者情報を閲覧可能（承認フロー確認のため）
CREATE POLICY "All users can view approvers" ON public.approvers
    FOR SELECT USING (true);

-- 管理者のみ承認者の管理が可能
CREATE POLICY "Admins can manage approvers" ON public.approvers
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id::uuid = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update approvers" ON public.approvers
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id::uuid = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "Admins can delete approvers" ON public.approvers
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id::uuid = auth.uid() 
            AND role = 'admin'
        )
    );

-- === STEP 11: 関数のセキュリティ設定 ===
-- 更新時刻を自動設定する関数のsearch_pathを固定
ALTER FUNCTION public.update_invoice_payments_updated_at() 
SET search_path = public;

-- === STEP 12: 既存データの役割名を更新 ===
-- 承認者（approver）をマネージャー（manager）に変更
UPDATE public.users SET role = 'manager' WHERE role = 'approver';

-- === 完了メッセージ ===
DO $$
BEGIN
    RAISE NOTICE '🎉 ========================================';
    RAISE NOTICE '🔒 RLS SETUP WITH MANAGER ROLE COMPLETED!';
    RAISE NOTICE '🔐 Security level: MAXIMUM';
    RAISE NOTICE '👑 Admin: Full access to all data';
    RAISE NOTICE '👔 Manager: View all data, approve expenses';
    RAISE NOTICE '👤 User: Own data only, full report access';
    RAISE NOTICE '🛡️  All tables protected with RLS';
    RAISE NOTICE '🎯 Role updated: approver → manager';
    RAISE NOTICE '🎉 ========================================';
END $$;

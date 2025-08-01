-- Row Level Security (RLS) ポリシーの設定
-- セキュリティ強化のため全テーブルでRLSを有効化

-- 1. 全テーブルでRLSを有効化
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approvers ENABLE ROW LEVEL SECURITY;

-- 2. ユーザーテーブルのポリシー
-- ユーザーは自分の情報のみ閲覧・更新可能
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (id = auth.uid()::text);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (id = auth.uid()::text);

-- 管理者は全ユーザー情報にアクセス可能
CREATE POLICY "Admins can view all users" ON public.users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid()::text 
            AND role = 'admin'
        )
    );

-- 3. 部門テーブルのポリシー
-- 全ユーザーが部門情報を閲覧可能（選択肢として必要）
CREATE POLICY "All users can view departments" ON public.departments
    FOR SELECT USING (true);

-- 管理者のみ部門の作成・更新・削除が可能
CREATE POLICY "Admins can manage departments" ON public.departments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid()::text 
            AND role = 'admin'
        )
    );

-- 4. イベントテーブルのポリシー
-- 全ユーザーがイベント情報を閲覧可能
CREATE POLICY "All users can view events" ON public.events
    FOR SELECT USING (true);

-- 管理者のみイベントの管理が可能
CREATE POLICY "Admins can manage events" ON public.events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid()::text 
            AND role = 'admin'
        )
    );

-- 5. カテゴリテーブルのポリシー
-- 全ユーザーがカテゴリを閲覧可能
CREATE POLICY "All users can view categories" ON public.categories
    FOR SELECT USING (true);

-- 管理者のみカテゴリの管理が可能
CREATE POLICY "Admins can manage categories" ON public.categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid()::text 
            AND role = 'admin'
        )
    );

-- 6. プロジェクトテーブルのポリシー
-- 全ユーザーがプロジェクト情報を閲覧可能
CREATE POLICY "All users can view projects" ON public.projects
    FOR SELECT USING (true);

-- 管理者のみプロジェクトの管理が可能
CREATE POLICY "Admins can manage projects" ON public.projects
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid()::text 
            AND role = 'admin'
        )
    );

-- 7. 経費申請テーブルのポリシー
-- ユーザーは自分の経費申請のみ閲覧・作成・更新可能
CREATE POLICY "Users can view own expenses" ON public.expenses
    FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Users can create own expenses" ON public.expenses
    FOR INSERT WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update own pending expenses" ON public.expenses
    FOR UPDATE USING (
        user_id = auth.uid()::text 
        AND status = 'pending'
    );

-- 管理者と承認者は全経費申請を閲覧・管理可能
CREATE POLICY "Admins and approvers can view all expenses" ON public.expenses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid()::text 
            AND (role = 'admin' OR role = 'approver')
        )
    );

CREATE POLICY "Admins and approvers can update expense status" ON public.expenses
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid()::text 
            AND (role = 'admin' OR role = 'approver')
        )
    );

-- 8. 請求書支払いテーブルのポリシー
-- ユーザーは自分の請求書支払いのみ閲覧・作成・更新可能
CREATE POLICY "Users can view own invoice payments" ON public.invoice_payments
    FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Users can create own invoice payments" ON public.invoice_payments
    FOR INSERT WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update own pending invoice payments" ON public.invoice_payments
    FOR UPDATE USING (
        user_id = auth.uid()::text 
        AND status = 'pending'
    );

-- 管理者と承認者は全請求書支払いを閲覧・管理可能
CREATE POLICY "Admins and approvers can view all invoice payments" ON public.invoice_payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid()::text 
            AND (role = 'admin' OR role = 'approver')
        )
    );

CREATE POLICY "Admins and approvers can update invoice payment status" ON public.invoice_payments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid()::text 
            AND (role = 'admin' OR role = 'approver')
        )
    );

-- 9. 承認者テーブルのポリシー
-- 全ユーザーが承認者情報を閲覧可能（承認フロー確認のため）
CREATE POLICY "All users can view approvers" ON public.approvers
    FOR SELECT USING (true);

-- 管理者のみ承認者の管理が可能
CREATE POLICY "Admins can manage approvers" ON public.approvers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid()::text 
            AND role = 'admin'
        )
    );

-- 10. 関数のセキュリティ設定
-- 更新時刻を自動設定する関数のsearch_pathを固定
ALTER FUNCTION public.update_invoice_payments_updated_at() 
SET search_path = public;

-- RLS設定完了メッセージ
DO $$
BEGIN
    RAISE NOTICE 'RLS policies have been successfully applied to all tables!';
    RAISE NOTICE 'Security level: ENHANCED';
    RAISE NOTICE 'All tables are now protected with Row Level Security.';
END $$;

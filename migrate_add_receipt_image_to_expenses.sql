-- マイグレーション: expensesテーブルとinvoice_paymentsテーブルにreceipt_imageカラムを追加
-- 実行日: 2025-08-20
-- 目的: 領収書や請求書の画像を保存できるようにして、申請管理画面で表示できるようにする

-- 1. expenses テーブルに receipt_image カラムを追加
ALTER TABLE expenses 
ADD COLUMN receipt_image TEXT;

-- 2. invoice_payments テーブルに receipt_image カラムを追加
ALTER TABLE invoice_payments 
ADD COLUMN receipt_image TEXT;

-- 3. コメントを追加
COMMENT ON COLUMN expenses.receipt_image IS '領収書画像のURL（Supabase Storage）';
COMMENT ON COLUMN invoice_payments.receipt_image IS '請求書画像のURL（Supabase Storage）';

-- 4. 確認用クエリ（実際のマイグレーション実行時はコメントアウト）
-- SELECT 
--   id, 
--   description, 
--   receipt_image,
--   created_at
-- FROM expenses 
-- ORDER BY created_at DESC 
-- LIMIT 5;

-- マイグレーション完了
-- 次の作業: 
-- 1. TypeScript型定義の更新 (src/lib/supabase.ts)
-- 2. ファイルアップロード処理の実装 (フロントエンド)
-- 3. 申請API修正（ファイル保存対応）
-- 4. 申請管理画面の領収書表示修正
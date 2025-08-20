-- マイグレーション: eventsテーブルからcancelledステータスを削除
-- 実行日: 2025-08-20
-- 目的: イベント管理でキャンセルステータスが不要になったため削除

-- 1. 現在cancelled状態のイベントをcompletedに変更（必要に応じて調整）
UPDATE events 
SET status = 'completed' 
WHERE status = 'cancelled';

-- 2. CHECK制約を削除
ALTER TABLE events 
DROP CONSTRAINT IF EXISTS events_status_check;

-- 3. 新しいCHECK制約を追加（cancelledを除外）
ALTER TABLE events 
ADD CONSTRAINT events_status_check 
CHECK (status IN ('active', 'completed'));

-- 4. 確認用クエリ（実際のマイグレーション実行時はコメントアウト）
-- SELECT 
--   id, 
--   name, 
--   status,
--   start_date,
--   end_date
-- FROM events 
-- ORDER BY created_at DESC 
-- LIMIT 10;

-- マイグレーション完了
-- 影響：既存のcancelledステータスのイベントはcompletedに変更される
-- 次の作業：フロントエンドでのテスト確認
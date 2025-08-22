# システム全体改善 - テスト手順

## 実装した改善内容

### 1. 精算・支払い処理機能の追加
**追加した機能**:
- ✅ 精算処理メニュー（経費申請→精算済み）
- ✅ 支払い処理メニュー（請求書払い・外注契約→支払い済み）
- ✅ 処理状況の可視化（処理待ち・処理済み）
- ✅ 管理者権限による精算・支払い処理
- ✅ 実際の処理金額とメモ機能

### 2. スプレッドシート自動更新の修正
**修正前の問題**:
- ❌ 承認時点で支払日が設定されてしまう
- ❌ 実際の精算・支払い後もスプレッドシートが更新されない

**修正後**:
- ✅ 承認時は支払日を空にする
- ✅ 精算・支払い処理時にスプレッドシートを更新
- ✅ 正確な支払日・ステータス・メモが反映される

## 新機能の詳細

### データベーススキーマの拡張
```sql
-- 精算関連フィールド（expenses）
ALTER TABLE expenses ADD COLUMN settled_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE expenses ADD COLUMN settled_by UUID REFERENCES users(id);
ALTER TABLE expenses ADD COLUMN settlement_amount INTEGER;
ALTER TABLE expenses ADD COLUMN settlement_notes TEXT;

-- 支払い関連フィールド（invoice_payments, subcontracts）
ALTER TABLE invoice_payments ADD COLUMN paid_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE invoice_payments ADD COLUMN paid_by UUID REFERENCES users(id);
ALTER TABLE invoice_payments ADD COLUMN paid_amount DECIMAL(12,2);
ALTER TABLE invoice_payments ADD COLUMN payment_notes TEXT;
```

### APIエンドポイント
- `GET /api/settlements` - 精算・支払い対象データの取得
- `POST /api/settlements` - 精算・支払い処理の実行

### 新しい画面
- `/admin/settlements` - 精算・支払い処理画面

## テスト手順

### 1. 精算・支払い処理画面の確認
1. http://localhost:3003/admin/settlements にアクセス
2. **期待される結果**:
   - ✅ 統計カード（処理待ち・処理済み件数）が表示される
   - ✅ 「処理待ち」「処理済み」タブが機能する
   - ✅ 経費申請・請求書払い・外注契約が分類表示される

### 2. 精算処理のテスト
1. 承認済みの経費申請を作成（または既存のものを使用）
2. 精算・支払い処理画面の「処理待ち」タブを確認
3. 経費申請行で「精算処理」ボタンをクリック
4. 処理ダイアログで以下を入力:
   - 処理金額（申請金額と同じまたは異なる額）
   - メモ（任意）
5. 「精算実行」ボタンをクリック

**期待される結果**:
- ✅ 「精算処理が完了しました」メッセージが表示される
- ✅ 該当申請が「処理済み」タブに移動する
- ✅ ステータスが「精算済み」に変更される
- ✅ 処理者と処理日時が記録される

### 3. 支払い処理のテスト
1. 承認済みの請求書払い申請を作成
2. 請求書払い行で「支払い処理」ボタンをクリック
3. 処理を実行

**期待される結果**:
- ✅ 「支払い処理が完了しました」メッセージが表示される
- ✅ ステータスが「支払い済み」に変更される

### 4. 外注契約の支払い処理テスト
1. 承認済みの外注契約を確認
2. 支払い処理を実行
3. **期待される結果**: 支払い情報が記録される

### 5. スプレッドシート自動更新のテスト

#### 事前準備
1. Google Sheetsの環境変数が設定されていることを確認:
   ```env
   GOOGLE_PROJECT_ID=your-project-id
   GOOGLE_PRIVATE_KEY_ID=your-private-key-id
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   GOOGLE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/...
   GOOGLE_SHEETS_ALL_EXPENSES_ID=your-spreadsheet-id
   ```

#### テスト手順
1. 新しい経費申請を作成・承認
2. Google Spreadsheetsを確認
3. **期待される結果**:
   - ✅ 承認時点で新しい行が追加される
   - ✅ 支払日列は空白
   - ✅ ステータスは「承認済み」

4. 同じ申請を精算処理
5. Google Spreadsheetsを再確認
6. **期待される結果**:
   - ✅ 支払日が処理日で更新される
   - ✅ ステータスが「精算済み」に更新される
   - ✅ 備考欄にメモが追加される

### 6. 権限テスト
1. 一般ユーザーでログイン
2. **期待される結果**:
   - ✅ 「精算・支払い処理」メニューが表示されない

3. 管理者でログイン
4. **期待される結果**:
   - ✅ 「精算・支払い処理」メニューが表示される
   - ✅ 処理が実行可能

### 7. データ整合性テスト
1. 申請管理画面で編集後エラーが発生しないか確認
2. レポート画面で精算済み・支払い済みデータが正しく表示されるか確認
3. CSV エクスポートで新しいステータスが反映されるか確認

## 実装されたファイル

### 新規作成
- `migrate_add_settlement_payment_fields.sql` - データベーススキーマ拡張
- `src/app/api/settlements/route.ts` - 精算・支払い処理API
- `src/app/admin/settlements/page.tsx` - 精算・支払い処理画面

### 修正
- `src/components/layout/sidebar.tsx` - ナビゲーションメニュー追加
- `src/lib/google-sheets.ts` - スプレッドシート更新機能追加
- `src/app/api/applications/[id]/approve/route.ts` - 承認時の支払日を空に修正

## 技術的詳細

### 精算・支払い処理のフロー
```
承認済み申請
    ↓
精算・支払い処理画面で処理実行
    ↓
データベース更新（ステータス・処理日時・処理者・金額・メモ）
    ↓
スプレッドシート更新（支払日・ステータス・備考）
```

### スプレッドシート更新の改善
- 承認時: 支払日 = 空白
- 処理時: 支払日 = 実際の処理日
- 重複チェック機能で同じデータの二重登録を防止
- 更新機能で既存データの支払い情報を更新

### セキュリティ考慮
- RLSポリシーで管理者のみが処理可能
- 承認済みのもののみ処理対象
- 処理履歴の完全な記録

これで精算処理から支払い完了までの完全なワークフローが実装され、スプレッドシートにも正確なデータが反映されるようになりました。
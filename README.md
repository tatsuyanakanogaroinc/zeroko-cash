# 🏢 経費精算システム (zeroko-cash)

社内の経費精算プロセスをデジタル化し、申請から承認、集計まで一元管理できるWebアプリケーションです。

**最終更新: 2025-01-02 - ダッシュボードUIをクリーンなリストレイアウトに変更**

![Next.js](https://img.shields.io/badge/Next.js-15.4.5-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Supabase](https://img.shields.io/badge/Supabase-Connected-green)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4)

## 🚀 **現在の状況: 本格運用可能**

✅ **データベース接続完了** - Supabase統合済み  
✅ **基本機能実装完了** - 経費申請・承認・レポート機能  
✅ **レスポンシブUI完成** - PC・タブレット・モバイル対応  
✅ **デプロイ準備完了** - Vercel対応済み

## 技術スタック

- **フロントエンド**: Next.js 14 (App Router)
- **バックエンド**: Next.js API Routes
- **データベース**: PostgreSQL (Supabase)
- **ファイルストレージ**: Supabase Storage
- **スタイリング**: Tailwind CSS
- **UI コンポーネント**: shadcn/ui
- **状態管理**: Zustand + persist
- **フォームバリデーション**: React Hook Form + Zod

## 機能

### ユーザー機能
- ダッシュボード（申請状況サマリー、今月の経費合計）
- 経費申請（フォーム入力、領収書アップロード）
- 申請履歴（フィルター機能付き）
- レポート（月別支出グラフ、カテゴリ別円グラフ）

### 管理者機能
- 承認管理（承認待ち一覧、一括承認）
- ユーザー管理
- マスター管理（カテゴリ、プロジェクト、部門）
- 分析・レポート（全社経費ダッシュボード）

## 本格運用に向けたセットアップ

### 1. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com)にアクセスしてアカウントを作成
2. 新しいプロジェクトを作成
3. プロジェクトの設定から以下を取得：
   - Project URL
   - anon public key
   - service_role key

### 2. 環境変数の設定

`.env.local`ファイルを作成し、以下の環境変数を設定：

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Database
DATABASE_URL=your_database_connection_string

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. データベースのセットアップ

1. SupabaseのSQL Editorにアクセス
2. `src/lib/database.ts`の`databaseSchema`をコピー
3. SQL Editorで実行してテーブルを作成

### 4. 依存関係のインストール

```bash
npm install
```

### 5. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてアプリケーションを確認してください。

## デプロイ

### Vercelでのデプロイ

1. [Vercel](https://vercel.com)にアクセスしてアカウントを作成
2. GitHubリポジトリと連携
3. 環境変数を設定
4. デプロイを実行

### 環境変数の設定（本番）

Vercelのダッシュボードで以下の環境変数を設定：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`

## プロジェクト構造

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── admin/         # 管理者API
│   │   │   └── cleanup/   # データクリーンアップAPI
│   │   ├── expenses/      # 経貿API
│   │   └── categories/    # カテゴリAPI
│   ├── dashboard/         # ダッシュボード
│   ├── expenses/          # 経費申請関連
│   ├── reports/           # レポート
│   ├── admin/             # 管理者機能
│   └── page.tsx          # ルートページ
├── components/            # React コンポーネント
│   ├── layout/           # レイアウトコンポーネント
│   └── ui/              # shadcn/ui コンポーネント
├── lib/                  # ユーティリティ
│   ├── supabase.ts       # フロントエンド用Supabaseクライアント
│   ├── supabase-admin.ts # 管理者用Supabaseクライアント
│   ├── database.ts       # 通常データベース操作
│   ├── database-admin.ts # 管理者権限データベース操作
│   ├── store.ts          # Zustand ストア
│   ├── types.ts          # TypeScript 型定義
│   ├── validations.ts    # Zod バリデーション
│   └── utils.ts          # ユーティリティ関数
└── scripts/              # 管理スクリプト
    ├── setup-basic-departments.js
    ├── clean-all-test-data.js
    └── ...
```

## 開発状況

### Phase 1 (MVP) - 完了 ✅
- [x] 基本的な経費申請・承認機能
- [x] 領収書アップロード
- [x] ダッシュボード
- [x] 申請一覧
- [x] レスポンシブUI
- [x] 動的カテゴリ・プロジェクト管理
- [x] 承認管理機能
- [x] レポート機能

### Phase 2 - 本格運用準備 🔄
- [x] データベース連携（Supabase）
- [x] API Routes実装
- [x] 環境変数設定
- [x] デプロイ設定

### Phase 3 - 高度な機能 📋
- [ ] メール通知機能
- [ ] 承認フロー設定
- [ ] 予算管理機能
- [ ] 監査ログ
- [ ] 多言語対応
- [ ] モバイルアプリ

## セキュリティ考慮事項

### 権限分離とアクセス制御
- **フロントエンド**: ANON KEYを使用（RLS適用）
- **サーバーサイド/管理スクリプト**: SERVICE_ROLE KEYを使用（RLS回避）
- 環境変数の適切な管理
- SupabaseのRLS（Row Level Security）設定
- ファイルアップロードの制限
- CSRF対策
- XSS対策

## パフォーマンス最適化

- 画像の最適化
- コード分割
- キャッシュ戦略
- CDN活用

## 監視・ログ

- Vercel Analytics
- Supabase Logs
- エラー監視（Sentry推奨）

## ライセンス

MIT License

## 🚀 **優先度1: データベース連携**

### 1. Supabase設定
```bash
# Supabaseプロジェクトの作成と設定
npm install @supabase/supabase-js
```

### 2. データベーススキーマ設計
```sql
-- ユーザーテーブル
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  email VARCHAR UNIQUE NOT NULL,
  department_id UUID REFERENCES departments(id),
  role VARCHAR DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 部門テーブル
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  budget INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- イベントテーブル
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  budget INTEGER DEFAULT 0,
  status VARCHAR DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 勘定科目テーブル
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  description TEXT,
  requires_receipt BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 経費申請テーブル
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  category_id UUID REFERENCES categories(id),
  event_id UUID REFERENCES events(id),
  amount INTEGER NOT NULL,
  description TEXT NOT NULL,
  expense_date DATE NOT NULL,
  payment_method VARCHAR NOT NULL,
  status VARCHAR DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔐 **優先度2: 認証機能**

### 1. Supabase Auth統合
```typescript
// lib/auth.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

### 2. ログインページ作成
- メール/パスワード認証
- ソーシャルログイン（Google、GitHub）
- パスワードリセット機能

## 📧 **優先度3: 通知機能**

### 1. 承認フロー通知
- 申請提出時の通知
- 承認/却下時の通知
- 承認待ちのリマインダー

### 2. メール通知
```typescript
// lib/notifications.ts
export async function sendApprovalNotification(
  expenseId: string,
  approverId: string
) {
  // メール送信ロジック
}
```

## 🔄 **優先度4: 承認フロー**

### 1. 承認者設定
- 部門ごとの承認者設定
- 承認権限の管理

### 2. 承認プロセス
- 承認/却下の理由記録
- 承認履歴の管理
- 承認チェーンの実装

## 📊 **優先度5: 高度な分析機能**

### 1. リアルタイムダッシュボード
- 承認待ち件数の表示
- 部門別予算使用率
- 月次推移グラフ

### 2. 予算管理
- 部門別予算の設定
- 予算超過アラート
- 予算使用率の可視化

## 🛡️ **優先度6: セキュリティ強化**

### 1. 権限管理
- ロールベースアクセス制御
- データアクセス権限の設定

### 2. 監査ログ
- 操作履歴の記録
- セキュリティ監査

## 📱 **優先度7: ユーザビリティ向上**

### 1. レスポンシブデザイン
- モバイル対応
- タブレット対応

### 2. 検索・フィルター機能
- 高度な検索機能
- 保存可能なフィルター

##  **実装順序の提案**

1. **まずはSupabase設定**から始めることをお勧めします
2. **認証機能**を実装して、ユーザー管理を本格化
3. **データベース連携**でモックデータを実際のデータに置き換え
4. **通知機能**でワークフローを自動化
5. **承認フロー**で業務プロセスを完成

どの機能から始めたいですか？また、特に重視したい機能はありますか？

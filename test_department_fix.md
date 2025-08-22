# 経費申請時の部門紐づけ問題修正 - テスト手順

## 修正した問題

**修正前の問題**:
- ❌ ダッシュボード・申請一覧でユーザーの所属部門が表示されていた
- ❌ レポートでもユーザーの所属部門で集計されていた
- ❌ 経費申請時に選択した部門が反映されない
- ❌ CSV エクスポートでも間違った部門データが出力される

**修正後**:
- ✅ 申請時に選択した部門を優先表示
- ✅ レポート集計も申請時の部門で正しく計算
- ✅ CSV エクスポートでも申請時の部門を出力
- ✅ 全画面で一貫した部門表示

## 修正内容の詳細

### 1. ダッシュボード (`src/app/dashboard/page.tsx`)
**修正前**:
```typescript
// 経費申請の場合：ユーザーの所属部門を参照
if (application.type === 'expense' && application.users?.departments) {
  return application.users.departments.name || '不明';
}
```

**修正後**:
```typescript
// 申請時に選択した部門を優先的に使用
if (application.department_id) {
  const dept = departments.find(d => d.id === application.department_id);
  if (dept) return dept.name;
}
```

### 2. 申請管理画面 (`src/app/admin/approvals/page.tsx`)
同様に`getDepartmentName`関数を修正。申請時の部門IDを優先して使用するように変更。

### 3. レポート画面 (`src/app/reports/page.tsx`)
部門別フィルタリングロジックを修正：

**修正前**:
```typescript
filteredExpenses = allExpenses.filter(expense => 
  (expense.users?.department_id === itemId) || (expense.department_id === itemId)
);
```

**修正後**:
```typescript
filteredExpenses = allExpenses.filter(expense => 
  expense.department_id === itemId
);
```

### 4. レポートデータAPI (`src/app/api/reports-data/route.ts`)
部門別集計の計算基準を変更：

**修正前**:
```typescript
// ユーザーの部門に計上
if (expense.users?.department_id) {
  departmentExpenses[expense.users.department_id] = 
    (departmentExpenses[expense.users.department_id] || 0) + expense.amount;
}
```

**修正後**:
```typescript
// 申請時に選択した部門に計上
if (expense.department_id) {
  departmentExpenses[expense.department_id] = 
    (departmentExpenses[expense.department_id] || 0) + expense.amount;
}
```

### 5. CSV エクスポート (`src/app/api/export/csv/route.ts`)
データ取得クエリとマッピングを修正：

**修正前**:
```typescript
users:users!left(id, name, email, department_id, departments:departments!left(*))
// ...
department: expense.users?.departments?.name || '',
```

**修正後**:
```typescript
users:users!left(id, name, email),
departments:departments!left(*),
// ...
department: expense.departments?.name || '',
```

## テスト手順

### 前提条件
1. 異なる部門に所属するユーザーでテストする
2. 経費申請時に所属部門とは異なる部門を選択する

### テストケース
**例**: ユーザー田中（営業部所属）が経費申請でマーケティング部を選択

### 1. 経費申請作成
1. http://localhost:3003/expenses/new にアクセス
2. 田中でログイン（営業部所属）
3. 以下で申請作成:
   - 部門: マーケティング部を選択
   - 金額: 5000円
   - その他項目を入力
4. 申請を提出

### 2. ダッシュボードでの確認
1. http://localhost:3003/dashboard にアクセス
2. 申請一覧を確認
3. **期待される結果**:
   - ✅ 部門列に「マーケティング部」が表示される（田中の所属部門「営業部」ではない）

### 3. 申請管理画面での確認
1. http://localhost:3003/admin/approvals にアクセス（管理者でログイン）
2. 申請一覧を確認
3. **期待される結果**:
   - ✅ 部門列に「マーケティング部」が表示される

### 4. 申請承認
1. 申請管理画面で申請を承認
2. ステータスが「承認済み」になることを確認

### 5. レポート画面での確認
1. http://localhost:3003/reports にアクセス
2. 「部門別」タブを確認
3. **期待される結果**:
   - ✅ マーケティング部の支出に5000円が追加される
   - ✅ 営業部の支出には追加されない（田中の所属部門だが申請時は選択していない）

### 6. CSV エクスポートでの確認
1. 申請管理画面でCSV エクスポート実行
2. ダウンロードしたCSVファイルを確認
3. **期待される結果**:
   - ✅ 部門列に「マーケティング部」が出力される

### 7. 複数申請での確認
1. 同一ユーザーで複数の異なる部門に申請作成:
   - 申請A: 営業部選択
   - 申請B: マーケティング部選択
   - 申請C: 開発部選択
2. 各画面で表示確認
3. **期待される結果**:
   - ✅ 各申請で選択した部門が正しく表示・集計される

### 8. 部門未選択の場合の動作確認
1. 経費申請で部門を選択しない（任意項目のため）
2. **期待される結果**:
   - ✅ 部門列に「未定」または「-」が表示される
   - ✅ エラーが発生しない

## データの整合性確認

### 既存データの影響
- 修正前に作成された申請データも新しいロジックで正しく表示される
- `department_id`フィールドが存在する申請は正しく処理される
- `department_id`が null の古いデータは適切にフォールバック処理される

### パフォーマンス影響
- 部門マスターデータの参照が効率化される
- 不要なユーザー部門情報の取得が削減される

## フォールバック動作

以下の優先順位で部門を決定します：

1. **最優先**: `application.department_id`（申請時選択部門）
2. **フォールバック1**: `application.departments?.name`（JOIN データ）
3. **フォールバック2**: 「未定」または「-」

## 技術的詳細

### データフロー
```
経費申請作成
  ↓
フォームで部門選択 (department_id)
  ↓
データベースに保存
  ↓
各画面で department_id を参照して部門名を表示
  ↓
レポート・CSV でも同じ department_id で集計
```

### 影響範囲
- ダッシュボード表示
- 申請管理画面表示
- レポート集計・表示
- CSV エクスポート
- スプレッドシート自動同期

この修正により、経費申請で選択した部門が全システムで一貫して表示・集計されるようになり、部門別の予算管理が正確に行われます。
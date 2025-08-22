# 申請管理の編集後エラー修正 - テスト手順

## 問題の原因
申請一覧で編集後にエラーが発生していた原因：
1. **ページ全体リロード** - `window.location.reload()`でReact状態との同期が取れない
2. **API更新処理の不備** - `department_id`/`project_id`が更新処理に含まれていない
3. **user_id不足** - 編集APIで必要な`user_id`が送信されていない

## 実装した修正内容

### 1. 編集成功時の処理改善
```typescript
// 修正前：ページ全体をリロード（エラーの原因）
const handleEditSuccess = () => {
  setEditModalOpen(false);
  setSelectedApplication(null);
  window.location.reload();
};

// 修正後：APIからデータを再取得して状態を更新
const handleEditSuccess = async () => {
  setEditModalOpen(false);
  setSelectedApplication(null);
  
  try {
    // 申請データを再取得
    const response = await fetch('/api/applications');
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.data) {
        const normalizedData = data.data.map((item: any) => ({
          ...item,
          date: item.date || item.expense_date || item.invoice_date,
          department_id: item.department_id || item.departments?.id,
          // ... その他の正規化処理
        }));
        setApplications(normalizedData);
      }
    }
  } catch (error) {
    console.error('データの再取得に失敗:', error);
    window.location.reload(); // フォールバック
  }
};
```

### 2. API更新処理の修正
```typescript
// expenses/[id]/route.ts の PUT処理に以下を追加：
department_id: body.department_id || null,
project_id: body.project_id || null,
```

### 3. EditApplicationModal修正
```typescript
// user_idを確実に送信
const requestData = {
  ...data,
  user_id: application.user_id || application.users?.id,
  event_id: data.event_id === 'none' ? null : data.event_id,
};
```

## テスト手順

### 1. 申請管理画面へのアクセス
1. http://localhost:3003/admin/approvals にアクセス
2. 申請一覧が正常に表示されることを確認

### 2. 申請編集のテスト
1. 任意の申請行の「編集」ボタン（鉛筆アイコン）をクリック
2. 編集モーダルが開くことを確認
3. 以下の項目を変更：
   - 説明文
   - 金額
   - 勘定科目
   - 部門（新しく追加されたフィールド）
   - プロジェクト（新しく追加されたフィールド）
4. 「更新」ボタンをクリック

### 3. 編集成功の確認
1. **期待される動作**：
   - ✅ アラート「申請が正常に更新されました」が表示
   - ✅ モーダルが自動的に閉じる
   - ✅ 申請一覧が自動更新される（リロードなし）
   - ✅ 変更内容が一覧に反映される
   - ❌ エラーが発生しない

### 4. エラー確認
1. ブラウザの開発者ツール（F12）でコンソールを確認
2. **期待される結果**：
   - APIエラーが発生しない
   - React状態エラーが発生しない
   - 「Sending update request:」ログで正しいデータが送信されている

### 5. 複数回の編集テスト
1. 同じ申請を再度編集
2. 異なる申請も編集
3. 連続して編集処理を行う
4. **期待される結果**：安定した動作

## 修正前後の比較

| 項目 | 修正前 | 修正後 |
|------|--------|--------|
| 編集完了処理 | ページ全体リロード | APIデータ再取得 |
| 状態管理 | 不安定 | React状態と同期 |
| API更新 | 部門/プロジェクト未対応 | 完全対応 |
| user_id送信 | なし | あり |
| エラー発生率 | 高い | 低い |

この修正により、申請管理画面の編集機能が安定して動作するようになり、編集後のエラーが解消されます。
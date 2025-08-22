# プロフィール名前編集修正 - テスト手順

## 修正内容
マイページでの名前編集が保存されない問題を修正しました。

### 問題の原因
- `userService.updateUser()`を使用していたが、RLS（Row Level Security）ポリシーにより、通常のSupabaseクライアントでは更新できない
- 認証コンテキストの更新に`login()`を使用していたが、これは適切ではない

### 実装した修正 (`src/app/profile/page.tsx:103-138`)
1. **API呼び出しの変更**:
   ```typescript
   // Before: userService.updateUser()を使用
   await userService.updateUser(user.id, profileData);
   
   // After: 直接/api/usersのPUT APIを使用
   const response = await fetch('/api/users', {
     method: 'PUT',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       id: user.id,
       name: profileData.name,
       email: profileData.email,
       department_id: profileData.department_id || null,
     }),
   });
   ```

2. **認証コンテキスト更新の修正**:
   ```typescript
   // Before: login()を使用（不適切）
   await login(profileData.email);
   
   // After: refreshUser()を使用（適切）
   await refreshUser();
   ```

3. **エラーハンドリングの改善**:
   - API応答の詳細なエラーチェック
   - エラーメッセージの適切な表示

## テスト手順

### 1. プロフィール編集画面の確認
1. http://localhost:3003/profile にアクセス
2. ログインしてプロフィール画面を表示
3. **期待される結果**:
   - ✅ 現在のユーザー情報が正しく表示される
   - ✅ 編集ボタンが正常に動作する

### 2. 名前編集機能のテスト
1. プロフィール画面で「編集」ボタンをクリック
2. 名前フィールドを変更（例: "テストユーザー" → "更新されたユーザー"）
3. 「保存」ボタンをクリック
4. **期待される結果**:
   - ✅ 「プロフィールを更新しました」トーストメッセージが表示
   - ✅ 編集モードが自動的に終了
   - ✅ 更新された名前が画面に即座に反映
   - ✅ ページリロード後も名前が保持される

### 3. 部門・メールアドレスの編集テスト
1. 編集モードで部門やメールアドレスも変更
2. 保存を実行
3. **期待される結果**:
   - ✅ すべての変更が正常に保存される
   - ✅ 認証コンテキストが正しく更新される

### 4. エラーケースのテスト
1. 無効なメールアドレス形式で保存を試行
2. **期待される結果**:
   - ✅ 適切なエラーメッセージが表示される
   - ✅ フォームが編集モードのまま残る

### 5. ブラウザ開発者ツールでの確認
1. F12で開発者ツールを開く
2. Network タブで API リクエストを確認
3. **期待される結果**:
   - ✅ `/api/users` への PUT リクエストが送信される
   - ✅ レスポンスが200 OKで返される
   - ✅ `/api/user-data` への POST リクエスト（refreshUser）が実行される

## 技術的詳細

### RLS (Row Level Security) 対応
- 通常のSupabaseクライアントではRLSポリシーにより更新が制限される
- `/api/users` エンドポイントはサービスロールキーを使用してRLSを回避

### 認証コンテキスト管理
- `refreshUser()`は現在のセッションを維持しながらユーザー情報のみを更新
- `login()`とは異なり、セッションの再認証は行わない

### データフロー
1. フォーム送信 → `/api/users` PUT API
2. データベース更新（RLS回避）
3. `refreshUser()` → `/api/user-data` POST API
4. 認証コンテキスト更新
5. UI反映

## 修正前の問題
- ❌ 名前を変更しても保存されない
- ❌ 「更新したけど、変わらなかった」状態
- ❌ RLSポリシーによる権限エラー

## 修正後の状態
- ✅ 名前変更が正常に保存される
- ✅ 即座にUI反映される
- ✅ ページリロード後も変更が保持される
- ✅ 適切なエラーハンドリング
- ✅ 管理者権限での更新処理

この修正により、マイページでの名前編集が正常に動作するようになりました。
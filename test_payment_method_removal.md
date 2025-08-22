# 支払い方法フィールド削除 - テスト手順

## 実装した修正内容
支払い方法フィールドが不要になったため、以下から完全に削除しました：

### 1. 経費申請フォーム (`src/app/expenses/new/page.tsx`)
- ✅ 支払い方法選択UIを削除
- ✅ フォームデフォルト値から削除
- ✅ 編集時の値設定を削除
- ✅ APIへのデータ送信を`'personal_cash'`固定値に変更

### 2. バリデーションスキーマ (`src/lib/validations.ts`)
- ✅ `payment_method`フィールドのバリデーションルールを削除

### 3. 編集モーダル (`src/components/modals/EditApplicationModal.tsx`)
- ✅ 支払い方法選択UIを削除
- ✅ バリデーションスキーマから削除
- ✅ インターフェース定義から削除
- ✅ フォーム初期値から削除

### 4. 更新API (`src/app/api/expenses/[id]/route.ts`)
- ✅ `payment_method`を`'personal_cash'`固定値に変更

## テスト手順

### 1. 経費申請フォームの確認
1. http://localhost:3003/expenses/new にアクセス
2. 経費申請フォームを確認
3. **期待される結果**：
   - ❌ 支払い方法選択フィールドが表示されない
   - ✅ その他のフィールド（日付、金額、勘定科目、部門など）は正常表示
   - ✅ フォーム送信が正常に動作する

### 2. 申請管理の編集機能確認
1. http://localhost:3003/admin/approvals にアクセス
2. 任意の申請の編集ボタンをクリック
3. **期待される結果**：
   - ❌ 編集モーダルに支払い方法フィールドが表示されない
   - ✅ その他のフィールドは正常に編集可能
   - ✅ 更新処理が正常に動作する

### 3. データベースの確認
APIで送信されるデータの確認：
```javascript
// ブラウザの開発者ツールのNetworkタブで確認
// 経費申請/編集時のリクエストボディに以下が含まれること
{
  // ... other fields
  "payment_method": "personal_cash"  // 固定値
}
```

### 4. エラーが発生しないことの確認
1. ブラウザの開発者ツール（F12）でコンソールを確認
2. **期待される結果**：
   - ❌ `payment_method`関連のバリデーションエラーが発生しない
   - ❌ フォーム送信時にエラーが発生しない
   - ❌ 編集時にエラーが発生しない

## 削除されたUI要素

### 経費申請フォーム
```html
<!-- 削除された要素 -->
<div className="space-y-2">
  <Label htmlFor="payment_method">支払方法 *</Label>
  <Select>
    <SelectItem value="personal_cash">自費現金</SelectItem>
    <SelectItem value="personal_credit">自費クレカ</SelectItem>
    <SelectItem value="company_cash">会社現金</SelectItem>
    <SelectItem value="company_credit">会社クレカ</SelectItem>
  </Select>
</div>
```

### 編集モーダル
```html
<!-- 削除された要素 -->
<div className="space-y-2">
  <Label htmlFor="payment_method">支払い方法 *</Label>
  <Select>
    <SelectItem value="personal_cash">個人立替（現金）</SelectItem>
    <SelectItem value="personal_card">個人立替（カード）</SelectItem>
    <!-- ... その他の選択肢 -->
  </Select>
</div>
```

## 影響範囲
- ✅ **フォーム簡素化**: ユーザーが選択する項目が減り、より簡単に
- ✅ **データ整合性**: すべての経費申請が`personal_cash`で統一
- ✅ **保守性向上**: 不要なフィールドの削除により、コードが簡潔に
- ❌ **機能削減**: 支払い方法の区別ができなくなる（要件通り）

この修正により、支払い方法フィールドが完全に削除され、経費申請がより簡潔になりました。
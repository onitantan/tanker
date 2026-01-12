# Tanker アプリ更新ガイド

## 📋 アプリを更新していくために必要な準備

### 1. **環境変数の設定** ⚠️ 必須

プロジェクトルートに `.env.local` ファイルを作成し、以下の環境変数を設定してください：

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**取得方法：**
1. [Supabase Dashboard](https://app.supabase.com/) にログイン
2. プロジェクトを選択
3. Settings → API から以下を取得：
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. **データベースのセットアップ** ⚠️ 必須

Supabase SQL Editor で以下のSQLを実行してください：

#### 2.1. `user_settings` テーブルの作成
`supabase_migration.sql` の内容を実行

#### 2.2. `transactions` テーブルの確認
以下のカラムが存在することを確認：
- `id` (UUID, PRIMARY KEY)
- `user_id` (UUID/TEXT)
- `name` (TEXT) - 項目名
- `amount` (NUMERIC) - 金額
- `type` (TEXT) - 'income' | 'expense'
- `date` (DATE) - 日付
- `category` (TEXT) - 'consumption' | 'waste' | 'investment'
- `tag` (TEXT) - 勘定科目（'food', 'daily', 'transport', etc.）
- `payment_method` (TEXT) - 支払い方法（'credit', 'pay', 'cash', 'bank'）
- `created_at` (TIMESTAMP)

#### 2.3. Row Level Security (RLS) ポリシーの設定
`supabase_rls_policy.sql` の内容を実行

### 3. **依存関係のインストール**

```bash
npm install
# または
yarn install
# または
pnpm install
```

### 4. **開発サーバーの起動**

```bash
npm run dev
# または
yarn dev
# または
pnpm dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開く

### 5. **現在の機能一覧**

✅ **実装済み機能：**
- ユーザー認証（ログイン/ログアウト）
- 取引の追加（収入/支出）
- 取引履歴の表示・削除
- 資産推移グラフ
- 収支分析（PL、BS、各種チャート）
- 設定画面（初期資産、目標資産の設定）
- タンクビジュアル（達成率表示）
- タグ機能（勘定科目）
- 支払い方法の記録

### 6. **今後の更新で注意すべきポイント**

#### 型定義の整合性
- `types/index.ts` の `Transaction` 型とデータベーススキーマを一致させる
- 新しいカラムを追加する場合は、型定義も更新

#### コンポーネントの構造
- `components/` 配下のコンポーネントは独立して動作
- Props の型定義を明確にする
- `@/lib/supabaseClient` を使用（`@/utils/supabaseClient` ではない）

#### 認証フロー
- `AuthGuard` コンポーネントで保護されたページは自動的に `/auth` にリダイレクト
- すべてのSupabase操作で `user.id` を使用（ダミーIDは使用しない）

#### データ取得パターン
```typescript
// 推奨パターン
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  // エラーハンドリング
  return;
}
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('user_id', user.id);
```

### 7. **よくある問題と解決策**

#### 問題: ビルドエラー「Module not found」
- **解決策**: `tsconfig.json` の `paths` 設定を確認
- `@/*` が `./*` にマッピングされていることを確認

#### 問題: データが0円になる
- **解決策**: `initial_asset` が正しく取得されているか確認
- `user_settings` テーブルにデータが存在するか確認

#### 問題: 無限ロード
- **解決策**: `AuthGuard` が `/auth` ページをガードしていないか確認
- `loading` ステートが確実に `false` になるよう `finally` ブロックを使用

### 8. **開発時のチェックリスト**

- [ ] 環境変数が設定されている
- [ ] データベーススキーマが最新
- [ ] RLSポリシーが設定されている
- [ ] 型定義がデータベースと一致している
- [ ] 認証フローが正常に動作する
- [ ] エラーハンドリングが適切

### 9. **次のステップ（更新例）**

1. **機能追加**
   - 取引の編集機能
   - カテゴリ別の集計強化
   - エクスポート機能（CSV/PDF）

2. **UI改善**
   - ダークモード対応
   - アニメーション強化
   - レスポンシブデザインの最適化

3. **パフォーマンス**
   - データのキャッシュ戦略
   - 無限スクロール
   - オフライン対応

4. **テスト**
   - ユニットテスト
   - 統合テスト
   - E2Eテスト

---

## 🚀 クイックスタート

```bash
# 1. 環境変数を設定
cp .env.example .env.local
# .env.local を編集してSupabaseの認証情報を入力

# 2. 依存関係をインストール
npm install

# 3. データベースをセットアップ
# Supabase SQL Editorで supabase_migration.sql を実行

# 4. 開発サーバーを起動
npm run dev
```

---

**質問や問題があれば、エラーメッセージと一緒に共有してください！**

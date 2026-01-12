-- Tanker: user_settings テーブルのRLSポリシー設定
-- SupabaseのSQL Editorで実行してください

-- 1. 既存のルールを一旦クリアにする
DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;
DROP POLICY IF EXISTS "Enable access to own settings" ON user_settings;

-- 2. RLSを有効化（まだ有効でない場合）
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- 3. 「自分のIDのデータなら、読み書き全部OK」という最強ルールを1つ作る
-- 認証ユーザーの場合
CREATE POLICY "Enable access to own settings" ON user_settings
  FOR ALL
  USING (
    -- 認証ユーザーの場合: auth.uid() = user_id
    (auth.uid()::text = user_id)
    OR
    -- 認証がない場合（'default'ユーザー）: user_id = 'default' かつ auth.uid() が null
    (user_id = 'default' AND auth.uid() IS NULL)
  )
  WITH CHECK (
    (auth.uid()::text = user_id)
    OR
    (user_id = 'default' AND auth.uid() IS NULL)
  );

-- 注意: もし認証を使わない場合は、以下のより緩いポリシーを使用してください（開発環境のみ推奨）
-- CREATE POLICY "Enable access to own settings" ON user_settings
--   FOR ALL
--   USING (true)
--   WITH CHECK (true);

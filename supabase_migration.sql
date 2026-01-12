-- Tanker: user_settings テーブル作成
-- SupabaseのSQL Editorで実行してください

CREATE TABLE IF NOT EXISTS user_settings (
  user_id TEXT PRIMARY KEY,
  initial_asset NUMERIC DEFAULT 0 NOT NULL,
  daily_budget_goal NUMERIC DEFAULT 3000 NOT NULL,
  currency_unit TEXT DEFAULT '円' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- updated_at を自動更新するトリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at を自動更新するトリガー
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- デフォルトユーザーの初期データを挿入（オプション）
INSERT INTO user_settings (user_id, initial_asset, daily_budget_goal, currency_unit)
VALUES ('default', 0, 3000, '円')
ON CONFLICT (user_id) DO NOTHING;

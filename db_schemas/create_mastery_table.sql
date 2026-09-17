CREATE TABLE IF NOT EXISTS user_subject_stats (
    telegram_id TEXT REFERENCES profiles(telegram_id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    questions_attempted INTEGER DEFAULT 0,
    questions_correct INTEGER DEFAULT 0,
    total_time_spent_seconds INTEGER DEFAULT 0,
    last_practiced TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (telegram_id, subject)
);

-- Enable RLS
ALTER TABLE user_subject_stats ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own stats
CREATE POLICY "Users can view own stats" 
ON user_subject_stats FOR SELECT 
USING (telegram_id = auth.jwt()->>'sub' OR telegram_id = current_setting('request.jwt.claims', true)::json->>'sub');
-- Wait, the telegram app uses a custom auth system via Next.js server cookie. So we will just use Service Role Key for now on the backend to fetch/update, or we don't need strict Supabase RLS if accessed via Next.js API.

-- ============================================================
-- Ethio Scholar — Supabase Database Migration
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================
-- Auth strategy: Telegram Login ONLY (both web + mini app)
-- Every user is identified by their Telegram numeric ID.
-- No Supabase Auth / email / password needed.
-- ============================================================

-- ── 1. PROFILES ───────────────────────────────────────────────

DROP TABLE IF EXISTS saved_mistakes CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

CREATE TABLE profiles (
  telegram_id         TEXT        PRIMARY KEY,   -- Telegram user ID (e.g. "123456789")
  full_name           TEXT,
  username            TEXT,                      -- Telegram @username (optional)
  avatar_url          TEXT,
  daily_streak        INTEGER     DEFAULT 0,
  last_activity_date  DATE,
  subscription_status TEXT        DEFAULT 'free'
                      CHECK (subscription_status IN ('free', 'premium')),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Public read/write — Telegram HMAC verification on the server is the security layer
CREATE POLICY "Telegram users full access"
  ON profiles FOR ALL USING (false) WITH CHECK (false);


-- ── 2. SAVED MISTAKES (BOOKMARKS) ─────────────────────────────

CREATE TABLE saved_mistakes (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  telegram_id  TEXT        NOT NULL REFERENCES profiles(telegram_id) ON DELETE CASCADE,
  question_id  TEXT        NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (telegram_id, question_id)
);

CREATE INDEX idx_saved_mistakes_telegram_id ON saved_mistakes(telegram_id);

ALTER TABLE saved_mistakes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Telegram users full access"
  ON saved_mistakes FOR ALL USING (false) WITH CHECK (false);


-- ── 3. VERIFY ─────────────────────────────────────────────────
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name IN ('profiles', 'saved_mistakes')
ORDER BY table_name, ordinal_position;


-- ── 4. PROFILE STUDY PREFERENCES (Run this in Supabase SQL Editor) ─────────
-- Adds exam type, stream, and subject to profiles so it's collected once at onboarding

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS target_exam TEXT,   -- 'entrance' | 'freshman' | 'exit'
  ADD COLUMN IF NOT EXISTS stream      TEXT,   -- e.g. 'Natural Science', 'Engineering & Tech'
  ADD COLUMN IF NOT EXISTS subject     TEXT;   -- e.g. 'Physics', 'Computer Science'

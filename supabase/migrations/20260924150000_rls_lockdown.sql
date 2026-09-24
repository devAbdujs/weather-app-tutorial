-- Enable Row Level Security on all critical tables
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS saved_mistakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_subject_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS study_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payment_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ai_responses_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS otp_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS flashcards ENABLE ROW LEVEL SECURITY;

-- Block all direct direct mutations (INSERT/UPDATE/DELETE) for anon and authenticated roles
-- (Since Next.js Server Actions use Service Role to perform all mutations safely)
-- Note: 'authenticated' is included just in case standard Supabase Auth is enabled in the future.

-- For questions, flashcards, and study_notes: allow public SELECT (so client-side components can fetch them if needed)
CREATE POLICY "Allow public SELECT on questions" ON questions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public SELECT on flashcards" ON flashcards FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public SELECT on study_notes" ON study_notes FOR SELECT TO anon, authenticated USING (true);

-- For all other tables, explicitly DENY everything for anon and authenticated roles
-- (Supabase default is deny all when RLS is enabled and no policies exist, but adding these for explicitness)
-- Actually, just leaving them with NO policies means they are fully blocked from anon/authenticated.

-- We will explicitly create a policy that allows nothing, just to be documented.
-- (No policies created = completely closed to public API).

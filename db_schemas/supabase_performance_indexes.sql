-- Performance & Optimization Indexes for Supabase

-- The Python migration script successfully copied data but missed transferring the 
-- vital performance indexes from SQLite. Running these will prevent full-table 
-- sequential scans and massively speed up the app!

-- 1. QUESTIONS TABLE (The heaviest table with 31,000+ rows)
-- Single-column indexes for fast filtering
CREATE INDEX IF NOT EXISTS idx_questions_exam_type ON questions(exam_type);
CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions(subject);
CREATE INDEX IF NOT EXISTS idx_questions_year_ec ON questions(year_ec);

-- Composite index for the exact query used in PracticeHub and ExamSessionLoader
-- (When a user filters by exam type, subject, AND year simultaneously)
CREATE INDEX IF NOT EXISTS idx_questions_composite_filters 
ON questions(exam_type, subject, year_ec);

-- 2. STUDY NOTES TABLE
CREATE INDEX IF NOT EXISTS idx_study_notes_department ON study_notes(department);

-- 3. USER SUBJECT STATS (Mastery Analytics)
CREATE INDEX IF NOT EXISTS idx_user_subject_stats_telegram_id ON user_subject_stats(telegram_id);

-- 4. SAVED MISTAKES (Bookmarks)
CREATE INDEX IF NOT EXISTS idx_saved_mistakes_telegram_id ON saved_mistakes(telegram_id);

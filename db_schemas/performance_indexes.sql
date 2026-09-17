-- Performance Indexes for Temari App
-- These indexes prevent full-table scans when querying user data and notes.

-- 1. Study Notes (Queried heavily by exam_type and department when a user opens a subject)
CREATE INDEX IF NOT EXISTS idx_study_notes_exam_type ON study_notes (exam_type);
CREATE INDEX IF NOT EXISTS idx_study_notes_department ON study_notes (department);

-- 2. Notebook Pins (Queried by telegram_id to show a student's pinned flashcards)
CREATE INDEX IF NOT EXISTS idx_notebook_pins_telegram_id ON notebook_pins (telegram_id);
CREATE INDEX IF NOT EXISTS idx_notebook_pins_subject ON notebook_pins (subject);

-- 3. Saved Mistakes (Queried when rendering the exam review or starting a quick drill)
CREATE INDEX IF NOT EXISTS idx_saved_mistakes_telegram_id ON saved_mistakes (telegram_id);

-- 4. User Subject Stats (Queried on the Mastery Tree page)
-- (Primary Key is telegram_id, subject which already creates a btree index, but we can index just telegram_id for faster lookups of ALL stats for a user)
CREATE INDEX IF NOT EXISTS idx_user_subject_stats_telegram_id ON user_subject_stats (telegram_id);

-- 5. Flashcards (If we have a standalone flashcards table, queried by subject/grade)
-- CREATE INDEX IF NOT EXISTS idx_flashcards_subject ON flashcards (subject);

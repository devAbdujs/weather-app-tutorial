-- Temari App Database Indexes (Performance Optimization)
-- Run this in the Supabase Dashboard SQL Editor to prevent full table scans when users filter exams.

CREATE INDEX IF NOT EXISTS idx_questions_subject_exam ON public.questions (subject, exam_type);
CREATE INDEX IF NOT EXISTS idx_questions_year_ec ON public.questions (year_ec);

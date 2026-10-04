-- ==============================================================================
-- Migration: 20261004120000_production_indexes_and_rpc.sql
-- Description: Consolidated indexes, RPC functions, and caching for production
-- Covers TODO items: D-01, D-02, D-03, D-04, D-05, D-06, D-09, D-10, D-11
-- ==============================================================================

-- ── 1. AI Responses Cache (D-02) ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_responses_cache (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id text NOT NULL,
  prompt_type text NOT NULL,
  response text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(question_id, prompt_type)
);

CREATE INDEX IF NOT EXISTS idx_ai_cache_lookup 
ON public.ai_responses_cache (question_id, prompt_type);

-- ── 2. Atomic Subject Stats Increment RPC (D-01) ──────────────────────────────
CREATE OR REPLACE FUNCTION increment_user_subject_stats(
    p_telegram_id TEXT,
    p_subject TEXT,
    p_attempted INT,
    p_correct INT,
    p_time INT DEFAULT 0
) RETURNS jsonb AS $$
DECLARE
    v_result RECORD;
BEGIN
    INSERT INTO user_subject_stats (
        telegram_id,
        subject,
        questions_attempted,
        questions_correct,
        total_time_spent_seconds,
        last_practiced
    ) VALUES (
        p_telegram_id,
        p_subject,
        p_attempted,
        p_correct,
        p_time,
        NOW()
    )
    ON CONFLICT (telegram_id, subject) DO UPDATE SET
        questions_attempted = user_subject_stats.questions_attempted + EXCLUDED.questions_attempted,
        questions_correct = user_subject_stats.questions_correct + EXCLUDED.questions_correct,
        total_time_spent_seconds = user_subject_stats.total_time_spent_seconds + EXCLUDED.total_time_spent_seconds,
        last_practiced = NOW()
    RETURNING questions_attempted, questions_correct, total_time_spent_seconds INTO v_result;

    RETURN jsonb_build_object(
        'attempted', v_result.questions_attempted,
        'correct', v_result.questions_correct,
        'time', v_result.total_time_spent_seconds
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 3. Questions Performance Indexes (D-03, D-04, D-05) ───────────────────────
CREATE INDEX IF NOT EXISTS idx_questions_exam_type ON public.questions(exam_type);
CREATE INDEX IF NOT EXISTS idx_questions_subject ON public.questions(subject);
CREATE INDEX IF NOT EXISTS idx_questions_year_ec ON public.questions(year_ec);
CREATE INDEX IF NOT EXISTS idx_questions_composite_filters 
ON public.questions(exam_type, subject, year_ec);

-- ── 4. Study Notes Performance Indexes (D-06) ─────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_study_notes_exam_type ON public.study_notes(exam_type);
CREATE INDEX IF NOT EXISTS idx_study_notes_department ON public.study_notes(department);

-- ── 5. User Subject Stats Index ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_user_subject_stats_telegram_id 
ON public.user_subject_stats(telegram_id);

-- ── 6. Saved Mistakes Index ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_saved_mistakes_telegram_id 
ON public.saved_mistakes(telegram_id);

-- ── 7. Payment Receipts User & Date Index (D-09) ──────────────────────────────
CREATE INDEX IF NOT EXISTS idx_payment_receipts_user_date 
ON public.payment_receipts(telegram_id, created_at DESC);

-- ── 8. OTP Codes Index (D-10) ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_otp_codes_phone_created 
ON public.otp_codes(phone, created_at DESC);

-- ── 9. User Pins Table Indexes & RLS Policy (D-11) ────────────────────────────
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_pins') THEN
    CREATE INDEX IF NOT EXISTS idx_user_pins_telegram_id ON public.user_pins(telegram_id);
    CREATE INDEX IF NOT EXISTS idx_user_pins_subject ON public.user_pins(subject);
    ALTER TABLE public.user_pins ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

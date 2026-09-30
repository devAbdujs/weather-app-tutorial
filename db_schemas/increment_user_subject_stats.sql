-- Atomic increment function for user_subject_stats
-- Prevents race conditions during offline sync / rapid exam submissions

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

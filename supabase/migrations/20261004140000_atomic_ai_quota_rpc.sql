-- Migration: Atomic AI Weekly Quota Check & Increment RPC (M-03)
-- Prevents TOCTOU race conditions when multiple requests or concurrent tabs are opened.

CREATE OR REPLACE FUNCTION check_and_increment_ai_quota(
  p_telegram_id TEXT,
  p_quota_limit INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_usage INT;
  v_reset_at TIMESTAMPTZ;
  v_now TIMESTAMPTZ := NOW();
  v_subscription TEXT;
BEGIN
  -- Row-level lock on the student profile to guarantee single-threaded serial execution
  SELECT ai_weekly_usage, ai_quota_reset_at, subscription_status
  INTO v_usage, v_reset_at, v_subscription
  FROM public.profiles
  WHERE telegram_id = p_telegram_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'error', 'profile_not_found'
    );
  END IF;

  -- 7-day rolling window reset: if unset or expired, reset usage counter
  IF v_reset_at IS NULL OR v_now >= v_reset_at THEN
    v_usage := 0;
    v_reset_at := v_now + INTERVAL '7 days';
  END IF;

  -- Check if student has already exhausted their weekly allowance
  IF COALESCE(v_usage, 0) >= p_quota_limit THEN
    UPDATE public.profiles
    SET ai_weekly_usage = COALESCE(v_usage, 0),
        ai_quota_reset_at = v_reset_at,
        updated_at = v_now
    WHERE telegram_id = p_telegram_id;

    RETURN jsonb_build_object(
      'allowed', false,
      'usage', COALESCE(v_usage, 0),
      'limit', p_quota_limit,
      'is_premium', (v_subscription = 'premium')
    );
  END IF;

  -- Atomically increment usage
  v_usage := COALESCE(v_usage, 0) + 1;

  UPDATE public.profiles
  SET ai_weekly_usage = v_usage,
      ai_quota_reset_at = v_reset_at,
      updated_at = v_now
  WHERE telegram_id = p_telegram_id;

  RETURN jsonb_build_object(
    'allowed', true,
    'usage', v_usage,
    'limit', p_quota_limit,
    'is_premium', (v_subscription = 'premium')
  );
END;
$$;

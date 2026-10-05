-- Migration: Drop deprecated otp_codes table and associated indexes
-- Reason: Temari uses Telegram Mini App initData and Telegram Login Widget authentication exclusively.
-- Direct SMS / phone OTP authentication is deprecated and removed.

DROP TABLE IF EXISTS public.otp_codes CASCADE;

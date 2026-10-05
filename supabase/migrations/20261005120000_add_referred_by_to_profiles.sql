-- Migration: Add referred_by column to profiles table if not exists
-- Tracks Telegram referral attribution for bot /start ref_<id> deep-links

ALTER TABLE IF EXISTS public.profiles 
ADD COLUMN IF NOT EXISTS referred_by TEXT;

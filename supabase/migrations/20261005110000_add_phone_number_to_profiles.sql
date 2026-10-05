-- Migration: Add phone_number column to profiles table if not exists
-- Tracks verified student phone numbers captured via Telegram OIDC OAuth

ALTER TABLE IF EXISTS public.profiles 
ADD COLUMN IF NOT EXISTS phone_number TEXT;

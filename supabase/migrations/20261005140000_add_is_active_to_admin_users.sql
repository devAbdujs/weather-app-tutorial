-- Migration: Add is_active column to admin_users table for account deactivation
ALTER TABLE IF EXISTS public.admin_users
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON public.admin_users(is_active);

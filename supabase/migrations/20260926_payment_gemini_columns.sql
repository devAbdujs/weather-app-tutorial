-- Migration: Add Gemini Vision extraction columns to payment_receipts
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)

ALTER TABLE public.payment_receipts
  ADD COLUMN IF NOT EXISTS gemini_amount    TEXT,
  ADD COLUMN IF NOT EXISTS gemini_sender    TEXT,
  ADD COLUMN IF NOT EXISTS gemini_flagged   BOOLEAN DEFAULT FALSE;

-- Index for fast admin dashboard queries
CREATE INDEX IF NOT EXISTS idx_payment_receipts_status 
  ON public.payment_receipts (status);

CREATE INDEX IF NOT EXISTS idx_payment_receipts_telegram_id 
  ON public.payment_receipts (telegram_id);

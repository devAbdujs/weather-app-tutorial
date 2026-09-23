-- Run this in your Supabase SQL Editor to enable AI Response Caching

CREATE TABLE IF NOT EXISTS public.ai_responses_cache (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id text NOT NULL,
  prompt_type text NOT NULL,
  response text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(question_id, prompt_type)
);

-- Index for lightning-fast cache hits
CREATE INDEX IF NOT EXISTS idx_ai_cache_lookup ON public.ai_responses_cache (question_id, prompt_type);

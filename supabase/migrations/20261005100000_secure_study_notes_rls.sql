-- Migration: Secure study_notes table against unauthenticated PostgREST scraping
-- Drops the wide-open public SELECT policy that allowed anon key users to dump all proprietary notes.
-- Access to study_notes is handled exclusively by server-side Next.js components/routes via the Service Role.

DROP POLICY IF EXISTS "Allow public SELECT on study_notes" ON public.study_notes;

-- Ensure RLS is active
ALTER TABLE IF EXISTS public.study_notes ENABLE ROW LEVEL SECURITY;

-- Note: No SELECT policies are granted to 'anon' or 'authenticated' roles.
-- PostgREST queries using NEXT_PUBLIC_SUPABASE_ANON_KEY will return 0 rows.
-- Next.js Server Components, Server Actions, and API routes bypass RLS safely using the Supabase Service Role key.

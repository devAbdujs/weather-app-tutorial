import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with the Service Role Key
// This client bypasses Row Level Security (RLS) entirely.
// ONLY use this in Server Actions and API Routes AFTER verifying the user's session.
export async function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase URL or Service Role Key in environment variables.');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    }
  });
}

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Singleton admin client — reuses the same HTTP connection across all API
// routes and server actions instead of paying TCP/TLS handshake cost every call.
// ONLY use this in Server Actions and API Routes AFTER verifying the user session.
// This client bypasses Row Level Security (RLS) entirely.
let _adminClient: SupabaseClient | null = null;

export function createAdminClient(): SupabaseClient {
  if (_adminClient) return _adminClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase URL or Service Role Key in environment variables.');
  }

  _adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return _adminClient;
}

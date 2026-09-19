import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Only run this test if env vars are present
const conditionalDescribe = (SUPABASE_URL && SUPABASE_ANON_KEY) ? describe : describe.skip;

conditionalDescribe('Supabase Row-Level Security (Integration)', () => {
  jest.setTimeout(30000);
  let anonClient: any;
  beforeAll(() => {
    // Next.js ships with undici for native fetch polyfill
    const nativeFetch = require('node-fetch');
    anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { fetch: nativeFetch }
    });
  });

  it('should block unauthenticated users from reading profiles', async () => {
    const { data, error } = await anonClient
      .from('profiles')
      .select('*')
      .limit(1);
    
    // RLS should block the read, returning empty array or an error
    expect(data).toHaveLength(0);
  });

  it('should block unauthenticated users from reading saved_mistakes', async () => {
    const { data, error } = await anonClient
      .from('saved_mistakes')
      .select('*')
      .limit(1);
    
    expect(data).toHaveLength(0);
  });

  it('should allow unauthenticated users to read questions', async () => {
    const { data, error } = await anonClient
      .from('questions')
      .select('id')
      .limit(1);
    
    // Questions table should be public for reading
    expect(error).toBeNull();
    expect(data?.length).toBeGreaterThanOrEqual(0);
  });
});

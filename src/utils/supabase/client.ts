import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const isProd = process.env.NODE_ENV === 'production';
  let cookieDomain: string | undefined = undefined;
  if (isProd) {
    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://temari.top';
      const parsedHost = new URL(siteUrl).hostname;
      const parts = parsedHost.split('.');
      if (parts.length >= 2) {
        cookieDomain = `.${parts.slice(-2).join('.')}`;
      }
    } catch {}
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    cookieDomain ? { cookieOptions: { domain: cookieDomain } } : undefined
  )
}

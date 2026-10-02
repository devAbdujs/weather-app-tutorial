import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
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

            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                ...options,
                ...(cookieDomain ? { domain: cookieDomain } : {}),
              })
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

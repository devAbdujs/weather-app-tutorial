import { NextRequest, NextResponse } from 'next/server';
import { parseSubdomain } from '@/lib/subdomains';

export function middleware(req: NextRequest) {
  const host = req.headers.get('host') || '';
  const subdomain = parseSubdomain(host);
  const pathname = req.nextUrl.pathname;

  // Clone the request headers so we can append custom subdomain metadata
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-temari-subdomain', subdomain);
  if (subdomain !== 'root') {
    requestHeaders.set('x-temari-target-exam', subdomain);
  }

  // Handle subdomain-specific routing for landing page
  if (pathname === '/') {
    const sessionCookie = req.cookies.get('es_session')?.value;
    if (sessionCookie) {
      // Authenticated user on subdomain -> redirect directly to scoped dashboard
      if (subdomain !== 'root') {
        const url = req.nextUrl.clone();
        url.pathname = '/dashboard';
        url.searchParams.set('target_exam', subdomain);
        return NextResponse.redirect(url);
      } else {
        const url = req.nextUrl.clone();
        url.pathname = '/dashboard';
        return NextResponse.redirect(url);
      }
    }
  }

  // Create response forwarding modified headers
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Share portal preference cookie across all subdomains
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

  if (subdomain !== 'root') {
    response.cookies.set({
      name: 'temari_portal',
      value: subdomain,
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: isProd ? 'none' : 'lax',
      secure: isProd,
      ...(cookieDomain ? { domain: cookieDomain } : {}),
    });
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - manifest.json (PWA manifest)
     * - assets (public assets)
     * - Static asset extensions (.png, .jpg, .svg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|assets/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?|ttf|css)$).*)',
  ],
};

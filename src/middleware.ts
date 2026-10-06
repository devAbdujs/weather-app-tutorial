import { NextRequest, NextResponse } from 'next/server';
import { parseSubdomain, getSubdomainUrl } from '@/lib/subdomains';

export function middleware(req: NextRequest) {
  const host = req.headers.get('host') || '';
  const subdomain = parseSubdomain(host);
  const pathname = req.nextUrl.pathname;

  // Clone the request headers so we can append custom subdomain metadata.
  // NOTE: x-temari-subdomain is UX/routing metadata only. It must NEVER be used
  // as a security or authorization boundary. Auth is strictly enforced by session tokens.
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-temari-subdomain', subdomain);
  if (subdomain !== 'root') {
    requestHeaders.set('x-temari-target-exam', subdomain);
  }

  // Handle path-based dedicated exam landing pages (/entrance, /freshman, /exit)
  if (pathname === '/entrance' || pathname === '/freshman' || pathname === '/exit') {
    const track = pathname.slice(1);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://temari.top';
    const isLocal = host.includes('localhost') || host.includes('127.0.0.1') || siteUrl.includes('localhost');

    // In production, canonically redirect to the dedicated live subdomain
    if (!isLocal) {
      const subdomainUrl = getSubdomainUrl(track as any);
      const sessionCookie = req.cookies.get('es_session')?.value;
      const targetUrl = sessionCookie 
        ? `${subdomainUrl}/dashboard?target_exam=${track}` 
        : subdomainUrl;
      
      const response = NextResponse.redirect(targetUrl, 308);
      response.cookies.set({
        name: 'temari_portal',
        value: track,
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
        domain: '.temari.top',
        sameSite: 'none',
        secure: true,
      });
      return response;
    }

    requestHeaders.set('x-temari-subdomain', track);
    requestHeaders.set('x-temari-target-exam', track);

    const sessionCookie = req.cookies.get('es_session')?.value;
    if (sessionCookie) {
      const url = req.nextUrl.clone();
      url.pathname = '/dashboard';
      url.searchParams.set('target_exam', track);
      return NextResponse.redirect(url);
    }

    const url = req.nextUrl.clone();
    url.pathname = '/';
    const response = NextResponse.rewrite(url, {
      request: {
        headers: requestHeaders,
      },
    });
    response.cookies.set({
      name: 'temari_portal',
      value: track,
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });
    return response;
  }

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

  // Handle subdomain-specific routing for landing page
  if (pathname === '/') {
    const isLoggedOutParam = req.nextUrl.searchParams.get('logged_out') === '1';
    const isLoggedOutCookie = req.cookies.get('temari_manual_logout')?.value === 'true';

    // If user explicitly logged out, DO NOT redirect them to dashboard!
    if (isLoggedOutParam || isLoggedOutCookie) {
      const response = NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
      response.cookies.set({
        name: 'es_session',
        value: '',
        path: '/',
        maxAge: 0,
        expires: new Date(0),
      });
      if (cookieDomain) {
        response.cookies.set({
          name: 'es_session',
          value: '',
          domain: cookieDomain,
          path: '/',
          maxAge: 0,
          expires: new Date(0),
        });
      }
      return response;
    }

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

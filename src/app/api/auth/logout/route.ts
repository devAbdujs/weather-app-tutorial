import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookieOptions } from '@/lib/session';

export async function POST(req: NextRequest) {
  return handleLogout(req);
}

export async function GET(req: NextRequest) {
  const redirectUrl = req.nextUrl.searchParams.get('redirect') || '/?logged_out=1';
  const response = NextResponse.redirect(new URL(redirectUrl, req.url));
  applyLogoutCookies(response);
  return response;
}

function handleLogout(req: NextRequest) {
  const response = NextResponse.json({ success: true });
  applyLogoutCookies(response);
  return response;
}

function applyLogoutCookies(response: NextResponse) {
  const cookieOptions = getSessionCookieOptions();

  // 1. Clear session with configured domain (.temari.top in production)
  if (cookieOptions.domain) {
    response.cookies.set({
      name: 'es_session',
      value: '',
      ...cookieOptions,
      maxAge: 0,
      expires: new Date(0),
    });
    response.cookies.set({
      name: 'temari_portal',
      value: '',
      domain: cookieOptions.domain,
      path: '/',
      maxAge: 0,
      expires: new Date(0),
    });
  }

  // 2. Clear host-only session cookies (without domain)
  response.cookies.set({
    name: 'es_session',
    value: '',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  });

  response.cookies.set({
    name: 'temari_portal',
    value: '',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });

  // 3. Set manual logout flag cookie to prevent middleware auto-redirects
  response.cookies.set({
    name: 'temari_manual_logout',
    value: 'true',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
    sameSite: 'lax',
  });

  if (cookieOptions.domain) {
    response.cookies.set({
      name: 'temari_manual_logout',
      value: 'true',
      domain: cookieOptions.domain,
      path: '/',
      maxAge: 60 * 60 * 24,
      sameSite: 'lax',
    });
  }
}

import { NextResponse } from 'next/server';

/**
 * Direct Phone PIN Auth - Deprecated & Disabled
 * 
 * Production authentication strictly uses Telegram Mini App initData or Telegram OIDC.
 * Direct PIN login without OTP verification was deprecated to prevent account takeover.
 */
export async function POST() {
  return NextResponse.json(
    { error: 'Direct phone PIN authentication is disabled. Please log in with Telegram.' },
    { status: 403 }
  );
}

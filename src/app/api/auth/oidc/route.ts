import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient as createClient } from '@/utils/supabase/admin';
import { encryptSession, getSessionCookieOptions } from '@/lib/session';
import { parseSubdomain } from '@/lib/subdomains';
import { checkRateLimit } from '@/lib/rateLimiter';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
    const rateLimit = await checkRateLimit(`auth_oidc:${ip}`, 15, 60_000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many authorization attempts. Please try again shortly.' },
        { status: 429 }
      );
    }

    const { code, code_verifier, targetExam } = await req.json();
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    const clientId = process.env.TELEGRAM_CLIENT_ID || (botToken ? botToken.split(':')[0] : '');
    const clientSecret = process.env.TELEGRAM_CLIENT_SECRET || botToken;

    if (!clientId || !clientSecret || !code || !code_verifier) {
      return NextResponse.json({ error: 'Missing required parameters or credentials' }, { status: 400 });
    }

    const tokenEndpoint = 'https://oauth.telegram.org/token';
    // Server-enforced redirect URI to prevent open-redirect / token interception attacks (H-07)
    const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://temari.top')).replace(/\/$/, '');
    const finalRedirectUri = `${baseUrl}/auth/callback`;

    // Telegram OIDC requires Basic Auth header: base64(client_id:client_secret)
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const tokenRes = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${basicAuth}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        client_id: clientId,
        redirect_uri: finalRedirectUri,
        code_verifier: code_verifier
      }).toString()
    });

    const tokenData = await tokenRes.json();
    
    if (!tokenRes.ok || !tokenData.id_token) {
      console.error("Telegram Token Exchange Error:", tokenData);
      return NextResponse.json({ error: 'Failed to verify authorization code' }, { status: 401 });
    }

    // Parse ID token payload safely across standard base64 and base64url encodings
    let idTokenPayload: any;
    try {
      const payloadPart = tokenData.id_token.split('.')[1];
      const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
      idTokenPayload = JSON.parse(Buffer.from(padded, 'base64').toString('utf-8'));
    } catch (parseErr) {
      console.error("[Auth OIDC] ID token payload parse error:", parseErr);
      return NextResponse.json({ error: 'Failed to parse authorization token' }, { status: 400 });
    }

    const telegramId = idTokenPayload.sub;
    const phone = idTokenPayload.phone_number;
    const fullName = idTokenPayload.name || '';
    const firstName = fullName.split(' ')[0] || 'Scholar';
    const username = idTokenPayload.preferred_username || null;
    const avatarUrl = idTokenPayload.picture || null;

    if (!telegramId) {
      return NextResponse.json({ error: 'Invalid ID token payload: missing sub' }, { status: 400 });
    }

    const supabase = await createClient();

    const upsertPayload: Record<string, any> = { 
      telegram_id: telegramId.toString(),
      full_name: fullName,
      username: username,
      avatar_url: avatarUrl,
    };
    if (phone) {
      upsertPayload.phone_number = phone;
    }

    // 1. Attempt upsert into profiles
    let profileResult = await supabase
      .from('profiles')
      .upsert({ ...upsertPayload }, { onConflict: 'telegram_id' })
      .select('telegram_id, target_exam, stream')
      .maybeSingle();

    // 2. Schema resilience: if phone_number column is not yet migrated in Supabase, retry without it
    if (profileResult.error && upsertPayload.phone_number) {
      const errMsg = (profileResult.error.message || '').toLowerCase();
      const isColumnMissing = 
        profileResult.error.code === 'PGRST204' || 
        errMsg.includes('phone_number') ||
        errMsg.includes('column');

      if (isColumnMissing) {
        console.warn("[Auth OIDC] 'phone_number' column not found on profiles table. Retrying upsert without phone_number. (Tip: run migration 20261005110000_add_phone_number_to_profiles.sql)");
        delete upsertPayload.phone_number;
        profileResult = await supabase
          .from('profiles')
          .upsert({ ...upsertPayload }, { onConflict: 'telegram_id' })
          .select('telegram_id, target_exam, stream')
          .maybeSingle();
      }
    }

    if (profileResult.error || !profileResult.data) {
      console.error("[Auth OIDC] Supabase profile upsert error:", profileResult.error);
      throw profileResult.error || new Error('Failed to create or retrieve user profile');
    }

    const profile = profileResult.data;

    // Resolve target_exam if not already set on profile
    let activeTargetExam = profile.target_exam;
    if (!activeTargetExam) {
      const explicitTarget = targetExam;
      const headerExam = req.headers.get('x-temari-target-exam');
      const cookieExam = req.cookies.get('temari_portal')?.value;
      const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
      const subdomain = parseSubdomain(host);

      const candidate = (explicitTarget && ['entrance', 'freshman', 'exit'].includes(explicitTarget))
        ? explicitTarget
        : (headerExam && ['entrance', 'freshman', 'exit'].includes(headerExam))
        ? headerExam
        : (cookieExam && ['entrance', 'freshman', 'exit'].includes(cookieExam))
        ? cookieExam
        : (subdomain !== 'root' ? subdomain : null);

      if (candidate) {
        activeTargetExam = candidate;
        try {
          await supabase
            .from('profiles')
            .update({ target_exam: candidate })
            .eq('telegram_id', profile.telegram_id);
        } catch (updateErr) {
          console.warn("[Auth OIDC] Non-fatal: Failed to update target_exam on profile:", updateErr);
        }
      }
    }

    const sessionToken = await encryptSession({
      telegram_id: telegramId.toString(),
      profile_id: profile.telegram_id,
      first_name: firstName,
      target_exam: activeTargetExam,
      stream: profile.stream,
    });

    const response = NextResponse.json({ success: true, phone });
    const cookieOptions = getSessionCookieOptions();

    response.cookies.set({
      name: 'es_session',
      value: sessionToken,
      ...cookieOptions,
    });

    // Clear any manual logout flags upon successful authentication
    if (cookieOptions.domain) {
      response.cookies.set({
        name: 'temari_manual_logout',
        value: '',
        domain: cookieOptions.domain,
        path: '/',
        maxAge: 0,
        expires: new Date(0),
      });
    }
    response.cookies.set({
      name: 'temari_manual_logout',
      value: '',
      path: '/',
      maxAge: 0,
      expires: new Date(0),
    });

    return response;

  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error("OIDC Auth Error:", error);
    return NextResponse.json(
      { error: 'Authentication failed. Please try again.', details: process.env.NODE_ENV === 'development' ? errorMsg : undefined },
      { status: 500 }
    );
  }
}

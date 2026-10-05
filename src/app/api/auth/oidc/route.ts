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

    const idTokenPayload = JSON.parse(Buffer.from(tokenData.id_token.split('.')[1], 'base64').toString());
    const telegramId = idTokenPayload.sub;
    const phone = idTokenPayload.phone_number;
    const fullName = idTokenPayload.name || '';
    const firstName = fullName.split(' ')[0] || 'Scholar';

    if (!telegramId) return NextResponse.json({ error: 'Invalid ID token payload' }, { status: 400 });

    const supabase = await createClient();
    const { data: profile, error } = await supabase
      .from('profiles')
      .upsert({ 
        telegram_id: telegramId.toString(),
        full_name: fullName,
      }, { onConflict: 'telegram_id' })
      .select('telegram_id, target_exam, stream')
      .single();

    if (error) throw error;

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
        await supabase
          .from('profiles')
          .update({ target_exam: candidate })
          .eq('telegram_id', profile.telegram_id);
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
    response.cookies.set({
      name: 'es_session',
      value: sessionToken,
      ...getSessionCookieOptions(),
    });

    return response;

  } catch (error: unknown) {
    console.error("OIDC Auth Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

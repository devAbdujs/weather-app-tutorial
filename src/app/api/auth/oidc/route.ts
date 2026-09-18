import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient as createClient } from '@/utils/supabase/admin';
import { encryptSession } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    const { code, code_verifier } = await req.json();
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    const clientId = process.env.TELEGRAM_CLIENT_ID || (botToken ? botToken.split(':')[0] : '');
    const clientSecret = process.env.TELEGRAM_CLIENT_SECRET || botToken;

    if (!clientId || !clientSecret || !code || !code_verifier) {
      return NextResponse.json({ error: 'Missing required parameters or credentials' }, { status: 400 });
    }

    const tokenEndpoint = 'https://oauth.telegram.org/token';
    const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://temari.top'}/auth/callback`;

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
        redirect_uri: redirectUri,
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

    const sessionToken = await encryptSession({
      telegram_id: telegramId.toString(),
      profile_id: profile.telegram_id,
      first_name: firstName,
      target_exam: profile.target_exam,
      stream: profile.stream,
    });

    const response = NextResponse.json({ success: true, phone });
    response.cookies.set({
      name: 'es_session',
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;

  } catch (error: unknown) {
    console.error("OIDC Auth Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

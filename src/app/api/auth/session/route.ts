import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/utils/supabase/server';
import { encryptSession } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { initData, webData } = data;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!botToken) {
      return NextResponse.json({ error: 'Server misconfiguration (Missing Token)' }, { status: 500 });
    }

    let telegramUser: any = null;

    // --- FLOW 1: Mini App Auth (initData) ---
    if (initData) {
      const urlParams = new URLSearchParams(initData);
      const hash = urlParams.get('hash');
      urlParams.delete('hash');

      const params = Array.from(urlParams.entries());
      params.sort((a, b) => a[0].localeCompare(b[0]));
      const dataCheckString = params.map(([key, value]) => `${key}=${value}`).join('\n');

      const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
      const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

      if (calculatedHash !== hash) return NextResponse.json({ error: 'Invalid Mini App signature' }, { status: 403 });

      const userString = urlParams.get('user');
      if (userString) telegramUser = JSON.parse(userString);
    } 
    // --- FLOW 2: Web Login Widget (webData) ---
    else if (webData) {
      const { hash, ...userData } = webData;
      
      const checkString = Object.keys(userData)
        .sort()
        .map(k => `${k}=${userData[k as keyof typeof userData]}`)
        .join('\n');

      const secretKey = crypto.createHash('sha256').update(botToken).digest();
      const calculatedHash = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex');

      if (calculatedHash !== hash) return NextResponse.json({ error: 'Invalid Web signature' }, { status: 403 });
      
      telegramUser = userData;
    }
    // --- FLOW 3: Dev Mode Bypass (Only works in localhost) ---
    else if (data.devMode && process.env.NODE_ENV === 'development') {
      telegramUser = {
        id: 999999999, // Fake Dev ID
        first_name: 'Dev',
        last_name: 'Scholar',
        username: 'dev_scholar'
      };
    }

    if (!telegramUser || !telegramUser.id) {
      return NextResponse.json({ error: 'No user data provided' }, { status: 400 });
    }

    // 3. Upsert User into Supabase
    const supabase = await createClient();
    
    // Deterministic UUID from Telegram ID
    const hashId = crypto.createHash('md5').update(telegramUser.id.toString()).digest('hex');
    const telegramUuid = `${hashId.substring(0,8)}-${hashId.substring(8,12)}-4${hashId.substring(13,16)}-a${hashId.substring(17,20)}-${hashId.substring(20,32)}`;

    const { data: profile, error } = await supabase
      .from('profiles')
      .upsert({ 
        id: telegramUuid,
        telegram_id: telegramUser.id.toString(),
        full_name: `${telegramUser.first_name} ${telegramUser.last_name || ''}`.trim(),
      }, { onConflict: 'id' })
      .select('id, target_exam, stream')
      .single();

    if (error) {
      console.error("Supabase upsert error:", error);
      throw error;
    }

    // 4. Create Encrypted HTTP-Only Session Cookie
    const sessionToken = encryptSession({
      telegram_id: telegramUser.id.toString(),
      profile_id: profile.id,
      first_name: telegramUser.first_name,
    });

    const response = NextResponse.json({ success: true, hasTargetExam: !!profile.target_exam });
    
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
    console.error("Auth API Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

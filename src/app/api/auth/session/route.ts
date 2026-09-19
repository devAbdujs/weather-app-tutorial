import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient as createClient } from '@/utils/supabase/admin';
import { encryptSession } from '@/lib/session';

import { validateMiniAppInitData, validateWebWidgetData } from '@/lib/telegramAuth';

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
      telegramUser = validateMiniAppInitData(initData, botToken);
      if (!telegramUser) return NextResponse.json({ error: 'Invalid Mini App signature' }, { status: 403 });
    } 
    // --- FLOW 2: Web Login Widget (webData) ---
    else if (webData) {
      telegramUser = validateWebWidgetData(webData, botToken);
      if (!telegramUser) return NextResponse.json({ error: 'Invalid Web signature' }, { status: 403 });
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
    
    const { data: profile, error } = await supabase
      .from('profiles')
      .upsert({ 
        telegram_id: telegramUser.id.toString(),
        full_name: `${telegramUser.first_name} ${telegramUser.last_name || ''}`.trim(),
        username: telegramUser.username || null,
        avatar_url: telegramUser.photo_url || null,
      }, { onConflict: 'telegram_id' })
      .select('telegram_id, target_exam, stream')
      .single();

    if (error) {
      console.error("Supabase upsert error:", error);
      throw error;
    }

    // 4. Create Encrypted HTTP-Only Session Cookie
    const sessionToken = await encryptSession({
      telegram_id: telegramUser.id.toString(),
      profile_id: profile.telegram_id,
      first_name: telegramUser.first_name,
      target_exam: profile.target_exam,
      stream: profile.stream,
    });

    const response = NextResponse.json({ success: true, hasTargetExam: !!profile.target_exam });
    
    response.cookies.set({
      name: 'es_session',
      value: sessionToken,
      httpOnly: true,
      secure: true,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;

  } catch (error: unknown) {
    console.error("Auth API Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

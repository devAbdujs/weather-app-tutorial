import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient as createClient } from '@/utils/supabase/admin';
import { encryptSession, getSessionCookieOptions } from '@/lib/session';
import { parseSubdomain } from '@/lib/subdomains';

import { validateMiniAppInitData, validateWebWidgetData } from '@/lib/telegramAuth';
import { checkRateLimit } from '@/lib/rateLimiter';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
    const rateLimit = await checkRateLimit(`auth_session:${ip}`, 15, 60_000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many authentication attempts. Please try again shortly.' },
        { status: 429 }
      );
    }

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

    // 4. Resolve target_exam if not already set on profile
    let activeTargetExam = profile.target_exam;
    if (!activeTargetExam) {
      const explicitTarget = data.targetExam;
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

    // 5. Create Encrypted HTTP-Only Session Cookie
    const sessionToken = await encryptSession({
      telegram_id: telegramUser.id.toString(),
      profile_id: profile.telegram_id,
      first_name: telegramUser.first_name,
      target_exam: activeTargetExam,
      stream: profile.stream,
    });

    const response = NextResponse.json({ success: true, hasTargetExam: !!activeTargetExam });
    
    response.cookies.set({
      name: 'es_session',
      value: sessionToken,
      ...getSessionCookieOptions(),
    });

    return response;

  } catch (error: unknown) {
    console.error("Auth API Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

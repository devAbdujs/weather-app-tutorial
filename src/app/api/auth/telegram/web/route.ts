import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient as createClient } from '@/utils/supabase/admin';
import { parseSubdomain } from '@/lib/subdomains';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    
    if (!data.hash || !data.id) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }

    // 1. Verify Telegram Web Widget Signature
    const { hash, ...userData } = data;
    
    const checkString = Object.keys(userData)
      .sort()
      .map(k => `${k}=${userData[k as keyof typeof userData]}`)
      .join('\n');

    const secretKey = crypto.createHash('sha256').update(botToken).digest();
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex');

    if (calculatedHash !== hash) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    // 2. Prevent replay attacks (24 hours)
    const now = Math.floor(Date.now() / 1000);
    if (now - data.auth_date > 86400) {
      return NextResponse.json({ error: 'Session expired. Please log in again.' }, { status: 401 });
    }

    // 3. Signature valid -> Upsert into Supabase
    const supabase = await createClient();

    const { data: profile, error } = await supabase
      .from('profiles')
      .upsert({ 
        telegram_id: data.id.toString(),
        full_name: `${data.first_name || ''} ${data.last_name || ''}`.trim(),
        username: data.username || null,
        avatar_url: data.photo_url || null,
      }, { onConflict: 'telegram_id' })
      .select('telegram_id, target_exam, stream')
      .single();

    if (error) throw error;

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
    const { encryptSession, getSessionCookieOptions } = await import('@/lib/session');
    const sessionToken = await encryptSession({
      telegram_id: data.id.toString(),
      profile_id: profile.telegram_id,
      first_name: data.first_name || 'Scholar',
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
    console.error("Telegram Web Auth Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

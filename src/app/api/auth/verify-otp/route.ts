import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/utils/supabase/server';
import { encryptSession } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();

    if (!code || code.length !== 6) {
      return NextResponse.json({ error: 'Invalid code format' }, { status: 400 });
    }

    const supabase = await createClient();

    // Look up the OTP code
    const { data: otpRecord, error } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('code', code)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !otpRecord) {
      return NextResponse.json({ error: 'Invalid or expired code. Please try again.' }, { status: 401 });
    }

    // Mark the code as used immediately to prevent replay attacks
    await supabase.from('otp_codes').update({ used: true }).eq('id', otpRecord.id);

    const telegramUser = otpRecord.telegram_user;

    // Upsert profile (same logic as existing session route)
    const hashId = crypto.createHash('md5').update(String(telegramUser.id)).digest('hex');
    const telegramUuid = `${hashId.substring(0,8)}-${hashId.substring(8,12)}-4${hashId.substring(13,16)}-a${hashId.substring(17,20)}-${hashId.substring(20,32)}`;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: telegramUuid,
        telegram_id: String(telegramUser.id),
        full_name: `${telegramUser.first_name} ${telegramUser.last_name || ''}`.trim(),
      }, { onConflict: 'id' })
      .select('id, target_exam, stream')
      .single();

    if (profileError) throw profileError;

    // Create encrypted session cookie
    const sessionToken = encryptSession({
      telegram_id: String(telegramUser.id),
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
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error: any) {
    console.error('OTP verify error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

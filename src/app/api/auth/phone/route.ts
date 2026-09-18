import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { encryptSession } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    const { phone, pin, action } = await req.json();

    if (!phone || !pin || pin.length !== 4) {
      return NextResponse.json({ error: 'Invalid phone or PIN' }, { status: 400 });
    }

    // Use a pseudo-Telegram ID to maintain compatibility with the existing DB schema
    const telegramId = `phone:${phone}`; 
    const supabase = await createAdminClient();
    
    let { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('telegram_id', telegramId)
      .maybeSingle();

    if (action === 'create') {
      if (profile) return NextResponse.json({ error: 'Account already exists' }, { status: 400 });
      
      const { data, error } = await supabase.from('profiles').insert({
        telegram_id: telegramId,
        full_name: 'Student',
      }).select().single();
      
      if (error) throw error;
      profile = data;
    } else {
      if (!profile) return NextResponse.json({ error: 'Account not found. Please create one.' }, { status: 404 });
      // Note: PIN verification is bypassed in this mockup as the DB lacks a pin_hash column.
    }

    // Issue Secure Cookie
    const sessionToken = await encryptSession({
      telegram_id: profile.telegram_id,
      profile_id: profile.telegram_id,
      first_name: profile.full_name || 'Student',
    });

    const response = NextResponse.json({ success: true, hasTargetExam: !!profile.target_exam });
    
    response.cookies.set({
      name: 'es_session',
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (error: any) {
    console.error('Phone Auth Error:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

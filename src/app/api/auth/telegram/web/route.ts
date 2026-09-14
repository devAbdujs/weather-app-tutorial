import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/utils/supabase/server';

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
    
    const hashId = crypto.createHash('md5').update(data.id.toString()).digest('hex');
    const telegramUuid = `${hashId.substring(0,8)}-${hashId.substring(8,12)}-4${hashId.substring(13,16)}-a${hashId.substring(17,20)}-${hashId.substring(20,32)}`;

    const { error } = await supabase
      .from('profiles')
      .upsert({ 
        id: telegramUuid,
        telegram_id: data.id.toString(),
        full_name: `${data.first_name} ${data.last_name || ''}`.trim(),
      }, { onConflict: 'id' });

    if (error) throw error;

    return NextResponse.json({ success: true });

  } catch (error: unknown) {
    console.error("Telegram Web Auth Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

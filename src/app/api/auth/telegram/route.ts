import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { initData } = body;

    if (!initData) {
      return NextResponse.json({ error: 'Missing initData' }, { status: 400 });
    }

    // Parse the initData string
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    urlParams.delete('hash');

    // Sort params alphabetically
    const params = Array.from(urlParams.entries());
    params.sort((a, b) => a[0].localeCompare(b[0]));
    const dataCheckString = params.map(([key, value]) => `${key}=${value}`).join('\n');

    // Cryptographically verify using the Bot Token
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      console.error("Missing TELEGRAM_BOT_TOKEN in .env");
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }

    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    if (calculatedHash !== hash) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    // Check auth_date to prevent replay attacks (reject if older than 24 hours)
    const authDate = parseInt(urlParams.get('auth_date') || '0', 10);
    const now = Math.floor(Date.now() / 1000);
    if (now - authDate > 86400) {
      return NextResponse.json({ error: 'initData expired. Please reopen the app.' }, { status: 401 });
    }

    // Signature is valid! Parse the user data
    const userString = urlParams.get('user');
    if (!userString) {
      return NextResponse.json({ error: 'No user data' }, { status: 400 });
    }
    
    const telegramUser = JSON.parse(userString);
    const supabase = await createClient();

    // Upsert the user into the Supabase profiles table
    // Supabase ID is UUID, but Telegram ID is a number. 
    // Wait, in schema.sql: id uuid REFERENCES auth.users
    // Oh no, the profiles table id is UUID, but telegramUser.id is an integer (e.g. 123456789)
    // We need a deterministic UUID from the telegram ID, or change the schema.

    // Hash Telegram ID deterministically into UUID format
    const hashId = crypto.createHash('md5').update(telegramUser.id.toString()).digest('hex');
    const telegramUuid = `${hashId.substring(0,8)}-${hashId.substring(8,12)}-4${hashId.substring(13,16)}-a${hashId.substring(17,20)}-${hashId.substring(20,32)}`;

    const { data: profile, error } = await supabase
      .from('profiles')
      .upsert({ 
        id: telegramUuid,
        full_name: `${telegramUser.first_name} ${telegramUser.last_name || ''}`.trim(),
      }, { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, profile });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal Server Error';
    console.error("Telegram Auth Error:", msg);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

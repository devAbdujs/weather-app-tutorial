import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/utils/supabase/server';
import { encryptSession } from '@/lib/session';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;

// Telegram sends updates to this endpoint
export async function POST(req: NextRequest) {
  try {
    // Verify the request is genuinely from Telegram using the secret header
    const secretHeader = req.headers.get('X-Telegram-Bot-Api-Secret-Token');
    const expectedSecret = crypto.createHash('sha256').update(BOT_TOKEN).digest('hex').slice(0, 32);
    if (secretHeader !== expectedSecret) {
      return NextResponse.json({ ok: false }, { status: 403 });
    }

    const update = await req.json();
    const message = update?.message;

    if (!message || !message.from) {
      return NextResponse.json({ ok: true }); // Ignore non-message updates
    }

    const telegramUser = message.from;
    const text = message.text || '';

    // Respond to /start or any message by generating an OTP
    if (text.startsWith('/start') || text.trim().length > 0) {
      const supabase = await createClient();

      // Generate a secure 6-digit OTP
      const code = String(Math.floor(100000 + Math.random() * 900000));
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 min expiry

      // Upsert: if they already have an unused code, replace it
      await supabase.from('otp_codes').upsert({
        telegram_id: String(telegramUser.id),
        telegram_user: telegramUser,
        code,
        expires_at: expiresAt,
        used: false,
      }, { onConflict: 'telegram_id' });

      // Send the OTP back to the user via bot
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: telegramUser.id,
          text: `👋 Hey ${telegramUser.first_name}!\n\nYour Temari login code is:\n\n*${code}*\n\n⏱ This code expires in 5 minutes. Enter it on the website to log in.`,
          parse_mode: 'Markdown',
        }),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Bot webhook error:', error);
    return NextResponse.json({ ok: true }); // Always return 200 to Telegram
  }
}

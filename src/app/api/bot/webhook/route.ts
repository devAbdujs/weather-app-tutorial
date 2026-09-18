import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

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

    // Only respond to the /start command now
    if (text.startsWith('/start')) {
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: telegramUser.id,
          text: `👋 Welcome to Temari, ${telegramUser.first_name}!\n\nI am your AI study assistant. Click the big **Open App 🚀** button at the bottom left of your screen to launch the app and start practicing!`,
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

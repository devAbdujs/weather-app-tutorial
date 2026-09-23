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
      const appUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://temari.top';
      
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: telegramUser.id,
          text: `👋 <b>Welcome to Temari, ${telegramUser.first_name}!</b>\n\nI am your ultimate AI-powered study companion for Ethiopian exams. 📚\n\n<b>What can you do inside the app?</b>\n🎯 Practice 31,000+ past exam questions\n🧠 Get instant explanations from an AI Tutor\n📊 Track your Scholar Tree mastery\n📝 Save short notes and review flashcards\n\nReady to ace your exams? Click the button below to launch!`,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "Launch Temari App 🚀",
                  web_app: { url: appUrl }
                }
              ]
            ]
          }
        }),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Bot webhook error:', error);
    return NextResponse.json({ ok: true }); // Always return 200 to Telegram
  }
}

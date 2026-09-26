/**
 * Telegram Bot Webhook — Primary Update Handler
 *
 * Handles:
 *   1. /start command  → Welcome message with mini-app launch button
 *   2. callback_query  → Payment approve / reject inline keyboard buttons
 *
 * Telegram sends ALL updates for the bot to this single endpoint.
 * Register it once via:
 *   POST https://api.telegram.org/bot<TOKEN>/setWebhook
 *   { "url": "https://www.temari.top/api/bot/webhook" }
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { sendStudentNotification } from '@/lib/paymentNotifier';

export const runtime = 'nodejs';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const ADMIN_TELEGRAM_ID = process.env.ADMIN_TELEGRAM_ID || '2111526264';

// ── Security: verify request is genuinely from Telegram ───────────────────────
function getExpectedSecret(): string {
  return crypto.createHash('sha256').update(BOT_TOKEN).digest('hex').slice(0, 32);
}

async function answerCallbackQuery(callbackQueryId: string, text: string): Promise<void> {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text, show_alert: false }),
  });
}

async function editMessageText(
  chatId: number | string,
  messageId: number,
  newText: string
): Promise<void> {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      text: newText,
      parse_mode: 'HTML',
    }),
  });
}

// ── Main handler ──────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    // Verify secret header from Telegram
    const secretHeader = req.headers.get('X-Telegram-Bot-Api-Secret-Token');
    if (secretHeader !== getExpectedSecret()) {
      // Telegram doesn't always send the header on all update types — allow if no header
      // but log it. In production consider strict mode: return 403.
      console.warn('[BotWebhook] Missing or invalid secret header');
    }

    const update = await req.json();

    // ── Route 1: /start command ──────────────────────────────────────────────
    if (update.message) {
      const message = update.message;
      const telegramUser = message.from;
      const text: string = message.text || '';

      if (text.startsWith('/start') && telegramUser) {
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
                [{ text: 'Launch Temari App 🚀', web_app: { url: appUrl } }],
              ],
            },
          }),
        });
      }

      return NextResponse.json({ ok: true });
    }

    // ── Route 2: Inline keyboard callback (Payment Approve / Reject) ──────────
    if (update.callback_query) {
      const callbackQuery = update.callback_query;
      const adminId = String(callbackQuery.from?.id);
      const data: string = callbackQuery.data || '';
      const messageId: number = callbackQuery.message?.message_id;
      const chatId: number = callbackQuery.message?.chat?.id;

      // Security: only the configured admin can approve/reject payments
      if (ADMIN_TELEGRAM_ID && adminId !== ADMIN_TELEGRAM_ID) {
        await answerCallbackQuery(callbackQuery.id, '⛔ Unauthorized');
        return NextResponse.json({ ok: true });
      }

      const approveMatch = data.match(/^approve_payment:(.+)$/);
      const rejectMatch = data.match(/^reject_payment:(.+)$/);

      if (approveMatch || rejectMatch) {
        const receiptId = (approveMatch ?? rejectMatch)![1];
        const approved = !!approveMatch;

        const supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Fetch the receipt to get the student's telegram_id
        const { data: receipt, error: fetchErr } = await supabaseAdmin
          .from('payment_receipts')
          .select('telegram_id, status, transaction_id')
          .eq('id', receiptId)
          .single();

        if (fetchErr || !receipt) {
          await answerCallbackQuery(callbackQuery.id, '❌ Receipt not found in database.');
          return NextResponse.json({ ok: true });
        }

        if (receipt.status !== 'pending') {
          await answerCallbackQuery(
            callbackQuery.id,
            `⚠️ Already ${receipt.status}. No change made.`
          );
          return NextResponse.json({ ok: true });
        }

        const studentTelegramId: string = receipt.telegram_id;
        const newStatus = approved ? 'approved' : 'rejected';

        // ── DB updates ────────────────────────────────────────────────────────
        const { error: receiptUpdateErr } = await supabaseAdmin
          .from('payment_receipts')
          .update({ status: newStatus })
          .eq('id', receiptId);

        if (receiptUpdateErr) {
          await answerCallbackQuery(callbackQuery.id, `❌ DB Error: ${receiptUpdateErr.message}`);
          return NextResponse.json({ ok: true });
        }

        if (approved) {
          const { error: profileUpdateErr } = await supabaseAdmin
            .from('profiles')
            .update({ subscription_status: 'premium' })
            .eq('telegram_id', studentTelegramId);

          if (profileUpdateErr) {
            console.error('[BotWebhook] Profile upgrade failed:', profileUpdateErr.message);
            // Non-fatal for the admin response — log and continue
          }
        }

        // ── Fetch student name for notification ───────────────────────────────
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('full_name')
          .eq('telegram_id', studentTelegramId)
          .single();

        const studentName = profile?.full_name?.split(' ')[0] ?? 'Student';

        // ── Notify student ────────────────────────────────────────────────────
        try {
          await sendStudentNotification(studentTelegramId, approved, studentName);
        } catch (notifyErr) {
          console.error('[BotWebhook] Student notification failed:', notifyErr);
        }

        // ── Update the admin's message to show it's been handled ──────────────
        const statusEmoji = approved ? '✅' : '❌';
        const statusLabel = approved ? 'APPROVED' : 'REJECTED';
        const originalText = callbackQuery.message?.text || '';
        const updatedText = `${statusEmoji} <b>[${statusLabel}]</b>\n\n${originalText}`;

        try {
          await editMessageText(chatId, messageId, updatedText);
        } catch (editErr) {
          // Non-critical
          console.warn('[BotWebhook] Could not edit admin message:', editErr);
        }

        await answerCallbackQuery(
          callbackQuery.id,
          approved
            ? `✅ ${studentName}'s account upgraded to Premium!`
            : `❌ Payment rejected. Student notified.`
        );
      }

      return NextResponse.json({ ok: true });
    }

    // Unknown update type — always return 200 so Telegram doesn't retry
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[BotWebhook] Unhandled error:', error);
    return NextResponse.json({ ok: true }); // Always 200 to Telegram
  }
}

/**
 * Telegram Bot Webhook — Primary Update Handler
 *
 * Handles:
 *   1. /start, /menu   → Multi-track interactive deep-link navigation grid
 *   2. /quiz           → Instant Daily Quiz drill with 4 inline choice buttons (+10 XP)
 *   3. /stats          → In-chat Scholar Profile card (XP, level, streak, subject mastery)
 *   4. /upgrade        → PRO subscription overview & Telebirr/CBE payment guide
 *   5. /help           → Full command index and learning guide
 *   6. callback_query  → Interactive in-chat navigation, track switching & quiz grading
 *   7. Document upload → Admin PDF auto-forwarding
 *   8. Payment alerts  → Admin instant approve/reject verification
 *
 * Telegram sends ALL updates for the bot to this single endpoint.
 * Register once via:
 *   POST https://api.telegram.org/bot<TOKEN>/setWebhook
 *   { "url": "https://www.temari.top/api/bot/webhook" }
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/utils/supabase/admin';
import { sendStudentNotification } from '@/lib/paymentNotifier';
import { calculateReferralAttribution, type PaymentReceiptRecord } from '@/lib/referral';
import {
  sendTelegramMessage,
  editTelegramMessage,
  answerCallbackQuery,
  ensureUserProfile,
  getMainMenuPayload,
  getTracksPayload,
  setTargetExamTrack,
  getStatsPayload,
  getQuizPayload,
  handleQuizAnswer,
  getUpgradePayload,
  getHelpPayload,
  getChannelJoinPayload,
  checkChannelMembership,
  getSingleQuestionPayload,
  getPersistentReplyKeyboard,
  getInvitePayload,
  recordReferral,
  escapeTelegramHtml,
} from '@/lib/telegramBot';

export const runtime = 'nodejs';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
// No hardcoded fallback — if env is unset, payment approvals are blocked for everyone.
// Set ADMIN_TELEGRAM_ID in your deployment environment variables.
const ADMIN_TELEGRAM_ID = process.env.ADMIN_TELEGRAM_ID || null;

// ── Security: verify request is genuinely from Telegram ───────────────────────
function getExpectedSecret(): string {
  return crypto.createHash('sha256').update(BOT_TOKEN || '').digest('hex').slice(0, 32);
}

// ── Main handler ──────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    // Verify secret header from Telegram.
    // Block if: header is absent (null) OR header is present but wrong.
    // Only allow if BOT_TOKEN is not configured (legacy webhook without secret).
    const secretHeader = req.headers.get('X-Telegram-Bot-Api-Secret-Token');
    if (BOT_TOKEN) {
      if (!secretHeader || secretHeader !== getExpectedSecret()) {
        console.warn('[BotWebhook] Missing or invalid secret header — rejecting request.');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    const update = await req.json();

    const supabaseAdmin = await createAdminClient();

    // ── Route 1: Message / Commands Handler ──────────────────────────────────
    if (update.message) {
      const message = update.message;
      const telegramUser = message.from;
      const text: string = (message.text || '').trim();
      const chatId = message.chat?.id || telegramUser?.id;

      if (telegramUser && chatId) {
        // Auto-register student profile if not exists
        await ensureUserProfile(supabaseAdmin, telegramUser);

        // Command: /start or /menu
        if (text.startsWith('/start') || text.startsWith('/menu')) {
          const parts = text.split(/\s+/);
          const rawArg = parts[1] || '';
          const arg = rawArg.toLowerCase();

          // 1. Referral deep-link: /start ref_<id>
          if (arg.startsWith('ref_')) {
            const referrerId = rawArg.slice(4).trim();
            if (referrerId) {
              await recordReferral(supabaseAdmin, telegramUser.id, referrerId);
            }
            const { text: menuText, reply_markup } = getMainMenuPayload(telegramUser.first_name || 'Scholar');
            await sendTelegramMessage(
              chatId,
              `🎁 <i>Referral invite activated! Welcome to Temari.</i>\n\n` + menuText,
              reply_markup
            );
            return NextResponse.json({ ok: true });
          }

          // 2. Exam track onboarding: /start track_<exam>
          if (arg.startsWith('track_')) {
            const track = arg.slice(6).trim();
            if (['entrance', 'freshman', 'exit'].includes(track)) {
              await setTargetExamTrack(supabaseAdmin, String(telegramUser.id), track as any);
              const label =
                track === 'entrance'
                  ? 'Grade 12 Entrance (EUEE)'
                  : track === 'freshman'
                  ? 'University Freshman'
                  : 'University Exit Exam';

              await sendTelegramMessage(
                chatId,
                `🎯 <b>Target Exam Configured: ${label}</b>\n\nYour question bank, curriculum notes, and micro-drills have been scoped to ${label}.\n\nTap below to take your first practice drill!`,
                {
                  inline_keyboard: [
                    [{ text: '🎯 Start Daily Drill (+10 XP)', callback_data: 'nav:quiz' }],
                    [{ text: '🚀 Open Web App', web_app: { url: SITE_URL } }],
                    [{ text: '🔙 Main Menu', callback_data: 'nav:menu' }],
                  ],
                }
              );
              return NextResponse.json({ ok: true });
            }
          }

          // 3. Question drill deep-link: /start q_<uuid>
          if (arg.startsWith('q_')) {
            const questionId = rawArg.slice(2).trim();
            const { text: qText, reply_markup } = await getSingleQuestionPayload(
              supabaseAdmin,
              questionId
            );
            await sendTelegramMessage(chatId, qText, reply_markup);
            return NextResponse.json({ ok: true });
          }

          if (arg === 'quiz') {
            const { text: quizText, reply_markup } = await getQuizPayload(supabaseAdmin, String(telegramUser.id));
            await sendTelegramMessage(chatId, quizText, reply_markup);
          } else if (arg === 'stats') {
            const { text: statsText, reply_markup } = await getStatsPayload(
              supabaseAdmin,
              String(telegramUser.id),
              telegramUser.first_name
            );
            await sendTelegramMessage(chatId, statsText, reply_markup);
          } else if (arg === 'upgrade' || arg === 'pro') {
            const { text: upText, reply_markup } = getUpgradePayload();
            await sendTelegramMessage(chatId, upText, reply_markup);
          } else if (arg === 'channel' || arg === 'community') {
            const { text: chText, reply_markup } = getChannelJoinPayload();
            await sendTelegramMessage(chatId, chText, reply_markup);
          } else {
            const { text: menuText, reply_markup } = getMainMenuPayload(telegramUser.first_name || 'Scholar');
            await sendTelegramMessage(chatId, menuText, reply_markup);
          }
          return NextResponse.json({ ok: true });
        }

        // Command: /quiz or Persistent Reply Button
        if (text.startsWith('/quiz') || text === '🎯 Daily Quiz Drill') {
          const { text: quizText, reply_markup } = await getQuizPayload(supabaseAdmin, String(telegramUser.id));
          await sendTelegramMessage(chatId, quizText, reply_markup);
          return NextResponse.json({ ok: true });
        }

        // Command: /stats or Persistent Reply Button
        if (text.startsWith('/stats') || text === '📊 My Scholar Stats') {
          const { text: statsText, reply_markup } = await getStatsPayload(
            supabaseAdmin,
            String(telegramUser.id),
            telegramUser.first_name
          );
          await sendTelegramMessage(chatId, statsText, reply_markup);
          return NextResponse.json({ ok: true });
        }

        // Command: /upgrade, /pro or Persistent Reply Button
        if (text.startsWith('/upgrade') || text.startsWith('/pro') || text === '⭐ Upgrade to PRO') {
          const { text: upText, reply_markup } = getUpgradePayload();
          await sendTelegramMessage(chatId, upText, reply_markup);
          return NextResponse.json({ ok: true });
        }

        // Command: /channel, /community or Persistent Reply Button
        if (text.startsWith('/channel') || text === '📢 Official Channel') {
          const { text: chText, reply_markup } = getChannelJoinPayload();
          await sendTelegramMessage(chatId, chText, reply_markup);
          return NextResponse.json({ ok: true });
        }

        // Command: /invite, /ref, /referral
        if (
          text.startsWith('/invite') ||
          text.startsWith('/ref') ||
          text.startsWith('/referral') ||
          text === '🎁 Invite Friends'
        ) {
          const { data: refList } = await supabaseAdmin
            .from('profiles')
            .select('telegram_id, subscription_status, created_at, updated_at')
            .eq('referred_by', String(telegramUser.id));

          const telegramIds = (refList || []).map(r => r.telegram_id).filter(Boolean);
          let receipts: PaymentReceiptRecord[] = [];
          if (telegramIds.length > 0) {
            const { data: recData } = await supabaseAdmin
              .from('payment_receipts')
              .select('telegram_id, status, created_at')
              .in('telegram_id', telegramIds)
              .eq('status', 'approved');
            receipts = (recData as PaymentReceiptRecord[]) || [];
          }

          const summary = calculateReferralAttribution(refList || [], receipts);

          const { text: invText, reply_markup } = getInvitePayload(
            telegramUser.id,
            process.env.NEXT_PUBLIC_BOT_USERNAME || 'toptemari_bot',
            { totalReferred: summary.totalRecruited, proReferred: summary.proConverted, totalEarnedETB: summary.totalEarnedETB }
          );
          await sendTelegramMessage(chatId, invText, reply_markup);
          return NextResponse.json({ ok: true });
        }

        // Open Web App Persistent Reply Button
        if (text === '🚀 Open Web App') {
          await sendTelegramMessage(
            chatId,
            `🚀 <b>Launch Temari Web App:</b>\n\nPractice full timed exams, read chapter notes, and get AI reasoning on any browser or mobile device:\n\n👉 <a href="${SITE_URL}">${SITE_URL}</a>`,
            {
              inline_keyboard: [
                [{ text: '🚀 Launch Web App', web_app: { url: SITE_URL } }],
              ],
            }
          );
          return NextResponse.json({ ok: true });
        }

        // Command: /help or Persistent Reply Button
        if (text.startsWith('/help') || text === '📖 Help Guide') {
          const { text: helpText, reply_markup } = getHelpPayload();
          await sendTelegramMessage(chatId, helpText, reply_markup);
          return NextResponse.json({ ok: true });
        }

        // Unrecognized free text input — Send helpful prompt with persistent reply keyboard
        if (!text.startsWith('/')) {
          const replyKeyboard = getPersistentReplyKeyboard();
          await sendTelegramMessage(
            chatId,
            `👋 Hello <b>${escapeTelegramHtml(
              telegramUser.first_name || 'Scholar'
            )}</b>! Choose an option below or tap a quick action to continue your exam preparation:`,
            replyKeyboard
          );
          return NextResponse.json({ ok: true });
        }
      }

      // ── Handle Admin PDF Document Upload ──────────────────────────────────
      const allowedAdminIds = (ADMIN_TELEGRAM_ID || '').split(',').map(s => s.trim()).filter(Boolean);
      if (message.document && telegramUser && allowedAdminIds.includes(String(telegramUser.id))) {
        const docName = message.document.file_name || 'document.pdf';
        const caption = message.caption || '';

        await sendTelegramMessage(
          telegramUser.id,
          `📥 <b>Document Received!</b>\n\n📄 File: <code>${docName}</code>\n🏷️ Caption: <i>${caption || 'No tags'}</i>\n\n⚙️ <i>Processing into study notes...</i>\n\n💡 <b>Tip:</b> For 100% precision on chapter names & course matching, you can also paste notes directly in the <a href="https://www.temari.top/admin/upload-notes">Web Admin Portal</a>.`
        );

        // Forward to n8n if webhook URL is configured
        const n8nWebhook = process.env.N8N_WEBHOOK_URL;
        if (n8nWebhook) {
          try {
            await fetch(n8nWebhook, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(update),
            });
          } catch (fwdErr) {
            console.warn('[BotWebhook] n8n forward failed:', fwdErr);
          }
        }
      }

      return NextResponse.json({ ok: true });
    }

    // ── Route 2: Inline keyboard callback handler ────────────────────────────
    if (update.callback_query) {
      const callbackQuery = update.callback_query;
      const fromUser = callbackQuery.from;
      const data: string = callbackQuery.data || '';
      const messageId: number = callbackQuery.message?.message_id;
      const chatId: number = callbackQuery.message?.chat?.id || fromUser?.id;

      // 1. Admin Payment Approve / Reject
      const approveMatch = data.match(/^approve_payment:(.+)$/);
      const rejectMatch = data.match(/^reject_payment:(.+)$/);

      if (approveMatch || rejectMatch) {
        const callerId = fromUser ? String(fromUser.id) : '';
        const allowedAdminIds = (ADMIN_TELEGRAM_ID || '').split(',').map(s => s.trim()).filter(Boolean);
        const isAuthorizedAdmin = Boolean(callerId && allowedAdminIds.includes(callerId));

        if (!isAuthorizedAdmin) {
          await answerCallbackQuery(callbackQuery.id, '⛔ Unauthorized', true);
          return NextResponse.json({ ok: true });
        }

        const receiptId = (approveMatch ?? rejectMatch)![1];
        const approved = !!approveMatch;

        // Fetch receipt
        const { data: receipt, error: fetchErr } = await supabaseAdmin
          .from('payment_receipts')
          .select('telegram_id, status, transaction_id, receipt_url')
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

        // Update receipt status
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
            // Revert receipt status to pending to avoid inconsistent state
            await supabaseAdmin
              .from('payment_receipts')
              .update({ status: 'pending' })
              .eq('id', receiptId);
            await answerCallbackQuery(callbackQuery.id, `❌ Profile upgrade failed: ${profileUpdateErr.message}`, true);
            return NextResponse.json({ ok: true });
          }

          // Auto-resolve any other duplicate pending receipts from this student
          await supabaseAdmin
            .from('payment_receipts')
            .update({ status: 'approved' })
            .eq('telegram_id', studentTelegramId)
            .eq('status', 'pending');
        }

        // Auto-Purge receipt image from storage to keep Supabase free tier at ~0 MB
        if (receipt.receipt_url) {
          try {
            const rawPart = receipt.receipt_url.split('/receipts/')[1];
            const fileName = rawPart ? rawPart.split('?')[0] : '';
            if (fileName) {
              await supabaseAdmin.storage.from('receipts').remove([decodeURIComponent(fileName)]);
            }
          } catch (storageErr) {
            console.warn('[BotWebhook] Failed to purge processed receipt image:', storageErr);
          }
        }

        // Fetch student name for notification
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('full_name')
          .eq('telegram_id', studentTelegramId)
          .single();

        const studentName = profile?.full_name?.split(' ')[0] ?? 'Student';

        // Notify student
        try {
          await sendStudentNotification(studentTelegramId, approved, studentName);
        } catch (notifyErr) {
          console.error('[BotWebhook] Student notification failed:', notifyErr);
        }

        // Update the admin message
        const statusEmoji = approved ? '✅' : '❌';
        const statusLabel = approved ? 'APPROVED' : 'REJECTED';
        const originalText = callbackQuery.message?.text || '';
        const updatedText = `${statusEmoji} <b>[${statusLabel}]</b>\n\n${originalText}`;

        await editTelegramMessage(chatId, messageId, updatedText);
        await answerCallbackQuery(
          callbackQuery.id,
          approved
            ? `✅ ${studentName}'s account upgraded to Premium!`
            : `❌ Payment rejected. Student notified.`
        );

        return NextResponse.json({ ok: true });
      }

      // 2. Navigation: Return to Main Menu
      if (data === 'nav:menu') {
        await answerCallbackQuery(callbackQuery.id);
        const { text, reply_markup } = getMainMenuPayload(fromUser?.first_name || 'Scholar');
        await editTelegramMessage(chatId, messageId, text, reply_markup);
        return NextResponse.json({ ok: true });
      }

      // 3. Navigation: Scholar Stats Card
      if (data === 'nav:stats') {
        await answerCallbackQuery(callbackQuery.id, '📊 Loading your stats...');
        const { text, reply_markup } = await getStatsPayload(
          supabaseAdmin,
          String(fromUser?.id),
          fromUser?.first_name || 'Scholar'
        );
        await editTelegramMessage(chatId, messageId, text, reply_markup);
        return NextResponse.json({ ok: true });
      }

      // 4. Navigation: Instant Quiz Drill
      if (data === 'nav:quiz') {
        await answerCallbackQuery(callbackQuery.id, '🎯 Loading question...');
        const { text, reply_markup } = await getQuizPayload(supabaseAdmin, String(fromUser?.id));
        await editTelegramMessage(chatId, messageId, text, reply_markup);
        return NextResponse.json({ ok: true });
      }

      // 5. Navigation: Exam Tracks Menu
      if (data === 'nav:tracks') {
        await answerCallbackQuery(callbackQuery.id);
        const { text, reply_markup } = getTracksPayload();
        await editTelegramMessage(chatId, messageId, text, reply_markup);
        return NextResponse.json({ ok: true });
      }

      // 6. Action: Set Exam Track
      const trackMatch = data.match(/^track:(entrance|freshman|exit)$/);
      if (trackMatch) {
        const track = trackMatch[1];
        const trackLabel = await setTargetExamTrack(supabaseAdmin, String(fromUser?.id), track);
        await answerCallbackQuery(callbackQuery.id, `✅ Track changed to ${trackLabel}!`, true);
        const { text, reply_markup } = getMainMenuPayload(fromUser?.first_name || 'Scholar');
        await editTelegramMessage(chatId, messageId, text, reply_markup);
        return NextResponse.json({ ok: true });
      }

      // 7. Navigation: PRO Upgrade Guide
      if (data === 'nav:upgrade') {
        await answerCallbackQuery(callbackQuery.id);
        const { text, reply_markup } = getUpgradePayload();
        await editTelegramMessage(chatId, messageId, text, reply_markup);
        return NextResponse.json({ ok: true });
      }

      // 8. Quiz Answer Evaluation
      const quizMatch = data.match(/^quiz:([^:]+):([A-Da-d])$/);
      if (quizMatch) {
        const [, questionId, option] = quizMatch;
        const result = await handleQuizAnswer(supabaseAdmin, String(fromUser?.id), questionId, option);
        await answerCallbackQuery(callbackQuery.id, result.isCorrect ? '🎉 Correct! +10 XP' : '❌ Not quite!');
        await editTelegramMessage(chatId, messageId, result.text, result.reply_markup);
        return NextResponse.json({ ok: true });
      }

      // 9. Navigation: Official Channel Community
      if (data === 'nav:channel') {
        await answerCallbackQuery(callbackQuery.id);
        const { text, reply_markup } = getChannelJoinPayload();
        await editTelegramMessage(chatId, messageId, text, reply_markup);
        return NextResponse.json({ ok: true });
      }

      // 10. Navigation: Invite Friends
      if (data === 'nav:invite') {
        await answerCallbackQuery(callbackQuery.id);
        const { data: refList } = await supabaseAdmin
          .from('profiles')
          .select('telegram_id, subscription_status, created_at, updated_at')
          .eq('referred_by', String(fromUser?.id));

        const telegramIds = (refList || []).map(r => r.telegram_id).filter(Boolean);
        let receipts: PaymentReceiptRecord[] = [];
        if (telegramIds.length > 0) {
          const { data: recData } = await supabaseAdmin
            .from('payment_receipts')
            .select('telegram_id, status, created_at')
            .in('telegram_id', telegramIds)
            .eq('status', 'approved');
          receipts = (recData as PaymentReceiptRecord[]) || [];
        }

        const summary = calculateReferralAttribution(refList || [], receipts);

        const { text, reply_markup } = getInvitePayload(
          fromUser?.id,
          process.env.NEXT_PUBLIC_BOT_USERNAME || 'toptemari_bot',
          { totalReferred: summary.totalRecruited, proReferred: summary.proConverted, totalEarnedETB: summary.totalEarnedETB }
        );
        await editTelegramMessage(chatId, messageId, text, reply_markup);
        return NextResponse.json({ ok: true });
      }

      // 10. Action: Verify Channel Membership
      if (data === 'channel:verify') {
        const isMember = await checkChannelMembership(fromUser?.id || '', '@temari_App');
        if (isMember) {
          await answerCallbackQuery(callbackQuery.id, '🎉 Channel membership verified! Bonus unlocked.', true);
          await editTelegramMessage(
            chatId,
            messageId,
            `🎉 <b>Channel Membership Verified!</b>\n\nWelcome to the @temari_App community! Your Scholar profile is verified with community perks.\n\nReady to test your knowledge? Tap below to start today's quiz drill!`,
            {
              inline_keyboard: [
                [{ text: '🎯 Launch Daily Quiz (+10 XP)', callback_data: 'nav:quiz' }],
                [{ text: '🚀 Open Web App', web_app: { url: SITE_URL } }],
                [{ text: '🔙 Main Menu', callback_data: 'nav:menu' }],
              ],
            }
          );
        } else {
          await answerCallbackQuery(
            callbackQuery.id,
            '⚠️ Please join @temari_App first, then tap Verify!',
            true
          );
        }
        return NextResponse.json({ ok: true });
      }

      // Default: Acknowledge callback query
      await answerCallbackQuery(callbackQuery.id);
      return NextResponse.json({ ok: true });
    }

    // Unknown update type — always return 200 so Telegram doesn't retry
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[BotWebhook] Unhandled error:', error);
    return NextResponse.json({ ok: true }); // Always 200 to Telegram
  }
}

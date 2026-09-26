/**
 * Payment Notifier
 * Sends Telegram inline keyboard alert to admin when a new payment is submitted.
 * Used by the payment submit API after Gemini Vision extraction.
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const ADMIN_TELEGRAM_ID = process.env.ADMIN_TELEGRAM_ID || '2111526264';

export interface PaymentInfo {
  receiptId: string;         // payment_receipts.id (UUID)
  telegramId: string;        // student's telegram_id
  studentName: string;       // student's first_name from profiles
  transactionId: string | null;
  amount: string | null;     // Extracted by Gemini, e.g. "500 ETB"
  senderName: string | null; // Extracted by Gemini
  receiptUrl: string;
}

export async function sendAdminPaymentAlert(info: PaymentInfo): Promise<void> {
  if (!BOT_TOKEN || !ADMIN_TELEGRAM_ID) {
    console.warn('[PaymentNotifier] ADMIN_TELEGRAM_ID or BOT_TOKEN not set — skipping Telegram alert.');
    return;
  }

  const caption = [
    `🔔 <b>New Payment Submission</b>`,
    ``,
    `👤 Student: <b>${info.studentName}</b>`,
    `🆔 Telegram ID: <code>${info.telegramId}</code>`,
    `📋 Transaction ID: <code>${info.transactionId ?? 'Not provided'}</code>`,
    `💰 Amount: <b>${info.amount ?? 'Unknown (check image)'}</b>`,
    `🏦 Sender Name: <b>${info.senderName ?? 'Unknown'}</b>`,
    ``,
    `📎 <a href="${info.receiptUrl}">View Receipt Image</a>`,
  ].join('\n');

  const keyboard = {
    inline_keyboard: [
      [
        { text: '✅ Approve Premium', callback_data: `approve_payment:${info.receiptId}` },
        { text: '❌ Reject', callback_data: `reject_payment:${info.receiptId}` },
      ],
    ],
  };

  const response = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: ADMIN_TELEGRAM_ID,
        text: caption,
        parse_mode: 'HTML',
        reply_markup: keyboard,
        disable_web_page_preview: false,
      }),
    }
  );

  if (!response.ok) {
    const body = await response.text();
    console.error('[PaymentNotifier] Telegram API error:', body);
  }
}

export async function sendStudentNotification(
  studentTelegramId: string,
  approved: boolean,
  studentName: string
): Promise<void> {
  if (!BOT_TOKEN) return;

  const text = approved
    ? `🎉 <b>Congratulations, ${studentName}!</b>\n\nYour payment has been <b>verified and approved</b> by our team.\n\n✅ Your account is now <b>Premium</b>! You have full access to all features.\n\nHappy studying! 📚`
    : `❌ <b>Payment Rejected</b>\n\nHi ${studentName}, unfortunately your payment could not be verified.\n\nPossible reasons:\n• The receipt image was unclear\n• Transaction amount did not match\n• Transaction ID could not be confirmed\n\nPlease upload a clear screenshot and try again. If you believe this is a mistake, contact support.`;

  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: studentTelegramId,
      text,
      parse_mode: 'HTML',
    }),
  });
}

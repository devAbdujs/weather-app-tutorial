import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getServerSession } from '@/lib/session';
import { createAdminClient } from '@/utils/supabase/admin';
import { getNextGeminiKey } from '@/lib/geminiKeyRotation';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';
import { sendAdminPaymentAlert } from '@/lib/paymentNotifier';
import { checkRateLimit } from '@/lib/rateLimiter';

// NOTE: Node.js runtime required for Buffer (not Edge-compatible)
export const runtime = 'nodejs';

const PAYMENT_AMOUNT_ETB = 199; // Expected payment amount (matches 199 ETB in upgrade UI)

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit: max 5 submissions per 10 minutes per student
    const rateLimit = await checkRateLimit(`payment_submit:${session.telegram_id}`, 5, 600_000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many submissions. Please wait a few minutes before trying again.' },
        { status: 429 }
      );
    }

    const supabaseAdmin = await createAdminClient();

    const formData = await req.formData();
    const file = formData.get('receipt') as File;
    const transactionId = formData.get('transactionId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'Missing receipt screenshot' }, { status: 400 });
    }

    // Validate file type
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/jpg'];
    if (file.type && !allowedMimes.includes(file.type.toLowerCase())) {
      return NextResponse.json(
        { error: 'Invalid file format. Only JPEG, PNG, and WebP images are accepted.' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Receipt screenshot is too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Guard: reject duplicate pending submissions from the same student
    const { data: existingPending } = await supabaseAdmin
      .from('payment_receipts')
      .select('id, created_at')
      .eq('telegram_id', session.telegram_id)
      .eq('status', 'pending')
      .maybeSingle();

    if (existingPending) {
      return NextResponse.json(
        {
          error: 'You already have a pending payment verification in progress. Our team will verify it shortly.',
          receiptId: existingPending.id,
        },
        { status: 409 }
      );
    }

    // ── Step 1: Upload receipt image to Supabase Storage ─────────────────────
    const fileBuffer = await file.arrayBuffer();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.\-]/g, '_');
    // Obscure telegram_id to prevent leaking raw user IDs in storage URLs
    const hashPrefix = crypto.createHash('sha256').update(String(session.telegram_id)).digest('hex').slice(0, 10);
    const fileName = `rcpt_${hashPrefix}_${Date.now()}_${cleanFileName}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('receipts')
      .upload(fileName, fileBuffer, { contentType: file.type || 'image/jpeg', upsert: true });

    if (uploadError) throw new Error(`Upload Failed: ${uploadError.message}`);

    // Generate signed URL (7-day validity) for admin review
    const { data: signedData, error: signError } = await supabaseAdmin.storage
      .from('receipts')
      .createSignedUrl(fileName, 60 * 60 * 24 * 7);

    if (signError || !signedData?.signedUrl) {
      console.error('[Payment Submit] Failed to create signed URL for receipt:', signError);
      throw new Error(`Failed to generate secure receipt access link: ${signError?.message || 'Storage error'}`);
    }

    const receiptUrl = signedData.signedUrl;

    // ── Step 2: Save pending receipt to database ──────────────────────────────
    const { data: receiptRow, error: insertError } = await supabaseAdmin
      .from('payment_receipts')
      .insert({
        telegram_id: session.telegram_id,
        transaction_id: transactionId || null,
        receipt_url: receiptUrl,
        status: 'pending',
      })
      .select('id')
      .single();

    if (insertError) throw new Error(`DB Insert Failed: ${insertError.message}`);
    const receiptId = receiptRow.id as string;

    // ── Step 3: Use Gemini Vision to extract payment details ──────────────────
    let extractedAmount: string | null = null;
    let extractedSender: string | null = null;
    let extractedTxId: string | null = transactionId || null;
    let geminiSuspicious = false;

    try {
      const geminiKey = getNextGeminiKey();
      if (geminiKey) {
        // Convert in-memory fileBuffer directly to base64 for Gemini inline_data
        const base64Image = Buffer.from(fileBuffer).toString('base64');
        const mimeType = file.type || 'image/jpeg';

        const google = createGoogleGenerativeAI({ apiKey: geminiKey });

        const { text: geminiText } = await generateText({
          model: google('gemini-1.5-flash'),
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  image: `data:${mimeType};base64,${base64Image}`,
                },
                {
                  type: 'text',
                  text: `You are a payment verification assistant for an Ethiopian educational app.
Analyze this bank/mobile money transfer receipt image.

Extract and respond with ONLY valid JSON in this exact format:
{
  "transaction_id": "the transaction ID or reference number (string or null)",
  "amount_etb": "the transfer amount as a number (e.g. 500) or null",
  "sender_name": "the full name of the sender (string or null)",
  "is_suspicious": false
}

Set "is_suspicious" to true if:
- The image is not a payment receipt
- The image appears edited or manipulated
- The amount is less than ${PAYMENT_AMOUNT_ETB} ETB
- No clear transaction reference is visible

Respond ONLY with the JSON object, no explanation, no markdown.`,
                },
              ],
            },
          ],
        });

        const jsonMatch = geminiText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          extractedTxId = parsed.transaction_id ?? extractedTxId;
          extractedAmount = parsed.amount_etb ? `${parsed.amount_etb} ETB` : null;
          extractedSender = parsed.sender_name ?? null;
          geminiSuspicious = parsed.is_suspicious === true;

          // Save Gemini-extracted info back to the receipt row
          // Use try/catch so a missing column doesn't break the whole flow
          try {
            await supabaseAdmin.from('payment_receipts').update({
              transaction_id: extractedTxId,
              gemini_amount: extractedAmount,
              gemini_sender: extractedSender,
              gemini_flagged: geminiSuspicious,
            }).eq('id', receiptId);
          } catch (_colErr) {
            // Columns may not exist yet — try a minimal update
            await supabaseAdmin.from('payment_receipts').update({
              transaction_id: extractedTxId,
            }).eq('id', receiptId);
          }
        }
      }
    } catch (geminiErr) {
      // Non-fatal — admin will review the image manually
      console.error('[Payment] Gemini Vision extraction failed:', geminiErr);
    }

    // ── Step 4: Fetch student name from profiles ──────────────────────────────
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('telegram_id', session.telegram_id)
      .single();

    const studentName = profile?.full_name?.split(' ')[0] ?? session.first_name ?? 'Student';

    // ── Step 5: Send Telegram alert to admin ──────────────────────────────────
    // (Non-blocking — we already saved to DB, so failure here is not critical)
    try {
      await sendAdminPaymentAlert({
        receiptId,
        telegramId: session.telegram_id,
        studentName,
        transactionId: extractedTxId,
        amount: extractedAmount,
        senderName: extractedSender,
        receiptUrl,
      });
    } catch (alertErr) {
      console.error('[Payment] Admin alert failed:', alertErr);
    }

    return NextResponse.json({
      success: true,
      receiptId,
      message: geminiSuspicious
        ? 'Your receipt was submitted but flagged for manual review. Our team will verify within 24 hours.'
        : 'Receipt submitted successfully! Our admin will verify and approve your account shortly.',
    });
  } catch (err: any) {
    console.error('[Payment Submit Error]', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

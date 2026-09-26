import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/session';
import { createClient } from '@supabase/supabase-js';
import { getNextGeminiKey } from '@/lib/geminiKeyRotation';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';
import { sendAdminPaymentAlert } from '@/lib/paymentNotifier';

// NOTE: Node.js runtime required for Buffer (not Edge-compatible)
export const runtime = 'nodejs';

const PAYMENT_AMOUNT_ETB = 200; // Expected payment amount — update this as needed

export async function POST(req: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('receipt') as File;
    const transactionId = formData.get('transactionId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'Missing receipt screenshot' }, { status: 400 });
    }

    // ── Step 1: Upload receipt image to Supabase Storage ─────────────────────
    const fileBuffer = await file.arrayBuffer();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.\-]/g, '_');
    const fileName = `${session.telegram_id}_${Date.now()}_${cleanFileName}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('receipts')
      .upload(fileName, fileBuffer, { contentType: file.type, upsert: true });

    if (uploadError) throw new Error(`Upload Failed: ${uploadError.message}`);

    const receiptUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/receipts/${fileName}`;

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
        // Fetch the image and convert to base64 for Gemini inline_data
        const imageResponse = await fetch(receiptUrl);
        const imageBuffer = await imageResponse.arrayBuffer();
        const base64Image = Buffer.from(imageBuffer).toString('base64');
        const mimeType = file.type || 'image/jpeg';

        const google = createGoogleGenerativeAI({ apiKey: geminiKey });

        const { text: geminiText } = await generateText({
          model: google('gemini-3.6-flash'),
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

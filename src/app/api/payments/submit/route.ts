import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getServerSession } from '@/lib/session';
import { createAdminClient } from '@/utils/supabase/admin';
import { getNextGeminiKey } from '@/lib/geminiKeyRotation';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';
import { sendAdminPaymentAlert, sendAutoApprovalAdminAlert, sendStudentNotification } from '@/lib/paymentNotifier';
import { checkRateLimit } from '@/lib/rateLimiter';

// NOTE: Node.js runtime required for Buffer (not Edge-compatible)
export const runtime = 'nodejs';

const PAYMENT_AMOUNT_ETB = 250; // Expected payment amount (matches 250 ETB in upgrade UI)
const MIN_AUTO_APPROVE_AMOUNT = 245; // Tolerance threshold for automated approval (covers potential bank fee rounding)

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
    const fileName = encodeURIComponent(`rcpt_${hashPrefix}_${Date.now()}_${cleanFileName}`);

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
          model: google(process.env.GEMINI_MODEL || 'gemini-3.8-flash'),
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
                  text: `You are an automated payment verification assistant for an Ethiopian educational app (Temari).
Analyze this CBE / Telebirr / Awash Bank transfer receipt screenshot.

Extract and respond with ONLY valid JSON in this exact format:
{
  "transaction_id": "the transaction reference or confirmation code (string or null)",
  "amount_etb": 250,
  "sender_name": "the full name of the sender (string or null)",
  "credited_account": "the recipient bank account number or phone number credited (string or null)",
  "receiver_name": "the recipient name or merchant credited (string or null)",
  "is_suspicious": false
}

Set "is_suspicious" to true if:
- The image is not a payment receipt or transfer confirmation
- The image appears edited, manipulated, font-altered, or counterfeit
- The amount transferred is less than ${MIN_AUTO_APPROVE_AMOUNT} ETB
- The transaction ID or reference is completely missing or obscured

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
          const rawAmt = parsed.amount_etb ?? parsed.amount;
          const numAmount = typeof rawAmt === 'number' 
            ? rawAmt 
            : parseFloat(String(rawAmt || '').replace(/[^0-9.]/g, ''));
          extractedAmount = !isNaN(numAmount) && numAmount > 0 ? `${numAmount} ETB` : null;
          extractedSender = parsed.sender_name ?? null;
          const extractedCreditedAccount = parsed.credited_account ?? null;
          const extractedReceiverName = parsed.receiver_name ?? null;
          geminiSuspicious = parsed.is_suspicious === true;

          // Save Gemini-extracted info back to the receipt row
          try {
            await supabaseAdmin.from('payment_receipts').update({
              transaction_id: extractedTxId,
              gemini_amount: extractedAmount,
              gemini_sender: extractedSender,
              gemini_flagged: geminiSuspicious,
            }).eq('id', receiptId);
          } catch (_colErr) {
            await supabaseAdmin.from('payment_receipts').update({
              transaction_id: extractedTxId,
            }).eq('id', receiptId);
          }

          // ── Step 3.5: Evaluate for Instant Auto-Approval ──────────────────────
          let isAutoApproved = false;

          if (!geminiSuspicious && !isNaN(numAmount) && numAmount >= MIN_AUTO_APPROVE_AMOUNT && extractedTxId) {
            // Check replay attack protection: ensure transaction_id has never been approved before
            const { data: duplicateTx } = await supabaseAdmin
              .from('payment_receipts')
              .select('id')
              .eq('transaction_id', extractedTxId)
              .eq('status', 'approved')
              .maybeSingle();

            if (!duplicateTx) {
              const rawCredited = (extractedCreditedAccount || '').replace(/\D/g, '');
              const rawReceiver = (extractedReceiverName || '').toLowerCase();

              // Verify credited account: CBE (1000217910448), Telebirr (0942202051), or Awash Bank
              const awashAccount = (process.env.AWASH_ACCOUNT || process.env.NEXT_PUBLIC_AWASH_ACCOUNT || '01320875412900').replace(/\D/g, '');
              const isCbeMatch = rawCredited.includes('1000217910448') || rawReceiver.includes('cbe');
              const isTelebirrMatch = rawCredited.endsWith('942202051') || rawReceiver.includes('telebirr') || rawReceiver.includes('temari');
              const isAwashMatch = (awashAccount && rawCredited.includes(awashAccount)) || rawReceiver.includes('awash');
              const isHolderMatch = rawReceiver.includes('abdu') && rawReceiver.includes('seid');

              if (isCbeMatch || isTelebirrMatch || isAwashMatch || isHolderMatch) {
                isAutoApproved = true;
              }
            } else {
              geminiSuspicious = true; // Duplicate transaction ID detected
            }
          }

          if (isAutoApproved) {
            // 1. Mark receipt approved
            await supabaseAdmin
              .from('payment_receipts')
              .update({
                status: 'approved',
                transaction_id: extractedTxId,
                gemini_amount: extractedAmount,
                gemini_sender: extractedSender,
                gemini_flagged: false,
              })
              .eq('id', receiptId);

            // 2. Upgrade user profile to premium immediately
            await supabaseAdmin
              .from('profiles')
              .update({ subscription_status: 'premium' })
              .eq('telegram_id', session.telegram_id);

            // 3. Auto-resolve any older duplicate pending receipts from this user
            await supabaseAdmin
              .from('payment_receipts')
              .update({ status: 'approved' })
              .eq('telegram_id', session.telegram_id)
              .eq('status', 'pending');

            // 4. Fetch student name
            const { data: profile } = await supabaseAdmin
              .from('profiles')
              .select('full_name')
              .eq('telegram_id', session.telegram_id)
              .single();
            const studentName = profile?.full_name?.split(' ')[0] ?? session.first_name ?? 'Student';

            // 5. Send instant confirmation to student on Telegram
            try {
              await sendStudentNotification(session.telegram_id, true, studentName);
            } catch (notifyErr) {
              console.error('[Payment] Student notification error:', notifyErr);
            }

            // 6. Send Auto-Approval summary alert to Admin
            try {
              await sendAutoApprovalAdminAlert({
                receiptId,
                telegramId: session.telegram_id,
                studentName,
                transactionId: extractedTxId,
                amount: extractedAmount || `${PAYMENT_AMOUNT_ETB} ETB`,
                senderName: extractedSender,
                receiptUrl,
              });
            } catch (adminErr) {
              console.error('[Payment] Admin alert failed:', adminErr);
            }

            return NextResponse.json({
              success: true,
              receiptId,
              isAutoApproved: true,
              message: '🎉 Payment verified automatically! Your Temari PRO account is now active.',
            });
          }
        }
      }
    } catch (geminiErr) {
      // Non-fatal — admin will review the image manually
      console.error('[Payment] Gemini Vision extraction failed:', geminiErr);
    }

    // ── Step 4: Fetch student name from profiles for manual review queue ──────
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('telegram_id', session.telegram_id)
      .single();

    const studentName = profile?.full_name?.split(' ')[0] ?? session.first_name ?? 'Student';

    // ── Step 5: Send Telegram alert to admin for manual review ────────────────
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
      isAutoApproved: false,
      message: geminiSuspicious
        ? 'Your receipt was submitted but flagged for manual review. Our team will verify within 24 hours.'
        : 'Receipt submitted successfully! Our admin will verify and approve your account shortly.',
    });
  } catch (err: any) {
    console.error('[Payment Submit Error]', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/session';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get('receipt') as File;
    const transactionId = formData.get('transactionId') as string;

    if (!file) return NextResponse.json({ error: 'Missing receipt screenshot' }, { status: 400 });

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!, 
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Upload image to Supabase Storage
    const fileBuffer = await file.arrayBuffer();
    // Clean filename to prevent weird characters
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.\-]/g, '_');
    const fileName = `${session.telegram_id}_${Date.now()}_${cleanFileName}`;

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('receipts')
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) throw new Error(`Upload Failed: ${uploadError.message}`);

    const receiptUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/receipts/${fileName}`;

    // Insert into database
    const { error: insertError } = await supabaseAdmin.from('payment_receipts').insert({
      telegram_id: session.telegram_id,
      transaction_id: transactionId || null,
      receipt_url: receiptUrl,
      status: 'pending'
    });

    if (insertError) throw new Error(`DB Insert Failed: ${insertError.message}`);

    // AUTOMATION BRIDGE: Send the uploaded receipt to n8n for Gemini AI verification
    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageUrl: receiptUrl,
            telegram_id: session.telegram_id
          })
        });
      } catch (webhookErr) {
        console.error('[n8n Webhook Error]', webhookErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Payment Submit Error]', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

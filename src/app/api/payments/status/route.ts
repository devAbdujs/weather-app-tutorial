import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/session';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const receiptId = searchParams.get('receiptId');

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch user profile status
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('subscription_status, full_name')
      .eq('telegram_id', session.telegram_id)
      .single();

    const isPremium = profile?.subscription_status === 'premium';

    // Fetch receipt status if provided, or get the latest one
    let receiptStatus = 'pending';
    let receiptQuery = supabaseAdmin
      .from('payment_receipts')
      .select('id, status, created_at')
      .eq('telegram_id', session.telegram_id);

    if (receiptId) {
      receiptQuery = receiptQuery.eq('id', receiptId);
    } else {
      receiptQuery = receiptQuery.order('created_at', { ascending: false }).limit(1);
    }

    const { data: receipts } = await receiptQuery;
    const latestReceipt = receipts && receipts.length > 0 ? receipts[0] : null;

    if (latestReceipt) {
      receiptStatus = latestReceipt.status;
    }

    return NextResponse.json({
      isApproved: isPremium || receiptStatus === 'approved',
      subscriptionStatus: profile?.subscription_status || 'free',
      receiptStatus: isPremium ? 'approved' : receiptStatus,
      studentName: profile?.full_name?.split(' ')[0] ?? session.first_name ?? 'Student',
    });
  } catch (err: any) {
    console.error('[Payment Status Check Error]', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient as createClient } from '@/utils/supabase/admin';
import { getServerSession } from '@/lib/session';
import { z } from 'zod';

const SubmitSchema = z.object({
  subject: z.string().min(1),
  attempted: z.number().int().nonnegative(),
  correct: z.number().int().nonnegative(),
  timeSpentSeconds: z.number().int().nonnegative().optional().default(0)
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const result = SubmitSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: 'Invalid request data', details: result.error.issues }, { status: 400 });
    }

    const { subject, attempted, correct, timeSpentSeconds } = result.data;

    const supabase = await createClient();
    const telegramId = session.telegram_id.toString();

    // Fetch existing stats
    const { data: existing } = await supabase
      .from('user_subject_stats')
      .select('*')
      .eq('telegram_id', telegramId)
      .eq('subject', subject)
      .maybeSingle();

    const newAttempted = (existing?.questions_attempted || 0) + attempted;
    const newCorrect = (existing?.questions_correct || 0) + correct;
    const newTime = (existing?.total_time_spent_seconds || 0) + (timeSpentSeconds || 0);

    const { error: upsertError } = await supabase
      .from('user_subject_stats')
      .upsert({
        telegram_id: telegramId,
        subject,
        questions_attempted: newAttempted,
        questions_correct: newCorrect,
        total_time_spent_seconds: newTime,
        last_practiced: new Date().toISOString()
      }, { onConflict: 'telegram_id, subject' });

    if (upsertError) {
      console.error('Failed to upsert subject stats', upsertError);
      throw upsertError;
    }

    // Level calculation algorithm:
    // Level 1: 0-10 correct
    // Level 2: 11-25 correct
    // Level 3: 26-50 correct
    // Level 4: 51-100 correct
    // Level 5: 101+ correct
    
    let level = 1;
    if (newCorrect > 100) level = 5;
    else if (newCorrect > 50) level = 4;
    else if (newCorrect > 25) level = 3;
    else if (newCorrect > 10) level = 2;

    return NextResponse.json({ 
      success: true, 
      stats: {
        attempted: newAttempted,
        correct: newCorrect,
        level
      }
    });

  } catch (error: any) {
    console.error('Exam submit error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

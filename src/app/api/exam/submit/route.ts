import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient as createClient } from '@/utils/supabase/admin';
import { getServerSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const SubmitSchema = z.object({
  subject: z.string().min(1).max(100),
  // Max 200 questions per session (realistic upper bound for a full exam).
  // Prevents stat inflation exploit: POST { correct: 999999 } → instant Level 5.
  attempted: z.number().int().min(0).max(200),
  correct:   z.number().int().min(0).max(200),
  // Max 4 hours (14400s) per session
  timeSpentSeconds: z.number().int().min(0).max(14400).optional().default(0),
}).refine(data => data.correct <= data.attempted, {
  message: 'correct answers cannot exceed attempted questions',
  path: ['correct'],
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

    // Try atomic RPC increment first to prevent offline queue flush race conditions
    let newAttempted = attempted;
    let newCorrect = correct;

    const { data: rpcData, error: rpcError } = await supabase.rpc('increment_user_subject_stats', {
      p_telegram_id: telegramId,
      p_subject: subject,
      p_attempted: attempted,
      p_correct: correct,
      p_time: timeSpentSeconds || 0,
    });

    if (!rpcError && rpcData) {
      newAttempted = (rpcData as any).attempted ?? attempted;
      newCorrect = (rpcData as any).correct ?? correct;
    } else {
      // Fallback if RPC is not yet created in the database
      const { data: existing } = await supabase
        .from('user_subject_stats')
        .select('*')
        .eq('telegram_id', telegramId)
        .eq('subject', subject)
        .maybeSingle();

      newAttempted = (existing?.questions_attempted || 0) + attempted;
      newCorrect = (existing?.questions_correct || 0) + correct;
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
        }, { onConflict: 'telegram_id,subject' });

      if (upsertError) {
        console.error('Failed to upsert subject stats', upsertError);
        throw upsertError;
      }
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

    try {
      revalidatePath('/mastery');
      revalidatePath('/profile');
      revalidatePath('/dashboard');
    } catch {}

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

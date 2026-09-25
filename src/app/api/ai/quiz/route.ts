export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/session';
import { generateObject } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { z } from 'zod';
import { getNextGeminiKey, markKeyRateLimited, getKeyCount } from '@/lib/geminiKeyRotation';
import { checkRateLimit } from '@/lib/rateLimiter';
import { createAdminClient as createClient } from '@/utils/supabase/admin';



// Define the exact shape of the quiz we want back
const QuizSchema = z.object({
  questions: z.array(z.object({
    question: z.string().describe("A challenging, conceptual multiple choice question based on the text."),
    options: z.array(z.string()).length(4).describe("Exactly 4 distinct plausible options."),
    answer: z.string().describe("The exact text of the correct option."),
    explanation: z.string().describe("A concise, insightful explanation of why this answer is correct and others are wrong.")
  })).length(3)
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ip = req.ip || req.headers.get('x-forwarded-for') || session.telegram_id || 'unknown';
    const rateLimitInfo = checkRateLimit(ip, 1, 60000);
    
    if (!rateLimitInfo.allowed) {
      return NextResponse.json({ error: 'Too many AI requests. Please wait a minute.' }, { status: 429 });
    }

    const body = await req.json();
    const { noteText } = body;
    
    if (!noteText || typeof noteText !== 'string') {
      return NextResponse.json({ error: 'noteText is required' }, { status: 400 });
    }

    // SUBSCRIPTION GATE: Only premium users can generate AI quizzes from notes
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status')
      .eq('telegram_id', session.telegram_id)
      .maybeSingle();

    if (!profile || profile.subscription_status !== 'premium') {
      return NextResponse.json(
        { error: 'upgrade_required', message: 'AI Quiz generation is a premium feature. Upgrade to access it.' },
        { status: 403 }
      );
    }

    const systemPrompt = `You are an elite, highly rigorous university examiner in Ethiopia.
Your task is to generate exactly 3 conceptual multiple-choice questions based on the provided textbook chapter.
DO NOT generate trivial factual recall questions. The questions should test deep understanding, critical thinking, and application of the concepts in the text.
The options must be highly plausible to challenge the student. Ensure the correct answer is unambiguously correct based strictly on the provided text.`;

    let attempt = 0;
    const maxRetries = Math.min(3, getKeyCount());

    while (attempt < maxRetries) {
      const geminiKey = getNextGeminiKey();
      if (!geminiKey) {
        return NextResponse.json({ error: 'No API keys available.' }, { status: 503 });
      }

      try {
        const google = createGoogleGenerativeAI({ apiKey: geminiKey });
        // Use 2.0 flash as it is highly capable
        const model = google('gemini-3.6-flash');

        const { object } = await generateObject({
          model,
          system: systemPrompt,
          prompt: `Create a 3-question conceptual quiz based on this text:\n\n${noteText.substring(0, 8000)}`,
          schema: QuizSchema,
          temperature: 0.3, 
        });

        return NextResponse.json({ success: true, quiz: object.questions });

      } catch (err: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
        if (err?.message?.includes('429') || err?.message?.includes('quota')) {
          markKeyRateLimited(geminiKey);
          attempt++;
          continue; 
        }
        console.error('[Quiz Gen Error]:', err.message);
        return NextResponse.json({ error: 'Failed to generate quiz due to an unexpected error.' }, { status: 500 });
      }
    }

    return NextResponse.json({ error: 'All API keys are currently rate-limited. Try again in a minute.' }, { status: 429 });

  } catch (err: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
    console.error('[Quiz POST Error]:', err.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

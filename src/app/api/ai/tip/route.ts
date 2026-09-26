export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/session';
import { getNextGeminiKey } from '@/lib/geminiKeyRotation';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';
import { checkRateLimit } from '@/lib/rateLimiter';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ip = req.ip || req.headers.get('x-forwarded-for') || session.telegram_id || 'unknown';
    const rateLimitInfo = checkRateLimit(ip, 1, 60000); // Max 1 tip per minute
    
    if (!rateLimitInfo.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await req.json();
    const { examType, streak, hour } = body;

    const examLabel =
      examType === 'freshman' ? 'University Freshman exams'
      : examType === 'entrance' ? 'Grade 12 EUEE (National Entrance) exam'
      : examType === 'exit' ? 'University Exit exam'
      : 'national exams';

    const timeContext =
      hour < 5  ? 'late at night'
      : hour < 12 ? 'in the morning'
      : hour < 17 ? 'in the afternoon'
      : 'in the evening';

    const streakContext = streak > 0
      ? `They have a current streak of ${streak} day${streak !== 1 ? 's' : ''}.`
      : 'They are just starting their study journey.';

    const prompt = `You are a motivational coach for Ethiopian students preparing for their ${examLabel}.
The student is studying ${timeContext}. ${streakContext}

Generate ONE short, powerful, and personalized motivational tip or inspiring quote for them.

Rules:
- Maximum 2 sentences. Be concise and punchy.
- Make it feel specific to their exam type and situation — not generic.
- Alternate between: study science facts, success stories, mindset shifts, and practical study tips.
- Do NOT use emojis. Do NOT say "Dear student" or use greetings.
- Output ONLY the tip text. No labels, no titles, no formatting.`;

    const key = getNextGeminiKey();
    if (!key) throw new Error('No API key available');

    const google = createGoogleGenerativeAI({ apiKey: key });

    const { text } = await generateText({
      model: google('gemini-3.6-flash'),
      prompt,
    });

    return NextResponse.json({ tip: text.trim() });
  } catch (err) {
    console.error('[tip route error]', err);
    const fallbacks = [
      'The brain consolidates memory during sleep — studying before bed and reviewing in the morning doubles retention.',
      'Top Ethiopian students don\'t just memorize; they explain concepts out loud as if teaching a friend.',
      'Struggling with a problem is not failure — it is the exact moment your brain builds new connections.',
      'Small daily sessions beat weekend cramming every time. 20 minutes a day for 30 days = 600 minutes of real learning.',
      'Your exam score is not a measure of your intelligence — it is a measure of your preparation.',
    ];
    const tip = fallbacks[Math.floor(Math.random() * fallbacks.length)];
    return NextResponse.json({ tip });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/session';
import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { z } from 'zod';
import { getNextGeminiKey, markKeyRateLimited, getKeyCount } from '@/lib/geminiKeyRotation';
import { checkRateLimit } from '@/lib/rateLimiter';



const RequestSchema = z.object({
  mode:          z.enum(['exam', 'notes']).default('exam'),
  noteText:      z.string().optional(),
  questionId:    z.string().optional(),
  questionText:  z.string().max(2000).optional(),
  options:       z.array(z.string().nullable()).max(4).optional(),
  correctAnswer: z.string().nullable().optional(),
  explanation:   z.string().nullable().optional(),
  promptType:    z.enum(['hint', 'eli5', 'amharic', 'chat']).default('chat'),
  subject:       z.string().optional(),
  studentAnswer: z.string().nullable().optional(),
  chatHistory:   z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string()
  })).optional(),
});

function buildPrompt(data: z.infer<typeof RequestSchema>): { system: string; defaultUserPrompt: string } {
  const { mode, noteText, questionText, options, correctAnswer, explanation, subject, studentAnswer } = data;

  const system = [
    `You are Mr. Helper, an elite AI tutor for Ethiopian students.`,
    subject ? `(Subject: ${subject}).` : '',
    ''
  ];

  if (mode === 'notes') {
    system.push(`You are helping a student understand their textbook/study notes.`);
    if (noteText) {
      system.push(`Textbook content being read:`);
      system.push(`"${noteText.substring(0, 4000)}"`);
    }
    system.push(`Answer any questions they have based on this text. Keep explanations simple, engaging, and directly related to the text. Do not make up formulas or facts not supported by the text.`);
  } else {
    const isIncorrect = studentAnswer && correctAnswer && studentAnswer.trim().toLowerCase() !== correctAnswer.trim().toLowerCase();
    system.push(`Question Context:`);
    system.push(`"${questionText}"`);
    if (options?.length) system.push(`Options: A) ${options[0]}  B) ${options[1]}  C) ${options[2]}  D) ${options[3]}`);
    if (correctAnswer) system.push(`Correct Answer: ${correctAnswer}`);
    if (explanation) system.push(`Official Explanation: ${explanation}`);
    if (studentAnswer) system.push(`Student's Answer: ${studentAnswer} ${isIncorrect ? '(INCORRECT)' : '(CORRECT)'}`);
    
    system.push('');
    system.push(`Rules:
1. DO NOT just give the answer right away unless they explicitly demand it or it's 'eli5'.
2. Use the Socratic method—guide them to the answer.
3. If they got it wrong, gently explain why their choice was incorrect without making them feel stupid.
4. Keep responses concise (under 3-4 short paragraphs). Use Markdown formatting (bold, bullet points) for readability.
5. If promptType='amharic', explain entirely in easy-to-understand Amharic.`);
  }

  const userPrompts: Record<string, string> = {
    hint: 'Give me a small hint to help me solve this.',
    eli5: 'Explain the core concept behind this simply, like I am 5 years old.',
    amharic: 'Translate the main idea and explain it in Amharic.',
    chat: 'Hello! I need help with this.'
  };

  return { 
    system: system.join('\n'), 
    defaultUserPrompt: userPrompts[data.promptType] || userPrompts.chat 
  };
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ip = req.ip || req.headers.get('x-forwarded-for') || session.telegram_id || 'unknown';
    const rateLimitInfo = checkRateLimit(ip, 10, 60000);
    
    if (!rateLimitInfo.allowed) {
      return new Response(JSON.stringify({ error: 'Too many AI requests. Please wait a minute.' }), { status: 429 });
    }

    const body = await req.json();
    const result = RequestSchema.safeParse(body);
    
    if (!result.success) {
      return new Response(JSON.stringify({ error: 'Invalid request data', details: result.error.issues }), { status: 400 });
    }

    const payload = result.data;
    const { system, defaultUserPrompt } = buildPrompt(payload);

    const finalMessages = payload.chatHistory && payload.chatHistory.length > 0 
      ? payload.chatHistory 
      : [{ role: 'user' as const, content: defaultUserPrompt }];

    let attempt = 0;
    const maxRetries = Math.min(3, getKeyCount());

    while (attempt < maxRetries) {
      const geminiKey = getNextGeminiKey();
      if (!geminiKey) {
        return new Response(JSON.stringify({ error: 'No API keys available.' }), { status: 503 });
      }

      try {
        const google = createGoogleGenerativeAI({ apiKey: geminiKey });
        const model = google('gemini-3.6-flash');

        const stream = await streamText({
          model,
          system,
          messages: finalMessages,
          temperature: 0.5,
        });

        return stream.toTextStreamResponse();
      } catch (err: unknown) {
        if ((err as Error)?.message?.includes('429') || (err as Error)?.message?.includes('quota') || (err as Error)?.message?.includes('404')) {
          markKeyRateLimited(geminiKey);
          attempt++;
          continue; 
        }
        throw err;
      }
    }

    return new Response(JSON.stringify({ error: 'All API keys are currently rate-limited. Try again in a minute.' }), { status: 429 });

  } catch (err: unknown) {
    console.error('[AITutor POST] Error:', (err as Error).message);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}

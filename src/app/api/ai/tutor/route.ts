export const runtime = 'edge';
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
  promptType:    z.enum(['hint', 'explain', 'eli5', 'amharic', 'chat']).default('chat'),
  subject:       z.string().optional(),
  studentAnswer: z.string().nullable().optional(),
  chatHistory:   z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string()
  })).optional(),
});

function buildPrompt(data: z.infer<typeof RequestSchema>, profileContext: string): { system: string; defaultUserPrompt: string } {
  const { mode, noteText, questionText, options, correctAnswer, explanation, subject, studentAnswer } = data;

  const system = [
    `You are Temari AI, an elite AI tutor for Ethiopian students.`,
    subject ? `(Subject: ${subject}).` : '',
    profileContext,
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

import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimitKey = `tutor:${session.telegram_id}`;
    const rateLimitInfo = checkRateLimit(rateLimitKey, 15, 60000);
    
    if (!rateLimitInfo.allowed) {
      return new Response(JSON.stringify({ error: 'Too many AI requests. Please slow down a moment.' }), { status: 429 });
    }

    const body = await req.json();
    const result = RequestSchema.safeParse(body);
    
    if (!result.success) {
      return new Response(JSON.stringify({ error: 'Invalid request data', details: result.error.issues }), { status: 400 });
    }

    const payload = result.data;
    const isFollowUpChat = payload.chatHistory && payload.chatHistory.length > 0;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    // 1. INDIVIDUAL QUOTA & SUBSCRIPTION ENGINE
    let profileContext = '';
    let currentUsage = 0;
    let isPremium = false;
    let quotaLimit = 5; // Default free tier allowance: 5 questions/week

    try {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('target_exam, stream, subscription_status, ai_weekly_usage, ai_quota_reset_at')
        .eq('telegram_id', session.telegram_id)
        .maybeSingle();

      if (!profile) {
        return new Response(JSON.stringify({ error: 'Profile not found' }), { status: 404 });
      }

      isPremium = profile.subscription_status === 'premium';
      quotaLimit = isPremium ? 150 : 5;

      // Check weekly reset (if reset_at is null or passed, reset usage to 0 and set 7-day rolling window)
      const now = new Date();
      const resetAt = profile.ai_quota_reset_at ? new Date(profile.ai_quota_reset_at) : null;

      if (!resetAt || now >= resetAt) {
        const nextReset = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        currentUsage = 0;
        await supabaseAdmin
          .from('profiles')
          .update({
            ai_weekly_usage: 0,
            ai_quota_reset_at: nextReset.toISOString(),
          })
          .eq('telegram_id', session.telegram_id);
      } else {
        currentUsage = profile.ai_weekly_usage || 0;
      }

      // Check if user reached their weekly limit
      if (currentUsage >= quotaLimit) {
        return new Response(
          JSON.stringify({
            error: 'quota_exceeded',
            isPremium,
            usage: currentUsage,
            limit: quotaLimit,
            message: isPremium
              ? `You have reached your weekly allowance of ${quotaLimit} Temari AI inquiries. Your quota refreshes soon!`
              : `You've used all ${quotaLimit} of your free Temari AI questions this week. Upgrade to Premium for 150 inquiries/week!`
          }),
          { status: 403 }
        );
      }

      if (profile.target_exam === 'entrance') profileContext = `Student Profile: Grade 12 (${profile.stream} track)`;
      else if (profile.target_exam === 'freshman') profileContext = `Student Profile: University Freshman (${profile.stream} track)`;
      else if (profile.target_exam === 'exit') profileContext = `Student Profile: University Exit Exam (${profile.stream} department)`;
    } catch (e) {
      console.error('[AI Profile Error]', e);
    }

    if (payload.questionId && !isFollowUpChat) {
      try {
        const { data: cached } = await supabaseAdmin
          .from('ai_cache')
          .select('response')
          .eq('question_id', payload.questionId)
          .eq('prompt_type', payload.promptType)
          .maybeSingle();

        if (cached?.response) {
          // Increment weekly quota usage even on cache hit
          try {
            await supabaseAdmin
              .from('profiles')
              .update({
                ai_weekly_usage: currentUsage + 1,
                updated_at: new Date().toISOString()
              })
              .eq('telegram_id', session.telegram_id);
          } catch (quotaErr) {
            console.error('[AI Cache Quota Update Error]', quotaErr);
          }

          // Cache Hit! Return instantly.
          return new Response(cached.response, { 
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          });
        }
      } catch (cacheErr) {
        // Silently ignore cache read errors
        console.error('[AI Cache Read Error]', cacheErr);
      }
    }

    const { system, defaultUserPrompt } = buildPrompt(payload, profileContext);

    const finalMessages = isFollowUpChat 
      ? payload.chatHistory! 
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
          onFinish: async ({ text }) => {
            // Increment weekly quota usage
            try {
              await supabaseAdmin
                .from('profiles')
                .update({
                  ai_weekly_usage: currentUsage + 1,
                  updated_at: new Date().toISOString()
                })
                .eq('telegram_id', session.telegram_id);
            } catch (quotaErr) {
              console.error('[AI Quota Increment Error]', quotaErr);
            }

            // 2. CACHE POPULATION: Save the generated response for the next student
            if (payload.questionId && !isFollowUpChat) {
              await supabaseAdmin.from('ai_cache').insert({
                question_id: payload.questionId,
                prompt_type: payload.promptType,
                response: text
              });
            }
          }
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

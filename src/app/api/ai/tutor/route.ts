export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/session';
import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { z } from 'zod';
import { getNextGeminiKey, markKeyRateLimited, getKeyCount } from '@/lib/geminiKeyRotation';
import { checkRateLimit } from '@/lib/rateLimiter';
import { getCachedAIResponse, setCachedAIResponse } from '@/lib/redis';



const RequestSchema = z.object({
  mode:            z.enum(['exam', 'notes']).default('exam'),
  noteText:        z.string().max(50000).optional(),
  selectedExcerpt: z.string().max(4000).optional(),
  questionId:      z.string().optional(),
  questionText:    z.string().max(2000).optional(),
  options:         z.array(z.string().nullable()).max(4).optional(),
  correctAnswer:   z.string().nullable().optional(),
  explanation:     z.string().nullable().optional(),
  imageUrl:        z.string().optional(),
  isSimulator:     z.boolean().optional(),
  promptType:      z.enum(['explain', 'eli5', 'amharic', 'summary', 'chat']).default('chat'),
  subject:         z.string().optional(),
  studentAnswer:   z.string().nullable().optional(),
  chatHistory:     z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().max(4000)
  })).max(20).optional(),
});

function buildPrompt(data: z.infer<typeof RequestSchema>, profileContext: string): { system: string; defaultUserPrompt: string } {
  const { mode, noteText, selectedExcerpt, questionText, options, correctAnswer, explanation, imageUrl, isSimulator, subject, studentAnswer } = data;

  const system = [
    `You are Temari AI, an elite AI tutor for Ethiopian students.`,
    subject ? `(Subject: ${subject}).` : '',
    profileContext,
    ''
  ];

  if (mode === 'notes') {
    system.push(`You are Temari AI, helping an Ethiopian student understand and master their study notes.`);
    if (noteText) {
      system.push(`Study Note Content (Current Chapter):`);
      system.push(`"""\n${noteText.substring(0, 100000)}\n"""`);
    }
    if (selectedExcerpt) {
      system.push(`\nStudent Focus: The student specifically selected and asked about this excerpt from the note:`);
      system.push(`> "${selectedExcerpt}"`);
      system.push(`Focus directly on unpacking, clarifying, and explaining this excerpt with intuitive examples and formulas, using the chapter context.`);
    }
    system.push(`\nTeaching & Grounding Guidelines:
1. Curriculum Anchor: Use the provided study note as your primary foundation for the topic, terms, and scope the student is studying.
2. Active Expansion: Because study notes are compressed summaries, actively draw upon your general academic knowledge to:
   - Explain the "why" and core intuition behind the concepts.
   - Break down dense formulas and technical terms step-by-step.
   - Provide concrete, relatable real-world examples and analogies.
   - Fill in missing context so the student truly understands rather than just memorizes.
3. Clarity & Format: Keep explanations clear, engaging, and well-structured using Markdown (bold headings, bullet points) and standard LaTeX ($...$ for inline math, $$...$$ for display formulas).
4. Amharic: If promptType='amharic' or requested, translate and explain clearly and naturally in Amharic (አማርኛ).`);
  } else {
    const isIncorrect = studentAnswer && correctAnswer && studentAnswer.trim().toLowerCase() !== correctAnswer.trim().toLowerCase();
    system.push(`Question Context:`);
    system.push(`"${questionText}"`);
    if (options?.length) system.push(`Options: A) ${options[0]}  B) ${options[1]}  C) ${options[2]}  D) ${options[3]}`);
    if (correctAnswer) system.push(`Correct Answer: ${correctAnswer}`);
    if (explanation) system.push(`Official Explanation: ${explanation}`);
    if (studentAnswer) system.push(`Student's Answer: ${studentAnswer} ${isIncorrect ? '(INCORRECT)' : '(CORRECT)'}`);
    
    if (imageUrl) {
      system.push(`\nAccompanying Diagram / Visual Figure:`);
      system.push(`This question includes an associated diagram or figure (${imageUrl}). Refer to this visual context when analyzing equations, options, forces, anatomical structures, or diagrams.`);
    }

    if (isSimulator) {
      system.push(`\nCRITICAL SOCRATIC GUARD (Active Timed Exam Simulation Mode):
- The student is taking an active, timed exam and has NOT yet submitted their final paper.
- You MUST NEVER directly disclose which option is correct (e.g. never say "The answer is B" or "Select C").
- If the student directly asks for the answer, remind them encouragingly that this is simulation mode.
- Guide the student Socratically: explain relevant physics/math/biology laws, formulas, and definitions; point out key terms in the question; and prompt them to apply the formula themselves to reach the answer.`);
    }

    system.push('');
    system.push(`Rules:
1. If promptType='explain', provide the full step-by-step solution clearly explaining why the correct choice is right and others are wrong.
2. If student got it wrong, gently explain why their choice was incorrect without being discouraging.
3. Keep responses concise (under 3-4 short paragraphs). Use Markdown formatting (bold, bullet points) and standard LaTeX ($...$ for inline formulas like $E=mc^2$ and $$...$$ on separate lines for display equations). Never output raw unformatted TeX without delimiters.
4. If promptType='amharic', explain entirely in easy-to-understand Amharic (አማርኛ).`);
  }

  const userPrompts: Record<string, string> = {
    explain: 'Please explain the correct answer step-by-step with clear reasoning.',
    eli5: 'Explain the core concept behind this simply, like I am 5 years old.',
    amharic: 'Translate the main idea and explain it in Amharic.',
    summary: 'Please summarize the 3 most crucial takeaways and exam-focused points from this chapter note.',
    chat: 'Hello! I need help with this.'
  };

  return { 
    system: system.join('\n'), 
    defaultUserPrompt: userPrompts[data.promptType] || userPrompts.chat 
  };
}

import { createAdminClient } from '@/utils/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimitKey = `tutor:${session.telegram_id}`;
    const rateLimitInfo = await checkRateLimit(rateLimitKey, 15, 60000);
    
    if (!rateLimitInfo.allowed) {
      return new Response(JSON.stringify({ error: 'Too many AI requests. Please slow down a moment.' }), { status: 429 });
    }

    const body = await req.json();
    const result = RequestSchema.safeParse(body);
    
    if (!result.success) {
      return new Response(JSON.stringify({ error: 'Invalid request data', details: result.error.issues }), { status: 400 });
    }

    const payload = result.data;
    const rawHistory = payload.chatHistory || [];
    // Ensure chatHistory does not begin with an assistant greeting (Gemini requires starting with 'user')
    const cleanedHistory = rawHistory.filter((msg, idx) => !(idx === 0 && msg.role === 'assistant'));

    const supabaseAdmin = await createAdminClient();

    // 1. INDIVIDUAL QUOTA & SUBSCRIPTION ENGINE (Parallelized with Multi-Tier Cache Check)
    let profileContext = '';
    let currentUsage = 0;
    let isPremium = false;
    let quotaLimit = 5; // Default free tier allowance: 5 questions/week

    const shouldCheckCache = payload.questionId && payload.promptType !== 'chat' && cleanedHistory.length <= 1;

    let profile: any = null;
    let cachedResponseText: string | null = null;

    try {
      // 1. Check L1 Redis Cache first (sub-10ms)
      if (shouldCheckCache) {
        cachedResponseText = await getCachedAIResponse(payload.questionId!, payload.promptType);
      }

      const [profileRes, cacheRes] = await Promise.all([
        supabaseAdmin
          .from('profiles')
          .select('target_exam, stream, subscription_status, ai_weekly_usage, ai_quota_reset_at')
          .eq('telegram_id', session.telegram_id)
          .maybeSingle(),
        shouldCheckCache && !cachedResponseText
          ? supabaseAdmin
              .from('ai_responses_cache')
              .select('response')
              .eq('question_id', payload.questionId)
              .eq('prompt_type', payload.promptType)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
      ]);

      profile = profileRes.data;
      if (!cachedResponseText && cacheRes?.data?.response) {
        const dbCachedText = cacheRes.data.response as string;
        cachedResponseText = dbCachedText;
        // Backfill L1 Redis Cache for subsequent instant hits
        setCachedAIResponse(payload.questionId!, payload.promptType, dbCachedText);
      }
    } catch (e) {
      console.error('[AI Parallel Lookup Error]', e);
    }

    if (!profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), { status: 404 });
    }

    isPremium = profile.subscription_status === 'premium';
    quotaLimit = isPremium ? 150 : 5;
    let atomicQuotaApplied = false;

    // Try atomic RPC increment first to prevent concurrent-tab TOCTOU bypasses (M-03)
    const { data: rpcQuota, error: rpcError } = await supabaseAdmin.rpc('check_and_increment_ai_quota', {
      p_telegram_id: session.telegram_id.toString(),
      p_quota_limit: quotaLimit
    });

    if (!rpcError && rpcQuota) {
      atomicQuotaApplied = true;
      if (!rpcQuota.allowed) {
        return new Response(
          JSON.stringify({
            error: 'quota_exceeded',
            isPremium,
            usage: rpcQuota.usage ?? quotaLimit,
            limit: quotaLimit,
            message: isPremium
              ? `You have reached your weekly allowance of ${quotaLimit} Temari AI inquiries. Your quota refreshes soon!`
              : `You've used all ${quotaLimit} of your free Temari AI questions this week. Upgrade to Premium for 150 inquiries/week!`
          }),
          { status: 403 }
        );
      }
      currentUsage = rpcQuota.usage ?? 0;
    } else {
      // Fallback if RPC is not yet created in the database
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
    }

    if (profile.target_exam === 'entrance') profileContext = `Student Profile: Grade 12 (${profile.stream} track)`;
    else if (profile.target_exam === 'freshman') profileContext = `Student Profile: University Freshman (${profile.stream} track)`;
    else if (profile.target_exam === 'exit') profileContext = `Student Profile: University Exit Exam (${profile.stream} department)`;

    // Check if cache hit (L1 Redis or L2 Supabase)
    if (cachedResponseText) {
      if (!atomicQuotaApplied) {
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
      }

      // Cache Hit! Return instantly.
      return new Response(cachedResponseText, { 
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }

    const { system, defaultUserPrompt } = buildPrompt(payload, profileContext);

    // If student provided chat history (first custom question, quick prompt, or multi-turn), preserve it!
    // Only fall back to defaultUserPrompt if cleanedHistory is completely empty.
    const finalMessages = cleanedHistory.length > 0
      ? cleanedHistory 
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
        const model = google('gemini-1.5-flash');

        const stream = await streamText({
          model,
          system,
          messages: finalMessages,
          temperature: 0.5,
          onFinish: async ({ text }) => {
            // Increment weekly quota usage if atomic RPC wasn't applied
            if (!atomicQuotaApplied) {
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
            }

            // 2. CACHE POPULATION: Save standard static responses (explain, eli5, amharic) for next students
            if (payload.questionId && payload.promptType !== 'chat' && cleanedHistory.length <= 1) {
              setCachedAIResponse(payload.questionId, payload.promptType, text);
              await supabaseAdmin.from('ai_responses_cache').upsert(
                {
                  question_id: payload.questionId,
                  prompt_type: payload.promptType,
                  response: text,
                },
                { onConflict: 'question_id,prompt_type', ignoreDuplicates: true }
              );
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

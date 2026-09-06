import { NextRequest } from 'next/server';
import { streamText } from 'ai';
import { google } from '@ai-sdk/google';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { questionText, options, correctAnswer, explanation, promptType, messages } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // Graceful fallback if GEMINI_API_KEY is not configured yet
      const fallbackResponses: Record<string, string> = {
        hint: `💡 **Tutor Hint:** Consider the fundamental relation between the given variables. What happens to the system when one parameter is doubled? Focus on applying the relevant conservation law.`,
        eli5: `🐣 **ELI5 (Simple Analogy):** Imagine you are pushing a cart. The harder you push, the faster it goes, but friction pushes back. That's exactly what is happening in this scenario!`,
        amharic: `🇪🇹 **በአማርኛ ማብራሪያ:** ይህ ጥያቄ የሚያተኩረው በመሰረታዊ ህግ ላይ ነው። የተሰጡትን ነጥቦች በማስተዋል ቀላሉን ቀመር ተጠቅመው መልሱን ማግኘት ይችላሉ። ትክክለኛው አማራጭ ${correctAnswer || 'C'} የሆነበት ምክንያት በግልጽ ተቀምጧል።`
      };

      const reply = fallbackResponses[promptType] || `Here is a guided explanation: The question asks "${questionText}". The official answer is ${correctAnswer}. ${explanation || 'Review the core concepts.'}`;

      return new Response(reply, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }

    const systemInstruction = `You are an expert, encouraging tutor for Ethiopian students preparing for National Entrance Exams (EUEE) and University exams.
Question: "${questionText}"
Options: ${JSON.stringify(options)}
Correct Answer: ${correctAnswer}
Official Explanation: "${explanation || 'Not provided'}"

Instructions:
- If promptType is 'hint': Give a concise, conceptual nudge without giving away the final answer.
- If promptType is 'eli5': Explain like I'm 5 using everyday simple analogies.
- If promptType is 'amharic': Explain clearly in natural Amharic.
- Always be encouraging and pedagogically sound.`;

    const userPrompt = promptType === 'hint'
      ? 'Give me a hint for this question.'
      : promptType === 'eli5'
      ? 'Explain this question like I am 5 years old.'
      : promptType === 'amharic'
      ? 'ይህን ጥያቄ በአማርኛ አብራራልኝ።'
      : messages?.[messages.length - 1]?.content || 'Explain this question.';

    const result = streamText({
      model: google('gemini-2.0-flash'),
      system: systemInstruction,
      prompt: userPrompt,
    });

    return result.toTextStreamResponse();
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

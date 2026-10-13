/**
 * @jest-environment node
 */
import { POST } from '@/app/api/ai/tutor/route';
import { NextRequest } from 'next/server';
import { getServerSession } from '@/lib/session';

jest.mock('@/lib/session', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/rateLimiter', () => ({
  checkRateLimit: jest.fn().mockResolvedValue({ allowed: true, remaining: 10, resetInMs: 60000 }),
}));

jest.mock('@/lib/redis', () => ({
  getCachedAIResponse: jest.fn().mockResolvedValue(null),
  setCachedAIResponse: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/telegramBot', () => ({
  sendQuotaExhaustionNudge: jest.fn().mockResolvedValue(true),
}));

jest.mock('@/lib/geminiKeyRotation', () => ({
  getNextGeminiKey: jest.fn().mockReturnValue('mock-gemini-key'),
  markKeyRateLimited: jest.fn(),
  getKeyCount: jest.fn().mockReturnValue(1),
}));

const mockStreamTextResponse = new Response('AI response text chunk', {
  headers: { 'Content-Type': 'text/plain; charset=utf-8' },
});

jest.mock('ai', () => ({
  streamText: jest.fn().mockResolvedValue({
    toTextStreamResponse: jest.fn(() => mockStreamTextResponse),
  }),
}));

jest.mock('@ai-sdk/google', () => ({
  createGoogleGenerativeAI: jest.fn(() => jest.fn(() => ({}))),
}));

let mockProfile = {
  target_exam: 'freshman',
  stream: 'Natural',
  subscription_status: 'free',
  ai_weekly_usage: 0,
  ai_quota_reset_at: new Date(Date.now() + 86400000).toISOString(),
  username: 'student1',
  full_name: 'Test Student',
};

let mockRpcResult = {
  data: { allowed: true, usage: 1, limit: 5, is_premium: false },
  error: null,
};

jest.mock('@/utils/supabase/admin', () => ({
  createAdminClient: jest.fn(() => ({
    from: jest.fn((table: string) => {
      if (table === 'profiles') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              maybeSingle: jest.fn().mockResolvedValue({ data: mockProfile, error: null }),
            })),
          })),
          upsert: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({ data: mockProfile, error: null }),
            })),
          })),
          update: jest.fn(() => ({
            eq: jest.fn().mockResolvedValue({ data: null, error: null }),
          })),
        };
      }
      if (table === 'admin_users') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              ilike: jest.fn(() => ({
                maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
              })),
            })),
            ilike: jest.fn(() => ({
              maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
            })),
          })),
        };
      }
      if (table === 'ai_responses_cache') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
              })),
            })),
          })),
          upsert: jest.fn().mockResolvedValue({ error: null }),
        };
      }
      return {};
    }),
    rpc: jest.fn(() => Promise.resolve(mockRpcResult)),
  })),
}));

describe('POST /api/ai/tutor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRpcResult = {
      data: { allowed: true, usage: 1, limit: 5, is_premium: false },
      error: null,
    };
  });

  it('rejects unauthorized requests with 401', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/ai/tutor', {
      method: 'POST',
      body: JSON.stringify({ promptType: 'chat' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('rejects invalid json payload with 400', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce({ telegram_id: '12345' });
    const req = new NextRequest('http://localhost:3000/api/ai/tutor', {
      method: 'POST',
      body: JSON.stringify({ mode: 'invalid_mode_unknown' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('accepts long chapter notes up to 250,000 characters without 400 validation error', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce({ telegram_id: '12345' });
    const longNoteText = 'A'.repeat(80000); // 80k chars (would fail previous 50k limit)
    const req = new NextRequest('http://localhost:3000/api/ai/tutor', {
      method: 'POST',
      body: JSON.stringify({
        mode: 'notes',
        promptType: 'chat',
        noteText: longNoteText,
        chatHistory: [{ role: 'user', content: 'Explain this chapter.' }],
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it('enforces 403 when weekly quota is exhausted', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce({ telegram_id: '12345' });
    mockRpcResult = {
      data: { allowed: false, usage: 5, limit: 5, is_premium: false },
      error: null,
    };
    const req = new NextRequest('http://localhost:3000/api/ai/tutor', {
      method: 'POST',
      body: JSON.stringify({
        mode: 'exam',
        promptType: 'explain',
        questionText: 'What is force?',
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe('quota_exceeded');
  });

  it('returns stream response 200 for allowed student request', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce({ telegram_id: '12345' });
    const req = new NextRequest('http://localhost:3000/api/ai/tutor', {
      method: 'POST',
      body: JSON.stringify({
        mode: 'exam',
        promptType: 'chat',
        questionText: 'What is energy?',
        chatHistory: [{ role: 'user', content: 'Explain energy.' }],
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });
});

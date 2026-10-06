/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/auth/oidc/route';

jest.mock('@/lib/rateLimiter', () => ({
  checkRateLimit: jest.fn().mockResolvedValue({ allowed: true, remaining: 10, resetInMs: 60000 }),
}));

jest.mock('@/lib/session', () => ({
  encryptSession: jest.fn().mockResolvedValue('mock-encrypted-session-token'),
  getSessionCookieOptions: jest.fn().mockReturnValue({
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 86400,
  }),
}));

const mockUpsert = jest.fn();
const mockSelect = jest.fn();
const mockMaybeSingle = jest.fn();

jest.mock('@/utils/supabase/admin', () => ({
  createAdminClient: jest.fn().mockImplementation(() => Promise.resolve({
    from: jest.fn().mockReturnValue({
      upsert: mockUpsert.mockReturnValue({
        select: mockSelect.mockReturnValue({
          maybeSingle: mockMaybeSingle,
        }),
      }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      }),
    }),
  })),
}));

describe('POST /api/auth/oidc', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.TELEGRAM_BOT_TOKEN = '123456:ABC-DEF-token';
    process.env.TELEGRAM_CLIENT_ID = '123456';
    process.env.TELEGRAM_CLIENT_SECRET = 'secret';
  });

  it('returns 400 if required parameters are missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/oidc', {
      method: 'POST',
      body: JSON.stringify({ code: 'abc' }), // missing code_verifier
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Missing required parameters or credentials');
  });

  it('handles token exchange failure gracefully', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'invalid_grant' }),
    });

    const req = new NextRequest('http://localhost:3000/api/auth/oidc', {
      method: 'POST',
      body: JSON.stringify({ code: 'bad_code', code_verifier: 'verifier' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Failed to verify authorization code');
  });

  it('retries upsert without phone_number if Supabase schema lacks phone_number column', async () => {
    const mockIdToken = [
      Buffer.from(JSON.stringify({ alg: 'none' })).toString('base64url'),
      Buffer.from(JSON.stringify({
        sub: '77665544',
        name: 'Abebe Kebede',
        phone_number: '+251911223344',
      })).toString('base64url'),
      'sig',
    ].join('.');

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id_token: mockIdToken }),
    });

    // 1st upsert fails with PGRST204 (column missing)
    // 2nd upsert succeeds
    mockMaybeSingle
      .mockResolvedValueOnce({
        error: { code: 'PGRST204', message: "Could not find the 'phone_number' column of 'profiles' in the schema cache" },
        data: null,
      })
      .mockResolvedValueOnce({
        error: null,
        data: { telegram_id: '77665544', target_exam: null, stream: null },
      });

    const req = new NextRequest('http://localhost:3000/api/auth/oidc', {
      method: 'POST',
      body: JSON.stringify({
        code: 'valid_code',
        code_verifier: 'valid_verifier',
        targetExam: 'entrance',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);

    // Verify upsert was called twice: first with phone_number, second without
    expect(mockUpsert).toHaveBeenCalledTimes(2);
    expect(mockUpsert.mock.calls[0][0].phone_number).toBe('+251911223344');
    expect(mockUpsert.mock.calls[1][0].phone_number).toBeUndefined();
  });
});

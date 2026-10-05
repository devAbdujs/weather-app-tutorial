/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/cron/streak-reminder/route';
import * as telegramBot from '@/lib/telegramBot';
import { getAddisAbabaDate } from '@/lib/streak';

jest.mock('@/lib/telegramBot', () => ({
  sendTelegramMessage: jest.fn(),
  escapeTelegramHtml: (str: string) => str,
}));

const mockSelect = jest.fn();
const mockGt = jest.fn();
const mockEq = jest.fn();
const mockNot = jest.fn();
const mockLimit = jest.fn();

jest.mock('@/utils/supabase/admin', () => ({
  createAdminClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: mockSelect,
    })),
  })),
}));

describe('GET /api/cron/streak-reminder', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };

    mockSelect.mockReturnValue({ gt: mockGt });
    mockGt.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ not: mockNot });
    mockNot.mockReturnValue({ limit: mockLimit });
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('rejects unauthorized requests when CRON_SECRET is set', async () => {
    process.env.CRON_SECRET = 'secret123';

    const req = new NextRequest('http://localhost:3000/api/cron/streak-reminder', {
      headers: { authorization: 'Bearer wrong-secret' },
    });

    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('queries at-risk streaks and notifies users via Telegram', async () => {
    process.env.CRON_SECRET = 'secret123';

    const now = new Date();
    const yesterdayEAT = getAddisAbabaDate(new Date(now.getTime() - 24 * 60 * 60 * 1000));

    mockLimit.mockResolvedValueOnce({
      data: [
        {
          telegram_id: '12345',
          full_name: 'Abebe Bikila',
          daily_streak: 5,
          last_activity_date: yesterdayEAT,
        },
      ],
      error: null,
    });

    (telegramBot.sendTelegramMessage as jest.Mock).mockResolvedValueOnce(true);

    const req = new NextRequest('http://localhost:3000/api/cron/streak-reminder', {
      headers: { authorization: 'Bearer secret123' },
    });

    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.found).toBe(1);
    expect(body.notified).toBe(1);

    expect(telegramBot.sendTelegramMessage).toHaveBeenCalledWith(
      '12345',
      expect.stringContaining('5-Day Streak'),
      expect.objectContaining({
        inline_keyboard: expect.any(Array),
      })
    );
  });

  it('returns notified: 0 when no users are at risk', async () => {
    mockLimit.mockResolvedValueOnce({
      data: [],
      error: null,
    });

    const req = new NextRequest('http://localhost:3000/api/cron/streak-reminder');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.notified).toBe(0);
    expect(telegramBot.sendTelegramMessage).not.toHaveBeenCalled();
  });
});

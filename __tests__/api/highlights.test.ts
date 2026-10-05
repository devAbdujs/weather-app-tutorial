/**
 * @jest-environment node
 */
import { POST } from '@/app/api/highlights/route';
import { NextRequest } from 'next/server';
import { getServerSession } from '@/lib/session';

jest.mock('@/lib/session', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/utils/supabase/admin', () => ({
  createAdminClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: { id: 'hl-1', subject: 'Biology', chapter_title: 'Cell', created_at: '2026-10-05T00:00:00Z' },
            error: null,
          }),
        })),
      })),
    })),
  })),
}));

describe('POST /api/highlights', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects unauthorized requests with 401', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/highlights', {
      method: 'POST',
      body: JSON.stringify({ text: 'Some note' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('rejects empty text with 400', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce({ telegram_id: 12345 });
    const req = new NextRequest('http://localhost:3000/api/highlights', {
      method: 'POST',
      body: JSON.stringify({ text: '' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Missing text content');
  });

  it('rejects text exceeding 2000 characters with 400', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce({ telegram_id: 12345 });
    const longText = 'a'.repeat(2001);
    const req = new NextRequest('http://localhost:3000/api/highlights', {
      method: 'POST',
      body: JSON.stringify({ text: longText }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Highlight text cannot exceed 2000 characters');
  });

  it('accepts valid text up to 2000 characters with 200', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce({ telegram_id: 12345 });
    const validText = 'a'.repeat(2000);
    const req = new NextRequest('http://localhost:3000/api/highlights', {
      method: 'POST',
      body: JSON.stringify({ text: validText, subject: 'Biology', chapter_title: 'Cell' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.highlight.text).toBe(validText);
  });
});

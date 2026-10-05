/**
 * @jest-environment node
 */
import { GET } from '@/app/api/notes/content/route';
import { NextRequest } from 'next/server';
import { getServerSession } from '@/lib/session';

jest.mock('@/lib/session', () => ({
  getServerSession: jest.fn(),
}));

const mockSingleNote = {
  id: 'note-123',
  content: 'Paragraph 1: Introduction to Mechanics and Kinematics.\n\nParagraph 2: Advanced derivation of motion equations.',
};

let mockProfileSubscription = 'free';

jest.mock('@/utils/supabase/admin', () => ({
  createAdminClient: jest.fn(() => ({
    from: jest.fn((table: string) => {
      if (table === 'study_notes') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              maybeSingle: jest.fn().mockResolvedValue({
                data: mockSingleNote,
                error: null,
              }),
            })),
          })),
        };
      }
      if (table === 'profiles') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              maybeSingle: jest.fn().mockResolvedValue({
                data: { subscription_status: mockProfileSubscription },
                error: null,
              }),
            })),
          })),
        };
      }
      return {};
    }),
  })),
}));

describe('GET /api/notes/content', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects unauthorized requests with 401', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/notes/content?id=note-123');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 if note id is missing', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce({ telegram_id: 999 });
    const req = new NextRequest('http://localhost:3000/api/notes/content');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('returns locked teaser with 403 for free users', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce({ telegram_id: 999 });
    mockProfileSubscription = 'free';

    const req = new NextRequest('http://localhost:3000/api/notes/content?id=note-123');
    const res = await GET(req);
    expect(res.status).toBe(403);

    const json = await res.json();
    expect(json.is_locked).toBe(true);
    expect(json.content).toContain('Paragraph 1: Introduction to Mechanics and Kinematics.');
    expect(json.content).not.toContain('Paragraph 2: Advanced derivation');
  });

  it('returns full content with 200 for premium users', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce({ telegram_id: 999 });
    mockProfileSubscription = 'premium';

    const req = new NextRequest('http://localhost:3000/api/notes/content?id=note-123');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.is_locked).toBe(false);
    expect(json.content).toBe(mockSingleNote.content);
  });
});

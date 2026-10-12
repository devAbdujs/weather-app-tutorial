/**
 * @jest-environment node
 */
import { GET, POST } from '@/app/api/admin/notes/route';
import { safeParseAiNote } from '@/app/api/admin/notes/transform/route';
import { NextRequest } from 'next/server';
import { verifyAdmin } from '@/app/actions/admin';
import { hasPermission } from '@/lib/adminPermissions';

jest.mock('@/app/actions/admin', () => ({
  verifyAdmin: jest.fn(),
}));

jest.mock('@/lib/adminPermissions', () => ({
  hasPermission: jest.fn(),
}));

const mockNotes = [
  { id: 'n2', title: 'Chapter 2: Theory of Demand and Supply', content: 'Word one word two word three' },
  { id: 'n1', title: 'Chapter 1: Basics of Economics', content: 'Intro text here' },
  { id: 'n10', title: 'Chapter 10: Advanced Topics', content: 'Ten words long content' },
];

let mockDbSelectResult: any = mockNotes;

jest.mock('@/utils/supabase/admin', () => ({
  createAdminClient: jest.fn(() => ({
    from: jest.fn((table: string) => {
      if (table === 'study_notes') {
        const chain: any = {
          select: jest.fn(() => chain),
          eq: jest.fn(() => chain),
          ilike: jest.fn(() => chain),
          order: jest.fn(() => Promise.resolve({ data: mockDbSelectResult, error: null })),
          insert: jest.fn(() => Promise.resolve({ error: null })),
          update: jest.fn(() => chain),
          maybeSingle: jest.fn(() => Promise.resolve({ data: null, error: null })),
        };
        return chain;
      }
      return {};
    }),
  })),
}));

describe('Admin Notes API (/api/admin/notes)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDbSelectResult = mockNotes;
    (verifyAdmin as jest.Mock).mockResolvedValue({ id: 'admin-1', role: 'superadmin' });
    (hasPermission as jest.Mock).mockReturnValue(true);
  });

  describe('GET /api/admin/notes', () => {
    it('returns 401 when unauthorized', async () => {
      (verifyAdmin as jest.Mock).mockResolvedValueOnce(null);
      const req = new NextRequest('http://localhost:3000/api/admin/notes?examType=freshman&department=Economics');
      const res = await GET(req);
      expect(res.status).toBe(401);
    });

    it('returns 400 when missing examType or department', async () => {
      const req = new NextRequest('http://localhost:3000/api/admin/notes?examType=freshman');
      const res = await GET(req);
      expect(res.status).toBe(400);
    });

    it('returns notes inventory sorted naturally by chapter number', async () => {
      const req = new NextRequest('http://localhost:3000/api/admin/notes?examType=freshman&department=Economics');
      const res = await GET(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.notes).toHaveLength(3);
      // Chapter 1 should come before Chapter 2, and Chapter 2 before Chapter 10
      expect(data.notes[0].title).toBe('Chapter 1: Basics of Economics');
      expect(data.notes[0].wordCount).toBe(3);
      expect(data.notes[1].title).toBe('Chapter 2: Theory of Demand and Supply');
      expect(data.notes[1].wordCount).toBe(6);
      expect(data.notes[2].title).toBe('Chapter 10: Advanced Topics');
    });
  });

  describe('POST /api/admin/notes', () => {
    it('returns 403 when lacking notes:write permission', async () => {
      (hasPermission as jest.Mock).mockReturnValueOnce(false);
      const req = new NextRequest('http://localhost:3000/api/admin/notes', {
        method: 'POST',
        body: JSON.stringify({
          examType: 'freshman',
          department: 'Economics',
          title: 'Chapter 1: Basics',
          content: 'Content here',
        }),
      });
      const res = await POST(req);
      expect(res.status).toBe(403);
    });

    it('saves a single note successfully', async () => {
      const req = new NextRequest('http://localhost:3000/api/admin/notes', {
        method: 'POST',
        body: JSON.stringify({
          examType: 'freshman',
          department: 'Economics',
          title: 'Chapter 1: Basics',
          content: 'Content here',
        }),
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.count).toBe(1);
    });
  });

  describe('safeParseAiNote', () => {
    it('parses valid JSON response with title and content', () => {
      const raw = '{\n  "title": "Chapter 1: Introduction",\n  "content": "## Basics\\nSome notes here."\n}';
      const parsed = safeParseAiNote(raw, 'Default Title');
      expect(parsed.title).toBe('Chapter 1: Introduction');
      expect(parsed.content).toBe('## Basics\nSome notes here.');
    });

    it('strips markdown code block fences wrapping JSON', () => {
      const raw = '```json\n{\n  "title": "Chapter 2: Logic",\n  "content": "Content"\n}\n```';
      const parsed = safeParseAiNote(raw, 'Default Title');
      expect(parsed.title).toBe('Chapter 2: Logic');
      expect(parsed.content).toBe('Content');
    });

    it('recovers from unescaped solitary LaTeX backslashes', () => {
      // In raw string from Gemini, solitary backslashes like \sqrt, \alpha make standard JSON.parse throw
      const raw = '{"title": "Chapter 3: Math", "content": "Formula is \\sqrt{x} and \\alpha + \\beta."}';
      const parsed = safeParseAiNote(raw, 'Default Title');
      expect(parsed.title).toBe('Chapter 3: Math');
      expect(parsed.content).toContain('sqrt{x}');
    });

    it('recovers from literal raw newlines inside content string', () => {
      const raw = '{"title": "Chapter 4: Vectors", "content": "Line 1\nLine 2\nLine 3"}';
      const parsed = safeParseAiNote(raw, 'Default Title');
      expect(parsed.title).toBe('Chapter 4: Vectors');
      expect(parsed.content).toContain('Line 1');
      expect(parsed.content).toContain('Line 3');
    });

    it('falls back to raw markdown when response is non-JSON', () => {
      const raw = '# Chapter 5: General Chemistry\n\n## Atoms and Molecules\nNotes here.';
      const parsed = safeParseAiNote(raw, 'Default Title');
      expect(parsed.title).toBe('Chapter 5: General Chemistry');
      expect(parsed.content).toContain('## Atoms and Molecules');
    });
  });
});

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/session';
import { createAdminClient } from '@/utils/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/notes/content?id=<note_uuid>
 *
 * Fetches the full markdown content of a single study note by ID.
 * Used by StudyNotesView for lazy on-demand loading after SSR sends only
 * note metadata (id, title, department) — keeping the initial page payload light.
 *
 * Authentication: requires a valid es_session cookie (standard user session).
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const noteId = req.nextUrl.searchParams.get('id');
    if (!noteId) {
      return NextResponse.json({ error: 'Missing note id' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const [{ data: note, error: noteError }, { data: profile }] = await Promise.all([
      supabase
        .from('study_notes')
        .select('id, content')
        .eq('id', noteId)
        .maybeSingle(),
      supabase
        .from('profiles')
        .select('subscription_status')
        .eq('telegram_id', session.telegram_id)
        .maybeSingle(),
    ]);

    if (noteError || !note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    const isPremium = profile?.subscription_status === 'premium';
    if (!isPremium) {
      const fullText = note.content ?? '';
      const paragraphs = fullText.split(/\n\n+/).filter(Boolean);
      const excerpt = paragraphs.length > 0
        ? paragraphs[0].slice(0, 350) + (paragraphs[0].length > 350 ? '...' : '')
        : 'Summary notes are locked behind Temari Premium.';

      return NextResponse.json(
        {
          content: excerpt,
          is_locked: true,
          message: 'Premium subscription required to access complete study notes and chapter quizzes.',
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { content: note.content ?? '', is_locked: false },
      {
        headers: {
          // Cache in client browser for 1 hour; private ensures CDN/proxies don't leak authenticated data
          'Cache-Control': 'private, max-age=3600, stale-while-revalidate=86400',
        },
      }
    );
  } catch (err) {
    console.error('[Notes Content Error]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

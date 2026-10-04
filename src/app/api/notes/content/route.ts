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
    const { data: note, error } = await supabase
      .from('study_notes')
      .select('id, content')
      .eq('id', noteId)
      .maybeSingle();

    if (error || !note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    return NextResponse.json(
      { content: note.content ?? '' },
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

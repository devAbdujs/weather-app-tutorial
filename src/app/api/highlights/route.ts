import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient as createClient } from '@/utils/supabase/admin';
import { getServerSession } from '@/lib/session';

const createHighlightSchema = z.object({
  subject: z.string().trim().max(100).optional().default('General'),
  chapter_title: z.string().trim().max(200).optional().default('General'),
  text: z.string().trim().min(1, 'Missing text content').max(2000, 'Highlight text cannot exceed 2000 characters'),
  color: z.string().trim().max(30).optional().default('yellow'),
});

const patchHighlightSchema = z.object({
  id: z.union([z.string(), z.number()]),
  text: z.string().trim().max(2000, 'Highlight text cannot exceed 2000 characters').optional(),
  color: z.string().trim().max(30),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const subject = searchParams.get('subject');
    const chapterTitle = searchParams.get('chapter_title');

    const supabase = await createClient();
    let query = supabase
      .from('user_pins')
      .select('*')
      .eq('telegram_id', session.telegram_id)
      .order('created_at', { ascending: true });

    if (subject && subject !== 'All') {
      query = query.eq('subject', subject);
    }
    if (chapterTitle) {
      query = query.eq('chapter_title', chapterTitle);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('Highlights query error:', error.message);
      return NextResponse.json({ highlights: [] });
    }

    const highlights = (data || []).map((row: any) => {
      let text = row.content;
      let color = 'yellow';
      try {
        if (row.content && typeof row.content === 'string' && row.content.startsWith('{')) {
          const parsed = JSON.parse(row.content);
          if (parsed.text) text = parsed.text;
          if (parsed.color) color = parsed.color;
        }
      } catch {
        // Fall back to plain string content
      }
      return {
        id: row.id,
        subject: row.subject,
        chapter_title: row.chapter_title,
        text,
        color,
        created_at: row.created_at,
      };
    });

    return NextResponse.json({ highlights });
  } catch (err: unknown) {
    console.error('Error fetching highlights:', (err as Error).message);
    return NextResponse.json({ highlights: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const rawBody = await req.json().catch(() => ({}));
    const parseResult = createHighlightSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0]?.message || 'Invalid highlight data' },
        { status: 400 }
      );
    }

    const { subject, chapter_title, text, color } = parseResult.data;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('user_pins')
      .insert([
        {
          telegram_id: session.telegram_id,
          subject,
          chapter_title,
          content: JSON.stringify({ text, color }),
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      highlight: {
        id: data.id,
        subject: data.subject,
        chapter_title: data.chapter_title,
        text,
        color,
        created_at: data.created_at,
      },
    });
  } catch (err: unknown) {
    console.error('Error saving highlight:', (err as Error).message);
    return NextResponse.json({ error: 'Failed to save highlight' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    let id: any = searchParams.get('id');

    if (!id) {
      const body = await req.json().catch(() => ({}));
      id = body.id;
    }

    if (!id) {
      return NextResponse.json({ error: 'Missing highlight id' }, { status: 400 });
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from('user_pins')
      .delete()
      .match({ id, telegram_id: session.telegram_id });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('Error deleting highlight:', (err as Error).message);
    return NextResponse.json({ error: 'Failed to delete highlight' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const rawBody = await req.json().catch(() => ({}));
    const parseResult = patchHighlightSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0]?.message || 'Invalid patch data' },
        { status: 400 }
      );
    }

    const { id, text, color } = parseResult.data;

    const supabase = await createClient();
    const { error } = await supabase
      .from('user_pins')
      .update({
        content: JSON.stringify({ text, color }),
      })
      .match({ id, telegram_id: session.telegram_id });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('Error updating highlight:', (err as Error).message);
    return NextResponse.json({ error: 'Failed to update highlight' }, { status: 500 });
  }
}

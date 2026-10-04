import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient as createClient } from '@/utils/supabase/admin';
import { getServerSession } from '@/lib/session';

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

    const body = await req.json();
    const { subject, chapter_title, text, color } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Missing text content' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('user_pins')
      .insert([
        {
          telegram_id: session.telegram_id,
          subject: subject || 'General',
          chapter_title: chapter_title || 'General',
          content: JSON.stringify({ text: text.trim(), color: color || 'yellow' }),
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
        text: text.trim(),
        color: color || 'yellow',
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
    let id = searchParams.get('id');

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

    const body = await req.json();
    const { id, text, color } = body;

    if (!id || !color) {
      return NextResponse.json({ error: 'Missing id or color' }, { status: 400 });
    }

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

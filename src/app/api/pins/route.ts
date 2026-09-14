import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getServerSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const { searchParams } = new URL(req.url);
    const subject = searchParams.get('subject');

    const supabase = await createClient();
    
    let query = supabase
      .from('user_pins')
      .select('*')
      .eq('telegram_id', session.telegram_id)
      .order('created_at', { ascending: false });
      
    if (subject && subject !== 'All') {
      query = query.eq('subject', subject);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Error fetching pins:', (error as Error).message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { subject, chapter_title, content } = body;

    if (!content) {
      return NextResponse.json({ error: 'Missing content' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('user_pins')
      .insert([
        { telegram_id: session.telegram_id, subject, chapter_title, content }
      ])
      .select()
      .single();

    if (error) throw error;
    
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Error saving pin:', (error as Error).message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from('user_pins')
      .delete()
      .match({ id, telegram_id: session.telegram_id });

    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error deleting pin:', (error as Error).message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { examType, department, title, content } = await req.json();

    if (!examType || !department || !title || !content) {
      return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    const { error } = await supabase.from('study_notes').insert({
      id: crypto.randomUUID(),
      exam_type: examType,
      department: department,
      title: title,
      content: content
    });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}

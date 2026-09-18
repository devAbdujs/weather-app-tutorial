import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import crypto from 'crypto';
import { verifyAdmin } from '@/app/actions/admin';

export async function POST(req: NextRequest) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { examType, department, title, content } = await req.json();

    if (!examType || !department || !title || !content) {
      return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 });
    }

    const supabase = await createAdminClient();

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

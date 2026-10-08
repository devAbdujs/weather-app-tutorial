import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import crypto from 'crypto';
import { hasPermission } from '@/lib/adminPermissions';

export async function POST(req: NextRequest) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (!hasPermission(isAdmin, 'notes:write')) {
      return NextResponse.json({ success: false, error: 'Forbidden: Insufficient permissions to modify study notes' }, { status: 403 });
    }

    const body = await req.json();
    const supabase = await createAdminClient();

    // Support both single note and batch array of notes
    const notesToSave: Array<{
      examType: string;
      department: string;
      title: string;
      content: string;
    }> = Array.isArray(body.notes) ? body.notes : [body];

    if (notesToSave.length === 0) {
      return NextResponse.json({ success: false, error: 'No notes provided' }, { status: 400 });
    }

    for (const note of notesToSave) {
      const examType = note.examType?.trim();
      const department = note.department?.trim();
      const title = note.title?.trim();
      const content = note.content?.trim();

      if (!examType || !department || !title || !content) {
        continue;
      }

      // Check if this chapter note already exists to prevent duplicate rows
      const { data: existing } = await supabase
        .from('study_notes')
        .select('id')
        .eq('exam_type', examType)
        .eq('department', department)
        .eq('title', title)
        .maybeSingle();

      if (existing?.id) {
        // Update existing note content
        const { error: updateErr } = await supabase
          .from('study_notes')
          .update({ content })
          .eq('id', existing.id);

        if (updateErr) throw updateErr;
      } else {
        // Insert new note
        const { error: insertErr } = await supabase
          .from('study_notes')
          .insert({
            id: crypto.randomUUID(),
            exam_type: examType,
            department: department,
            title: title,
            content: content,
          });

        if (insertErr) throw insertErr;
      }
    }

    return NextResponse.json({ success: true, count: notesToSave.length });
  } catch (err: unknown) {
    console.error('[Admin Notes Save Error]', err);
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}

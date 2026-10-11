import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { verifyAdmin } from '@/app/actions/admin';
import crypto from 'crypto';
import { hasPermission } from '@/lib/adminPermissions';

export async function GET(req: NextRequest) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const examType = searchParams.get('examType')?.trim();
    const department = searchParams.get('department')?.trim();

    if (!examType || !department) {
      return NextResponse.json({ success: false, error: 'Missing examType or department' }, { status: 400 });
    }

    const supabase = await createAdminClient();
    let { data: notes, error } = await supabase
      .from('study_notes')
      .select('id, title, content')
      .eq('exam_type', examType)
      .ilike('department', department)
      .order('title', { ascending: true });

    if (error) throw error;

    // Fallback: If 0 notes found, handle variants like '&' vs 'and'
    if (!notes || notes.length === 0) {
      const altDept = department.includes('&')
        ? department.replace(/&/g, 'and')
        : department.includes(' and ')
          ? department.replace(/\band\b/gi, '&')
          : null;

      if (altDept) {
        const { data: altNotes, error: altErr } = await supabase
          .from('study_notes')
          .select('id, title, content')
          .eq('exam_type', examType)
          .ilike('department', altDept)
          .order('title', { ascending: true });

        if (!altErr && altNotes && altNotes.length > 0) {
          notes = altNotes;
        }
      }
    }

    // Sort chapters naturally: Chapter 1, Chapter 2, ..., Chapter 10
    const sortedNotes = (notes || []).sort((a, b) => {
      const getNum = (str: string) => {
        const m = str.match(/(?:chapter|ch)\s*(\d+)/i);
        return m ? parseInt(m[1], 10) : 9999;
      };
      const diff = getNum(a.title) - getNum(b.title);
      if (diff !== 0) return diff;
      return a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' });
    });

    const inventory = sortedNotes.map((n) => {
      const words = (n.content || '').trim().split(/\s+/).filter(Boolean).length;
      return {
        id: n.id,
        title: n.title,
        createdAt: (n as any).created_at || new Date().toISOString(),
        wordCount: words,
      };
    });

    return NextResponse.json({ success: true, notes: inventory });
  } catch (err: unknown) {
    console.error('[Admin Notes Inventory Error]', err);
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}

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
      allowOverwrite?: boolean;
    }> = Array.isArray(body.notes) ? body.notes : [body];

    if (notesToSave.length === 0) {
      return NextResponse.json({ success: false, error: 'No notes provided' }, { status: 400 });
    }

    let savedCount = 0;
    let skippedCount = 0;

    for (const note of notesToSave) {
      const examType = note.examType?.trim();
      const department = note.department?.trim();
      const title = note.title?.trim();
      const content = note.content?.trim();
      const allowOverwrite = note.allowOverwrite !== false; // default true

      if (!examType || !department || !title || !content) {
        continue;
      }

      // Check if this chapter note already exists to prevent unintentional duplicates
      const { data: existing } = await supabase
        .from('study_notes')
        .select('id')
        .eq('exam_type', examType)
        .ilike('department', department)
        .ilike('title', title)
        .maybeSingle();

      if (existing?.id) {
        if (!allowOverwrite) {
          skippedCount++;
          continue;
        }
        // Update existing note content
        const { error: updateErr } = await supabase
          .from('study_notes')
          .update({ content })
          .eq('id', existing.id);

        if (updateErr) throw updateErr;
        savedCount++;
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
        savedCount++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      count: savedCount,
      skipped: skippedCount 
    });
  } catch (err: unknown) {
    console.error('[Admin Notes Save Error]', err);
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}

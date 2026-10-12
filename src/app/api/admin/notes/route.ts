import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { verifyAdmin } from '@/app/actions/admin';
import crypto from 'crypto';
import { hasPermission } from '@/lib/adminPermissions';
import { normalizeMarkdownLaTeX } from '@/lib/latex';

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

    // Fallback: If 0 notes found, handle curriculum course aliases & naming variants
    if (!notes || notes.length === 0) {
      const getAliases = (dept: string): string[] => {
        const d = dept.toLowerCase().trim();
        const list: string[] = [];
        if (d.includes('math') && d.includes('natural')) {
          list.push('Mathematics', 'Mathematics for Natural Sciences', 'Mathematics (Natural)');
        } else if (d === 'mathematics' || d === 'math') {
          list.push('Mathematics for Natural Sciences', 'Mathematics (Natural)', 'Mathematics (Social)');
        } else if (d.includes('emerging tech')) {
          list.push('Emerging Technology', 'Introduction to Emerging Technologies');
        } else if (d.includes('communicative english') || d.includes('english language skills')) {
          list.push('Communicative English', 'English', 'Communicative English Language Skills (I & II)');
        } else if (d.includes('moral') || d.includes('civic')) {
          list.push('Moral & Civics', 'Moral and Civic Education', 'Civics', 'Civics & Ethical Education');
        } else if (d.includes('geography')) {
          list.push('Geography of Ethiopia', 'Geography of Ethiopia and the Horn', 'Geography');
        } else if (d.includes('history')) {
          list.push('History of Ethiopia', 'History of Ethiopia and the Horn', 'History');
        } else if (d.includes('psychology')) {
          list.push('General Psychology', 'General Psychology and Life Skills', 'Psychology');
        } else if (d.includes('logic')) {
          list.push('Logic & Critical Thinking', 'Logic and Critical Thinking', 'Logic');
        } else if (d.includes('anthropology')) {
          list.push('Social Anthropology', 'Anthropology');
        }

        if (dept.includes('&')) list.push(dept.replace(/&/g, 'and'));
        if (dept.includes(' and ')) list.push(dept.replace(/\band\b/gi, '&'));
        return Array.from(new Set(list));
      };

      const aliases = getAliases(department);
      for (const alias of aliases) {
        if (alias.toLowerCase() === department.toLowerCase()) continue;
        const { data: altNotes, error: altErr } = await supabase
          .from('study_notes')
          .select('id, title, content')
          .eq('exam_type', examType)
          .ilike('department', alias)
          .order('title', { ascending: true });

        if (!altErr && altNotes && altNotes.length > 0) {
          notes = altNotes;
          break;
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
        content: n.content,
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
      const rawContent = note.content?.trim();
      const content = rawContent ? normalizeMarkdownLaTeX(rawContent) : '';
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

export async function DELETE(req: NextRequest) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (!hasPermission(isAdmin, 'notes:write')) {
      return NextResponse.json({ success: false, error: 'Forbidden: Insufficient permissions to delete study notes' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing note id parameter' }, { status: 400 });
    }

    const supabase = await createAdminClient();
    const { error } = await supabase.from('study_notes').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('[Admin Notes Delete Error]', err);
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}

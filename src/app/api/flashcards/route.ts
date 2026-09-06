import { NextRequest, NextResponse } from 'next/server';
import { getFlashcards, getFlashcardSubjects } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    if (searchParams.get('meta') === 'subjects') {
      const subjects = getFlashcardSubjects();
      return NextResponse.json({ success: true, subjects });
    }

    const subject = searchParams.get('subject') || undefined;
    const limitStr = searchParams.get('limit');
    const limit = limitStr ? parseInt(limitStr) : 40;

    const flashcards = getFlashcards(subject, limit);
    return NextResponse.json({ success: true, count: flashcards.length, flashcards });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

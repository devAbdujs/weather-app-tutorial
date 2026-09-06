import { NextRequest, NextResponse } from 'next/server';
import { getQuestions } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const track = searchParams.get('track') || searchParams.get('examType') || 'entrance';
    const subject = searchParams.get('subject') || undefined;
    const yearStr = searchParams.get('year');
    const limitStr = searchParams.get('limit');
    const offsetStr = searchParams.get('offset');
    const random = searchParams.get('random') === 'true';

    const year = yearStr ? parseInt(yearStr) : undefined;
    const limit = limitStr ? parseInt(limitStr) : 50;
    const offset = offsetStr ? parseInt(offsetStr) : 0;

    const { questions, total } = getQuestions({
      examType: track,
      subject,
      year,
      limit,
      offset,
      random
    });

    return NextResponse.json({
      success: true,
      track,
      subject: subject || 'All',
      year,
      total,
      count: questions.length,
      questions
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

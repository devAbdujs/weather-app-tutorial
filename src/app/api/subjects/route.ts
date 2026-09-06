import { NextRequest, NextResponse } from 'next/server';
import { getSubjectsByTrack } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const track = searchParams.get('track') || 'entrance';
    const subjects = getSubjectsByTrack(track);
    return NextResponse.json({ success: true, track, subjects });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

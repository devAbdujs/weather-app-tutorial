import { NextResponse } from 'next/server';
import { getTrackSummaries } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const tracks = getTrackSummaries();
    return NextResponse.json({ success: true, tracks });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

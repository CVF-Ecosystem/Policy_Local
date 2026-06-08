import { NextRequest, NextResponse } from 'next/server';
import { searchCorpus } from '@/lib/search';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get('q') || '';
    const documentType = url.searchParams.get('documentType') ?? undefined;
    const freshnessStatus = url.searchParams.get('freshnessStatus') ?? undefined;
    const jurisdiction = url.searchParams.get('jurisdiction') ?? undefined;
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 50);

    const { results, receipt } = searchCorpus(q, { documentType, freshnessStatus, jurisdiction }, limit);
    return NextResponse.json({ results, receipt, total: results.length });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

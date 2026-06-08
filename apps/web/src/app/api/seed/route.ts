import { NextResponse } from 'next/server';
import path from 'path';
import { seedFromJson } from '@/lib/ingest';

// POST /api/seed — seeds DB from generated JSON artifacts (dev/setup only)
export async function POST() {
  try {
    const root = process.cwd();
    const corpusPath = path.join(root, '..', '..', 'data', 'generated', 'policylocal-corpus-records.json');
    const chunksPath = path.join(root, '..', '..', 'data', 'generated', 'policylocal-chunks.json');
    seedFromJson(corpusPath, chunksPath);
    return NextResponse.json({ ok: true, message: 'Seeded from generated JSON' });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

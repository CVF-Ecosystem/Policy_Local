import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const url = new URL(req.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200);
    const kind = url.searchParams.get('kind');

    const conditions = kind ? ['kind = ?'] : [];
    const params: unknown[] = kind ? [kind] : [];
    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const logs = db.prepare(`
      SELECT id, kind, query_text, normalized_query, answer_class,
             sources, results, provider, created_at
      FROM query_log ${where}
      ORDER BY created_at DESC
      LIMIT ?
    `).all(...params, limit);

    return NextResponse.json({ logs });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // fetch receipt detail for a specific query log entry
  try {
    const { id } = await req.json();
    const db = getDb();
    const row = db.prepare('SELECT receipt_json FROM query_log WHERE id = ?').get(id) as { receipt_json: string } | undefined;
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ receipt: JSON.parse(row.receipt_json || '{}') });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

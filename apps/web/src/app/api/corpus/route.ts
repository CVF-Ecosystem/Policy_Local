import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const url = new URL(req.url);
    const doctype = url.searchParams.get('documentType');
    const freshness = url.searchParams.get('freshnessStatus');
    const sensitivity = url.searchParams.get('sensitivity');
    const q = url.searchParams.get('q');

    const conditions: string[] = ["processing_status != 'error'"];
    const params: unknown[] = [];

    if (doctype) { conditions.push('document_type = ?'); params.push(doctype); }
    if (freshness) { conditions.push('freshness_status = ?'); params.push(freshness); }
    if (sensitivity) { conditions.push('sensitivity = ?'); params.push(sensitivity); }
    if (q) { conditions.push('(file_name LIKE ? OR issuing_body LIKE ?)'); params.push(`%${q}%`, `%${q}%`); }

    const where = 'WHERE ' + conditions.join(' AND ');

    const records = db.prepare(`
      SELECT id, file_name, document_type, issuing_body, effective_date,
             freshness_status, sensitivity, processing_status, jurisdiction,
             authority_level, answer_class, topic_tags, imported_at
      FROM corpus_records ${where}
      ORDER BY imported_at DESC
      LIMIT 200
    `).all(...params);

    const stats = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN processing_status = 'ready' THEN 1 ELSE 0 END) as ready,
        SUM(CASE WHEN processing_status = 'processing' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN processing_status = 'error' THEN 1 ELSE 0 END) as error,
        SUM(CASE WHEN freshness_status = 'effective' THEN 1 ELSE 0 END) as effective,
        SUM(CASE WHEN freshness_status IN ('amended','not_yet_in_force') THEN 1 ELSE 0 END) as amended,
        SUM(CASE WHEN freshness_status = 'repealed' THEN 1 ELSE 0 END) as repealed,
        SUM(CASE WHEN freshness_status = 'draft' THEN 1 ELSE 0 END) as draft,
        SUM(CASE WHEN freshness_status = 'unknown' THEN 1 ELSE 0 END) as unknown_count
      FROM corpus_records
    `).get() as Record<string, number>;

    const queryStats = db.prepare('SELECT COUNT(*) as queries FROM query_log').get() as { queries: number };

    return NextResponse.json({
      records: (records as Record<string, unknown>[]).map(r => ({
        ...r,
        topicTags: JSON.parse((r['topic_tags'] as string) || '[]'),
      })),
      stats: {
        total: stats.total, ready: stats.ready, pending: stats.pending,
        error: stats.error, effective: stats.effective, amended: stats.amended,
        repealed: stats.repealed, draft: stats.draft, unknown: stats.unknown_count,
        queries: queryStats.queries,
        flagged: stats.amended + stats.repealed,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const db = getDb();
    db.prepare('DELETE FROM chunks WHERE corpus_record_id = ?').run(id);
    db.prepare('DELETE FROM corpus_records WHERE id = ?').run(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

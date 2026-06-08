import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// Keys stored in settings table — never returned in plaintext after save
const ALLOWED_KEYS = ['llm_provider', 'llm_model', 'llm_api_key', 'llm_base_url', 'ui_lang', 'ui_theme', 'ui_perpage'];

export async function GET() {
  try {
    const db = getDb();
    const rows = db.prepare('SELECT key, value FROM settings WHERE key IN (' + ALLOWED_KEYS.map(() => '?').join(',') + ')').all(...ALLOWED_KEYS) as { key: string; value: string }[];
    const out: Record<string, string> = {};
    for (const row of rows) {
      // mask API key — return only last 4 chars
      if (row.key === 'llm_api_key') {
        out[row.key] = row.value.length > 4 ? '••••' + row.value.slice(-4) : '••••';
      } else {
        out[row.key] = row.value;
      }
    }
    return NextResponse.json(out);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Record<string, string>;
    const db = getDb();
    const upsert = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    const batch = db.transaction((entries: [string, string][]) => {
      for (const [k, v] of entries) upsert.run(k, v);
    });
    const entries = Object.entries(body).filter(([k]) => ALLOWED_KEYS.includes(k)) as [string, string][];
    if (entries.length === 0) return NextResponse.json({ error: 'No valid keys' }, { status: 400 });
    batch(entries);
    return NextResponse.json({ ok: true, saved: entries.map(([k]) => k) });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

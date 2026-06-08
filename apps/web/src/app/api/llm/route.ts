import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { searchCorpus } from '@/lib/search';
import crypto from 'crypto';

function getSettings(db: ReturnType<typeof getDb>) {
  const rows = db.prepare("SELECT key, value FROM settings WHERE key IN ('llm_provider','llm_model','llm_api_key','llm_base_url')").all() as { key: string; value: string }[];
  return Object.fromEntries(rows.map(r => [r.key, r.value]));
}

function buildSystemPrompt(chunks: { fileName: string; articleRef: string | null; chunkText: string; freshnessStatus: string }[]): string {
  const context = chunks.map((c, i) =>
    `[${i + 1}] ${c.fileName}${c.articleRef ? ' · ' + c.articleRef : ''} (${c.freshnessStatus})\n${c.chunkText}`
  ).join('\n\n---\n\n');

  return `Bạn là trợ lý pháp lý nội bộ. Trả lời dựa trên các đoạn văn bản pháp luật được cung cấp bên dưới.

QUY TẮC BẮT BUỘC:
- Chỉ trả lời dựa trên nội dung corpus được cung cấp
- Trích dẫn rõ nguồn [số thứ tự] sau mỗi luận điểm
- Nếu corpus không đủ thông tin: trả lời "Corpus nội bộ không có đủ thông tin về vấn đề này — cần tra cứu nguồn chính thức"
- Với văn bản có freshness_status = "repealed": cảnh báo rõ ràng văn bản đã hết hiệu lực
- Với văn bản có freshness_status = "not_yet_in_force": ghi rõ chưa có hiệu lực
- Không suy diễn ngoài nội dung được cung cấp
- Ngôn ngữ: trả lời bằng tiếng Việt

CORPUS:
${context}`;
}

async function callAnthropic(apiKey: string, model: string, systemPrompt: string, userMessage: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: model || 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(`Anthropic ${res.status}: ${err?.error?.message || res.statusText}`);
  }
  const data = await res.json() as { content: { type: string; text: string }[] };
  return data.content.find(b => b.type === 'text')?.text || '';
}

async function callOpenAI(apiKey: string, model: string, baseUrl: string, systemPrompt: string, userMessage: string): Promise<string> {
  const url = (baseUrl || 'https://api.openai.com') + '/v1/chat/completions';
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
    body: JSON.stringify({
      model: model || 'gpt-4o-mini',
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userMessage }],
      max_tokens: 1024,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(`OpenAI ${res.status}: ${err?.error?.message || res.statusText}`);
  }
  const data = await res.json() as { choices: { message: { content: string } }[] };
  return data.choices[0]?.message?.content || '';
}

export async function POST(req: NextRequest) {
  try {
    const { query, documentType, freshnessStatus, topK = 6 } = await req.json() as {
      query: string; documentType?: string; freshnessStatus?: string; topK?: number;
    };

    if (!query?.trim()) return NextResponse.json({ error: 'query required' }, { status: 400 });

    const db = getDb();
    const cfg = getSettings(db);

    if (!cfg.llm_api_key) {
      return NextResponse.json({ error: 'no_key', message: 'Chưa cấu hình API key. Vào Settings → LLM để thêm key.' }, { status: 400 });
    }

    // 1. Retrieve relevant chunks from corpus
    const { results, receipt } = searchCorpus(query, { documentType, freshnessStatus }, topK);

    if (results.length === 0) {
      return NextResponse.json({
        answer: 'Corpus nội bộ không có đủ thông tin về vấn đề này — cần tra cứu nguồn chính thức.',
        answerClass: 'ESCALATE_OR_ABSTAIN',
        sources: [],
        receipt,
      });
    }

    // 2. Build grounded prompt
    const chunks = results.map(r => ({
      fileName: r.fileName, articleRef: r.articleRef,
      chunkText: r.chunkText, freshnessStatus: r.freshnessStatus,
    }));
    const systemPrompt = buildSystemPrompt(chunks);

    // 3. Call LLM
    const provider = cfg.llm_provider || 'anthropic';
    const model = cfg.llm_model || (provider === 'anthropic' ? 'claude-haiku-4-5-20251001' : 'gpt-4o-mini');
    let answer: string;

    if (provider === 'anthropic') {
      answer = await callAnthropic(cfg.llm_api_key, model, systemPrompt, query);
    } else {
      answer = await callOpenAI(cfg.llm_api_key, model, cfg.llm_base_url || '', systemPrompt, query);
    }

    // 4. Determine answer class from freshness
    const hasRepealed = results.some(r => r.freshnessStatus === 'repealed' || r.freshnessStatus === 'unknown');
    const answerClass = hasRepealed ? 'SUMMARY_WITH_SOURCE' : 'DIRECT_CITED_ANSWER';

    // 5. Log to query_log
    const receiptId = 'llm-' + crypto.randomBytes(6).toString('hex');
    db.prepare(`
      INSERT OR IGNORE INTO query_log (id, kind, query_text, normalized_query, answer_class, sources, results, provider, receipt_json)
      VALUES (?, 'chat', ?, ?, ?, ?, ?, ?, ?)
    `).run(receiptId, query, query.toLowerCase(), answerClass, results.length, results.length,
      provider + '/' + model, JSON.stringify({ ...receipt, llmProvider: provider, llmModel: model }));

    return NextResponse.json({
      answer,
      answerClass,
      receiptId,
      provider: provider + '/' + model,
      sources: results.map(r => ({
        corpusRecordId: r.corpusRecordId,
        fileName: r.fileName,
        articleRef: r.articleRef,
        freshnessStatus: r.freshnessStatus,
        snippet: r.chunkText.slice(0, 200),
      })),
      receipt,
    });
  } catch (err) {
    const msg = String(err);
    // mask any key that might appear in error
    const safe = msg.replace(/sk-[A-Za-z0-9\-_]{10,}/g, 'sk-[REDACTED]');
    return NextResponse.json({ error: safe }, { status: 500 });
  }
}

// GET — test connection only
export async function GET() {
  try {
    const db = getDb();
    const cfg = getSettings(db);
    if (!cfg.llm_api_key) return NextResponse.json({ ok: false, message: 'Chưa có API key' });

    const provider = cfg.llm_provider || 'anthropic';
    const model = cfg.llm_model || (provider === 'anthropic' ? 'claude-haiku-4-5-20251001' : 'gpt-4o-mini');

    let latency = 0;
    const t0 = Date.now();
    if (provider === 'anthropic') {
      await callAnthropic(cfg.llm_api_key, model, 'Respond with exactly: OK', 'ping');
    } else {
      await callOpenAI(cfg.llm_api_key, model, cfg.llm_base_url || '', 'Respond with exactly: OK', 'ping');
    }
    latency = Date.now() - t0;

    return NextResponse.json({ ok: true, provider, model, latencyMs: latency });
  } catch (err) {
    const safe = String(err).replace(/sk-[A-Za-z0-9\-_]{10,}/g, 'sk-[REDACTED]');
    return NextResponse.json({ ok: false, error: safe });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { searchCorpus } from '@/lib/search';
import crypto from 'crypto';

const PROVIDER_DEFAULTS: Record<string, { baseUrl: string; defaultModel: string }> = {
  openai:   { baseUrl: 'https://api.openai.com',           defaultModel: 'gpt-4o-mini' },
  deepseek: { baseUrl: 'https://api.deepseek.com',         defaultModel: 'deepseek-chat' },
  alibaba:  { baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode', defaultModel: 'qwen3.6-35b-a3b' },
  anthropic:{ baseUrl: '',                                 defaultModel: 'claude-haiku-4-5-20251001' },
  gemini:   { baseUrl: 'https://generativelanguage.googleapis.com', defaultModel: 'gemini-2.0-flash' },
  ollama:   { baseUrl: 'http://localhost:11434',           defaultModel: 'llama3' },
};

type LLMConfig = { provider: string; apiKey: string; model: string; baseUrl: string };

function resolveConfig(dbCfg: Record<string, string>): LLMConfig | null {
  // Priority: DB settings → env vars
  const provider = dbCfg.llm_provider || process.env.POLICYLOCAL_DEFAULT_PROVIDER || 'openai';

  let apiKey = dbCfg.llm_api_key || '';
  if (!apiKey) {
    if (provider === 'openai')    apiKey = process.env.OPENAI_API_KEY || '';
    if (provider === 'deepseek')  apiKey = process.env.DEEPSEEK_API_KEY || '';
    if (provider === 'alibaba')   apiKey = process.env.ALIBABA_API_KEY || process.env.DASHSCOPE_API_KEY || '';
    if (provider === 'gemini')    apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
  }
  if (!apiKey) return null;

  const defaults = PROVIDER_DEFAULTS[provider] ?? PROVIDER_DEFAULTS.openai;
  const model   = dbCfg.llm_model   || process.env.POLICYLOCAL_DEFAULT_MODEL || defaults.defaultModel;
  const baseUrl = dbCfg.llm_base_url
    || (provider === 'alibaba' ? process.env.ALIBABA_BASE_URL || defaults.baseUrl : defaults.baseUrl);

  return { provider, apiKey, model, baseUrl };
}

function getDbSettings(db: ReturnType<typeof getDb>): Record<string, string> {
  const rows = db.prepare(
    "SELECT key, value FROM settings WHERE key IN ('llm_provider','llm_model','llm_api_key','llm_base_url')"
  ).all() as { key: string; value: string }[];
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
- Với văn bản freshness_status = "repealed": cảnh báo rõ văn bản đã hết hiệu lực
- Với văn bản freshness_status = "not_yet_in_force": ghi rõ chưa có hiệu lực
- Không suy diễn ngoài nội dung được cung cấp
- Ngôn ngữ: trả lời bằng tiếng Việt

CORPUS:
${context}`;
}

async function callAnthropic(cfg: LLMConfig, systemPrompt: string, userMessage: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': cfg.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: cfg.model,
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

async function callOpenAICompatible(cfg: LLMConfig, systemPrompt: string, userMessage: string): Promise<string> {
  const url = cfg.baseUrl.replace(/\/$/, '') + '/v1/chat/completions';
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + cfg.apiKey,
    },
    body: JSON.stringify({
      model: cfg.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userMessage },
      ],
      max_tokens: 1024,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(`${cfg.provider} ${res.status}: ${err?.error?.message || res.statusText}`);
  }
  const data = await res.json() as { choices: { message: { content: string } }[] };
  return data.choices[0]?.message?.content || '';
}

async function callGemini(cfg: LLMConfig, systemPrompt: string, userMessage: string): Promise<string> {
  const url = `${cfg.baseUrl}/v1beta/models/${cfg.model}:generateContent`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': cfg.apiKey },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      generationConfig: { maxOutputTokens: 1024 },
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(`Gemini ${res.status}: ${err?.error?.message || res.statusText}`);
  }
  const data = await res.json() as { candidates: { content: { parts: { text: string }[] } }[] };
  return data.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '';
}

async function callLLM(cfg: LLMConfig, systemPrompt: string, userMessage: string): Promise<string> {
  if (cfg.provider === 'anthropic') return callAnthropic(cfg, systemPrompt, userMessage);
  if (cfg.provider === 'gemini')    return callGemini(cfg, systemPrompt, userMessage);
  return callOpenAICompatible(cfg, systemPrompt, userMessage);
}

function safeError(err: unknown): string {
  return String(err).replace(/sk-[A-Za-z0-9\-_]{10,}/g, 'sk-[REDACTED]');
}

// ── POST /api/llm — RAG query ────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { query, documentType, freshnessStatus, topK = 6 } = await req.json() as {
      query: string; documentType?: string; freshnessStatus?: string; topK?: number;
    };

    if (!query?.trim()) return NextResponse.json({ error: 'query required' }, { status: 400 });

    const db = getDb();
    const cfg = resolveConfig(getDbSettings(db));

    if (!cfg) {
      return NextResponse.json({
        error: 'no_key',
        message: 'Chưa có API key. Vào Settings → LLM để thêm, hoặc thêm OPENAI_API_KEY / DEEPSEEK_API_KEY vào .env.local',
      }, { status: 400 });
    }

    // 1. Retrieve relevant chunks
    const { results, receipt } = searchCorpus(query, { documentType, freshnessStatus }, topK);

    if (results.length === 0) {
      return NextResponse.json({
        answer: 'Corpus nội bộ không có đủ thông tin về vấn đề này — cần tra cứu nguồn chính thức.',
        answerClass: 'ESCALATE_OR_ABSTAIN',
        sources: [], receipt,
        provider: cfg.provider + '/' + cfg.model,
      });
    }

    // 2. Build grounded prompt
    const chunks = results.map(r => ({
      fileName: r.fileName, articleRef: r.articleRef,
      chunkText: r.chunkText, freshnessStatus: r.freshnessStatus,
    }));
    const systemPrompt = buildSystemPrompt(chunks);

    // 3. Call LLM
    const answer = await callLLM(cfg, systemPrompt, query);

    const hasRepealed = results.some(r => r.freshnessStatus === 'repealed' || r.freshnessStatus === 'unknown');
    const answerClass = hasRepealed ? 'SUMMARY_WITH_SOURCE' : 'DIRECT_CITED_ANSWER';

    // 4. Log
    const receiptId = 'llm-' + crypto.randomBytes(6).toString('hex');
    db.prepare(`
      INSERT OR IGNORE INTO query_log
        (id, kind, query_text, normalized_query, answer_class, sources, results, provider, receipt_json)
      VALUES (?, 'chat', ?, ?, ?, ?, ?, ?, ?)
    `).run(
      receiptId, query, query.toLowerCase(), answerClass,
      results.length, results.length,
      cfg.provider + '/' + cfg.model,
      JSON.stringify({ ...receipt, llmProvider: cfg.provider, llmModel: cfg.model }),
    );

    return NextResponse.json({
      answer, answerClass, receiptId,
      provider: cfg.provider + '/' + cfg.model,
      sources: results.map(r => ({
        corpusRecordId: r.corpusRecordId, fileName: r.fileName,
        articleRef: r.articleRef, freshnessStatus: r.freshnessStatus,
        snippet: r.chunkText.slice(0, 200),
      })),
      receipt,
    });
  } catch (err) {
    return NextResponse.json({ error: safeError(err) }, { status: 500 });
  }
}

// ── GET /api/llm — test connection ──────────────────────────────────────────
export async function GET() {
  try {
    const db = getDb();
    const cfg = resolveConfig(getDbSettings(db));

    if (!cfg) return NextResponse.json({ ok: false, message: 'Chưa có API key' });

    const t0 = Date.now();
    // minimal ping — 1 token response
    await callLLM(cfg, 'Respond with exactly one word: OK', 'ping');
    const latencyMs = Date.now() - t0;

    return NextResponse.json({ ok: true, provider: cfg.provider, model: cfg.model, latencyMs });
  } catch (err) {
    return NextResponse.json({ ok: false, error: safeError(err) });
  }
}

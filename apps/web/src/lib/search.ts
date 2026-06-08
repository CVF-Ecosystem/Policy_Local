import crypto from 'crypto';
import { getDb } from './db';

export type SearchFilter = {
  documentType?: string;
  freshnessStatus?: string;
  jurisdiction?: string;
  sensitivity?: string;
};

export type SearchResult = {
  corpusRecordId: string;
  fileName: string;
  documentType: string;
  issuingBody: string | null;
  effectiveDate: string | null;
  freshnessStatus: string;
  jurisdiction: string | null;
  answerClass: string | null;
  chunkId: string;
  chunkText: string;
  articleRef: string | null;
  topicTags: string[];
  score: number;
};

export type QueryReceipt = {
  receiptId: string;
  queryText: string;
  normalizedQuery: string;
  queryTimestamp: string;
  filtersApplied: SearchFilter;
  candidateCountBefore: number;
  candidateCountAfter: number;
  excludedCount: number;
  selectedCandidateIds: string[];
  citations: { sourcePath: string; snippet: string; freshnessStatus: string }[];
  answerClass: string;
  boundaryNote: string;
  freshnessDisclosureApplied: boolean;
  // per-result disclosure labels (EC-02 exception: date-aware instead of hard block)
  disclosures: { corpusRecordId: string; note: string }[];
};

function normalize(q: string): string {
  return q.toLowerCase()
    .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
    .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
    .replace(/[ìíịỉĩ]/g, 'i')
    .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
    .replace(/[ùúụủũưừứựửữ]/g, 'u')
    .replace(/[ỳýỵỷỹ]/g, 'y')
    .replace(/[đ]/g, 'd')
    .replace(/[^a-z0-9\s\/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(q: string): string[] {
  return normalize(q).split(' ').filter(t => t.length > 1);
}

// EC-02 exception granted 2026-06-08: date-aware disclaimer instead of hard block.
// not_yet_in_force → DIRECT_CITED_ANSWER + disclosure label (law promulgated but
// effective date not yet reached — normal VN legislative practice).
// repealed / unknown → SUMMARY_WITH_SOURCE (citing a dead law is a real risk).
export function freshnessAnswerClass(freshnessStatus: string): string {
  if (freshnessStatus === 'repealed' || freshnessStatus === 'unknown') return 'SUMMARY_WITH_SOURCE';
  return 'DIRECT_CITED_ANSWER';
}

export function freshnessDisclosureNote(freshnessStatus: string, effectiveDate: string | null): string {
  switch (freshnessStatus) {
    case 'not_yet_in_force':
      return effectiveDate
        ? `Văn bản có hiệu lực từ ${effectiveDate} — chưa áp dụng được trước ngày đó.`
        : 'Văn bản chưa có hiệu lực — kiểm tra ngày hiệu lực trước khi áp dụng.';
    case 'amended':
      return 'Văn bản đã được sửa đổi — kiểm tra phiên bản mới nhất trước khi áp dụng.';
    case 'repealed':
      return 'Văn bản đã hết hiệu lực — không còn giá trị pháp lý.';
    case 'unknown':
      return 'Trạng thái hiệu lực chưa xác định — xác minh trước khi sử dụng.';
    default:
      return '';
  }
}

export function searchCorpus(
  queryText: string,
  filters: SearchFilter = {},
  limit = 10
): { results: SearchResult[]; receipt: QueryReceipt } {
  const db = getDb();
  const normalizedQuery = normalize(queryText);
  const tokens = tokenize(queryText);
  const timestamp = new Date().toISOString();
  const receiptId = 'rcpt-' + crypto.randomBytes(6).toString('hex');

  // build WHERE for filters
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.documentType) {
    conditions.push('cr.document_type = ?');
    params.push(filters.documentType);
  }
  if (filters.freshnessStatus) {
    conditions.push('cr.freshness_status = ?');
    params.push(filters.freshnessStatus);
  }
  if (filters.jurisdiction) {
    conditions.push('cr.jurisdiction = ?');
    params.push(filters.jurisdiction);
  }
  if (filters.sensitivity) {
    conditions.push('cr.sensitivity = ?');
    params.push(filters.sensitivity);
  }

  const whereClause = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

  // get candidate records
  const candidatesBefore = db.prepare(`
    SELECT cr.id, cr.file_name, cr.document_type, cr.issuing_body,
           cr.effective_date, cr.freshness_status, cr.jurisdiction,
           cr.answer_class, cr.source_path
    FROM corpus_records cr
    ${whereClause}
    AND cr.processing_status = 'ready'
  `).all(...params) as {
    id: string; file_name: string; document_type: string; issuing_body: string | null;
    effective_date: string | null; freshness_status: string; jurisdiction: string | null;
    answer_class: string | null; source_path: string;
  }[];

  const candidateCountBefore = candidatesBefore.length;
  const selectedIds = candidatesBefore.map(r => r.id);

  if (selectedIds.length === 0 || tokens.length === 0) {
    const receipt: QueryReceipt = {
      receiptId, queryText, normalizedQuery, queryTimestamp: timestamp,
      filtersApplied: filters, candidateCountBefore: 0, candidateCountAfter: 0,
      excludedCount: 0, selectedCandidateIds: [], citations: [],
      answerClass: 'ESCALATE_OR_ABSTAIN',
      boundaryNote: 'No corpus records match filters or query is empty.',
      freshnessDisclosureApplied: false,
      disclosures: [],
    };
    logQuery(db, receiptId, 'search', queryText, normalizedQuery, 'ESCALATE_OR_ABSTAIN', 0, 0, receipt);
    return { results: [], receipt };
  }

  // score chunks by token overlap
  const placeholders = selectedIds.map(() => '?').join(',');
  const chunks = db.prepare(`
    SELECT c.chunk_id, c.corpus_record_id, c.chunk_text, c.article_ref,
           c.topic_tags, c.answer_class, c.freshness_status
    FROM chunks c
    WHERE c.corpus_record_id IN (${placeholders})
  `).all(...selectedIds) as {
    chunk_id: string; corpus_record_id: string; chunk_text: string;
    article_ref: string | null; topic_tags: string; answer_class: string | null;
    freshness_status: string | null;
  }[];

  type ScoredChunk = { score: number; chunk: typeof chunks[0]; record: typeof candidatesBefore[0] };
  const scored: ScoredChunk[] = [];

  const recordMap = new Map(candidatesBefore.map(r => [r.id, r]));

  for (const chunk of chunks) {
    const textLower = chunk.chunk_text.toLowerCase();
    const normText = normalize(chunk.chunk_text);
    let score = 0;
    for (const tok of tokens) {
      if (textLower.includes(tok)) score += 2;
      else if (normText.includes(tok)) score += 1;
    }
    if (score > 0) {
      scored.push({ score, chunk, record: recordMap.get(chunk.corpus_record_id)! });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, limit);

  const results: SearchResult[] = top.map(({ chunk, record, score }) => ({
    corpusRecordId: record.id,
    fileName: record.file_name,
    documentType: record.document_type,
    issuingBody: record.issuing_body,
    effectiveDate: record.effective_date,
    freshnessStatus: record.freshness_status,
    jurisdiction: record.jurisdiction,
    // EC-02 exception: date-aware answerClass instead of hard SUMMARY_WITH_SOURCE block
    answerClass: freshnessAnswerClass(record.freshness_status),
    chunkId: chunk.chunk_id,
    chunkText: chunk.chunk_text.slice(0, 500),
    articleRef: chunk.article_ref,
    topicTags: JSON.parse(chunk.topic_tags || '[]'),
    score,
  }));

  // per-result disclosure notes (shown inline in UI per result card)
  const resultDisclosures = results.map(r => ({
    corpusRecordId: r.corpusRecordId,
    note: freshnessDisclosureNote(r.freshnessStatus, r.effectiveDate),
  })).filter(d => d.note !== '');

  const hasFreshnessWarn = resultDisclosures.length > 0;
  const dominantAnswerClass = results[0]?.answerClass ?? 'SUMMARY_WITH_SOURCE';

  const citations = results.slice(0, 3).map(r => ({
    sourcePath: r.corpusRecordId,
    snippet: r.chunkText.slice(0, 200),
    freshnessStatus: r.freshnessStatus,
  }));

  const receipt: QueryReceipt = {
    receiptId, queryText, normalizedQuery, queryTimestamp: timestamp,
    filtersApplied: filters,
    candidateCountBefore,
    candidateCountAfter: results.length,
    excludedCount: candidateCountBefore - new Set(results.map(r => r.corpusRecordId)).size,
    selectedCandidateIds: [...new Set(results.map(r => r.corpusRecordId))],
    citations,
    answerClass: dominantAnswerClass,
    boundaryNote: hasFreshnessWarn
      ? resultDisclosures.map(d => d.note).join(' | ')
      : 'Kết quả từ corpus nội bộ.',
    freshnessDisclosureApplied: hasFreshnessWarn,
    disclosures: resultDisclosures,
  };

  logQuery(db, receiptId, 'search', queryText, normalizedQuery, dominantAnswerClass, results.length, results.length, receipt);

  return { results, receipt };
}

function logQuery(
  db: ReturnType<typeof getDb>,
  id: string, kind: string, text: string, normalized: string,
  answerClass: string, sources: number, results: number,
  receipt: QueryReceipt
) {
  db.prepare(`
    INSERT OR IGNORE INTO query_log (id, kind, query_text, normalized_query, answer_class, sources, results, receipt_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, kind, text, normalized, answerClass, sources, results, JSON.stringify(receipt));
}

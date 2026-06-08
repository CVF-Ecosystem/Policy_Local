import crypto from 'crypto';
import path from 'path';
import { getDb } from './db';

export type IngestResult = {
  id: string;
  fileName: string;
  status: 'inserted' | 'duplicate' | 'error';
  error?: string;
};

type ClassifyGuess = {
  documentType: string;
  issuingBody: string;
  jurisdiction: string;
  authorityLevel: string;
};

function classifyFromName(fileName: string): ClassifyGuess {
  const n = fileName.toLowerCase();
  if (n.includes('luật') || n.includes('luat') || /\d+\/\d+\/qh\d+/i.test(n))
    return { documentType: 'law', issuingBody: 'Quốc hội', jurisdiction: 'VN', authorityLevel: 'national_law' };
  if (n.includes('nghị định') || n.includes('nghi dinh') || /nđ-cp/i.test(n) || /nd-cp/i.test(n))
    return { documentType: 'decree', issuingBody: 'Chính phủ', jurisdiction: 'VN', authorityLevel: 'government_decree' };
  if (n.includes('thông tư') || n.includes('thong tu') || /tt-/i.test(n))
    return { documentType: 'circular', issuingBody: 'Bộ', jurisdiction: 'VN', authorityLevel: 'ministerial_circular' };
  if (n.includes('quyết định') || n.includes('quyet dinh') || /qđ-/i.test(n) || /qd-/i.test(n))
    return { documentType: 'decision', issuingBody: '', jurisdiction: 'VN', authorityLevel: 'official_decision' };
  if (n.includes('sop-') || n.includes('sop_'))
    return { documentType: 'sop', issuingBody: '', jurisdiction: 'company_internal', authorityLevel: 'company_sop' };
  if (n.includes('quy chế') || n.includes('chính sách') || n.includes('policy'))
    return { documentType: 'policy', issuingBody: '', jurisdiction: 'company_internal', authorityLevel: 'company_policy' };
  return { documentType: 'other', issuingBody: '', jurisdiction: 'unknown', authorityLevel: 'unknown' };
}

async function extractText(buffer: Buffer, fileName: string): Promise<string> {
  const ext = path.extname(fileName).toLowerCase();
  if (ext === '.txt' || ext === '.md') {
    return buffer.toString('utf-8');
  }
  if (ext === '.pdf') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string }>;
    const result = await pdfParse(buffer);
    return result.text;
  }
  if (ext === '.docx') {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
  return '';
}

function chunkText(text: string, chunkSize = 1800, overlap = 200): string[] {
  const chunks: string[] = [];
  let pos = 0;
  while (pos < text.length) {
    chunks.push(text.slice(pos, pos + chunkSize));
    pos += chunkSize - overlap;
  }
  return chunks;
}

export async function ingestFile(
  buffer: Buffer,
  fileName: string,
  overrides?: Partial<{
    documentType: string;
    issuingBody: string;
    effectiveDate: string;
    sensitivity: string;
    jurisdiction: string;
  }>
): Promise<IngestResult> {
  const db = getDb();
  const sourceHash = 'sha256:' + crypto.createHash('sha256').update(buffer).digest('hex');
  const id = 'doc_' + crypto.randomBytes(8).toString('hex');
  const normalizedPath = 'uploads/' + fileName.toLowerCase().replace(/\s+/g, '_');

  // deduplicate by hash
  const existing = db.prepare('SELECT id FROM corpus_records WHERE source_hash = ?').get(sourceHash) as { id: string } | undefined;
  if (existing) return { id: existing.id, fileName, status: 'duplicate' };

  const guess = classifyFromName(fileName);

  try {
    db.prepare(`UPDATE corpus_records SET processing_status = 'processing' WHERE id = ?`).run(id);

    const insertRecord = db.prepare(`
      INSERT INTO corpus_records
        (id, file_name, source_path, normalized_path, source_hash, byte_length,
         document_type, issuing_body, effective_date, freshness_status, sensitivity,
         processing_status, jurisdiction, authority_level, topic_tags, imported_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'processing', ?, ?, '[]', datetime('now'))
    `);

    insertRecord.run(
      id, fileName, 'uploads/' + fileName, normalizedPath, sourceHash, buffer.byteLength,
      overrides?.documentType ?? guess.documentType,
      overrides?.issuingBody ?? guess.issuingBody,
      overrides?.effectiveDate ?? null,
      'unknown',
      overrides?.sensitivity ?? 'public',
      overrides?.jurisdiction ?? guess.jurisdiction,
      guess.authorityLevel
    );

    // extract + chunk
    const text = await extractText(buffer, fileName);
    const rawChunks = chunkText(text);
    const insertChunk = db.prepare(`
      INSERT INTO chunks
        (chunk_id, corpus_record_id, source_path, source_hash, chunk_index,
         start_char, end_char, chunk_text, chunk_hash, topic_tags, answer_class, freshness_status, schema_version)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '[]', 'SUMMARY_WITH_SOURCE', 'unknown', 'policylocal.chunk.local.v1')
    `);

    const insertChunks = db.transaction((chunks: string[]) => {
      chunks.forEach((txt, i) => {
        const chunkHash = 'sha256:' + crypto.createHash('sha256').update(txt).digest('hex');
        const start = i === 0 ? 0 : (i * 1800 - i * 200);
        insertChunk.run(
          `${id}/chunk_${String(i).padStart(4, '0')}`,
          id, 'uploads/' + fileName, sourceHash,
          i, start, start + txt.length, txt, chunkHash
        );
      });
    });
    insertChunks(rawChunks);

    db.prepare(`UPDATE corpus_records SET processing_status = 'ready', text_length = ? WHERE id = ?`)
      .run(text.length, id);

    return { id, fileName, status: 'inserted' };
  } catch (err) {
    db.prepare(`UPDATE corpus_records SET processing_status = 'error' WHERE id = ?`).run(id);
    return { id, fileName, status: 'error', error: String(err) };
  }
}

export function seedFromJson(corpusJsonPath: string, chunksJsonPath: string) {
  const db = getDb();
  const fs = require('fs') as typeof import('fs');

  const corpusData = JSON.parse(fs.readFileSync(corpusJsonPath, 'utf-8'));
  const chunksData = JSON.parse(fs.readFileSync(chunksJsonPath, 'utf-8'));

  const insertRecord = db.prepare(`
    INSERT OR IGNORE INTO corpus_records
      (id, file_name, source_path, normalized_path, source_hash, byte_length, text_length,
       document_type, issuing_body, effective_date, freshness_status, freshness_checked_at,
       freshness_note, sensitivity, processing_status, jurisdiction, authority_level,
       answer_class, topic_tags, raw_disposition, imported_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ready', ?, ?, ?, ?, ?, datetime('now'))
  `);

  const insertChunk = db.prepare(`
    INSERT OR IGNORE INTO chunks
      (chunk_id, corpus_record_id, source_path, source_hash, chunk_index,
       start_char, end_char, chunk_text, chunk_hash, topic_tags, answer_class,
       article_ref, freshness_status, schema_version)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const seedAll = db.transaction(() => {
    for (const r of corpusData.records ?? []) {
      const recId = r.normalizedPath.replace(/[^a-z0-9]/g, '_');
      insertRecord.run(
        recId, path.basename(r.sourcePath), r.sourcePath, r.normalizedPath,
        r.sourceHash, r.byteLength ?? null, r.textLength ?? null,
        r.documentType, r.issuingBody ?? null, r.effectiveDate ?? null,
        r.freshnessStatus ?? 'unknown', r.freshnessCheckedAt ?? null,
        r.freshnessNote ?? null, r.sensitivityLevel ?? 'public',
        r.jurisdiction ?? null, r.authorityLevel ?? null,
        r.answerClass ?? null, JSON.stringify(r.topicTags ?? []),
        r.rawDisposition ?? null
      );
    }

    for (const c of chunksData.chunks ?? []) {
      const recId = c.sourcePath.toLowerCase().replace(/[^a-z0-9]/g, '_');
      insertChunk.run(
        c.chunkId, recId, c.sourcePath, c.sourceHash, c.chunkIndex,
        c.startChar ?? null, c.endChar ?? null, c.chunkText, c.chunkHash ?? null,
        JSON.stringify(c.topicTags ?? []), c.answerClass ?? null,
        c.articleRef ?? null, c.freshnessStatus ?? null, c.schemaVersion ?? null
      );
    }
  });

  seedAll();
}

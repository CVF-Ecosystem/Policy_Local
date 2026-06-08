import Database from 'better-sqlite3';
import path from 'path';
import os from 'os';
import fs from 'fs';

const DB_DIR = path.join(os.homedir(), '.policylocal');
const DB_PATH = path.join(DB_DIR, 'corpus.db');

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;
  fs.mkdirSync(DB_DIR, { recursive: true });
  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');
  migrate(_db);
  return _db;
}

function migrate(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS corpus_records (
      id TEXT PRIMARY KEY,
      file_name TEXT NOT NULL,
      source_path TEXT NOT NULL,
      normalized_path TEXT NOT NULL,
      source_hash TEXT NOT NULL,
      byte_length INTEGER,
      text_length INTEGER,
      document_type TEXT NOT NULL,
      issuing_body TEXT,
      effective_date TEXT,
      freshness_status TEXT NOT NULL DEFAULT 'unknown',
      freshness_checked_at TEXT,
      freshness_note TEXT,
      sensitivity TEXT NOT NULL DEFAULT 'public',
      processing_status TEXT NOT NULL DEFAULT 'pending',
      jurisdiction TEXT,
      authority_level TEXT,
      answer_class TEXT,
      topic_tags TEXT DEFAULT '[]',
      raw_disposition TEXT,
      imported_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS chunks (
      chunk_id TEXT PRIMARY KEY,
      corpus_record_id TEXT NOT NULL REFERENCES corpus_records(id),
      source_path TEXT NOT NULL,
      source_hash TEXT NOT NULL,
      chunk_index INTEGER NOT NULL,
      start_char INTEGER,
      end_char INTEGER,
      chunk_text TEXT NOT NULL,
      chunk_hash TEXT,
      topic_tags TEXT DEFAULT '[]',
      answer_class TEXT,
      article_ref TEXT,
      freshness_status TEXT,
      schema_version TEXT
    );

    CREATE TABLE IF NOT EXISTS query_log (
      id TEXT PRIMARY KEY,
      kind TEXT NOT NULL,
      query_text TEXT NOT NULL,
      normalized_query TEXT,
      answer_class TEXT,
      sources INTEGER DEFAULT 0,
      results INTEGER DEFAULT 0,
      provider TEXT,
      receipt_json TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_chunks_corpus ON chunks(corpus_record_id);
    CREATE INDEX IF NOT EXISTS idx_chunks_freshness ON chunks(freshness_status);
    CREATE INDEX IF NOT EXISTS idx_corpus_freshness ON corpus_records(freshness_status);
    CREATE INDEX IF NOT EXISTS idx_corpus_doctype ON corpus_records(document_type);
    CREATE INDEX IF NOT EXISTS idx_query_log_created ON query_log(created_at DESC);
  `);
}

export type DbCorpusRecord = {
  id: string;
  file_name: string;
  source_path: string;
  normalized_path: string;
  source_hash: string;
  byte_length: number | null;
  text_length: number | null;
  document_type: string;
  issuing_body: string | null;
  effective_date: string | null;
  freshness_status: string;
  freshness_checked_at: string | null;
  freshness_note: string | null;
  sensitivity: string;
  processing_status: string;
  jurisdiction: string | null;
  authority_level: string | null;
  answer_class: string | null;
  topic_tags: string;
  raw_disposition: string | null;
  imported_at: string;
};

export type DbChunk = {
  chunk_id: string;
  corpus_record_id: string;
  source_path: string;
  source_hash: string;
  chunk_index: number;
  start_char: number | null;
  end_char: number | null;
  chunk_text: string;
  chunk_hash: string | null;
  topic_tags: string;
  answer_class: string | null;
  article_ref: string | null;
  freshness_status: string | null;
  schema_version: string | null;
};

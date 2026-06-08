# Gap 4 — Semantic Search Upgrade Roadmap
**Policy_Local · authored 2026-06-08**

---

## Problem Statement

Current retrieval in `search.ts` is **keyword overlap scoring**:
- Tokenize query → count how many tokens appear in chunk text
- Score = sum of raw token hits (2pt exact, 1pt normalized)
- No understanding of meaning — "lao động" ≠ "nhân viên", "chấm dứt hợp đồng" ≠ "sa thải"

**Real-world consequence:** User asks *"khi nào được sa thải nhân viên"* — corpus has
*"điều kiện chấm dứt hợp đồng lao động"* — zero score match, result missed entirely.

---

## Current Architecture (Baseline)

```
Query text
    │
    ▼
normalize() → tokenize()
    │
    ▼
SQLite: SELECT chunks WHERE corpus_record_id IN (filtered_records)
    │
    ▼
for each chunk: count token hits → score
    │
    ▼
sort by score → top-K → return
```

Storage: flat `chunks` table, no vector columns, no embedding index.

---

## Target Architecture (Gap 4 complete)

```
Query text
    │
    ├─── keyword path (existing, kept as fallback)
    │
    └─── embedding path (new)
              │
              ▼
         embed(query) → float32[384]
              │
              ▼
         sqlite-vec: SELECT chunk_id, distance
         FROM chunk_vss
         ORDER BY distance  ← cosine similarity
              │
              ▼
         RRF fusion: merge keyword scores + vector scores
              │
              ▼
         top-K reranked → return
```

---

## Tranches

### T1 — Embedding Model Selection + Ingest Pipeline *(~1 day)*

**Decision:** Local model, no API cost, runs on CPU.

| Option | Model | Size | Vietnamese quality |
|---|---|---|---|
| **A (recommended)** | `intfloat/multilingual-e5-small` | 117MB | Good — multilingual trained on 100 langs including VI |
| B | `BAAI/bge-m3` | 570MB | Excellent but large |
| C | OpenAI `text-embedding-3-small` | API call | Best but requires key + cost |

**Recommendation:** Option A for self-contained local deployment. Option C as optional
upgrade when user has OpenAI key configured in Settings.

**Deliverables:**
- `apps/web/src/lib/embedder.ts` — singleton model loader using `@xenova/transformers`
  (runs in Node.js server component, WASM backend)
- Update `ingest.ts`: after chunking → `embedder.embed(chunk_text)` → store Float32Array
- DB migration: `chunk_embeddings` table with `chunk_id` + `embedding BLOB`

**Package:** `@xenova/transformers` (~2.5MB npm, model downloads on first run to `~/.policylocal/models/`)

---

### T2 — Vector Store with sqlite-vec *(~1 day)*

**sqlite-vec** is a SQLite extension for vector similarity search. Loads as a native module.

**Deliverables:**
- `apps/web/src/lib/vec-store.ts` — load `sqlite-vec` extension, create virtual table `chunk_vss`
- Migration: `CREATE VIRTUAL TABLE chunk_vss USING vec0(embedding float[384])`
- `vectorSearch(queryEmbedding, topK, filteredRecordIds)` — returns `{chunkId, distance}[]`
- Update `next.config.ts`: add `sqlite-vec` to `serverExternalPackages`

**Package:** `sqlite-vec` (prebuilt binaries per platform)

**Fallback:** If `sqlite-vec` fails to load (platform/arch), silently fall back to keyword-only.
This ensures Windows/Mac/Linux all work without blocking on native module issues.

---

### T3 — Hybrid Retrieval + RRF Fusion *(~0.5 day)*

**Reciprocal Rank Fusion** merges keyword rank and vector rank without needing score normalization:

```ts
function rrf(keywordRanks: Map<string, number>, vectorRanks: Map<string, number>, k = 60) {
  const scores = new Map<string, number>();
  for (const [id, rank] of keywordRanks) scores.set(id, (scores.get(id) ?? 0) + 1 / (k + rank));
  for (const [id, rank] of vectorRanks)  scores.set(id, (scores.get(id) ?? 0) + 1 / (k + rank));
  return [...scores.entries()].sort((a, b) => b[1] - a[1]);
}
```

**Deliverables:**
- Update `search.ts`: `searchCorpus()` runs both paths in parallel, fuses with RRF
- New `SearchFilter.mode`: `'keyword' | 'semantic' | 'hybrid'` (default `'hybrid'`)
- Search UI: mode toggle (Hybrid / Keyword / Semantic) in filter panel
- Receipts: include `retrievalMode` field

---

### T4 — Re-embed on Freshness Change *(~0.5 day)*

When `PATCH /api/corpus` updates `freshnessStatus`, chunk embeddings remain valid
(text unchanged). But when a document is **replaced** (re-ingested), old embeddings
must be deleted and new ones created.

**Deliverables:**
- `ingest.ts`: on re-ingest of same SHA-256 hash → skip (already indexed)
- On different hash → delete old `chunk_vss` entries → re-embed new chunks
- `DELETE /api/corpus`: cascade delete from `chunk_vss`

---

### T5 — Settings UI: Embedding Model Picker *(~0.5 day)*

Add "Search" tab to Settings:

```
Settings → Search
  Retrieval mode:  ● Hybrid  ○ Keyword only  ○ Semantic only
  Embedding model: ● Local (multilingual-e5-small, 117MB)
                   ○ OpenAI text-embedding-3-small (requires API key)
  [Re-embed corpus]  ← triggers background re-index job
  Index status: 1,234 chunks indexed · last updated 08/06/2026
```

**Deliverables:**
- `api/settings/route.ts`: add `search_mode`, `embedding_provider` keys
- `api/embed/route.ts`: `POST` triggers background re-embed of all chunks
- Settings page: new "Search" tab

---

## Dependency Graph

```
T1 (embedder + ingest pipeline)
  └─► T2 (sqlite-vec store)
        └─► T3 (hybrid RRF) ─── can ship as usable milestone
              └─► T4 (re-embed on replace)
T5 (settings UI) ─── can be done in parallel with T3/T4
```

**Minimum shippable:** T1 + T2 + T3 = semantic search working end-to-end.

---

## Effort Estimate

| Tranche | Effort | Blocking |
|---|---|---|
| T1 | 1 day | None |
| T2 | 1 day | T1 |
| T3 | 0.5 day | T2 |
| T4 | 0.5 day | T2 |
| T5 | 0.5 day | T1 |
| **Total** | **~3.5 days** | |

---

## What Does NOT Change

- `corpus_records` schema — unchanged
- `chunks` table — unchanged (embeddings in separate table/vtable)
- EC-02 freshness disclosure — unchanged, applied post-retrieval
- `QueryReceipt` structure — additive only (`retrievalMode` field added)
- API contract of `GET /api/search` — backward compatible

---

## Risks

| Risk | Mitigation |
|---|---|
| `@xenova/transformers` slow first load (model download ~117MB) | Download on first ingest, not on query. Show progress in Import UI. |
| `sqlite-vec` native binary not available for platform | Graceful fallback to keyword-only at runtime |
| Vietnamese tokenization quality | `multilingual-e5-small` trained on VI; test with legal terms before shipping T3 |
| Memory pressure (WASM embedding on large corpus) | Batch embed during ingest (not query time); embeddings stored, not recomputed |

---

## Decision Required Before T1

1. **Embedding provider:** Local (`multilingual-e5-small`) or OpenAI-when-key-available?
   → Recommendation: Local default, OpenAI opt-in via Settings toggle

2. **Ship threshold:** T1+T2+T3 only, or full T1–T5?
   → Recommendation: T1+T2+T3 as first milestone, T4+T5 as follow-up

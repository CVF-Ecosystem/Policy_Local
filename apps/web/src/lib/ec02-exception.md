# EC-02 Operator Exception — Policy_Local

**Granted by:** Operator (nmtienctt@gmail.com)
**Date:** 2026-06-08
**Scope:** Policy_Local local application only

## Exception Rule

EC-02 boundary is replaced by a **date-aware disclaimer model**:

| `freshnessStatus` | `answerClass` | Disclaimer shown |
|---|---|---|
| `effective` | `DIRECT_CITED_ANSWER` | None |
| `not_yet_in_force` | `DIRECT_CITED_ANSWER` | "Văn bản có hiệu lực từ [effectiveDate], chưa áp dụng được trước ngày đó." |
| `amended` | `DIRECT_CITED_ANSWER` | "Văn bản đã được sửa đổi — kiểm tra phiên bản mới nhất." |
| `repealed` | `SUMMARY_WITH_SOURCE` | "Văn bản đã hết hiệu lực." |
| `unknown` | `SUMMARY_WITH_SOURCE` | "Trạng thái hiệu lực chưa xác định." |

## Rationale

Laws in Vietnam (and most jurisdictions) are promulgated with a future
effective date — typically 6 months to 1 year after signing. The gap between
`issuedDate` and `effectiveDate` is normal and expected. Users of Policy_Local
need full content access during this preparation period. The disclaimer
preserves the legal accuracy signal without blocking useful retrieval.

## What is NOT changed

- `ESCALATE_OR_ABSTAIN` still applies for: out-of-corpus queries,
  jurisdiction mismatch, genuinely unknown status with no source document.
- Freshness disclosure label is always included in query receipts.
- `repealed` documents remain `SUMMARY_WITH_SOURCE` — citing a repealed law
  as authoritative is a real risk, not just a timing issue.

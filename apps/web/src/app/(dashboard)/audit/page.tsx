'use client';
import { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { Icon } from '@/components/ui/Icon';
import { AnswerBadge } from '@/components/ui/Badges';
import { PageHead } from '@/components/ui/PageHead';
import { Drawer } from '@/components/ui/Overlays';

type QueryRow = {
  id: string; kind: string; query_text: string; answer_class: string | null;
  results: number; sources: number; created_at: string;
};
type Receipt = {
  receiptId: string; queryText: string; normalizedQuery: string; queryTimestamp: string;
  filtersApplied: Record<string, string>;
  candidateCountBefore: number; candidateCountAfter: number; excludedCount: number;
  citations: { sourcePath: string; snippet: string; freshnessStatus: string }[];
  answerClass: string; boundaryNote: string;
  freshnessDisclosureApplied: boolean;
  disclosures: { corpusRecordId: string; note: string }[];
};

const iconBtnH: React.CSSProperties = {
  width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)',
  background: 'var(--surface-2)', display: 'grid', placeItems: 'center',
  cursor: 'pointer', color: 'var(--text-3)',
};

function fmtDateTime(iso: string) {
  try {
    const d = new Date(iso);
    const date = d.toLocaleDateString('vi-VN');
    const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    return { date, time };
  } catch { return { date: '', time: '' }; }
}

export default function AuditPage() {
  const { t } = useApp();
  const [logs, setLogs] = useState<QueryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [kindFilter, setKindFilter] = useState('');
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [page, setPage] = useState(0);
  const LIMIT = 20;

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: String(LIMIT), offset: String(page * LIMIT) });
    if (kindFilter) params.set('kind', kindFilter);
    fetch('/api/audit?' + params)
      .then(r => r.json())
      .then(data => setLogs(data.logs || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [kindFilter, page]);

  useEffect(() => { load(); }, [load]);

  const openReceipt = (id: string) => {
    setReceiptLoading(true);
    fetch('/api/audit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
      .then(r => r.json())
      .then(data => { if (data.receipt) setReceipt(data.receipt); })
      .catch(() => {})
      .finally(() => setReceiptLoading(false));
  };

  const exportCsv = () => {
    const rows = [['ID', 'Loại', 'Truy vấn', 'Kết quả', 'Nguồn', 'Thời gian']];
    logs.forEach(q => rows.push([q.id, q.kind, q.query_text, String(q.results), String(q.sources), q.created_at]));
    const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a'); a.href = url; a.download = 'audit-log.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="anim-up">
      <PageHead title={t('audit.title')} sub={t('audit.sub')} actions={
        <button type="button" className="btn btn-ghost" onClick={exportCsv}>
          <Icon name="download" size={15} />{t('audit.export')}
        </button>
      } />

      {/* filter bar */}
      <div className="card" style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        {([['', 'Tất cả'], ['chat', t('kind.chat')], ['search', t('kind.search')]] as [string, string][]).map(([val, lb]) => (
          <button key={val} type="button" className="btn btn-sm"
            onClick={() => { setKindFilter(val); setPage(0); }}
            style={{ background: kindFilter === val ? 'var(--accent-soft)' : 'var(--surface-2)', color: kindFilter === val ? 'var(--accent-text)' : 'var(--text-2)', border: '1px solid ' + (kindFilter === val ? 'var(--accent-border)' : 'var(--border)') }}>
            {lb}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', fontSize: 12.5, color: 'var(--text-3)' }}>
          {loading ? '…' : `${logs.length} mục`}
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--text-3)', fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.04em', background: 'var(--surface-2)' }}>
              <th style={{ padding: '11px 16px' }}>{t('audit.col.time')}</th>
              <th style={{ padding: '11px 12px' }}>{t('audit.col.kind')}</th>
              <th style={{ padding: '11px 12px' }}>{t('audit.col.query')}</th>
              <th style={{ padding: '11px 12px' }}>{t('audit.col.result')}</th>
              <th style={{ padding: '11px 12px' }}>{t('audit.col.source')}</th>
              <th style={{ padding: '11px 16px', textAlign: 'right' }}>{t('audit.col.detail')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={6} style={{ padding: '12px 16px' }}>
                    <div className="shimmer" style={{ height: 20, borderRadius: 6, width: '100%' }} />
                  </td>
                </tr>
              ))
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13.5 }}>
                  Chưa có lịch sử tra cứu.
                </td>
              </tr>
            ) : (
              logs.map(q => {
                const { date, time } = fmtDateTime(q.created_at);
                return (
                  <tr key={q.id} onClick={() => openReceipt(q.id)}
                    style={{ borderTop: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.14s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                    <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{time} · {date}</td>
                    <td style={{ padding: '12px 12px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--text-2)' }}>
                        <Icon name={q.kind === 'chat' ? 'chat' : 'search'} size={13} />{t('kind.' + q.kind)}
                      </span>
                    </td>
                    <td style={{ padding: '12px 12px', maxWidth: 280 }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{q.query_text}</span>
                    </td>
                    <td style={{ padding: '12px 12px' }}>
                      {q.kind === 'chat' && q.answer_class
                        ? <AnswerBadge value={q.answer_class} />
                        : <span style={{ fontSize: 12.5, color: 'var(--text-2)' }}>{q.results} {t('common.results')}</span>}
                    </td>
                    <td style={{ padding: '12px 12px', fontSize: 12.5, color: 'var(--text-2)' }}>
                      {q.sources > 0 ? `${q.sources} ${t('common.sources')}` : '—'}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button type="button" style={{ border: 'none', background: 'transparent', color: 'var(--accent-text)', cursor: 'pointer' }} title="Xem chi tiết">
                        <Icon name="arrowRight" size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        {logs.length === LIMIT && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, justifyContent: 'center' }}>
            {page > 0 && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPage(p => p - 1)}>
                <Icon name="arrowLeft" size={13} />Trước
              </button>
            )}
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPage(p => p + 1)}>
              Tiếp<Icon name="arrowRight" size={13} />
            </button>
          </div>
        )}
      </div>

      <Drawer open={!!receipt || receiptLoading} onClose={() => setReceipt(null)} width={500}>
        {receiptLoading ? (
          <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3, 4].map(i => <div key={i} className="shimmer" style={{ height: 36, borderRadius: 8 }} />)}
          </div>
        ) : receipt ? (
          <>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center' }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{t('audit.receipt')}</h2>
              <button type="button" onClick={() => setReceipt(null)} title="Đóng" style={{ ...iconBtnH, marginLeft: 'auto' }}>
                <Icon name="x" size={16} />
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 22 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Field label="ID receipt">
                  <code style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--text-3)' }}>{receipt.receiptId}</code>
                </Field>
                <Field label={t('audit.receipt.normalized')}>
                  <code style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{receipt.normalizedQuery}</code>
                </Field>
                <Field label={t('audit.receipt.filters')}>
                  {Object.keys(receipt.filtersApplied).length === 0 ? (
                    <span style={{ color: 'var(--text-3)', fontSize: 13 }}>Không có bộ lọc</span>
                  ) : (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {Object.entries(receipt.filtersApplied).map(([k, v]) => (
                        <span key={k} className="badge s-gray">{k}: {v}</span>
                      ))}
                    </div>
                  )}
                </Field>
                <Field label={t('audit.receipt.candidates')}>
                  {receipt.candidateCountBefore} văn bản trước lọc → {receipt.candidateCountAfter} kết quả
                </Field>
                {receipt.excludedCount > 0 && (
                  <Field label={t('audit.receipt.excluded')}>{receipt.excludedCount} văn bản</Field>
                )}
                <Field label="Answer class">
                  <AnswerBadge value={receipt.answerClass} />
                </Field>
                {receipt.citations.length > 0 && (
                  <Field label={t('audit.receipt.citations')}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {receipt.citations.map((c, i) => (
                        <div key={i} style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--surface-2)', fontSize: 12.5 }}>
                          <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-text)', marginBottom: 4 }}>{c.sourcePath}</div>
                          <div style={{ color: 'var(--text-3)', lineHeight: 1.55 }}>{c.snippet.slice(0, 160)}…</div>
                        </div>
                      ))}
                    </div>
                  </Field>
                )}
                {receipt.disclosures.length > 0 && (
                  <Field label="Freshness disclosures">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {receipt.disclosures.map((d, i) => (
                        <div key={i} style={{ display: 'flex', gap: 8, padding: '8px 11px', borderRadius: 8, background: 'var(--amber-bg)', fontSize: 12.5 }}>
                          <Icon name="info" size={14} style={{ color: 'var(--amber-text)', flex: 'none', marginTop: 1 }} />
                          <span style={{ color: 'var(--text-2)' }}>{d.note}</span>
                        </div>
                      ))}
                    </div>
                  </Field>
                )}
                {receipt.boundaryNote && (
                  <Field label="Boundary note">
                    <span style={{ fontSize: 12.5, color: 'var(--text-2)', fontStyle: 'italic' }}>{receipt.boundaryNote}</span>
                  </Field>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 9, background: 'var(--green-bg)', border: '1px solid color-mix(in oklch, var(--green-solid) 24%, transparent)' }}>
                  <Icon name="shieldCheck" size={16} style={{ color: 'var(--green-text)' }} />
                  <span style={{ fontSize: 13, color: 'var(--green-text)', fontWeight: 500 }}>{t('audit.receipt.verified')}</span>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </Drawer>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 13.5, color: 'var(--text)' }}>{children}</div>
    </div>
  );
}

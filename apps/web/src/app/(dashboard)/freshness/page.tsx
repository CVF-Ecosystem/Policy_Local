'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Icon } from '@/components/ui/Icon';
import { DocTypeBadge, FreshBadge } from '@/components/ui/Badges';
import { PageHead } from '@/components/ui/PageHead';
import { Modal } from '@/components/ui/Overlays';
import { toast } from '@/components/ui/Toast';

type CorpusRow = {
  id: string; file_name: string; document_type: string;
  freshness_status: string; effective_date: string | null;
  issuing_body: string | null; updated_at: string;
};
type Stats = {
  total: number; effective: number; amended: number;
  repealed: number; unknown: number; flagged: number;
};

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

export default function FreshnessPage() {
  const { t } = useApp();
  const router = useRouter();
  const [filter, setFilter] = useState<string | null>(null);
  const [rows, setRows] = useState<CorpusRow[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, effective: 0, amended: 0, repealed: 0, unknown: 0, flagged: 0 });
  const [loading, setLoading] = useState(true);
  const [updateItem, setUpdateItem] = useState<CorpusRow | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter) params.set('freshness', filter);
    else params.set('flaggedOnly', '1');
    fetch('/api/corpus?' + params)
      .then(r => r.json())
      .then(data => {
        if (data.records) setRows(data.records);
        if (data.stats) setStats(data.stats);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const openUpdate = (row: CorpusRow) => {
    setUpdateItem(row);
    setNewStatus(row.freshness_status);
    setNote('');
  };

  const saveStatus = () => {
    if (!updateItem) return;
    setSaving(true);
    fetch('/api/corpus', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: updateItem.id, freshnessStatus: newStatus, note }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.ok) {
          toast('Đã cập nhật trạng thái', { kind: 'success' });
          setUpdateItem(null);
          load();
        } else {
          toast(data.error || 'Lỗi cập nhật', { kind: 'error' });
        }
      })
      .catch(() => toast('Lỗi kết nối', { kind: 'error' }))
      .finally(() => setSaving(false));
  };

  const exportCsv = () => {
    const headers = ['ID', 'Tên văn bản', 'Loại', 'Trạng thái', 'Ngày hiệu lực', 'Cơ quan'];
    const csvRows = [headers, ...rows.map(r => [r.id, r.file_name, r.document_type, r.freshness_status, r.effective_date || '', r.issuing_body || ''])];
    const csv = csvRows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a'); a.href = url; a.download = 'freshness-report.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const cards = [
    { k: 'effective', v: stats.effective, c: 'green' },
    { k: 'amended', v: stats.amended, c: 'amber' },
    { k: 'repealed', v: stats.repealed, c: 'red' },
    { k: 'unknown', v: stats.unknown, c: 'gray' },
  ];

  return (
    <div className="anim-up">
      <PageHead title={t('fresh.title')} actions={
        <>
          <button type="button" className="btn btn-ghost" onClick={exportCsv}>
            <Icon name="download" size={15} />{t('fresh.export')}
          </button>
          <button type="button" className="btn btn-primary" onClick={() => router.push('/corpus')}>
            <Icon name="refresh" size={15} />{t('fresh.runAll')}
          </button>
        </>
      } />

      {/* status filter cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 18 }}>
        {cards.map(c => (
          <button key={c.k} type="button" onClick={() => setFilter(filter === c.k ? null : c.k)} className="card"
            style={{ padding: 16, textAlign: 'left', cursor: 'pointer', borderColor: filter === c.k ? 'var(--accent)' : 'var(--border)', boxShadow: filter === c.k ? '0 0 0 3px var(--accent-soft)' : 'var(--shadow-sm)', background: 'var(--surface)', border: '1px solid', fontFamily: 'var(--font-sans)', transition: 'all 0.18s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <span className={'badge-dot dot-' + c.c} style={{ width: 11, height: 11 }} />
              {loading
                ? <span className="shimmer" style={{ display: 'inline-block', width: 40, height: 28, borderRadius: 6 }} />
                : <span style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em' }}>{c.v}</span>}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 6 }}>{t('fs.' + c.k)}</div>
          </button>
        ))}
      </div>

      <div style={{ fontSize: 12.5, color: 'var(--text-3)', marginBottom: 10 }}>
        {filter ? `Lọc: ${t('fs.' + filter)} — ${rows.length} văn bản` : `Văn bản cần chú ý — ${rows.length} mục`}
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--text-3)', fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.04em', background: 'var(--surface-2)' }}>
                <th style={{ padding: '11px 16px' }}>{t('corpus.col.name')}</th>
                <th style={{ padding: '11px 12px' }}>{t('fresh.col.current')}</th>
                <th style={{ padding: '11px 12px' }}>{t('common.effectiveFrom')}</th>
                <th style={{ padding: '11px 12px' }}>{t('common.lastChecked')}</th>
                <th style={{ padding: '11px 16px', textAlign: 'right' }}>{t('fresh.col.action')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} style={{ padding: '13px 16px' }}>
                      <div className="shimmer" style={{ height: 22, borderRadius: 6, width: '100%' }} />
                    </td>
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '36px 16px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13.5 }}>
                    {filter ? 'Không có văn bản với trạng thái này.' : 'Tất cả văn bản đều đang có hiệu lực.'}
                  </td>
                </tr>
              ) : (
                rows.map(row => (
                  <tr key={row.id} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '13px 16px', maxWidth: 280 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                        <DocTypeBadge type={row.document_type} />
                        <span style={{ flex: 1, minWidth: 0, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.file_name}</span>
                      </div>
                      {row.issuing_body && (
                        <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 3, paddingLeft: 0 }}>{row.issuing_body}</div>
                      )}
                    </td>
                    <td style={{ padding: '13px 12px' }}><FreshBadge status={row.freshness_status} /></td>
                    <td style={{ padding: '13px 12px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{fmtDate(row.effective_date)}</td>
                    <td style={{ padding: '13px 12px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{fmtDate(row.updated_at?.slice(0, 10))}</td>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => openUpdate(row)}>{t('fresh.act.update')}</button>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => router.push('/search')} title={t('fresh.act.replace')}>
                          <Icon name="search" size={13} />
                        </button>
                        <button type="button" className="btn btn-ghost btn-sm" title={t('fresh.act.ack')}
                          onClick={() => toast('Đã đánh dấu', { kind: 'success' })}>
                          <Icon name="check" size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={!!updateItem} onClose={() => setUpdateItem(null)} width={440}>
        {updateItem && (
          <>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{t('fresh.act.update')}</h2>
              <p style={{ fontSize: 13, color: 'var(--text-3)', margin: '4px 0 0' }}>{updateItem.file_name}</p>
            </div>
            <div style={{ padding: 22 }}>
              <span className="label-cap" style={{ display: 'block', marginBottom: 10 }}>{t('fresh.col.current')}</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {(['effective', 'not_yet_in_force', 'amended', 'repealed', 'unknown'] as const).map(fs => (
                  <label key={fs} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 9, border: '1px solid ' + (newStatus === fs ? 'var(--accent)' : 'var(--border)'), cursor: 'pointer', fontSize: 13.5, background: newStatus === fs ? 'var(--accent-soft)' : 'var(--surface-2)', transition: 'all 0.16s' }}>
                    <input type="radio" name="newfs" checked={newStatus === fs} onChange={() => setNewStatus(fs)} style={{ accentColor: 'var(--accent)' }} />
                    <FreshBadge status={fs} />
                  </label>
                ))}
              </div>
              <span className="label-cap" style={{ display: 'block', marginBottom: 8 }}>{t('fresh.col.note')}</span>
              <textarea className="field" rows={2} style={{ resize: 'vertical' }} placeholder="Ghi chú sửa đổi…" value={note} onChange={e => setNote(e.target.value)} />
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setUpdateItem(null)}>{t('common.cancel')}</button>
                <button type="button" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={saving} onClick={saveStatus}>
                  {saving ? <Icon name="refresh" size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : null}
                  {t('common.save')}
                </button>
              </div>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}

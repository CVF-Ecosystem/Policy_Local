'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Icon } from '@/components/ui/Icon';
import { DocTypeBadge, FreshBadge } from '@/components/ui/Badges';
import { PageHead } from '@/components/ui/PageHead';
import { Modal } from '@/components/ui/Overlays';
import { toast } from '@/components/ui/Toast';
import { CORPUS, CROSS_REFS, STATS } from '@/lib/mock';

export default function FreshnessPage() {
  const { t } = useApp();
  const router = useRouter();
  const [filter, setFilter] = useState<string | null>(null);
  const [updateItem, setUpdateItem] = useState<typeof CORPUS[0] | null>(null);
  const S = STATS;

  const cards = [
    { k: 'effective', v: S.effective, c: 'green' },
    { k: 'amended', v: S.amended, c: 'amber' },
    { k: 'repealed', v: S.repealed, c: 'red' },
    { k: 'unknown', v: S.unknown, c: 'gray' },
  ];

  let rows = CORPUS.filter(c => c.freshnessStatus === 'amended' || c.freshnessStatus === 'repealed' || c.freshnessStatus === 'draft');
  if (filter) rows = rows.filter(c => c.freshnessStatus === filter);

  return (
    <div className="anim-up">
      <PageHead title={t('fresh.title')} actions={
        <>
          <button className="btn btn-ghost"><Icon name="download" size={15} />{t('fresh.export')}</button>
          <button className="btn btn-primary"><Icon name="refresh" size={15} />{t('fresh.runAll')}</button>
        </>
      } />

      {/* status filter cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 18 }}>
        {cards.map(c => (
          <button key={c.k} onClick={() => setFilter(filter === c.k ? null : c.k)} className="card"
            style={{ padding: 16, textAlign: 'left', cursor: 'pointer', borderColor: filter === c.k ? 'var(--accent)' : 'var(--border)', boxShadow: filter === c.k ? '0 0 0 3px var(--accent-soft)' : 'var(--shadow-sm)', background: 'var(--surface)', border: '1px solid', fontFamily: 'var(--font-sans)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <span className={'badge-dot dot-' + c.c} style={{ width: 11, height: 11 }} />
              <span style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em' }}>{c.v}</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 6 }}>{t('fs.' + c.k)}</div>
          </button>
        ))}
      </div>

      {/* table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--text-3)', fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '11px 16px' }}>{t('corpus.col.name')}</th>
                <th style={{ padding: '11px 12px' }}>{t('fresh.col.current')}</th>
                <th style={{ padding: '11px 12px' }}>{t('fresh.col.note')}</th>
                <th style={{ padding: '11px 12px' }}>{t('common.lastChecked')}</th>
                <th style={{ padding: '11px 16px', textAlign: 'right' }}>{t('fresh.col.action')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(c => {
                const xref = CROSS_REFS[c.id];
                return (
                  <tr key={c.id} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '13px 16px', maxWidth: 280 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                        <DocTypeBadge type={c.documentType} />
                        <span style={{ flex: 1, minWidth: 0, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.fileName}</span>
                      </div>
                    </td>
                    <td style={{ padding: '13px 12px' }}><FreshBadge status={c.freshnessStatus} /></td>
                    <td style={{ padding: '13px 12px', maxWidth: 300, color: 'var(--text-2)', fontSize: 12.5 }}>
                      {xref ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <Icon name="link" size={12} style={{ color: 'var(--text-3)', flex: 'none' }} />{xref.note}
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ padding: '13px 12px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>01/06/2026</td>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        {xref && (
                          <button className="btn btn-soft btn-sm" title={t('fresh.act.compare')}>
                            <Icon name="scale" size={13} />{t('fresh.act.compare')}
                          </button>
                        )}
                        <button className="btn btn-ghost btn-sm" onClick={() => setUpdateItem(c)}>{t('fresh.act.update')}</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => router.push('/search')} title={t('fresh.act.replace')}>
                          <Icon name="search" size={13} />
                        </button>
                        <button className="btn btn-ghost btn-sm" title={t('fresh.act.ack')}
                          onClick={() => toast('Đã đánh dấu', { kind: 'success' })}>
                          <Icon name="check" size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={!!updateItem} onClose={() => setUpdateItem(null)} width={440}>
        {updateItem && (
          <>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{t('fresh.act.update')}</h2>
              <p style={{ fontSize: 13, color: 'var(--text-3)', margin: '4px 0 0' }}>{updateItem.fileName}</p>
            </div>
            <div style={{ padding: 22 }}>
              <span className="label-cap" style={{ display: 'block', marginBottom: 10 }}>{t('fresh.col.current')}</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {(['effective', 'amended', 'repealed', 'obsolete'] as const).map(fs => (
                  <label key={fs} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 9, border: '1px solid var(--border)', cursor: 'pointer', fontSize: 13.5 }}>
                    <input type="radio" name="newfs" defaultChecked={fs === updateItem.freshnessStatus} style={{ accentColor: 'var(--accent)' }} />
                    <FreshBadge status={fs} />
                  </label>
                ))}
              </div>
              <span className="label-cap" style={{ display: 'block', marginBottom: 8 }}>{t('fresh.col.note')}</span>
              <textarea className="field" rows={2} style={{ resize: 'vertical' }} placeholder="Ghi chú sửa đổi…" />
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setUpdateItem(null)}>{t('common.cancel')}</button>
                <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => { setUpdateItem(null); toast('Đã cập nhật trạng thái', { kind: 'success' }); }}>
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

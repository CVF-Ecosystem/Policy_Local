'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Icon } from '@/components/ui/Icon';
import { DocTypeBadge, FreshBadge, SensBadge } from '@/components/ui/Badges';
import { PageHead } from '@/components/ui/PageHead';
import { Drawer } from '@/components/ui/Overlays';
import { toast } from '@/components/ui/Toast';

type CorpusRow = {
  id: string; file_name: string; document_type: string; issuing_body: string | null;
  effective_date: string | null; freshness_status: string; sensitivity: string;
  processing_status: string; jurisdiction: string | null; authority_level: string | null;
  answer_class: string | null; topic_tags: string[]; imported_at: string;
};

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

const iconBtnH: React.CSSProperties = {
  width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)',
  display: 'grid', placeItems: 'center', cursor: 'pointer', color: 'var(--text-3)',
};

function CorpusDrawer({ item, onClose, onDelete }: {
  item: CorpusRow | null; onClose: () => void; onDelete: (id: string) => void;
}) {
  const { t } = useApp();
  const router = useRouter();
  if (!item) return null;

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '11px 0', borderTop: '1px solid var(--border)' }}>
      <span style={{ fontSize: 13, color: 'var(--text-3)' }}>{label}</span>
      <span style={{ fontSize: 13.5, fontWeight: 500, textAlign: 'right' }}>{children}</span>
    </div>
  );

  const handleDelete = async () => {
    if (!confirm(`Xóa "${item.file_name}" khỏi corpus?`)) return;
    await fetch('/api/corpus', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: item.id }) });
    toast('Đã xóa văn bản', { kind: 'success' });
    onDelete(item.id);
    onClose();
  };

  return (
    <Drawer open={!!item} onClose={onClose} width={480}>
      <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <DocTypeBadge type={item.document_type} /><FreshBadge status={item.freshness_status} />
          </div>
          <h2 style={{ fontSize: 17, fontWeight: 600, margin: 0, lineHeight: 1.3, letterSpacing: '-0.01em' }}>{item.file_name}</h2>
        </div>
        <button onClick={onClose} style={iconBtnH} title="Đóng"><Icon name="x" size={16} /></button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 22px 22px' }}>
        <div style={{ marginTop: 14 }}>
          <span className="label-cap">{t('corpus.drawer.metadata')}</span>
          <div style={{ marginTop: 6 }}>
            <Field label={t('corpus.col.body')}>{item.issuing_body || '—'}</Field>
            <Field label={t('common.effectiveFrom')}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5 }}>{fmtDate(item.effective_date)}</span>
            </Field>
            <Field label={t('corpus.filter.sensitivity')}><SensBadge value={item.sensitivity} /></Field>
            <Field label="Thẩm quyền">
              <span style={{ fontSize: 12.5, color: 'var(--text-2)' }}>{item.authority_level || '—'}</span>
            </Field>
            <Field label="ID">
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--text-2)' }}>{item.id.slice(0, 24)}…</span>
            </Field>
          </div>
          {item.topic_tags?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
              {item.topic_tags.map(tg => (
                <span key={tg} style={{ fontSize: 11.5, padding: '3px 9px', borderRadius: 99, background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-2)' }}>#{tg}</span>
              ))}
            </div>
          )}
        </div>

        {(item.freshness_status === 'amended' || item.freshness_status === 'not_yet_in_force') && (
          <div style={{ marginTop: 20, padding: 14, borderRadius: 11, background: 'var(--amber-bg)', border: '1px solid color-mix(in oklch, var(--amber-solid) 30%, transparent)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Icon name="alert" size={15} style={{ color: 'var(--amber-text)' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--amber-text)' }}>
                {item.freshness_status === 'not_yet_in_force'
                  ? `Có hiệu lực từ ${fmtDate(item.effective_date)}`
                  : t('fresh.amendedBy')}
              </span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0, lineHeight: 1.5 }}>
              {item.freshness_status === 'not_yet_in_force'
                ? 'Văn bản chưa có hiệu lực — có thể tra cứu nội dung để chuẩn bị.'
                : 'Kiểm tra phiên bản sửa đổi mới nhất trước khi áp dụng.'}
            </p>
          </div>
        )}

        {item.freshness_status === 'repealed' && (
          <div style={{ marginTop: 20, padding: 14, borderRadius: 11, background: 'var(--red-bg)', border: '1px solid color-mix(in oklch, var(--red-solid) 30%, transparent)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="x" size={15} style={{ color: 'var(--red-text)' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--red-text)' }}>Văn bản đã hết hiệu lực</span>
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: 16, borderTop: '1px solid var(--border)', display: 'flex', gap: 10 }}>
        <button type="button" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}
          onClick={() => { onClose(); router.push('/search'); }}>
          <Icon name="search" size={15} />{t('corpus.drawer.related')}
        </button>
        <button type="button" className="btn btn-danger" onClick={handleDelete}>
          <Icon name="trash" size={15} />
        </button>
      </div>
    </Drawer>
  );
}

export default function CorpusPage() {
  const { t } = useApp();
  const router = useRouter();
  const [tab, setTab] = useState<'manage' | 'processing'>('manage');
  const [sel, setSel] = useState<string[]>([]);
  const [detail, setDetail] = useState<CorpusRow | null>(null);
  const [q, setQ] = useState('');
  const [showFilter, setShowFilter] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [records, setRecords] = useState<CorpusRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (typeFilter.length === 1) params.set('documentType', typeFilter[0]);
    fetch('/api/corpus?' + params).then(r => r.json()).then(data => {
      setRecords(data.records || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [q, typeFilter]);

  useEffect(() => { load(); }, [load]);

  const ready = records.filter(c => c.processing_status === 'ready');
  const processing = records.filter(c => c.processing_status !== 'ready');
  const rows = tab === 'processing' ? processing : ready;
  const allSel = rows.length > 0 && sel.length === rows.length;

  const toggleType = (dt: string) =>
    setTypeFilter(f => f.includes(dt) ? f.filter(x => x !== dt) : [...f, dt]);

  const handleDelete = (id: string) => setRecords(rs => rs.filter(r => r.id !== id));

  const handleBulkDelete = async () => {
    if (!confirm(`Xóa ${sel.length} văn bản?`)) return;
    await Promise.all(sel.map(id =>
      fetch('/api/corpus', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    ));
    setRecords(rs => rs.filter(r => !sel.includes(r.id)));
    setSel([]);
    toast(`Đã xóa ${sel.length} văn bản`, { kind: 'success' });
  };

  return (
    <div className="anim-up">
      <PageHead title={t('corpus.title')} actions={
        <>
          <button type="button" className="btn btn-ghost"><Icon name="download" size={15} />{t('export.title')}</button>
          <button type="button" className="btn btn-primary" onClick={() => router.push('/corpus/import')}>
            <Icon name="plus" size={16} />{t('nav.corpus.import')}
          </button>
        </>
      } />

      {/* tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', marginBottom: 18 }}>
        {([['manage', `${t('corpus.tab.manage')} (${ready.length})`],
          ['processing', `${t('corpus.tab.processing')} (${processing.length})`]] as [string, string][]).map(([id, lb]) => (
          <button key={id} type="button" onClick={() => { setTab(id as typeof tab); setSel([]); }} style={{
            border: 'none', background: 'transparent', padding: '10px 14px', fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
            color: tab === id ? 'var(--text)' : 'var(--text-3)',
            borderBottom: tab === id ? '2px solid var(--accent)' : '2px solid transparent', marginBottom: -1,
            fontFamily: 'var(--font-sans)',
          }}>{lb}</button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
        {/* filter sidebar */}
        {showFilter && (
          <div className="card" style={{ width: 220, flex: 'none', padding: 16 }}>
            <span className="label-cap" style={{ display: 'block', marginBottom: 14 }}>{t('corpus.filter.doctype')}</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(['law', 'decree', 'circular', 'decision', 'policy', 'sop'] as const).map(dt => (
                <label key={dt} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, cursor: 'pointer', color: 'var(--text-2)' }}>
                  <input type="checkbox" checked={typeFilter.includes(dt)} onChange={() => toggleType(dt)}
                    style={{ accentColor: 'var(--accent)', width: 15, height: 15 }} />
                  {t('dt.' + dt)}
                </label>
              ))}
            </div>
            <div className="hr" style={{ margin: '16px 0' }} />
            <button type="button" className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => setTypeFilter([])}>
              {t('corpus.filter.reset')}
            </button>
          </div>
        )}

        {/* table */}
        <div className="card" style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderBottom: '1px solid var(--border)' }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowFilter(s => !s)}>
              <Icon name="filter" size={15} />
            </button>
            <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
              <Icon name="search" size={15} style={{ position: 'absolute', left: 11, top: 10, color: 'var(--text-3)' }} />
              <input className="field" value={q} onChange={e => setQ(e.target.value)}
                placeholder={t('corpus.searchBox')} style={{ paddingLeft: 32, fontSize: 13.5 }} />
            </div>
            {sel.length > 0 && (
              <div className="anim-in" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12.5, color: 'var(--text-2)' }}>{sel.length} {t('corpus.selected')}</span>
                <button type="button" className="btn btn-danger btn-sm" onClick={handleBulkDelete}>
                  <Icon name="trash" size={13} />{t('corpus.bulk.delete')}
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[1, 2, 3, 4].map(i => <div key={i} className="shimmer" style={{ height: 44, borderRadius: 6 }} />)}
            </div>
          ) : rows.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-3)' }}>
              <Icon name="fileText" size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 8 }}>Corpus trống</div>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => router.push('/corpus/import')}>
                <Icon name="plus" size={14} />{t('nav.corpus.import')}
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: 'var(--text-3)', fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <th style={{ padding: '10px 12px', width: 36 }}>
                      <input type="checkbox" checked={!!allSel} title="Chọn tất cả"
                        onChange={() => setSel(allSel ? [] : rows.map(r => r.id))}
                        style={{ accentColor: 'var(--accent)', width: 15, height: 15 }} />
                    </th>
                    <th style={{ padding: '10px 12px' }}>{t('corpus.col.name')}</th>
                    <th style={{ padding: '10px 12px' }}>{t('corpus.col.type')}</th>
                    <th style={{ padding: '10px 12px' }}>{t('corpus.col.body')}</th>
                    <th style={{ padding: '10px 12px' }}>{t('corpus.col.date')}</th>
                    <th style={{ padding: '10px 12px' }}>{t('corpus.col.fresh')}</th>
                    <th style={{ padding: '10px 12px', width: 40 }} />
                  </tr>
                </thead>
                <tbody>
                  {rows.map(c => (
                    <tr key={c.id} onClick={() => setDetail(c)}
                      style={{ borderTop: '1px solid var(--border)', cursor: 'pointer' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                      <td style={{ padding: '11px 12px' }} onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={sel.includes(c.id)} title={`Chọn ${c.file_name}`}
                          onChange={() => setSel(s => s.includes(c.id) ? s.filter(x => x !== c.id) : [...s, c.id])}
                          style={{ accentColor: 'var(--accent)', width: 15, height: 15 }} />
                      </td>
                      <td style={{ padding: '11px 12px', maxWidth: 300, width: '40%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                          <Icon name="fileText" size={15} style={{ color: 'var(--text-3)', flex: 'none' }} />
                          <span style={{ flex: 1, minWidth: 0, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.file_name}</span>
                          {c.sensitivity !== 'public' && <Icon name="lock" size={12} style={{ color: 'var(--text-3)', flex: 'none' }} />}
                        </div>
                      </td>
                      <td style={{ padding: '11px 12px' }}><DocTypeBadge type={c.document_type} /></td>
                      <td style={{ padding: '11px 12px', color: 'var(--text-2)', whiteSpace: 'nowrap' }}>{c.issuing_body || '—'}</td>
                      <td style={{ padding: '11px 12px', color: 'var(--text-2)', fontFamily: 'var(--font-mono)', fontSize: 12.5 }}>{fmtDate(c.effective_date)}</td>
                      <td style={{ padding: '11px 12px' }}><FreshBadge status={c.freshness_status} /></td>
                      <td style={{ padding: '11px 12px' }} onClick={e => e.stopPropagation()}>
                        <button type="button" title="Tùy chọn" style={{ border: 'none', background: 'transparent', color: 'var(--text-3)', cursor: 'pointer' }}>
                          <Icon name="more" size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <CorpusDrawer item={detail} onClose={() => setDetail(null)} onDelete={handleDelete} />
    </div>
  );
}

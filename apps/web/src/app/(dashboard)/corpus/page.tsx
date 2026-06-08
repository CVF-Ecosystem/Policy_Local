'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Icon } from '@/components/ui/Icon';
import { DocTypeBadge, FreshBadge, SensBadge } from '@/components/ui/Badges';
import { PageHead } from '@/components/ui/PageHead';
import { Drawer } from '@/components/ui/Overlays';
import { CORPUS, CROSS_REFS, CorpusItem } from '@/lib/mock';

function fmtDate(iso: string | undefined) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

const iconBtnH: React.CSSProperties = {
  width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)',
  display: 'grid', placeItems: 'center', cursor: 'pointer', color: 'var(--text-3)',
};

function CorpusDrawer({ item, onClose }: { item: CorpusItem | null; onClose: () => void }) {
  const { t } = useApp();
  const router = useRouter();
  if (!item) return null;
  const xref = CROSS_REFS[item.id];
  const xrefTarget = xref?.target ? CORPUS.find(c => c.id === xref.target) : null;

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '11px 0', borderTop: '1px solid var(--border)' }}>
      <span style={{ fontSize: 13, color: 'var(--text-3)' }}>{label}</span>
      <span style={{ fontSize: 13.5, fontWeight: 500, textAlign: 'right' }}>{children}</span>
    </div>
  );

  return (
    <Drawer open={!!item} onClose={onClose} width={480}>
      <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <DocTypeBadge type={item.documentType} /><FreshBadge status={item.freshnessStatus} />
          </div>
          <h2 style={{ fontSize: 17, fontWeight: 600, margin: 0, lineHeight: 1.3, letterSpacing: '-0.01em' }}>{item.fileName}</h2>
        </div>
        <button onClick={onClose} style={iconBtnH}><Icon name="x" size={16} /></button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 22px 22px' }}>
        <div style={{ marginTop: 14 }}>
          <span className="label-cap">{t('corpus.drawer.metadata')}</span>
          <div style={{ marginTop: 6 }}>
            <Field label={t('corpus.col.body')}>{item.issuingBody}</Field>
            <Field label={t('common.effectiveFrom')}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5 }}>{fmtDate(item.effectiveDate)}</span>
            </Field>
            <Field label={t('corpus.filter.sensitivity')}><SensBadge value={item.sensitivity} /></Field>
            <Field label="ID">
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-2)' }}>{item.id}</span>
            </Field>
          </div>
          {item.topicTags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
              {item.topicTags.map(tg => (
                <span key={tg} style={{ fontSize: 11.5, padding: '3px 9px', borderRadius: 99, background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-2)' }}>#{tg}</span>
              ))}
            </div>
          )}
        </div>

        {xref && (
          <div style={{ marginTop: 20, padding: 14, borderRadius: 11, background: 'var(--amber-bg)', border: '1px solid color-mix(in oklch, var(--amber-solid) 30%, transparent)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Icon name="link" size={15} style={{ color: 'var(--amber-text)' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--amber-text)' }}>
                {xref.type === 'replaced_by' ? t('fresh.replacedBy') : t('fresh.amendedBy')}
              </span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0, lineHeight: 1.5 }}>{xref.note}</p>
            {xrefTarget && (
              <div onClick={() => { onClose(); router.push('/corpus'); }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, padding: '9px 11px', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)', cursor: 'pointer' }}>
                <DocTypeBadge type={xrefTarget.documentType} />
                <span style={{ fontSize: 12.5, fontWeight: 500, flex: 1 }}>{xrefTarget.fileName}</span>
                <Icon name="arrowRight" size={14} style={{ color: 'var(--accent)' }} />
              </div>
            )}
          </div>
        )}

        {item.matchedSection && (
          <div style={{ marginTop: 20 }}>
            <span className="label-cap">{t('corpus.drawer.excerpt')}</span>
            <div style={{ fontSize: 13, fontWeight: 600, margin: '8px 0 4px' }}>{item.matchedSection}</div>
            <p className="excerpt" style={{ margin: '4px 0 0' }}>
              "Cổ đông phổ thông có quyền tham dự, phát biểu và biểu quyết tại cuộc họp Đại hội đồng cổ đông theo quy định của pháp luật và Điều lệ công ty…"
            </p>
          </div>
        )}
      </div>

      <div style={{ padding: 16, borderTop: '1px solid var(--border)', display: 'flex', gap: 10 }}>
        <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}
          onClick={() => { onClose(); router.push('/search'); }}>
          <Icon name="eye" size={15} />{t('common.openSource')}
        </button>
        <button className="btn btn-ghost" onClick={() => { onClose(); router.push('/search'); }}>
          <Icon name="search" size={15} />
        </button>
        <button className="btn btn-danger"><Icon name="trash" size={15} /></button>
      </div>
    </Drawer>
  );
}

export default function CorpusPage() {
  const { t } = useApp();
  const router = useRouter();
  const [tab, setTab] = useState<'manage' | 'processing'>('manage');
  const [sel, setSel] = useState<string[]>([]);
  const [detail, setDetail] = useState<CorpusItem | null>(null);
  const [q, setQ] = useState('');
  const [showFilter, setShowFilter] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);

  const all = CORPUS;
  let rows = tab === 'processing'
    ? all.filter(c => c.processingStatus !== 'ready')
    : all.filter(c => c.processingStatus === 'ready');
  if (q) rows = rows.filter(c => c.fileName.toLowerCase().includes(q.toLowerCase()));
  if (typeFilter.length) rows = rows.filter(c => typeFilter.includes(c.documentType));

  const toggleType = (dt: string) =>
    setTypeFilter(f => f.includes(dt) ? f.filter(x => x !== dt) : [...f, dt]);
  const allSel = rows.length > 0 && sel.length === rows.length;

  return (
    <div className="anim-up">
      <PageHead title={t('corpus.title')} actions={
        <>
          <button className="btn btn-ghost"><Icon name="download" size={15} />{t('export.title')}</button>
          <button className="btn btn-primary" onClick={() => router.push('/corpus/import')}>
            <Icon name="plus" size={16} />{t('nav.corpus.import')}
          </button>
        </>
      } />

      {/* tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', marginBottom: 18 }}>
        {([['manage', `${t('corpus.tab.manage')} (${all.filter(c => c.processingStatus === 'ready').length})`],
          ['processing', `${t('corpus.tab.processing')} (${all.filter(c => c.processingStatus !== 'ready').length})`]] as [string, string][]).map(([id, lb]) => (
          <button key={id} onClick={() => { setTab(id as typeof tab); setSel([]); }} style={{
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
            <span className="label-cap" style={{ display: 'block', marginBottom: 10 }}>{t('corpus.filter.status')}</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {(['effective', 'amended', 'repealed'] as const).map(fs => (
                <label key={fs} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, cursor: 'pointer', color: 'var(--text-2)' }}>
                  <input type="radio" name="fs" style={{ accentColor: 'var(--accent)', width: 15, height: 15 }} />{t('fs.' + fs)}
                </label>
              ))}
            </div>
            <div className="hr" style={{ margin: '16px 0' }} />
            <button className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => setTypeFilter([])}>
              {t('corpus.filter.reset')}
            </button>
          </div>
        )}

        {/* table */}
        <div className="card" style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          {/* toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderBottom: '1px solid var(--border)' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowFilter(s => !s)}>
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
                <button className="btn btn-soft btn-sm"><Icon name="refresh" size={13} />{t('corpus.bulk.check')}</button>
                <button className="btn btn-danger btn-sm"><Icon name="trash" size={13} />{t('corpus.bulk.delete')}</button>
              </div>
            )}
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--text-3)', fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '10px 12px', width: 36 }}>
                    <input type="checkbox" checked={!!allSel}
                      onChange={() => setSel(allSel ? [] : rows.map(r => r.id))}
                      style={{ accentColor: 'var(--accent)', width: 15, height: 15 }} />
                  </th>
                  <th style={{ padding: '10px 12px' }}>{t('corpus.col.name')}</th>
                  <th style={{ padding: '10px 12px' }}>{t('corpus.col.type')}</th>
                  <th style={{ padding: '10px 12px' }}>{t('corpus.col.body')}</th>
                  <th style={{ padding: '10px 12px' }}>{t('corpus.col.date')}</th>
                  <th style={{ padding: '10px 12px' }}>{t('corpus.col.fresh')}</th>
                  <th style={{ padding: '10px 12px', width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {rows.map(c => (
                  <tr key={c.id} onClick={() => setDetail(c)}
                    style={{ borderTop: '1px solid var(--border)', cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                    <td style={{ padding: '11px 12px' }} onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={sel.includes(c.id)}
                        onChange={() => setSel(s => s.includes(c.id) ? s.filter(x => x !== c.id) : [...s, c.id])}
                        style={{ accentColor: 'var(--accent)', width: 15, height: 15 }} />
                    </td>
                    <td style={{ padding: '11px 12px', maxWidth: 300, width: '40%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                        <Icon name="fileText" size={15} style={{ color: 'var(--text-3)', flex: 'none' }} />
                        <span style={{ flex: 1, minWidth: 0, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.fileName}</span>
                        {c.sensitivity !== 'public' && <Icon name="lock" size={12} style={{ color: 'var(--text-3)', flex: 'none' }} />}
                      </div>
                    </td>
                    <td style={{ padding: '11px 12px' }}><DocTypeBadge type={c.documentType} /></td>
                    <td style={{ padding: '11px 12px', color: 'var(--text-2)', whiteSpace: 'nowrap' }}>{c.issuingBody}</td>
                    <td style={{ padding: '11px 12px', color: 'var(--text-2)', fontFamily: 'var(--font-mono)', fontSize: 12.5 }}>{fmtDate(c.effectiveDate)}</td>
                    <td style={{ padding: '11px 12px' }}><FreshBadge status={c.freshnessStatus} /></td>
                    <td style={{ padding: '11px 12px' }} onClick={e => e.stopPropagation()}>
                      <button style={{ border: 'none', background: 'transparent', color: 'var(--text-3)', cursor: 'pointer' }}>
                        <Icon name="more" size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <CorpusDrawer item={detail} onClose={() => setDetail(null)} />
    </div>
  );
}

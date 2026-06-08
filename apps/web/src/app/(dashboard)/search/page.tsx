'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Icon } from '@/components/ui/Icon';
import { DocTypeBadge, FreshBadge, AnswerBadge } from '@/components/ui/Badges';
import { PageHead } from '@/components/ui/PageHead';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Overlays';
import { toast } from '@/components/ui/Toast';
import { CORPUS } from '@/lib/mock';

function fmtDate(iso: string | undefined) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function RelevanceBar({ pct }: { pct: number }) {
  return (
    <span style={{ display: 'inline-block', width: 90, height: 6, borderRadius: 99, background: 'var(--surface-3)', overflow: 'hidden', verticalAlign: 'middle' }}>
      <span style={{ display: 'block', height: '100%', width: pct + '%', background: pct > 70 ? 'var(--green-solid)' : 'var(--amber-solid)', borderRadius: 99 }} />
    </span>
  );
}

const SEARCH_RESULTS = [
  { id: 'ci_02', section: 'Điều 85, Khoản 1 — Mức đóng của người lao động', score: 82, excerpt: 'Người lao động… hằng tháng đóng bằng 8% mức tiền lương tháng vào quỹ hưu trí và tử tuất.', ac: 'DIRECT_CITED_ANSWER' },
  { id: 'ci_05', section: 'Điều 65 — Thời giờ làm thêm trong năm', score: 64, excerpt: 'Tổng số giờ làm thêm không quá 200 giờ trong 01 năm, trừ một số trường hợp được làm thêm không quá 300 giờ.', ac: 'SUMMARY_WITH_SOURCE' },
  { id: 'ci_03', section: 'Điều 113 — Nghỉ hằng năm', score: 58, excerpt: 'Người lao động làm việc đủ 12 tháng cho một người sử dụng lao động thì được nghỉ hằng năm 12 ngày làm việc.', ac: 'DIRECT_CITED_ANSWER' },
  { id: 'ci_09', section: 'Mục II — Quy trình thu BHXH bắt buộc', score: 41, excerpt: 'Đơn vị lập danh sách lao động tham gia BHXH, BHYT và nộp cho cơ quan BHXH theo mẫu D02-TS.', ac: 'PROCEDURAL_GUIDANCE' },
];

interface ResultEntry { id: string; section: string; score: number; excerpt: string; ac: string; }

function CitationModal({ r, onClose }: { r: ResultEntry | null; onClose: () => void }) {
  const { t } = useApp();
  const [fmt, setFmt] = useState<'legal' | 'apa' | 'plain'>('legal');
  const [copied, setCopied] = useState(false);
  if (!r) return null;
  const item = CORPUS.find(c => c.id === r.id)!;
  const sectionShort = r.section.split('—')[0].trim();
  const texts = {
    legal: `${sectionShort} ${item.fileName}`,
    apa: `${item.issuingBody}. (${item.effectiveDate.slice(0, 4)}). ${item.fileName}. ${sectionShort}.`,
    plain: `${item.fileName} — ${r.section} — "${r.excerpt}"`,
  };
  return (
    <Modal open={!!r} onClose={onClose} width={560}>
      <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center' }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{t('search.cite.title')}</h2>
        <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', display: 'grid', placeItems: 'center', cursor: 'pointer', color: 'var(--text-3)', marginLeft: 'auto' }}>
          <Icon name="x" size={16} />
        </button>
      </div>
      <div style={{ padding: 22 }}>
        <div style={{ display: 'flex', gap: 4, background: 'var(--surface-2)', padding: 4, borderRadius: 9, marginBottom: 16 }}>
          {([['legal', t('search.cite.legal')], ['apa', t('search.cite.apa')], ['plain', t('search.cite.plain')]] as const).map(([id, lb]) => (
            <button key={id} onClick={() => setFmt(id)} style={{ flex: 1, border: 'none', padding: 8, borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-sans)', background: fmt === id ? 'var(--surface)' : 'transparent', color: fmt === id ? 'var(--text)' : 'var(--text-3)', boxShadow: fmt === id ? 'var(--shadow-sm)' : 'none' }}>{lb}</button>
          ))}
        </div>
        <div style={{ padding: 16, borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border)', fontFamily: fmt === 'plain' ? 'var(--font-serif)' : 'var(--font-mono)', fontSize: 13.5, lineHeight: 1.6, color: 'var(--text)' }}>
          {texts[fmt]}
        </div>
        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}
          onClick={() => { navigator.clipboard?.writeText(texts[fmt]); setCopied(true); toast('Đã copy!'); setTimeout(() => setCopied(false), 1500); }}>
          <Icon name={copied ? 'check' : 'copy'} size={15} />{copied ? 'Đã copy!' : t('common.copyCitation')}
        </button>
      </div>
    </Modal>
  );
}

export default function SearchPage() {
  const { t } = useApp();
  const router = useRouter();
  const [query, setQuery] = useState('mức đóng BHXH');
  const [chips, setChips] = useState(['effective']);
  const [citeItem, setCiteItem] = useState<ResultEntry | null>(null);
  const [empty, setEmpty] = useState(false);

  const results = empty ? [] : SEARCH_RESULTS.map(r => ({ ...r, item: CORPUS.find(c => c.id === r.id)! })).filter(r => r.item);
  const flaggedCount = results.filter(r => r.item.freshnessStatus === 'amended' || r.item.freshnessStatus === 'repealed').length;

  const allChips: [string, string][] = [
    ['law', t('dt.law')], ['decree', t('dt.decree')], ['circular', t('dt.circular')],
    ['effective', t('fs.effective')], ['internal', t('sv.internal')],
  ];
  const toggleChip = (c: string) => setChips(p => p.includes(c) ? p.filter(x => x !== c) : [...p, c]);

  return (
    <div className="anim-up">
      <PageHead title={t('search.title')} />

      <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
        {/* filter panel */}
        <div className="card" style={{ width: 230, flex: 'none', padding: 16, position: 'sticky', top: 76 }}>
          <span className="label-cap" style={{ display: 'block', marginBottom: 10 }}>{t('corpus.filter.doctype')}</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(['law', 'decree', 'circular', 'decision', 'policy'] as const).map(dt => (
              <label key={dt} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, cursor: 'pointer', color: 'var(--text-2)' }}>
                <input type="checkbox" defaultChecked style={{ accentColor: 'var(--accent)', width: 15, height: 15 }} />{t('dt.' + dt)}
              </label>
            ))}
          </div>
          <div className="hr" style={{ margin: '16px 0' }} />
          <span className="label-cap" style={{ display: 'block', marginBottom: 10 }}>{t('corpus.filter.status')}</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(['effective', 'amended', 'repealed'] as const).map(fs => (
              <label key={fs} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, cursor: 'pointer', color: 'var(--text-2)' }}>
                <input type="checkbox" defaultChecked={fs === 'effective'} style={{ accentColor: 'var(--accent)', width: 15, height: 15 }} />{t('fs.' + fs)}
              </label>
            ))}
          </div>
          <div className="hr" style={{ margin: '16px 0' }} />
          <span className="label-cap" style={{ display: 'block', marginBottom: 10 }}>{t('corpus.filter.date')}</span>
          <div style={{ display: 'flex', gap: 7 }}>
            <input className="field" placeholder="Từ" style={{ padding: '7px 9px', fontSize: 12.5 }} />
            <input className="field" placeholder="Đến" style={{ padding: '7px 9px', fontSize: 12.5 }} />
          </div>
        </div>

        {/* results area */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* search bar */}
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <Icon name="search" size={19} style={{ position: 'absolute', left: 15, top: 14, color: 'var(--text-3)' }} />
            <input className="field" value={query}
              onChange={e => { setQuery(e.target.value); setEmpty(e.target.value.toLowerCase().includes('xyz')); }}
              placeholder={t('search.placeholder')}
              style={{ padding: '13px 16px 13px 44px', fontSize: 15.5, fontWeight: 500 }} />
            <button className="btn btn-soft btn-sm" style={{ position: 'absolute', right: 8, top: 8 }}
              onClick={() => toast('Đã lưu tìm kiếm', { kind: 'success' })}>
              <Icon name="bookmark" size={13} />{t('search.save')}
            </button>
          </div>

          {/* filter chips */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {allChips.map(([c, lb]) => (
              <button key={c} onClick={() => toggleChip(c)} style={{
                fontFamily: 'var(--font-sans)', fontSize: 12.5, fontWeight: 500, padding: '6px 12px', borderRadius: 99, cursor: 'pointer',
                border: '1px solid ' + (chips.includes(c) ? 'var(--accent-border)' : 'var(--border)'),
                background: chips.includes(c) ? 'var(--accent-soft)' : 'var(--surface)',
                color: chips.includes(c) ? 'var(--accent-text)' : 'var(--text-2)',
              }}>{lb}</button>
            ))}
            <button style={{ fontFamily: 'var(--font-sans)', fontSize: 12.5, fontWeight: 500, padding: '6px 12px', borderRadius: 99, cursor: 'pointer', border: '1px dashed var(--border-strong)', background: 'transparent', color: 'var(--text-3)' }}>
              + {t('corpus.filter.all')}…
            </button>
          </div>

          {/* freshness warning banner */}
          {flaggedCount > 0 && !empty && (
            <div className="anim-in" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderRadius: 11, background: 'var(--amber-bg)', border: '1px solid color-mix(in oklch, var(--amber-solid) 32%, transparent)', marginBottom: 16 }}>
              <Icon name="alert" size={18} style={{ color: 'var(--amber-text)', flex: 'none' }} />
              <span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>
                <strong style={{ color: 'var(--amber-text)' }}>{flaggedCount}</strong> {t('search.freshWarn.pre')} {results.length} {t('search.freshWarn')}
              </span>
              <button className="btn btn-sm" style={{ marginLeft: 'auto', background: 'var(--surface)', color: 'var(--amber-text)', border: '1px solid color-mix(in oklch, var(--amber-solid) 30%, transparent)' }}
                onClick={() => router.push('/freshness')}>
                {t('search.detail')}<Icon name="arrowRight" size={13} />
              </button>
            </div>
          )}

          {empty ? (
            <div className="card">
              <EmptyState icon="searchX" title={t('search.empty.title')} desc={t('search.empty.desc')}
                actions={
                  <>
                    <button className="btn btn-ghost" onClick={() => { setQuery('mức đóng BHXH'); setEmpty(false); }}>{t('search.empty.clear')}</button>
                    <button className="btn btn-primary" onClick={() => router.push('/corpus/import')}>
                      <Icon name="plus" size={15} />{t('dash.action.import')}
                    </button>
                  </>
                } />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>{results.length} {t('common.results')} · "{query}"</div>
              {results.map(r => (
                <div key={r.id} className="card" style={{ padding: 18, transition: 'box-shadow 0.18s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-sm)'}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8, flexWrap: 'wrap' }}>
                    <DocTypeBadge type={r.item.documentType} />
                    <span style={{ fontSize: 15.5, fontWeight: 600, letterSpacing: '-0.01em' }}>{r.item.fileName}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 12.5, color: 'var(--text-3)', marginBottom: 12 }}>
                    <span>{r.item.issuingBody}</span><span>·</span>
                    <span>{t('common.effectiveFrom')} {fmtDate(r.item.effectiveDate)}</span><span>·</span>
                    <FreshBadge status={r.item.freshnessStatus} />
                  </div>
                  <div className="hr" />
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', margin: '12px 0 6px' }}>{r.section}</div>
                  <p className="excerpt" style={{ margin: 0, paddingLeft: 14, borderLeft: '2px solid var(--accent)' }}>"{r.excerpt}"</p>
                  <div className="hr" style={{ margin: '14px 0' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{t('common.relevance')}</span>
                    <RelevanceBar pct={r.score} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>{r.score}%</span>
                    <AnswerBadge value={r.ac} />
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                      <button className="btn btn-soft btn-sm">
                        <Icon name="externalLink" size={13} />{t('common.openSource')}
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setCiteItem(r)}>
                        <Icon name="copy" size={13} />{t('common.copyCitation')}
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => router.push('/chat')}>
                        <Icon name="chat" size={13} />{t('search.askThis')}<Icon name="arrowRight" size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <CitationModal r={citeItem} onClose={() => setCiteItem(null)} />
    </div>
  );
}

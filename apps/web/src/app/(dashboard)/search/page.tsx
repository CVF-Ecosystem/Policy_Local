'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Icon } from '@/components/ui/Icon';
import { DocTypeBadge, FreshBadge, AnswerBadge } from '@/components/ui/Badges';
import { PageHead } from '@/components/ui/PageHead';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Overlays';
import { toast } from '@/components/ui/Toast';

type SearchResult = {
  corpusRecordId: string; fileName: string; documentType: string;
  issuingBody: string | null; effectiveDate: string | null;
  freshnessStatus: string; answerClass: string | null;
  chunkId: string; chunkText: string; articleRef: string | null;
  topicTags: string[]; score: number;
};
type Receipt = {
  receiptId: string; boundaryNote: string; freshnessDisclosureApplied: boolean;
  disclosures: { corpusRecordId: string; note: string }[];
  answerClass: string; candidateCountBefore: number; candidateCountAfter: number;
};

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function RelevanceBar({ score }: { score: number }) {
  const pct = Math.min(100, score * 8);
  return (
    <span style={{ display: 'inline-block', width: 90, height: 6, borderRadius: 99, background: 'var(--surface-3)', overflow: 'hidden', verticalAlign: 'middle' }}>
      <span style={{ display: 'block', height: '100%', width: pct + '%', background: pct > 60 ? 'var(--green-solid)' : 'var(--amber-solid)', borderRadius: 99 }} />
    </span>
  );
}

function CitationModal({ r, onClose }: { r: SearchResult | null; onClose: () => void }) {
  const { t } = useApp();
  const [fmt, setFmt] = useState<'legal' | 'apa' | 'plain'>('legal');
  const [copied, setCopied] = useState(false);
  if (!r) return null;
  const section = r.articleRef || r.chunkText.slice(0, 60) + '…';
  const texts = {
    legal: `${r.fileName}${r.articleRef ? ' · ' + r.articleRef : ''}`,
    apa: `${r.issuingBody || ''}. (${r.effectiveDate?.slice(0, 4) || ''}). ${r.fileName}.`,
    plain: `${r.fileName}${r.articleRef ? ' — ' + r.articleRef : ''} — "${r.chunkText.slice(0, 120)}"`,
  };
  return (
    <Modal open={!!r} onClose={onClose} width={560}>
      <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center' }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{t('search.cite.title')}</h2>
        <button type="button" onClick={onClose} title="Đóng" style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', display: 'grid', placeItems: 'center', cursor: 'pointer', color: 'var(--text-3)', marginLeft: 'auto' }}>
          <Icon name="x" size={16} />
        </button>
      </div>
      <div style={{ padding: 22 }}>
        <div style={{ display: 'flex', gap: 4, background: 'var(--surface-2)', padding: 4, borderRadius: 9, marginBottom: 16 }}>
          {([['legal', t('search.cite.legal')], ['apa', t('search.cite.apa')], ['plain', t('search.cite.plain')]] as const).map(([id, lb]) => (
            <button key={id} type="button" onClick={() => setFmt(id)} style={{ flex: 1, border: 'none', padding: 8, borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-sans)', background: fmt === id ? 'var(--surface)' : 'transparent', color: fmt === id ? 'var(--text)' : 'var(--text-3)', boxShadow: fmt === id ? 'var(--shadow-sm)' : 'none' }}>{lb}</button>
          ))}
        </div>
        <div style={{ padding: 16, borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border)', fontFamily: fmt === 'plain' ? 'var(--font-serif)' : 'var(--font-mono)', fontSize: 13.5, lineHeight: 1.6, color: 'var(--text)' }}>
          {texts[fmt]}
        </div>
        <button type="button" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}
          onClick={() => { navigator.clipboard?.writeText(texts[fmt]); setCopied(true); toast(t('toast.copied')); setTimeout(() => setCopied(false), 1500); }}>
          <Icon name={copied ? 'check' : 'copy'} size={15} />{copied ? 'Đã copy!' : t('common.copyCitation')}
        </button>
      </div>
    </Modal>
  );
}

export default function SearchPage() {
  const { t } = useApp();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [docTypeFilters, setDocTypeFilters] = useState<string[]>([]);
  const [freshnessFilter, setFreshnessFilter] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [citeItem, setCiteItem] = useState<SearchResult | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = (q: string, docType?: string, freshness?: string) => {
    if (!q.trim()) { setResults([]); setReceipt(null); setSearched(false); return; }
    setLoading(true);
    setSearched(true);
    const params = new URLSearchParams({ q, limit: '20' });
    if (docType) params.set('documentType', docType);
    if (freshness) params.set('freshnessStatus', freshness);
    fetch('/api/search?' + params)
      .then(r => r.json())
      .then(data => { setResults(data.results || []); setReceipt(data.receipt || null); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      doSearch(query, docTypeFilters[0], freshnessFilter);
    }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, docTypeFilters, freshnessFilter]);

  const disclosureMap = new Map(receipt?.disclosures?.map(d => [d.corpusRecordId, d.note]) ?? []);
  const flaggedCount = results.filter(r => disclosureMap.has(r.corpusRecordId)).length;

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
                <input type="checkbox"
                  checked={docTypeFilters.includes(dt)}
                  onChange={() => setDocTypeFilters(f => f.includes(dt) ? f.filter(x => x !== dt) : [...f, dt])}
                  style={{ accentColor: 'var(--accent)', width: 15, height: 15 }} />
                {t('dt.' + dt)}
              </label>
            ))}
          </div>
          <div className="hr" style={{ margin: '16px 0' }} />
          <span className="label-cap" style={{ display: 'block', marginBottom: 10 }}>{t('corpus.filter.status')}</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {([['', t('corpus.filter.all')], ['effective', t('fs.effective')], ['amended', t('fs.amended')], ['not_yet_in_force', 'Chưa có hiệu lực'], ['repealed', t('fs.repealed')]] as [string, string][]).map(([val, lb]) => (
              <label key={val} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, cursor: 'pointer', color: 'var(--text-2)' }}>
                <input type="radio" name="freshness" checked={freshnessFilter === val}
                  onChange={() => setFreshnessFilter(val)}
                  style={{ accentColor: 'var(--accent)', width: 15, height: 15 }} />
                {lb}
              </label>
            ))}
          </div>
          <div className="hr" style={{ margin: '16px 0' }} />
          <button type="button" className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => { setDocTypeFilters([]); setFreshnessFilter(''); }}>
            {t('corpus.filter.reset')}
          </button>
        </div>

        {/* results area */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* search bar */}
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <Icon name="search" size={19} style={{ position: 'absolute', left: 15, top: 14, color: 'var(--text-3)' }} />
            <input className="field" value={query} onChange={e => setQuery(e.target.value)}
              placeholder={t('search.placeholder')}
              style={{ padding: '13px 16px 13px 44px', fontSize: 15.5, fontWeight: 500 }} />
            {loading && (
              <span style={{ position: 'absolute', right: 14, top: 14 }}>
                <Icon name="refresh" size={17} style={{ color: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} />
              </span>
            )}
          </div>

          {/* freshness disclosure banner */}
          {flaggedCount > 0 && (
            <div className="anim-in" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderRadius: 11, background: 'var(--amber-bg)', border: '1px solid color-mix(in oklch, var(--amber-solid) 32%, transparent)', marginBottom: 16 }}>
              <Icon name="alert" size={18} style={{ color: 'var(--amber-text)', flex: 'none' }} />
              <span style={{ fontSize: 13.5, color: 'var(--text-2)', flex: 1 }}>
                <strong style={{ color: 'var(--amber-text)' }}>{flaggedCount}</strong> {t('search.freshWarn.pre')} {results.length} {t('search.freshWarn')}
              </span>
              <button type="button" className="btn btn-sm" style={{ background: 'var(--surface)', color: 'var(--amber-text)', border: '1px solid color-mix(in oklch, var(--amber-solid) 30%, transparent)' }}
                onClick={() => router.push('/freshness')}>
                {t('search.detail')}<Icon name="arrowRight" size={13} />
              </button>
            </div>
          )}

          {/* empty / no-query state */}
          {!searched && !loading && (
            <div className="card" style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-3)' }}>
              <Icon name="search" size={36} style={{ marginBottom: 14, opacity: 0.3 }} />
              <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 6 }}>Nhập từ khóa để tra cứu</div>
              <div style={{ fontSize: 13 }}>Tìm theo tên văn bản, điều khoản, hoặc nội dung</div>
            </div>
          )}

          {/* results */}
          {searched && !loading && results.length === 0 && (
            <div className="card">
              <EmptyState icon="searchX" title={t('search.empty.title')} desc={t('search.empty.desc')}
                actions={
                  <>
                    <button type="button" className="btn btn-ghost" onClick={() => { setQuery(''); setSearched(false); }}>{t('search.empty.clear')}</button>
                    <button type="button" className="btn btn-primary" onClick={() => router.push('/corpus/import')}>
                      <Icon name="plus" size={15} />{t('dash.action.import')}
                    </button>
                  </>
                } />
            </div>
          )}

          {results.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>{results.length} {t('common.results')} · "{query}"</div>
              {results.map(r => {
                const disclosure = disclosureMap.get(r.corpusRecordId);
                return (
                  <div key={r.chunkId} className="card" style={{ padding: 18, transition: 'box-shadow 0.18s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-sm)'}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8, flexWrap: 'wrap' }}>
                      <DocTypeBadge type={r.documentType} />
                      <span style={{ fontSize: 15.5, fontWeight: 600, letterSpacing: '-0.01em' }}>{r.fileName}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 12.5, color: 'var(--text-3)', marginBottom: 12 }}>
                      <span>{r.issuingBody}</span>
                      {r.issuingBody && <span>·</span>}
                      <span>{t('common.effectiveFrom')} {fmtDate(r.effectiveDate)}</span>
                      <span>·</span>
                      <FreshBadge status={r.freshnessStatus} />
                    </div>

                    {/* EC-02 disclosure note per result */}
                    {disclosure && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 11px', borderRadius: 8, background: 'var(--amber-bg)', marginBottom: 12, fontSize: 12.5, color: 'var(--text-2)' }}>
                        <Icon name="info" size={14} style={{ color: 'var(--amber-text)', flex: 'none' }} />
                        {disclosure}
                      </div>
                    )}

                    <div className="hr" />
                    {r.articleRef && (
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', margin: '12px 0 6px' }}>{r.articleRef}</div>
                    )}
                    <p className="excerpt" style={{ margin: '10px 0 0', paddingLeft: 14, borderLeft: '2px solid var(--accent)' }}>
                      "{r.chunkText}"
                    </p>
                    <div className="hr" style={{ margin: '14px 0' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{t('common.relevance')}</span>
                      <RelevanceBar score={r.score} />
                      <AnswerBadge value={r.answerClass || 'SUMMARY_WITH_SOURCE'} />
                      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setCiteItem(r)}>
                          <Icon name="copy" size={13} />{t('common.copyCitation')}
                        </button>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => router.push('/chat')}>
                          <Icon name="chat" size={13} />{t('search.askThis')}<Icon name="arrowRight" size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <CitationModal r={citeItem} onClose={() => setCiteItem(null)} />
    </div>
  );
}

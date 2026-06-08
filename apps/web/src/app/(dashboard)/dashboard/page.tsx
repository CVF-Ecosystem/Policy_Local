'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Icon } from '@/components/ui/Icon';
import { DocTypeBadge, FreshBadge, AnswerBadge } from '@/components/ui/Badges';
import { Donut } from '@/components/ui/Donut';
import { Counter } from '@/components/ui/Counter';
import { PageHead } from '@/components/ui/PageHead';

type Stats = {
  total: number; ready: number; pending: number; error: number;
  effective: number; amended: number; repealed: number; draft: number;
  unknown: number; flagged: number; queries: number;
};
type CorpusRow = {
  id: string; file_name: string; document_type: string; freshness_status: string;
};
type QueryRow = {
  id: string; kind: string; query_text: string; answer_class: string | null;
  results: number; created_at: string;
};

function fmtTime(iso: string) {
  try { return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }); }
  catch { return ''; }
}

export default function DashboardPage() {
  const { t } = useApp();
  const router = useRouter();

  const [stats, setStats] = useState<Stats>({ total: 0, ready: 0, pending: 0, error: 0, effective: 0, amended: 0, repealed: 0, draft: 0, unknown: 0, flagged: 0, queries: 0 });
  const [flagged, setFlagged] = useState<CorpusRow[]>([]);
  const [queries, setQueries] = useState<QueryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/corpus').then(r => r.json()),
      fetch('/api/audit?limit=5').then(r => r.json()),
    ]).then(([corpusData, auditData]) => {
      if (corpusData.stats) setStats(corpusData.stats);
      if (corpusData.records) {
        setFlagged((corpusData.records as CorpusRow[])
          .filter((c: CorpusRow) => c.freshness_status === 'amended' || c.freshness_status === 'repealed')
          .slice(0, 4));
      }
      if (auditData.logs) setQueries(auditData.logs);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const S = stats;
  const statCards = [
    { k: 'total', v: S.total, icon: 'fileText', tone: 'accent' },
    { k: 'ready', v: S.ready, icon: 'check2', tone: 'green' },
    { k: 'review', v: S.flagged, icon: 'alert', tone: 'amber' },
    { k: 'queries', v: S.queries, icon: 'search', tone: 'gray' },
  ];
  const toneBg: Record<string, string> = {
    accent: 'var(--accent-soft)', green: 'var(--green-bg)', amber: 'var(--amber-bg)', gray: 'var(--surface-2)',
  };
  const toneFg: Record<string, string> = {
    accent: 'var(--accent-text)', green: 'var(--green-text)', amber: 'var(--amber-text)', gray: 'var(--text-2)',
  };

  return (
    <div className="anim-up">
      <PageHead title={t('dash.title')} sub={t('dash.welcome')} />

      {/* stat cards */}
      <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        {statCards.map(s => (
          <div key={s.k} className="card card-i" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <span style={{ width: 38, height: 38, borderRadius: 10, background: toneBg[s.tone], color: toneFg[s.tone], display: 'grid', placeItems: 'center' }}>
              <Icon name={s.icon} size={19} />
            </span>
            <div>
              <div style={{ fontSize: 27, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                <Counter value={s.v} />
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 6 }}>{t('dash.stat.' + s.k)}</div>
            </div>
          </div>
        ))}
      </div>

      {/* quick search */}
      <div onClick={() => router.push('/search')} className="card card-i"
        style={{ marginTop: 14, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 13, cursor: 'pointer' }}>
        <Icon name="search" size={20} style={{ color: 'var(--accent)' }} />
        <span style={{ color: 'var(--text-3)', fontSize: 15 }}>{t('dash.quicksearch')}</span>
        <span className="btn btn-primary btn-sm" style={{ marginLeft: 'auto', pointerEvents: 'none' }}>
          {t('common.search')}<Icon name="arrowRight" size={14} />
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 14, marginTop: 14 }}>
        {/* left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>

          {/* recent activity */}
          <div className="card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
              <span className="label-cap">{t('dash.recent')}</span>
              <a href="/audit" style={{ marginLeft: 'auto', fontSize: 12.5, color: 'var(--accent-text)', textDecoration: 'none', fontWeight: 500 }}>{t('common.viewAll')}</a>
            </div>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[1, 2, 3].map(i => <div key={i} className="shimmer" style={{ height: 44, borderRadius: 8 }} />)}
              </div>
            ) : queries.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-3)', fontSize: 13.5 }}>
                Chưa có truy vấn nào. <button className="btn btn-ghost btn-sm" onClick={() => router.push('/search')}>Tra cứu ngay</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {queries.map((q, i) => (
                  <div key={q.id} onClick={() => router.push(q.kind === 'chat' ? '/chat' : '/search')}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 10px', margin: '0 -10px', borderRadius: 8, borderTop: i ? '1px solid var(--border)' : 'none', cursor: 'pointer', transition: 'background 0.16s var(--ease)' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                    <span style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--surface-2)', color: 'var(--text-3)', display: 'grid', placeItems: 'center', flex: 'none' }}>
                      <Icon name={q.kind === 'chat' ? 'chat' : 'search'} size={15} />
                    </span>
                    <span style={{ flex: 1, fontSize: 13.5, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.query_text}</span>
                    {q.kind === 'chat' && q.answer_class
                      ? <AnswerBadge value={q.answer_class} />
                      : <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{q.results} {t('common.results')}</span>}
                    <span style={{ fontSize: 11.5, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', minWidth: 40, textAlign: 'right' }}>{fmtTime(q.created_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* donut */}
          <div className="card" style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 24 }}>
            <div style={{ position: 'relative' }}>
              <Donut segments={[
                { value: S.ready, color: 'var(--green-solid)' },
                { value: S.pending, color: 'var(--amber-solid)' },
                { value: S.error, color: 'var(--red-solid)' },
              ]} />
              <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}><Counter value={S.total} /></div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{t('common.documents')}</div>
                </div>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <span className="label-cap">{t('dash.corpusStatus')}</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 12 }}>
                {([['green', t('dash.stat.ready'), S.ready], ['amber', t('import.step.process'), S.pending], ['red', 'Error', S.error]] as [string, string, number][]).map(([c, lb, v]) => (
                  <div key={lb} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13 }}>
                    <span className={'badge-dot dot-' + c} style={{ width: 9, height: 9 }} />
                    <span style={{ flex: 1, color: 'var(--text-2)' }}>{lb}</span>
                    <span style={{ fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* right */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
          <div className="card" style={{ padding: 18 }}>
            <span className="label-cap">{t('dash.alerts')}</span>
            <p style={{ fontSize: 12.5, color: 'var(--text-3)', margin: '4px 0 12px' }}>{t('dash.alerts.sub')}</p>
            {flagged.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--text-3)', textAlign: 'center', padding: '12px 0' }}>
                {loading ? <span className="shimmer" style={{ display: 'block', height: 36, borderRadius: 8 }} /> : 'Không có văn bản cần chú ý.'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {flagged.map(c => (
                  <div key={c.id} onClick={() => router.push('/freshness')}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 11px', borderRadius: 9, background: 'var(--surface-2)', cursor: 'pointer', border: '1px solid var(--border)', transition: 'background 0.18s var(--ease), border-color 0.18s, transform 0.18s var(--ease)' }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'var(--surface-3)'; el.style.borderColor = 'var(--border-strong)'; el.style.transform = 'translateX(2px)'; }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'var(--surface-2)'; el.style.borderColor = 'var(--border)'; el.style.transform = 'none'; }}>
                    <DocTypeBadge type={c.document_type} />
                    <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.file_name}</span>
                    <FreshBadge status={c.freshness_status} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button className="btn btn-primary" onClick={() => router.push('/corpus/import')} style={{ justifyContent: 'center' }}>
              <Icon name="plus" size={16} />{t('dash.action.import')}
            </button>
            <button className="btn btn-ghost" onClick={() => router.push('/freshness')} style={{ justifyContent: 'center' }}>
              <Icon name="refresh" size={16} />{t('dash.action.freshness')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

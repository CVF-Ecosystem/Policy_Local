'use client';
import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Icon } from '@/components/ui/Icon';
import { DocTypeBadge } from '@/components/ui/Badges';
import { Donut } from '@/components/ui/Donut';
import { PageHead } from '@/components/ui/PageHead';
import { REPORTS, STATS } from '@/lib/mock';

function Sparkline({ data, good }: { data: number[]; good: boolean }) {
  const w = 130, h = 34;
  const min = Math.min(...data), max = Math.max(...data);
  const rng = max - min || 1;
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, h - 2 - ((v - min) / rng) * (h - 6)] as [number, number]);
  const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const area = d + ` L${w} ${h} L0 ${h} Z`;
  const col = good ? 'var(--green-solid)' : 'var(--accent)';
  const gid = 'sg' + Math.round(min * 100) + data.length;
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: 'block', marginTop: 12 }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={col} stopOpacity="0.18" /><stop offset="1" stopColor={col} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={d} fill="none" stroke={col} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function StatCard({ label, value, suffix, delta, deltaGood, series }: {
  label: string; value: string | number; suffix?: string; delta: number; deltaGood?: boolean; series?: number[];
}) {
  const { t } = useApp();
  const up = delta >= 0;
  const good = deltaGood === undefined ? up : deltaGood;
  return (
    <div className="card" style={{ padding: 18 }}>
      <div style={{ fontSize: 12.5, color: 'var(--text-3)', fontWeight: 500 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, margin: '10px 0 8px' }}>
        <span style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-0.02em' }}>{value}</span>
        {suffix && <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-3)' }}>{suffix}</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontWeight: 600, padding: '2px 7px', borderRadius: 99, background: good ? 'var(--green-bg)' : 'var(--red-bg)', color: good ? 'var(--green-text)' : 'var(--red-text)' }}>
          <Icon name="trendUp" size={12} style={{ transform: up ? 'none' : 'scaleY(-1)' }} />
          {up ? '+' : ''}{delta}%
        </span>
        <span style={{ color: 'var(--text-3)' }}>{t('report.vsPrev')}</span>
      </div>
      {series && <Sparkline data={series} good={good} />}
    </div>
  );
}

function HeatMap({ data }: { data: number[] }) {
  const { t } = useApp();
  const weeks = 12, days = 7;
  const max = Math.max(...data) || 1;
  const cell = 15, gap = 4;
  const color = (v: number) => {
    if (v <= 0) return 'var(--surface-3)';
    const op = (0.25 + (v / max) * 0.75).toFixed(2);
    return `color-mix(in oklch, var(--accent) ${Math.round(Number(op) * 100)}%, var(--surface-3))`;
  };
  const dlabels = ['T2', '', 'T4', '', 'T6', '', 'CN'];
  return (
    <div>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap }}>
          {dlabels.map((d, i) => (
            <div key={i} style={{ height: cell, fontSize: 9.5, color: 'var(--text-3)', lineHeight: cell + 'px', fontFamily: 'var(--font-mono)' }}>{d}</div>
          ))}
        </div>
        <div style={{ display: 'flex', gap, overflowX: 'auto' }}>
          {Array.from({ length: weeks }, (_, w) => (
            <div key={w} style={{ display: 'flex', flexDirection: 'column', gap }}>
              {Array.from({ length: days }, (_, d) => {
                const v = data[w * days + d] ?? 0;
                return <div key={d} title={v + ' truy vấn'} style={{ width: cell, height: cell, borderRadius: 3, background: color(v) }} />;
              })}
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, fontSize: 11, color: 'var(--text-3)', justifyContent: 'flex-end' }}>
        <span>{t('report.activity.less')}</span>
        {[0, 0.3, 0.6, 1].map((f, i) => (
          <span key={i} style={{ width: 11, height: 11, borderRadius: 3, background: f === 0 ? 'var(--surface-3)' : `color-mix(in oklch, var(--accent) ${Math.round((0.25 + f * 0.75) * 100)}%, var(--surface-3))` }} />
        ))}
        <span>{t('report.activity.more')}</span>
      </div>
    </div>
  );
}

function Gauge({ pct }: { pct: number }) {
  const size = 132, stroke = 14, r = (size - stroke) / 2, circ = 2 * Math.PI * r;
  const len = (pct / 100) * circ;
  return (
    <div style={{ position: 'relative', margin: '14px 0 0' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--accent)" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${len} ${circ - len}`} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
        <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em' }}>{pct}%</div>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const { t } = useApp();
  const [range, setRange] = useState('30d');
  const R = REPORTS;
  const compMax = Math.max(...R.corpusComp.map(c => c.value));
  const dtLabel: Record<string, string> = { law: t('dt.law'), decree: t('dt.decree'), circular: t('dt.circular'), decision: t('dt.decision'), policy: t('dt.policy'), sop: t('dt.sop') };

  return (
    <div className="anim-up">
      <PageHead title={t('report.title')} sub={t('report.sub')} actions={
        <>
          <div style={{ display: 'flex', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 99, padding: 3, gap: 2 }}>
            {(['7d', '30d', '90d'] as const).map(r => (
              <button key={r} onClick={() => setRange(r)} style={{ fontFamily: 'var(--font-sans)', border: 'none', background: range === r ? 'var(--surface)' : 'transparent', color: range === r ? 'var(--text)' : 'var(--text-3)', fontSize: 12.5, fontWeight: 600, padding: '6px 12px', borderRadius: 99, cursor: 'pointer', boxShadow: range === r ? 'var(--shadow-sm)' : 'none' }}>
                {t('report.range.' + r)}
              </button>
            ))}
          </div>
          <button className="btn btn-primary"><Icon name="download" size={15} />{t('report.export')}</button>
        </>
      } />

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        <StatCard label={t('report.kpi.queries')} value={R.kpi.queries.value.toLocaleString()} delta={R.kpi.queries.delta} series={R.spark.queries} />
        <StatCard label={t('report.kpi.citeRate')} value={R.kpi.citeRate.value} suffix="%" delta={R.kpi.citeRate.delta} series={R.spark.citeRate} />
        <StatCard label={t('report.kpi.abstainRate')} value={R.kpi.abstainRate.value} suffix="%" delta={R.kpi.abstainRate.delta} deltaGood={true} series={R.spark.abstainRate} />
        <StatCard label={t('report.kpi.avgSources')} value={R.kpi.avgSources.value} delta={R.kpi.avgSources.delta} series={R.spark.avgSources} />
      </div>

      {/* volume + answer mix */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: 14, marginTop: 14 }}>
        <div className="card" style={{ padding: 20, minWidth: 0 }}>
          <span className="label-cap">{t('report.volume')}</span>
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', gap: 18, marginBottom: 14 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--text-2)' }}><span style={{ width: 11, height: 11, borderRadius: 3, background: 'var(--accent)' }} />{t('report.volume.chat')}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--text-2)' }}><span style={{ width: 11, height: 11, borderRadius: 3, background: 'color-mix(in oklch, var(--accent) 38%, var(--surface-3))' }} />{t('report.volume.search')}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', height: 180, position: 'relative', gap: 0 }}>
              {[0, 0.5, 1].map((g, i) => <div key={i} style={{ position: 'absolute', left: 0, right: 0, bottom: g * 180, height: 1, background: 'var(--border)' }} />)}
              {R.volume.map((d, i) => {
                const maxV = Math.max(...R.volume.map(v => Math.max(v.chat, v.search)));
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 180, width: '100%', justifyContent: 'center' }}>
                      <div style={{ width: '34%', height: (d.chat / maxV) * 180, background: 'var(--accent)', borderRadius: '4px 4px 0 0' }} />
                      <div style={{ width: '34%', height: (d.search / maxV) * 180, background: 'color-mix(in oklch, var(--accent) 38%, var(--surface-3))', borderRadius: '4px 4px 0 0' }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', marginTop: 8 }}>
              {R.volume.map((d, i) => <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 10.5, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{i % 2 === 0 ? d.d : ''}</div>)}
            </div>
          </div>
        </div>
        <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column' }}>
          <span className="label-cap">{t('report.answerMix')}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 14 }}>
            <div style={{ position: 'relative', flex: 'none' }}>
              <Donut segments={R.answerMix.map(a => ({ value: a.value, color: a.color }))} size={120} stroke={15} />
              <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
                <div><div style={{ fontSize: 21, fontWeight: 600 }}>{R.answerMix[0].value}%</div><div style={{ fontSize: 10, color: 'var(--text-3)' }}>cited</div></div>
              </div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 9 }}>
              {R.answerMix.map(a => (
                <div key={a.k} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
                  <span style={{ width: 9, height: 9, borderRadius: 3, background: a.color, flex: 'none' }} />
                  <span style={{ flex: 1, color: 'var(--text-2)' }}>{t('ac.' + a.k)}</span>
                  <span style={{ fontWeight: 600 }}>{a.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* corpus comp + freshness + coverage */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 14, marginTop: 14 }}>
        <div className="card" style={{ padding: 20 }}>
          <span className="label-cap">{t('report.corpusComp')}</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
            {R.corpusComp.map(c => (
              <div key={c.k}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 5 }}>
                  <span style={{ color: 'var(--text-2)' }}>{dtLabel[c.k]}</span><span style={{ fontWeight: 600 }}>{c.value}</span>
                </div>
                <div style={{ height: 8, borderRadius: 99, background: 'var(--surface-3)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: (c.value / compMax * 100) + '%', background: 'var(--accent)', borderRadius: 99 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span className="label-cap" style={{ alignSelf: 'flex-start' }}>{t('report.freshComp')}</span>
          <div style={{ position: 'relative', margin: '14px 0 6px' }}>
            <Donut segments={[
              { value: STATS.effective, color: 'var(--green-solid)' },
              { value: STATS.amended, color: 'var(--amber-solid)' },
              { value: STATS.repealed, color: 'var(--red-solid)' },
              { value: STATS.unknown, color: 'var(--gray-solid)' },
            ]} size={120} stroke={15} />
            <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
              <div><div style={{ fontSize: 21, fontWeight: 600 }}>{STATS.total}</div><div style={{ fontSize: 10, color: 'var(--text-3)' }}>{t('common.documents')}</div></div>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
            {([['effective', 'green'], ['amended', 'amber'], ['repealed', 'red'], ['unknown', 'gray']] as [string, string][]).map(([k, c]) => (
              <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'var(--text-2)' }}>
                <span className={'badge-dot dot-' + c} />{t('fs.' + k)}
              </span>
            ))}
          </div>
        </div>
        <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
          <span className="label-cap" style={{ alignSelf: 'flex-start' }}>{t('report.coverage')}</span>
          <Gauge pct={91} />
          <p style={{ fontSize: 11.5, color: 'var(--text-3)', margin: '12px 0 0', lineHeight: 1.5 }}>{t('report.coverage.sub')}</p>
        </div>
      </div>

      {/* heatmap + gaps */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 14, marginTop: 14 }}>
        <div className="card" style={{ padding: 20 }}>
          <span className="label-cap">{t('report.activity')}</span>
          <div style={{ marginTop: 16 }}><HeatMap data={R.heatmap} /></div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <span className="label-cap">{t('report.gaps')}</span>
          <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '4px 0 12px' }}>{t('report.gaps.sub')}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {R.gaps.map((g, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 26, height: 26, borderRadius: 7, flex: 'none', display: 'grid', placeItems: 'center', background: g.status === 'abstain' ? 'var(--red-bg)' : 'var(--amber-bg)', color: g.status === 'abstain' ? 'var(--red-text)' : 'var(--amber-text)' }}>
                  <Icon name={g.status === 'abstain' ? 'searchX' : 'alert'} size={14} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.topic}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{g.note}</div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', whiteSpace: 'nowrap' }}>{g.asked} {t('report.gaps.asked')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* top docs + top queries */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
        <div className="card" style={{ padding: 20 }}>
          <span className="label-cap">{t('report.topDocs')}</span>
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 12 }}>
            {R.topDocs.map((d, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 0', borderTop: i ? '1px solid var(--border)' : 'none' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-3)', width: 16 }}>{i + 1}</span>
                <DocTypeBadge type={d.type} />
                <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</span>
                <span style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 600, whiteSpace: 'nowrap' }}>{d.count} {t('report.citations')}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <span className="label-cap">{t('report.topQueries')}</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginTop: 16 }}>
            {R.topQueries.map((q, i) => {
              const mx = R.topQueries[0].count;
              return (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
                    <span style={{ color: 'var(--text)', fontWeight: 500 }}>"{q.q}"</span>
                    <span style={{ color: 'var(--text-3)', fontSize: 12 }}>{q.count}</span>
                  </div>
                  <div style={{ height: 7, borderRadius: 99, background: 'var(--surface-3)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: (q.count / mx * 100) + '%', background: 'color-mix(in oklch, var(--accent) 70%, var(--surface-3))', borderRadius: 99 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

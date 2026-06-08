'use client';
import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Icon } from '@/components/ui/Icon';
import { AnswerBadge } from '@/components/ui/Badges';
import { PageHead } from '@/components/ui/PageHead';
import { Drawer } from '@/components/ui/Overlays';
import { QUERIES } from '@/lib/mock';

const iconBtnH: React.CSSProperties = {
  width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)',
  display: 'grid', placeItems: 'center', cursor: 'pointer', color: 'var(--text-3)',
};

const SAMPLE_RECEIPT = {
  normalized: 'mức đóng bảo hiểm xã hội người lao động',
  filters: ['Luật', 'Nghị định', 'Hiệu lực'],
  candidates: 14,
  excluded: 3,
  citations: ['Điều 85 Luật BHXH 2014', 'Điều 65 NĐ 145/2020/NĐ-CP'],
  provider: 'Anthropic claude-sonnet-4-6',
  verified: true,
};

export default function AuditPage() {
  const { t } = useApp();
  const [receipt, setReceipt] = useState<typeof SAMPLE_RECEIPT | null>(null);

  return (
    <div className="anim-up">
      <PageHead title={t('audit.title')} sub={t('audit.sub')} actions={
        <button className="btn btn-ghost"><Icon name="download" size={15} />{t('audit.export')}</button>
      } />

      {/* filter bar */}
      <div className="card" style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        {(['Tất cả', t('kind.chat'), t('kind.search')] as string[]).map((lb, i) => (
          <button key={i} className="btn btn-sm" style={{ background: i === 0 ? 'var(--accent-soft)' : 'var(--surface-2)', color: i === 0 ? 'var(--accent-text)' : 'var(--text-2)', border: '1px solid ' + (i === 0 ? 'var(--accent-border)' : 'var(--border)') }}>{lb}</button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <input className="field" placeholder="Từ ngày" style={{ width: 120, padding: '7px 10px', fontSize: 12.5 }} />
          <input className="field" placeholder="Đến ngày" style={{ width: 120, padding: '7px 10px', fontSize: 12.5 }} />
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--text-3)', fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <th style={{ padding: '11px 16px' }}>{t('audit.col.time')}</th>
              <th style={{ padding: '11px 12px' }}>{t('audit.col.kind')}</th>
              <th style={{ padding: '11px 12px' }}>{t('audit.col.query')}</th>
              <th style={{ padding: '11px 12px' }}>{t('audit.col.result')}</th>
              <th style={{ padding: '11px 12px' }}>{t('audit.col.source')}</th>
              <th style={{ padding: '11px 16px', textAlign: 'right' }}>{t('audit.col.detail')}</th>
            </tr>
          </thead>
          <tbody>
            {QUERIES.map(q => (
              <tr key={q.id} onClick={() => setReceipt(SAMPLE_RECEIPT)}
                style={{ borderTop: '1px solid var(--border)', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{q.time} · {q.date}</td>
                <td style={{ padding: '12px 12px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--text-2)' }}>
                    <Icon name={q.kind === 'chat' ? 'chat' : 'search'} size={13} />{t('kind.' + q.kind)}
                  </span>
                </td>
                <td style={{ padding: '12px 12px', maxWidth: 300 }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{q.text}</span>
                </td>
                <td style={{ padding: '12px 12px' }}>
                  {q.kind === 'chat' && q.answerClass
                    ? <AnswerBadge value={q.answerClass} />
                    : <span style={{ fontSize: 12.5, color: 'var(--text-2)' }}>{q.results} {t('common.results')}</span>}
                </td>
                <td style={{ padding: '12px 12px', fontSize: 12.5, color: 'var(--text-2)' }}>
                  {q.kind === 'chat' && (q.sources ?? 0) > 0 ? `${q.sources} ${t('common.sources')}` : '—'}
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                  <button style={{ border: 'none', background: 'transparent', color: 'var(--accent-text)', cursor: 'pointer' }}>
                    <Icon name="arrowRight" size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Drawer open={!!receipt} onClose={() => setReceipt(null)} width={500}>
        {receipt && (
          <>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center' }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{t('audit.receipt')}</h2>
              <button onClick={() => setReceipt(null)} style={{ ...iconBtnH, marginLeft: 'auto' }}><Icon name="x" size={16} /></button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 22 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Field label={t('audit.receipt.normalized')}>
                  <code style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{receipt.normalized}</code>
                </Field>
                <Field label={t('audit.receipt.filters')}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {receipt.filters.map(f => <span key={f} className="badge s-gray">{f}</span>)}
                  </div>
                </Field>
                <Field label={t('audit.receipt.candidates')}>{receipt.candidates} văn bản</Field>
                <Field label={t('audit.receipt.excluded')}>{receipt.excluded} văn bản</Field>
                <Field label={t('audit.receipt.citations')}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {receipt.citations.map(c => <span key={c} style={{ fontSize: 12.5, fontFamily: 'var(--font-mono)', color: 'var(--accent-text)' }}>{c}</span>)}
                  </div>
                </Field>
                <Field label={t('audit.receipt.provider')}>
                  <code style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{receipt.provider}</code>
                </Field>
                {receipt.verified && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 9, background: 'var(--green-bg)', border: '1px solid color-mix(in oklch, var(--green-solid) 24%, transparent)' }}>
                    <Icon name="shieldCheck" size={16} style={{ color: 'var(--green-text)' }} />
                    <span style={{ fontSize: 13, color: 'var(--green-text)', fontWeight: 500 }}>{t('audit.receipt.verified')}</span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
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

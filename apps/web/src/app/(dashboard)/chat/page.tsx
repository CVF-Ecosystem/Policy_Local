'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Icon } from '@/components/ui/Icon';
import { AnswerBadge, FreshBadge } from '@/components/ui/Badges';
import { Modal } from '@/components/ui/Overlays';

const iconBtnH: React.CSSProperties = {
  width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)',
  display: 'grid', placeItems: 'center', cursor: 'pointer', color: 'var(--text-3)',
};

export default function ChatPage() {
  const { t } = useApp();
  const router = useRouter();
  const [hasKey, setHasKey] = useState(false);
  const [scopeOpen, setScopeOpen] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [input, setInput] = useState('');

  return (
    <div className="anim-up" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px - 48px)', maxWidth: 860, margin: '0 auto' }}>

      {/* disclaimer */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '11px 15px', borderRadius: 10, background: 'var(--blue-bg)', border: '1px solid color-mix(in oklch, var(--blue-solid) 28%, transparent)', marginBottom: 12 }}>
        <Icon name="info" size={16} style={{ color: 'var(--blue-text)', flex: 'none', marginTop: 1 }} />
        <span style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.5 }}>{t('chat.disclaimer')}</span>
      </div>

      {/* scope selector */}
      <div style={{ marginBottom: 14 }}>
        <button onClick={() => setScopeOpen(o => !o)} className="btn btn-ghost btn-sm">
          <Icon name="layers" size={14} />{t('chat.scope')}: <strong>{t('chat.scope.all')} (247)</strong>
          <Icon name="chevronDown" size={13} style={{ transform: scopeOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.18s' }} />
        </button>
        {scopeOpen && (
          <div className="card anim-in" style={{ padding: 14, marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {(['law', 'decree', 'circular', 'decision', 'policy', 'sop'] as const).map(dt => (
              <label key={dt} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, cursor: 'pointer', color: 'var(--text-2)' }}>
                <input type="checkbox" defaultChecked style={{ accentColor: 'var(--accent)', width: 15, height: 15 }} />{t('dt.' + dt)}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* thread */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 18, paddingRight: 4 }}>

        {/* user message */}
        <div style={{ alignSelf: 'flex-end', maxWidth: '78%' }}>
          <div style={{ background: 'var(--grad)', color: 'var(--on-accent)', padding: '11px 15px', borderRadius: '14px 14px 4px 14px', fontSize: 14.5, lineHeight: 1.5 }}>
            Mức đóng BHXH của người lao động là bao nhiêu?
          </div>
        </div>

        {/* assistant — direct cited answer */}
        <div style={{ alignSelf: 'flex-start', maxWidth: '88%' }}>
          <div className="card" style={{ padding: 18 }}>
            <AnswerBadge value="DIRECT_CITED_ANSWER" />
            <p style={{ fontSize: 14.5, lineHeight: 1.65, margin: '12px 0 0' }}>
              Theo <strong>Điều 85, Luật BHXH 2014 (số 58/2014/QH13)</strong>, người lao động hằng tháng đóng bằng <strong>8% mức tiền lương tháng</strong> vào quỹ hưu trí và tử tuất.
            </p>

            {/* citation block */}
            <div style={{ marginTop: 14, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface-2)', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '11px 14px', borderBottom: '1px solid var(--border)' }}>
                <Icon name="fileText" size={15} style={{ color: 'var(--text-3)' }} />
                <span style={{ fontSize: 12.5, fontWeight: 600 }}>Luật BHXH 2014 · Điều 85, Khoản 1</span>
                <span style={{ marginLeft: 'auto' }}><FreshBadge status="amended" /></span>
              </div>
              <div style={{ padding: 14 }}>
                <p className="excerpt" style={{ margin: 0 }}>
                  "Người lao động… hằng tháng đóng bằng 8% mức tiền lương tháng vào quỹ hưu trí và tử tuất."
                </p>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button className="btn btn-soft btn-sm"><Icon name="externalLink" size={13} />{t('common.openSource')}</button>
                  <button className="btn btn-ghost btn-sm"><Icon name="copy" size={13} />{t('common.copyCitation')}</button>
                </div>
              </div>
            </div>

            {/* freshness warning */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 12, padding: '10px 13px', borderRadius: 9, background: 'var(--amber-bg)' }}>
              <Icon name="alert" size={15} style={{ color: 'var(--amber-text)', flex: 'none' }} />
              <span style={{ fontSize: 12.5, color: 'var(--text-2)' }}>{t('chat.warn')}</span>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 14, alignItems: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowReceipt(true)}>
                <Icon name="shieldCheck" size={14} />{t('chat.viewReceipt')}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => router.push('/search')}>
                {t('chat.findMore')}<Icon name="arrowRight" size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* user message 2 */}
        <div style={{ alignSelf: 'flex-end', maxWidth: '78%' }}>
          <div style={{ background: 'var(--grad)', color: 'var(--on-accent)', padding: '11px 15px', borderRadius: '14px 14px 4px 14px', fontSize: 14.5, lineHeight: 1.5 }}>
            Mức phạt khi sa thải trái pháp luật là bao nhiêu tiền?
          </div>
        </div>

        {/* assistant — abstain */}
        <div style={{ alignSelf: 'flex-start', maxWidth: '88%' }}>
          <div className="card" style={{ padding: 18, borderColor: 'color-mix(in oklch, var(--red-solid) 30%, var(--border))' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <AnswerBadge value="ESCALATE_OR_ABSTAIN" />
              <span style={{ fontSize: 14.5, fontWeight: 600 }}>{t('chat.abstain.title')}</span>
            </div>
            <div style={{ marginTop: 12, fontSize: 13.5 }}>
              <span style={{ color: 'var(--text-3)', fontWeight: 600 }}>{t('chat.abstain.reason')}: </span>
              <span style={{ color: 'var(--text-2)' }}>{t('chat.abstain.reasonText')}</span>
            </div>
            <div style={{ marginTop: 14 }}>
              <span className="label-cap">{t('chat.abstain.suggest')}</span>
              <ul style={{ margin: '8px 0 0', paddingLeft: 4, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 7 }}>
                {(['s1', 's2', 's3'] as const).map(s => (
                  <li key={s} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13.5, color: 'var(--text-2)' }}>
                    <span style={{ width: 5, height: 5, borderRadius: 99, background: 'var(--text-3)', flex: 'none' }} />
                    {t('chat.abstain.' + s)}
                  </li>
                ))}
              </ul>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className="btn btn-primary btn-sm" onClick={() => router.push('/corpus/import')}>
                <Icon name="plus" size={13} />{t('dash.action.import')}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => router.push('/search')}>
                <Icon name="search" size={13} />{t('search.title')}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowReceipt(true)}>
                <Icon name="shieldCheck" size={13} />{t('chat.viewReceipt')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* input bar */}
      <div style={{ marginTop: 14 }}>
        {hasKey ? (
          <div className="card" style={{ padding: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input className="field" value={input} onChange={e => setInput(e.target.value)}
                placeholder={t('chat.input')} style={{ border: 'none', boxShadow: 'none', padding: '8px 6px' }} />
              <button className="btn btn-primary"><Icon name="send" size={15} />{t('chat.send')}</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 6px 2px', fontSize: 11.5, color: 'var(--text-3)' }}>
              <Icon name="key" size={12} style={{ color: 'var(--green-text)' }} />
              <span>Anthropic · claude-sonnet-4-6</span>
              <button onClick={() => router.push('/settings')} style={{ border: 'none', background: 'transparent', color: 'var(--accent-text)', cursor: 'pointer', fontWeight: 600, fontFamily: 'var(--font-sans)', fontSize: 11.5 }}>
                {t('chat.changeKey')}
              </button>
              <button onClick={() => setHasKey(false)} style={{ marginLeft: 'auto', border: 'none', background: 'transparent', color: 'var(--text-3)', cursor: 'pointer', fontSize: 11 }}>
                demo: no key
              </button>
            </div>
          </div>
        ) : (
          <div className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12, background: 'var(--surface-2)' }}>
            <Icon name="sparkles" size={18} style={{ color: 'var(--accent)' }} />
            <span style={{ fontSize: 13.5, color: 'var(--text-2)', flex: 1 }}>Cần API key để dùng tính năng hỏi đáp.</span>
            <button className="btn btn-primary btn-sm" onClick={() => router.push('/settings')}>
              <Icon name="settings" size={14} />{t('nav.settings')}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setHasKey(true)}>demo: has key</button>
          </div>
        )}
      </div>

      {/* receipt modal */}
      <Modal open={showReceipt} onClose={() => setShowReceipt(false)} width={560}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{t('audit.receipt')}</h2>
          <button onClick={() => setShowReceipt(false)} style={{ ...iconBtnH, marginLeft: 'auto' }}><Icon name="x" size={16} /></button>
        </div>
        <div style={{ padding: 22, overflowY: 'auto', maxHeight: '60vh' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: t('audit.col.query'), value: 'Mức đóng BHXH của người lao động là bao nhiêu?' },
              { label: t('audit.receipt.normalized'), value: 'mức đóng bảo hiểm xã hội người lao động', mono: true },
              { label: t('audit.receipt.candidates'), value: '14 văn bản' },
              { label: t('audit.receipt.excluded'), value: '3 văn bản (repealed)' },
              { label: t('audit.receipt.citations'), value: 'Điều 85 Luật BHXH 2014; Điều 65 NĐ 145/2020' },
              { label: t('audit.receipt.provider'), value: 'Anthropic claude-sonnet-4-6', mono: true },
            ].map(({ label, value, mono }) => (
              <div key={label} style={{ paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 6 }}>{label}</div>
                <div style={{ fontSize: 13.5, fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)', color: 'var(--text)', lineHeight: 1.6 }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}

'use client';
import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Icon } from '@/components/ui/Icon';
import { DocTypeBadge } from '@/components/ui/Badges';
import { PageHead } from '@/components/ui/PageHead';

function SetRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <span style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text-2)', minWidth: 130 }}>{label}</span>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const { t, lang, setLang, theme, setTheme } = useApp();
  const [tab, setTab] = useState<'storage' | 'llm' | 'classify' | 'ui'>('storage');
  const [provider, setProvider] = useState('anthropic');

  return (
    <div className="anim-up" style={{ maxWidth: 760, margin: '0 auto' }}>
      <PageHead title={t('set.title')} />

      {/* tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', marginBottom: 22 }}>
        {(['storage', 'llm', 'classify', 'ui'] as const).map(id => (
          <button key={id} onClick={() => setTab(id)} style={{ border: 'none', background: 'transparent', padding: '10px 14px', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', color: tab === id ? 'var(--text)' : 'var(--text-3)', borderBottom: tab === id ? '2px solid var(--accent)' : '2px solid transparent', marginBottom: -1, fontFamily: 'var(--font-sans)' }}>
            {t('set.tab.' + id)}
          </button>
        ))}
      </div>

      {tab === 'storage' && (
        <div className="card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <SetRow label={t('set.storage.dir')}>
            <code style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-2)' }}>~/.policylocal/</code>
            <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }}>{t('chat.changeKey')}</button>
          </SetRow>
          <SetRow label={t('set.storage.usage')}>
            <div style={{ flex: 1 }}>
              <div style={{ height: 8, borderRadius: 99, background: 'var(--surface-3)', overflow: 'hidden', marginBottom: 6 }}>
                <div style={{ height: '100%', width: '23%', background: 'var(--accent)', borderRadius: 99 }} />
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>234 MB / ~10 GB</div>
            </div>
          </SetRow>
          <SetRow label={t('set.storage.backup')}>
            <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{t('set.storage.lastBackup')} 01/06/2026</span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <button className="btn btn-soft btn-sm"><Icon name="database" size={13} />{t('set.storage.backupNow')}</button>
              <button className="btn btn-ghost btn-sm">{t('set.storage.restore')}</button>
            </div>
          </SetRow>
          <div className="hr" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderRadius: 10, background: 'var(--red-bg)' }}>
            <Icon name="alert" size={18} style={{ color: 'var(--red-text)' }} />
            <span style={{ fontSize: 13, color: 'var(--text-2)', flex: 1 }}>{t('set.storage.wipe')}</span>
            <button className="btn btn-danger btn-sm"><Icon name="trash" size={13} />{t('set.storage.wipe')}</button>
          </div>
        </div>
      )}

      {tab === 'llm' && (
        <div className="card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <span className="label-cap" style={{ display: 'block', marginBottom: 10 }}>{t('set.llm.provider')}</span>
            <div style={{ display: 'flex', gap: 10 }}>
              {([['anthropic', 'Anthropic'], ['openai', 'OpenAI'], ['ollama', 'Ollama (local)']] as [string, string][]).map(([id, lb]) => (
                <button key={id} onClick={() => setProvider(id)} className="card" style={{ flex: 1, padding: 13, cursor: 'pointer', textAlign: 'center', borderColor: provider === id ? 'var(--accent)' : 'var(--border)', boxShadow: provider === id ? '0 0 0 3px var(--accent-soft)' : 'none', fontSize: 13.5, fontWeight: 600, color: provider === id ? 'var(--accent-text)' : 'var(--text-2)', border: '1px solid', fontFamily: 'var(--font-sans)', background: 'var(--surface)' }}>
                  {lb}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="label-cap" style={{ display: 'block', marginBottom: 8 }}>{t('set.llm.key')}</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="field" type="password" defaultValue="sk-ant-xxxxxxxxxxxxxxxxxxxx" style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }} />
              <button className="btn btn-soft">{t('set.llm.test')}</button>
              <button className="btn btn-ghost"><Icon name="trash" size={14} /></button>
            </div>
          </div>
          <div>
            <span className="label-cap" style={{ display: 'block', marginBottom: 8 }}>{t('set.llm.model')}</span>
            <select className="field" defaultValue="s46">
              <option value="s46">claude-sonnet-4-6</option>
              <option value="o48">claude-opus-4-8</option>
              <option value="h45">claude-haiku-4-5</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 10, padding: 14, borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <Icon name="lock" size={16} style={{ color: 'var(--text-3)', flex: 'none', marginTop: 1 }} />
            <span style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.55 }}>{t('set.llm.note')}</span>
          </div>
        </div>
      )}

      {tab === 'classify' && (
        <div className="card" style={{ padding: 22 }}>
          <span className="label-cap" style={{ display: 'block', marginBottom: 10 }}>{t('import.col.detected')}</span>
          <p style={{ fontSize: 13.5, color: 'var(--text-2)', margin: '0 0 16px', lineHeight: 1.6 }}>
            Quy tắc tự động nhận diện loại văn bản từ tên file. Ví dụ: tên chứa "Luật" → law, "Nghị định / NĐ-CP" → decree, "Thông tư / TT-" → circular.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {([['Luật, QH', 'law'], ['Nghị định, NĐ-CP', 'decree'], ['Thông tư, TT-', 'circular'], ['Quyết định, QĐ-', 'decision'], ['Quy chế, Chính sách', 'policy'], ['SOP-', 'sop']] as [string, string][]).map(([pat, dt]) => (
              <div key={dt} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 13px', borderRadius: 9, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <code style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--text-2)', flex: 1 }}>{pat}</code>
                <Icon name="arrowRight" size={14} style={{ color: 'var(--text-3)' }} />
                <DocTypeBadge type={dt} />
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'ui' && (
        <div className="card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <SetRow label={t('set.ui.lang')}>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              {([['vi', 'Tiếng Việt'], ['en', 'English']] as [string, string][]).map(([id, lb]) => (
                <button key={id} onClick={() => setLang(id as 'vi' | 'en')} className="btn btn-sm"
                  style={{ background: lang === id ? 'var(--accent-soft)' : 'var(--surface-2)', color: lang === id ? 'var(--accent-text)' : 'var(--text-2)', border: '1px solid ' + (lang === id ? 'var(--accent-border)' : 'var(--border)') }}>
                  {lb}
                </button>
              ))}
            </div>
          </SetRow>
          <SetRow label={t('set.ui.theme')}>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              {([['light', t('set.theme.light')], ['dark', t('set.theme.dark')]] as [string, string][]).map(([id, lb]) => (
                <button key={id} onClick={() => setTheme(id as 'light' | 'dark')} className="btn btn-sm"
                  style={{ background: theme === id ? 'var(--accent-soft)' : 'var(--surface-2)', color: theme === id ? 'var(--accent-text)' : 'var(--text-2)', border: '1px solid ' + (theme === id ? 'var(--accent-border)' : 'var(--border)') }}>
                  <Icon name={id === 'dark' ? 'moon' : 'sun'} size={13} />{lb}
                </button>
              ))}
            </div>
          </SetRow>
          <SetRow label={t('set.ui.perpage')}>
            <select className="field" defaultValue="20" style={{ marginLeft: 'auto', width: 100 }}>
              <option>10</option><option>20</option><option>50</option>
            </select>
          </SetRow>
        </div>
      )}
    </div>
  );
}

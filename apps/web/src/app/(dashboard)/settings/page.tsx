'use client';
import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Icon } from '@/components/ui/Icon';
import { DocTypeBadge } from '@/components/ui/Badges';
import { PageHead } from '@/components/ui/PageHead';
import { toast } from '@/components/ui/Toast';

type TestResult = { ok: boolean; provider?: string; model?: string; latencyMs?: number; error?: string };

function SetRow({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, minHeight: 44 }}>
      <div style={{ minWidth: 150 }}>
        <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text-2)' }}>{label}</div>
        {sub && <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2 }}>{sub}</div>}
      </div>
      {children}
    </div>
  );
}

const ANTHROPIC_MODELS = [
  ['claude-haiku-4-5-20251001', 'Haiku 4.5 — nhanh, rẻ'],
  ['claude-sonnet-4-6', 'Sonnet 4.6 — cân bằng'],
  ['claude-opus-4-8', 'Opus 4.8 — mạnh nhất'],
];
const OPENAI_MODELS = [
  ['gpt-4o-mini', 'GPT-4o mini'],
  ['gpt-4o', 'GPT-4o'],
  ['gpt-4-turbo', 'GPT-4 Turbo'],
];

export default function SettingsPage() {
  const { t, lang, setLang, theme, setTheme } = useApp();
  const [tab, setTab] = useState<'storage' | 'llm' | 'classify' | 'ui'>('storage');

  // LLM state
  const [provider, setProvider] = useState('anthropic');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('claude-haiku-4-5-20251001');
  const [baseUrl, setBaseUrl] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [keyMask, setKeyMask] = useState('');  // masked display from server
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [keyDirty, setKeyDirty] = useState(false);

  // Storage state
  const [dbSize, setDbSize] = useState<string | null>(null);

  useEffect(() => {
    // load persisted LLM settings
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => {
        if (data.llm_provider) setProvider(data.llm_provider);
        if (data.llm_model) setModel(data.llm_model);
        if (data.llm_api_key) setKeyMask(data.llm_api_key);  // already masked by server
        if (data.llm_base_url) setBaseUrl(data.llm_base_url);
      })
      .catch(() => {});
    // corpus size approximation
    fetch('/api/corpus')
      .then(r => r.json())
      .then(data => {
        const total: number = data.stats?.total ?? 0;
        setDbSize(total + ' văn bản');
      })
      .catch(() => {});
  }, []);

  const saveSettings = () => {
    setSaving(true);
    const body: Record<string, string> = { llm_provider: provider, llm_model: model };
    if (keyDirty && apiKey) body.llm_api_key = apiKey;
    if (baseUrl) body.llm_base_url = baseUrl;
    fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(r => r.json())
      .then(data => {
        if (data.ok) {
          toast('Đã lưu cài đặt', { kind: 'success' });
          setKeyDirty(false);
          if (apiKey) { setKeyMask('••••' + apiKey.slice(-4)); setApiKey(''); }
        } else {
          toast(data.error || 'Lỗi lưu', { kind: 'error' });
        }
      })
      .catch(() => toast('Lỗi kết nối', { kind: 'error' }))
      .finally(() => setSaving(false));
  };

  const testConnection = () => {
    setTesting(true);
    setTestResult(null);
    // save first if dirty
    const doTest = () => fetch('/api/llm').then(r => r.json()).then(setTestResult).finally(() => setTesting(false));
    if (keyDirty && apiKey) {
      const body: Record<string, string> = { llm_provider: provider, llm_model: model, llm_api_key: apiKey };
      if (baseUrl) body.llm_base_url = baseUrl;
      fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        .then(() => doTest()).catch(() => { setTesting(false); toast('Lỗi lưu key', { kind: 'error' }); });
    } else {
      doTest();
    }
  };

  const modelOptions = provider === 'openai' ? OPENAI_MODELS : ANTHROPIC_MODELS;

  return (
    <div className="anim-up" style={{ maxWidth: 760, margin: '0 auto' }}>
      <PageHead title={t('set.title')} />

      {/* tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', marginBottom: 22 }}>
        {(['storage', 'llm', 'classify', 'ui'] as const).map(id => (
          <button key={id} type="button" onClick={() => setTab(id)} style={{ border: 'none', background: 'transparent', padding: '10px 14px', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', color: tab === id ? 'var(--text)' : 'var(--text-3)', borderBottom: tab === id ? '2px solid var(--accent)' : '2px solid transparent', marginBottom: -1, fontFamily: 'var(--font-sans)' }}>
            {t('set.tab.' + id)}
          </button>
        ))}
      </div>

      {/* ── STORAGE ── */}
      {tab === 'storage' && (
        <div className="card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <SetRow label={t('set.storage.dir')}>
            <code style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-2)' }}>~/.policylocal/corpus.db</code>
          </SetRow>
          <SetRow label={t('set.storage.usage')} sub={dbSize || '…'}>
            <div style={{ flex: 1 }}>
              <div style={{ height: 8, borderRadius: 99, background: 'var(--surface-3)', overflow: 'hidden', marginBottom: 4 }}>
                <div style={{ height: '100%', width: '23%', background: 'var(--accent)', borderRadius: 99 }} />
              </div>
            </div>
          </SetRow>
          <div className="hr" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderRadius: 10, background: 'var(--red-bg)' }}>
            <Icon name="alert" size={18} style={{ color: 'var(--red-text)' }} />
            <span style={{ fontSize: 13, color: 'var(--text-2)', flex: 1 }}>{t('set.storage.wipe')}</span>
            <button type="button" className="btn btn-danger btn-sm"><Icon name="trash" size={13} />{t('set.storage.wipe')}</button>
          </div>
        </div>
      )}

      {/* ── LLM ── */}
      {tab === 'llm' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* provider selector */}
          <div className="card" style={{ padding: 20 }}>
            <span className="label-cap" style={{ display: 'block', marginBottom: 12 }}>{t('set.llm.provider')}</span>
            <div style={{ display: 'flex', gap: 10 }}>
              {([['anthropic', 'Anthropic', 'Claude'], ['openai', 'OpenAI', 'GPT / compatible'], ['ollama', 'Ollama', 'Local model']] as [string, string, string][]).map(([id, lb, sub]) => (
                <button key={id} type="button" onClick={() => { setProvider(id); setModel(id === 'openai' ? 'gpt-4o-mini' : 'claude-haiku-4-5-20251001'); }}
                  className="card" style={{ flex: 1, padding: '13px 10px', cursor: 'pointer', textAlign: 'center', borderColor: provider === id ? 'var(--accent)' : 'var(--border)', boxShadow: provider === id ? '0 0 0 3px var(--accent-soft)' : 'none', border: '1px solid', fontFamily: 'var(--font-sans)', background: 'var(--surface)', transition: 'all 0.16s' }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: provider === id ? 'var(--accent-text)' : 'var(--text)' }}>{lb}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 3 }}>{sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* API key */}
          <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <span className="label-cap" style={{ display: 'block', marginBottom: 8 }}>{t('set.llm.key')}</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <input className="field"
                    type={showKey ? 'text' : 'password'}
                    value={keyDirty ? apiKey : (keyMask || '')}
                    placeholder={keyMask ? keyMask : (provider === 'anthropic' ? 'sk-ant-…' : provider === 'openai' ? 'sk-…' : 'http://localhost:11434')}
                    onChange={e => { setApiKey(e.target.value); setKeyDirty(true); setTestResult(null); }}
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 13, paddingRight: 36 }} />
                  <button type="button" title={showKey ? 'Ẩn' : 'Hiện'}
                    onClick={() => setShowKey(v => !v)}
                    style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-3)' }}>
                    <Icon name={showKey ? 'eyeOff' : 'eye'} size={15} />
                  </button>
                </div>
                <button type="button" className="btn btn-ghost" title="Xóa key" onClick={() => { setApiKey(''); setKeyMask(''); setKeyDirty(true); }}>
                  <Icon name="trash" size={14} />
                </button>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon name="lock" size={12} />
                Key lưu local trong SQLite — không gửi ra ngoài ngoài lúc gọi LLM
              </div>
            </div>

            {/* model */}
            <div>
              <span className="label-cap" style={{ display: 'block', marginBottom: 8 }}>{t('set.llm.model')}</span>
              <select className="field" value={model} onChange={e => setModel(e.target.value)} title="Chọn model LLM" aria-label="Chọn model LLM">
                {modelOptions.map(([id, lb]) => <option key={id} value={id}>{lb}</option>)}
              </select>
            </div>

            {/* base URL (Ollama / custom) */}
            {(provider === 'ollama' || provider === 'openai') && (
              <div>
                <span className="label-cap" style={{ display: 'block', marginBottom: 8 }}>Base URL {provider === 'ollama' ? '(Ollama endpoint)' : '(optional override)'}</span>
                <input className="field" type="url" value={baseUrl} onChange={e => setBaseUrl(e.target.value)}
                  placeholder={provider === 'ollama' ? 'http://localhost:11434' : 'https://api.openai.com'} />
              </div>
            )}

            {/* test result */}
            {testResult && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 9, background: testResult.ok ? 'var(--green-bg)' : 'var(--red-bg)', border: '1px solid ' + (testResult.ok ? 'color-mix(in oklch, var(--green-solid) 24%, transparent)' : 'color-mix(in oklch, var(--red-solid) 24%, transparent)') }}>
                <Icon name={testResult.ok ? 'shieldCheck' : 'alert'} size={16} style={{ color: testResult.ok ? 'var(--green-text)' : 'var(--red-text)', flex: 'none' }} />
                <span style={{ fontSize: 13, color: testResult.ok ? 'var(--green-text)' : 'var(--red-text)', fontWeight: 500 }}>
                  {testResult.ok
                    ? `Kết nối thành công — ${testResult.provider} / ${testResult.model} (${testResult.latencyMs}ms)`
                    : testResult.error}
                </span>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="btn btn-ghost" onClick={testConnection} disabled={testing} style={{ gap: 8 }}>
                {testing
                  ? <Icon name="refresh" size={14} style={{ animation: 'spin 0.8s linear infinite' }} />
                  : <Icon name="shieldCheck" size={14} />}
                {t('set.llm.test')}
              </button>
              <button type="button" className="btn btn-primary" onClick={saveSettings} disabled={saving} style={{ marginLeft: 'auto' }}>
                {saving ? <Icon name="refresh" size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Icon name="check" size={14} />}
                {t('common.save')}
              </button>
            </div>
          </div>

          {/* RAG info box */}
          <div className="card" style={{ padding: 18, background: 'var(--accent-soft)', border: '1px solid var(--accent-border)' }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--accent-text)', marginBottom: 8 }}>
              Cách hoạt động (RAG)
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.65, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, background: 'var(--surface-2)', padding: '1px 7px', borderRadius: 5, flex: 'none', marginTop: 1 }}>1</span>
                <span>User hỏi → hệ thống tìm các đoạn văn bản liên quan trong corpus SQLite</span>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, background: 'var(--surface-2)', padding: '1px 7px', borderRadius: 5, flex: 'none', marginTop: 1 }}>2</span>
                <span>Các đoạn đó được gửi kèm câu hỏi đến LLM như context</span>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, background: 'var(--surface-2)', padding: '1px 7px', borderRadius: 5, flex: 'none', marginTop: 1 }}>3</span>
                <span>LLM trả lời <strong>chỉ dựa trên corpus</strong> — không hallucinate ngoài dữ liệu đã import</span>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, background: 'var(--surface-2)', padding: '1px 7px', borderRadius: 5, flex: 'none', marginTop: 1 }}>4</span>
                <span>Mỗi câu trả lời đều có receipt ID và danh sách nguồn trích dẫn</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CLASSIFY ── */}
      {tab === 'classify' && (
        <div className="card" style={{ padding: 22 }}>
          <span className="label-cap" style={{ display: 'block', marginBottom: 10 }}>{t('import.col.detected')}</span>
          <p style={{ fontSize: 13.5, color: 'var(--text-2)', margin: '0 0 16px', lineHeight: 1.6 }}>
            Quy tắc tự động nhận diện loại văn bản từ tên file. Được áp dụng khi import — có thể sửa thủ công trong bước Classify.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {([['Luật, QH, QH14', 'law'], ['Nghị định, NĐ-CP', 'decree'], ['Thông tư, TT-', 'circular'], ['Quyết định, QĐ-', 'decision'], ['Quy chế, Chính sách, policy', 'policy'], ['SOP-', 'sop']] as [string, string][]).map(([pat, dt]) => (
              <div key={dt} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 13px', borderRadius: 9, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <code style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--text-2)', flex: 1 }}>{pat}</code>
                <Icon name="arrowRight" size={14} style={{ color: 'var(--text-3)' }} />
                <DocTypeBadge type={dt} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── UI ── */}
      {tab === 'ui' && (
        <div className="card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <SetRow label={t('set.ui.lang')}>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              {([['vi', 'Tiếng Việt'], ['en', 'English']] as [string, string][]).map(([id, lb]) => (
                <button key={id} type="button" onClick={() => setLang(id as 'vi' | 'en')} className="btn btn-sm"
                  style={{ background: lang === id ? 'var(--accent-soft)' : 'var(--surface-2)', color: lang === id ? 'var(--accent-text)' : 'var(--text-2)', border: '1px solid ' + (lang === id ? 'var(--accent-border)' : 'var(--border)') }}>
                  {lb}
                </button>
              ))}
            </div>
          </SetRow>
          <SetRow label={t('set.ui.theme')}>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              {([['light', t('set.theme.light')], ['dark', t('set.theme.dark')]] as [string, string][]).map(([id, lb]) => (
                <button key={id} type="button" onClick={() => setTheme(id as 'light' | 'dark')} className="btn btn-sm"
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

'use client';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Icon } from '@/components/ui/Icon';

const iconBtnStyle: React.CSSProperties = {
  width: 38, height: 38, borderRadius: 9, border: '1px solid var(--border)', background: 'var(--surface-2)',
  display: 'grid', placeItems: 'center', cursor: 'pointer', color: 'var(--text-2)', transition: 'all 0.15s',
};

export function Header() {
  const { t, lang, setLang, theme, setTheme, collapsed, setCollapsed } = useApp();
  const router = useRouter();

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 40, height: 60, display: 'flex', alignItems: 'center', gap: 14,
      padding: '0 24px', background: 'color-mix(in oklch, var(--bg) 82%, transparent)',
      backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)',
    }}>
      <button className="icon-btn-h" onClick={() => setCollapsed(!collapsed)} title="Toggle sidebar" style={iconBtnStyle}>
        <Icon name="layers" size={17} />
      </button>

      <button onClick={() => router.push('/search')} style={{
        flex: 1, maxWidth: 460, display: 'flex', alignItems: 'center', gap: 10, height: 38, padding: '0 13px',
        background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 9,
        color: 'var(--text-3)', cursor: 'pointer', fontSize: 13.5, fontFamily: 'var(--font-sans)',
      }}>
        <Icon name="search" size={16} />
        <span>{t('header.searchHint')}</span>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 11, border: '1px solid var(--border-strong)', borderRadius: 5, padding: '2px 6px', color: 'var(--text-3)' }}>⌘K</span>
      </button>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ display: 'flex', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 99, padding: 3, gap: 2 }}>
          {(['vi', 'en'] as const).map(l => (
            <button key={l} onClick={() => setLang(l)} style={{
              fontFamily: 'var(--font-sans)', border: 'none',
              background: lang === l ? 'var(--surface)' : 'transparent',
              color: lang === l ? 'var(--text)' : 'var(--text-3)',
              fontSize: 12, fontWeight: 600, padding: '5px 11px', borderRadius: 99, cursor: 'pointer',
              boxShadow: lang === l ? 'var(--shadow-sm)' : 'none',
            }}>{l === 'vi' ? 'VN' : 'EN'}</button>
          ))}
        </div>
        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} style={iconBtnStyle} title={t('header.theme')}>
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={17} />
        </button>
      </div>
    </header>
  );
}

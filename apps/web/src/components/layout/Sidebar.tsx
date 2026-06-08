'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Icon } from '@/components/ui/Icon';

export function Sidebar() {
  const { t, collapsed } = useApp();
  const pathname = usePathname();
  const [openCorpus, setOpenCorpus] = useState(pathname.startsWith('/corpus'));

  const isActive = (href: string) => pathname === href || (href !== '/' && pathname.startsWith(href));

  const Item = ({ href, icon, label, badge, hasChildren }: { href: string; icon: string; label: string; badge?: string; hasChildren?: boolean }) => {
    const active = isActive(href);
    return (
      <Link href={href}
        onClick={hasChildren ? (e) => { e.preventDefault(); setOpenCorpus(o => !o); } : undefined}
        style={{
          display: 'flex', alignItems: 'center', gap: 11, padding: '9px 11px', borderRadius: 9, textDecoration: 'none',
          color: active ? 'var(--on-accent)' : 'var(--sidebar-text)',
          background: active ? 'var(--grad)' : 'transparent',
          boxShadow: active ? '0 4px 12px color-mix(in oklch, var(--accent) 36%, transparent)' : 'none',
          fontSize: 13.5, fontWeight: active ? 600 : 500,
          transition: 'background 0.14s, color 0.14s', cursor: 'pointer',
        }}
        onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--sidebar-bg-2)'; }}
        onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
        <Icon name={icon} size={17} sw={1.9} style={{ flex: 'none' }} />
        {!collapsed && <span style={{ flex: 1 }}>{label}</span>}
        {!collapsed && badge && (
          <span style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: '0.04em', padding: '2px 6px', borderRadius: 5, background: 'var(--accent)', color: 'var(--on-accent)' }}>{badge}</span>
        )}
        {!collapsed && hasChildren && (
          <Icon name="chevronDown" size={14} style={{ transform: openCorpus ? 'none' : 'rotate(-90deg)', transition: 'transform 0.18s', color: 'var(--sidebar-text-dim)' }} />
        )}
      </Link>
    );
  };

  const Section = ({ label }: { label: string }) =>
    collapsed
      ? <div style={{ height: 1, background: 'var(--sidebar-border)', margin: '14px 8px' }} />
      : <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.09em', color: 'var(--sidebar-text-dim)', padding: '0 11px', margin: '18px 0 8px' }}>{label}</div>;

  return (
    <aside style={{
      width: collapsed ? 64 : 244, flex: 'none', background: 'var(--sidebar-bg)',
      borderRight: '1px solid var(--sidebar-border)', display: 'flex', flexDirection: 'column',
      transition: 'width 0.24s var(--ease)', height: '100vh', position: 'sticky', top: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '18px 16px 14px' }}>
        <span style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--grad)', display: 'grid', placeItems: 'center', color: 'var(--on-accent)', flex: 'none', boxShadow: '0 3px 10px color-mix(in oklch, var(--accent) 40%, transparent)' }}>
          <Icon name="fileText" size={17} sw={2} />
        </span>
        {!collapsed && <div style={{ fontWeight: 600, fontSize: 15.5, color: 'var(--text)', letterSpacing: '-0.01em' }}>PolicyLocal</div>}
      </div>

      <nav style={{ flex: 1, overflowY: 'auto', padding: '6px 12px' }}>
        <Section label={t('nav.section.workspace')} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Item href="/dashboard" icon="dashboard" label={t('nav.dashboard')} />
          <Item href="/corpus" icon="folder" label={t('nav.corpus')} hasChildren />
          {openCorpus && !collapsed && (
            <div style={{ marginLeft: 30, display: 'flex', flexDirection: 'column', gap: 1, paddingLeft: 8, borderLeft: '1px solid var(--sidebar-border)' }}>
              {([['corpus/import', t('nav.corpus.import')], ['corpus', t('nav.corpus.manage')]] as [string, string][]).map(([id, lb]) => (
                <Link key={id} href={'/' + id} style={{ padding: '7px 10px', borderRadius: 6, textDecoration: 'none', fontSize: 13, color: pathname === '/' + id ? 'var(--sidebar-active-fg)' : 'var(--sidebar-text-dim)', fontWeight: pathname === '/' + id ? 600 : 500 }}>{lb}</Link>
              ))}
            </div>
          )}
          <Item href="/search" icon="search" label={t('nav.search')} />
          <Item href="/chat" icon="chat" label={t('nav.chat')} badge="Beta" />
          <Item href="/collections" icon="bookmark" label={t('nav.collections')} />
        </div>

        <Section label={t('nav.section.govern')} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Item href="/reports" icon="chartBar" label={t('nav.reports')} />
          <Item href="/freshness" icon="refresh" label={t('nav.freshness')} />
          <Item href="/audit" icon="shield" label={t('nav.audit')} />
          <Item href="/settings" icon="settings" label={t('nav.settings')} />
        </div>
      </nav>

      {!collapsed && (
        <div style={{ margin: 12, padding: '11px 13px', borderRadius: 10, background: 'var(--sidebar-bg-2)', border: '1px solid var(--sidebar-border)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 28, height: 28, borderRadius: 8, background: 'color-mix(in oklch, var(--green-solid) 22%, transparent)', color: 'var(--green-solid)', display: 'grid', placeItems: 'center', flex: 'none' }}>
            <Icon name="lock" size={14} sw={2.2} />
          </span>
          <span style={{ fontSize: 11.5, color: 'var(--sidebar-text)', lineHeight: 1.35 }}>{t('common.local')}</span>
        </div>
      )}
    </aside>
  );
}

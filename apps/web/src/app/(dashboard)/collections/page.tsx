'use client';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Icon } from '@/components/ui/Icon';
import { PageHead } from '@/components/ui/PageHead';
import { COLLECTIONS, SAVED_SEARCHES } from '@/lib/mock';

const COLOR_MAP: Record<string, string> = {
  blue: 'var(--blue-solid)',
  green: 'var(--green-solid)',
  amber: 'var(--amber-solid)',
};

export default function CollectionsPage() {
  const { t } = useApp();
  const router = useRouter();

  return (
    <div className="anim-up">
      <PageHead title={t('col.title')} actions={
        <button className="btn btn-primary"><Icon name="plus" size={15} />{t('col.new')}</button>
      } />

      <span className="label-cap">{t('col.collections')}</span>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, margin: '12px 0 28px' }}>
        {COLLECTIONS.map(c => {
          const col = COLOR_MAP[c.color] || 'var(--accent)';
          return (
            <div key={c.id} onClick={() => router.push('/corpus')} className="card"
              style={{ padding: 18, cursor: 'pointer', transition: 'box-shadow 0.18s, transform 0.18s' }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = 'var(--shadow-md)'; el.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = 'var(--shadow-sm)'; el.style.transform = 'none'; }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ width: 40, height: 40, borderRadius: 11, background: `color-mix(in oklch, ${col} 16%, transparent)`, color: col, display: 'grid', placeItems: 'center' }}>
                  <Icon name="bookmark" size={19} />
                </span>
                <button style={{ border: 'none', background: 'transparent', color: 'var(--text-3)', cursor: 'pointer' }}>
                  <Icon name="more" size={16} />
                </button>
              </div>
              <div style={{ fontSize: 15.5, fontWeight: 600, margin: '14px 0 4px', letterSpacing: '-0.01em' }}>{c.name}</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>{c.count} {t('col.items')} · {t('col.updated')} {c.updated}</div>
            </div>
          );
        })}
      </div>

      <span className="label-cap">{t('col.saved')}</span>
      <div className="card" style={{ marginTop: 12, overflow: 'hidden' }}>
        {SAVED_SEARCHES.map((s, i) => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderTop: i ? '1px solid var(--border)' : 'none' }}>
            <Icon name="search" size={16} style={{ color: 'var(--text-3)' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>"{s.query}"</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{s.filters} · {s.count} {t('common.results')}</div>
            </div>
            <button className="btn btn-soft btn-sm" onClick={() => router.push('/search')}>
              <Icon name="refresh" size={13} />{t('col.run') || 'Chạy lại'}
            </button>
            <button style={{ border: 'none', background: 'transparent', color: 'var(--text-3)', cursor: 'pointer' }}>
              <Icon name="trash" size={15} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

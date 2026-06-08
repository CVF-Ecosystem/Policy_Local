import { ReactNode } from 'react';
import { Icon } from './Icon';

export function EmptyState({ icon, title, desc, actions }: {
  icon: string; title: string; desc: string; actions?: ReactNode;
}) {
  return (
    <div className="anim-in" style={{ textAlign: 'center', padding: '64px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'grid', placeItems: 'center', color: 'var(--text-3)', marginBottom: 8 }}>
        <Icon name={icon} size={26} sw={1.7} />
      </div>
      <div style={{ fontSize: 16, fontWeight: 600 }}>{title}</div>
      <div style={{ fontSize: 14, color: 'var(--text-2)', maxWidth: 360 }}>{desc}</div>
      {actions && <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>{actions}</div>}
    </div>
  );
}

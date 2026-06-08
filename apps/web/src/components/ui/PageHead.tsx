import { ReactNode } from 'react';

export function PageHead({ title, sub, actions, children }: {
  title: string; sub?: string; actions?: ReactNode; children?: ReactNode;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: 200 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', margin: 0 }}>{title}</h1>
        {sub && <p style={{ fontSize: 14.5, color: 'var(--text-2)', margin: '6px 0 0', maxWidth: '60ch' }}>{sub}</p>}
        {children}
      </div>
      {actions && <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>{actions}</div>}
    </div>
  );
}

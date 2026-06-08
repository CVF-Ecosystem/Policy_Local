'use client';
import { useEffect, ReactNode } from 'react';

export function Drawer({ open, onClose, width = 460, children }: {
  open: boolean; onClose: () => void; width?: number; children: ReactNode;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 80 }}>
      <div onClick={onClose} className="anim-in" style={{ position: 'absolute', inset: 0, background: 'oklch(0 0 0 / 0.32)', backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width, maxWidth: '94vw', background: 'var(--surface)', borderLeft: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)', animation: 'slideIn 0.32s var(--ease) both', display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  );
}

export function Modal({ open, onClose, width = 520, children }: {
  open: boolean; onClose: () => void; width?: number; children: ReactNode;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 90, display: 'grid', placeItems: 'center', padding: 20 }}>
      <div onClick={onClose} className="anim-in" style={{ position: 'absolute', inset: 0, background: 'oklch(0 0 0 / 0.4)', backdropFilter: 'blur(3px)' }} />
      <div className="card" style={{ position: 'relative', width, maxWidth: '95vw', maxHeight: '88vh', overflow: 'auto', boxShadow: 'var(--shadow-lg)', animation: 'scaleIn 0.24s var(--ease) both' }}>
        {children}
      </div>
    </div>
  );
}

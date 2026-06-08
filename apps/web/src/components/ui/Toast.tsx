'use client';
import { useState, useEffect } from 'react';
import { Icon } from './Icon';

interface ToastItem { id: number; message: string; kind: 'success' | 'info' | 'warn' | 'error'; }

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);
  useEffect(() => {
    let id = 0;
    const h = (e: Event) => {
      const detail = (e as CustomEvent).detail as Omit<ToastItem, 'id'> & { duration?: number };
      const item: ToastItem = { id: ++id, kind: detail.kind ?? 'success', message: detail.message };
      setItems(xs => [...xs, item]);
      setTimeout(() => setItems(xs => xs.filter(x => x.id !== item.id)), detail.duration || 2800);
    };
    window.addEventListener('pl-toast', h);
    return () => window.removeEventListener('pl-toast', h);
  }, []);

  const tone: Record<string, string> = { success: 'green', info: 'blue', warn: 'amber', error: 'red' };
  const ico: Record<string, string> = { success: 'check2', info: 'info', warn: 'alert', error: 'x' };

  return (
    <div style={{ position: 'fixed', bottom: 22, left: '50%', transform: 'translateX(-50%)', zIndex: 120, display: 'flex', flexDirection: 'column', gap: 9, alignItems: 'center', pointerEvents: 'none' }}>
      {items.map(item => {
        const c = tone[item.kind] || 'green';
        return (
          <div key={item.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 16px 11px 13px', boxShadow: 'var(--shadow-lg)', animation: 'fadeUp 0.3s var(--ease) both', minWidth: 240, maxWidth: 420 }}>
            <span style={{ width: 26, height: 26, borderRadius: 7, flex: 'none', display: 'grid', placeItems: 'center', background: `var(--${c}-bg)`, color: `var(--${c}-text)` }}>
              <Icon name={ico[item.kind] || 'check2'} size={15} sw={2.6} />
            </span>
            <span style={{ fontSize: 13.5, color: 'var(--text)', fontWeight: 500 }}>{item.message}</span>
          </div>
        );
      })}
    </div>
  );
}

export function toast(message: string, opts?: { kind?: 'success' | 'info' | 'warn' | 'error'; duration?: number }) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('pl-toast', { detail: { kind: (opts?.kind ?? 'success') as ToastItem['kind'], duration: opts?.duration, message } }));
  }
}

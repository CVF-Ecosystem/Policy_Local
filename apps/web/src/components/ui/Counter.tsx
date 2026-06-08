'use client';
import { useState, useEffect } from 'react';

function useCountUp(target: number | string, dur = 900) {
  const num = typeof target === 'number' ? target : parseFloat(String(target).replace(/[^0-9.]/g, '')) || 0;
  const [val, setVal] = useState(num);
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVal(num); return;
    }
    let raf: number, done = false;
    let start: number | undefined;
    const finish = () => { if (!done) { done = true; setVal(num); } };
    const ease = (x: number) => 1 - Math.pow(1 - x, 3);
    const tick = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / dur, 1);
      setVal(num * ease(p));
      if (p < 1) raf = requestAnimationFrame(tick); else finish();
    };
    raf = requestAnimationFrame(tick);
    const safety = setTimeout(finish, dur + 500);
    return () => { cancelAnimationFrame(raf); clearTimeout(safety); };
  }, [num, dur]);
  return val;
}

export function Counter({ value, dur = 900 }: { value: number | string; dur?: number }) {
  const isNum = typeof value === 'number';
  const raw = isNum ? value : String(value);
  const hasComma = !isNum && String(raw).includes(',');
  const v = useCountUp(value, dur);
  const rounded = Math.round(v);
  return <span>{hasComma || rounded >= 1000 ? rounded.toLocaleString() : rounded}</span>;
}

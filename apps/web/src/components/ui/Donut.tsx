'use client';

interface Segment { value: number; color: string; }

export function Donut({ segments, size = 132, stroke = 16, animate = true }: {
  segments: Segment[]; size?: number; stroke?: number; animate?: boolean;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
      className={animate ? 'donut-anim' : ''} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={stroke} />
      {segments.map((s, i) => {
        const len = (s.value / total) * circ;
        const el = (
          <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke={s.color} strokeWidth={stroke}
            strokeDasharray={`${len} ${circ - len}`} strokeDashoffset={-offset}
            strokeLinecap="butt"
            style={{ '--circ': circ, animationDelay: (0.12 + i * 0.14) + 's' } as React.CSSProperties}
          />
        );
        offset += len;
        return el;
      })}
    </svg>
  );
}

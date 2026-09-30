import { useRef, useState, type CSSProperties } from 'react';
import type { CurvesValue, CurvePt } from '../store/DialStore';
import { Folder } from './Folder';
import { valuesEqual } from './valuesEqual';

/**
 * CurvesControl — an editable response curve. With `variant: 'rgb'` it shows
 * RGB/R/G/B tabs for color grading; with `variant: 'single'` it's one curve for
 * tone / easing / remapping. Drag points; click empty space to add a point;
 * double-click a middle point to remove it. Endpoints move only vertically.
 *
 * Resolve with `sampleCurve(points, x)` → y (both in [0,1]); `curveChannel(value,
 * ch)` gets a channel's points.
 */

type Channel = 'rgb' | 'r' | 'g' | 'b';

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/**
 * Monotone cubic (Fritsch–Carlson / PCHIP) sampled y for x (both [0,1]). This is
 * what real curve tools use: smooth through the points but **never overshoots**
 * between them — a steep control point can't make the curve bulge past it the way
 * a Catmull-Rom spline does. Used for drawing and by consumers.
 */
export function sampleCurve(pts: CurvePt[], x: number): number {
  const n = pts.length;
  if (n === 0) return x;
  if (n === 1) return clamp(pts[0].y, 0, 1);
  if (x <= pts[0].x) return clamp(pts[0].y, 0, 1);
  if (x >= pts[n - 1].x) return clamp(pts[n - 1].y, 0, 1);

  // Segment widths (h) and secant slopes (delta).
  const h: number[] = [];
  const delta: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    const dx = pts[i + 1].x - pts[i].x || 1e-6;
    h.push(dx);
    delta.push((pts[i + 1].y - pts[i].y) / dx);
  }

  // Tangents, then the Fritsch–Carlson limiter that guarantees monotonicity.
  const m = new Array<number>(n);
  m[0] = delta[0];
  m[n - 1] = delta[n - 2];
  for (let i = 1; i < n - 1; i++) {
    m[i] = delta[i - 1] * delta[i] <= 0 ? 0 : (delta[i - 1] + delta[i]) / 2;
  }
  for (let i = 0; i < n - 1; i++) {
    if (delta[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / delta[i];
    const b = m[i + 1] / delta[i];
    const s = a * a + b * b;
    if (s > 9) {
      const t = 3 / Math.sqrt(s);
      m[i] = t * a * delta[i];
      m[i + 1] = t * b * delta[i];
    }
  }

  // Cubic Hermite on the containing segment.
  let i = 0;
  while (i < n - 1 && pts[i + 1].x < x) i++;
  const t = (x - pts[i].x) / h[i];
  const t2 = t * t;
  const t3 = t2 * t;
  const y =
    (2 * t3 - 3 * t2 + 1) * pts[i].y +
    (t3 - 2 * t2 + t) * h[i] * m[i] +
    (-2 * t3 + 3 * t2) * pts[i + 1].y +
    (t3 - t2) * h[i] * m[i + 1];
  return clamp(y, 0, 1);
}

export function curveChannel(value: CurvesValue, ch: Channel): CurvePt[] {
  return value[ch] ?? [{ x: 0, y: 0 }, { x: 1, y: 1 }];
}

// The composite (RGB) curve draws in the theme's primary text color so it reads on
// either background — never a hardcoded white that vanishes on a light panel.
const CHANNEL_TABS: { key: Channel; label: string; dot: string }[] = [
  { key: 'rgb', label: 'RGB', dot: 'var(--dial-text-focus)' },
  { key: 'r', label: 'R', dot: '#ff5a52' },
  { key: 'g', label: 'G', dot: '#4cd964' },
  { key: 'b', label: 'B', dot: '#3b9bff' },
];

interface CurvesControlProps {
  label: string;
  value: CurvesValue;
  defaultValue: CurvesValue;
  onChange: (value: CurvesValue) => void;
  help?: string;
}

export function CurvesControl({ label, value, defaultValue, onChange, help }: CurvesControlProps) {
  const v = value ?? defaultValue;
  const canReset = !valuesEqual(v, defaultValue);
  const isRgb = v.variant === 'rgb';
  const [channel, setChannel] = useState<Channel>('rgb');
  const boxRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<number | null>(null);

  const pts = curveChannel(v, channel);
  const lineColor = CHANNEL_TABS.find((t) => t.key === channel)?.dot ?? '#fff';

  const setPts = (next: CurvePt[]) => onChange({ ...v, [channel]: next });

  const coordFromEvent = (e: { clientX: number; clientY: number }): CurvePt => {
    const r = boxRef.current?.getBoundingClientRect();
    if (!r) return { x: 0, y: 0 };
    return {
      x: clamp((e.clientX - r.left) / r.width, 0, 1),
      y: clamp(1 - (e.clientY - r.top) / r.height, 0, 1),
    };
  };

  const onBgDown = (e: React.PointerEvent) => {
    e.preventDefault();
    const p = coordFromEvent(e);
    // insert sorted by x
    const next = [...pts, p].sort((a, b) => a.x - b.x);
    dragRef.current = next.indexOf(p);
    try {
      boxRef.current?.setPointerCapture(e.pointerId);
    } catch {
      /* no-op */
    }
    setPts(next);
  };

  const onHandleDown = (idx: number) => (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = idx;
    try {
      boxRef.current?.setPointerCapture(e.pointerId);
    } catch {
      /* no-op */
    }
  };

  const onMove = (e: React.PointerEvent) => {
    const idx = dragRef.current;
    if (idx == null) return;
    const p = coordFromEvent(e);
    const isFirst = idx === 0;
    const isLast = idx === pts.length - 1;
    const lo = isFirst ? 0 : pts[idx - 1].x + 0.001;
    const hi = isLast ? 1 : pts[idx + 1].x - 0.001;
    const x = isFirst ? 0 : isLast ? 1 : clamp(p.x, lo, hi);
    setPts(pts.map((pt, i) => (i === idx ? { x, y: p.y } : pt)));
  };

  const onUp = () => {
    dragRef.current = null;
  };

  const removePoint = (idx: number) => {
    if (idx === 0 || idx === pts.length - 1) return; // keep endpoints
    setPts(pts.filter((_, i) => i !== idx));
  };

  // Build the smooth curve polyline (48 samples).
  const N = 48;
  const linePoints = Array.from({ length: N + 1 }, (_, i) => {
    const x = i / N;
    return `${x * 100},${(1 - sampleCurve(pts, x)) * 100}`;
  }).join(' ');

  const tabBtn = (active: boolean): CSSProperties => ({
    flex: 1,
    height: 28,
    borderRadius: 6,
    border: 'none',
    background: active ? 'var(--dial-surface-active)' : 'transparent',
    color: active ? 'var(--dial-text-focus)' : 'var(--dial-text-label)',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  });

  return (
    <Folder title={label} help={help} defaultOpen={true} canReset={canReset} onReset={() => onChange(defaultValue)}>
      <div className="dialkit-curves-control" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {isRgb && (
        <div style={{ display: 'flex', gap: 2, padding: 2, background: 'var(--dial-surface)', border: '1px solid var(--dial-border)', borderRadius: 'var(--dial-radius, 8px)' }}>
          {CHANNEL_TABS.map((t) => (
            <button key={t.key} type="button" onClick={() => setChannel(t.key)} style={tabBtn(channel === t.key)}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: t.dot }} />
              {t.label}
            </button>
          ))}
        </div>
      )}

      <div
        ref={boxRef}
        onPointerDown={onBgDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '1 / 1',
          borderRadius: 'var(--dial-radius, 8px)',
          border: '1px solid var(--dial-border)',
          background: 'var(--dial-surface)',
          touchAction: 'none',
          overflow: 'hidden',
        }}
      >
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          {/* grid */}
          {[25, 50, 75].map((g) => (
            <g key={g}>
              <line x1={g} y1={0} x2={g} y2={100} stroke="var(--dial-border)" strokeWidth={0.5} />
              <line x1={0} y1={g} x2={100} y2={g} stroke="var(--dial-border)" strokeWidth={0.5} />
            </g>
          ))}
          {/* identity reference */}
          <line x1={0} y1={100} x2={100} y2={0} stroke="var(--dial-border)" strokeWidth={0.75} strokeDasharray="2 2" />
          {/* curve */}
          <polyline points={linePoints} fill="none" stroke={lineColor} strokeWidth={1.75} vectorEffect="non-scaling-stroke" />
        </svg>
        {/* point handles (HTML, so pointer targets are crisp) */}
        {pts.map((p, i) => (
          <div
            key={i}
            onPointerDown={onHandleDown(i)}
            onDoubleClick={() => removePoint(i)}
            style={{
              position: 'absolute',
              left: `${p.x * 100}%`,
              top: `${(1 - p.y) * 100}%`,
              width: 12,
              height: 12,
              transform: 'translate(-50%, -50%)',
              borderRadius: '50%',
              background: '#fff',
              border: `2px solid ${lineColor}`,
              boxShadow: '0 1px 3px rgba(0,0,0,0.6)',
              cursor: 'grab',
            }}
          />
        ))}
      </div>
      </div>
    </Folder>
  );
}

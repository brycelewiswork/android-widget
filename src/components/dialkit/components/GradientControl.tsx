import { useEffect, useRef, useState } from 'react';
import { DEFAULT_GRADIENT, type GradientStop, type GradientValue } from '../store/DialStore';
import { ColorCell } from './ColorCell';
import { Folder } from './Folder';
import { ScrubNumber } from './ScrubNumber';
import { SelectField } from './SelectField';
import { valuesEqual } from './valuesEqual';
import { CONTROL_GAP, FIELD, LABEL, SUBLABEL } from './controlStyles';

/**
 * GradientControl — one control that owns a whole gradient: type, angle, and an
 * ordered list of color stops. Never model a gradient as two separate color
 * controls (see DESIGN.md → "Designing control panels").
 *
 * The value is `{ gradientType, angle, stops: [{ pos, color, opacity }] }`. Stops
 * are ordered by `pos`, so dragging a handle along the track *is* the reorder —
 * there's no separate list-reordering step. `gradientToCss(value)` turns it into a
 * CSS gradient string for consumers.
 */

interface GradientControlProps {
  label: string;
  value: GradientValue;
  defaultValue?: GradientValue;
  onChange: (value: GradientValue) => void;
  help?: string;
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

function hexToRgba(hex: string, opacityPct: number): string {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const r = parseInt(h.slice(0, 2), 16) || 0;
  const g = parseInt(h.slice(2, 4), 16) || 0;
  const b = parseInt(h.slice(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${clamp(opacityPct, 0, 100) / 100})`;
}

const hexRgb = (hex: string): [number, number, number] => {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  return [parseInt(h.slice(0, 2), 16) || 0, parseInt(h.slice(2, 4), 16) || 0, parseInt(h.slice(4, 6), 16) || 0];
};

/** Linear RGB blend of two hex colors (t in [0,1]). */
const lerpHex = (a: string, b: string, t: number): string => {
  const [r1, g1, b1] = hexRgb(a);
  const [r2, g2, b2] = hexRgb(b);
  const mix = (x: number, y: number) => Math.round(x + (y - x) * t);
  return '#' + [mix(r1, r2), mix(g1, g2), mix(b1, b2)].map((n) => n.toString(16).padStart(2, '0')).join('').toUpperCase();
};

const sortedStops = (stops: GradientStop[]) => [...stops].sort((a, b) => a.pos - b.pos);

/** CSS gradient string for consumers to apply to `background`. */
export function gradientToCss(value: GradientValue): string {
  const parts = sortedStops(value.stops)
    .map((s) => `${hexToRgba(s.color, s.opacity)} ${s.pos}%`)
    .join(', ');
  return value.gradientType === 'radial'
    ? `radial-gradient(circle, ${parts})`
    : `linear-gradient(${value.angle}deg, ${parts})`;
}

/** Left→right preview for the editor track (ignores angle/type). */
const trackCss = (stops: GradientStop[]) =>
  `linear-gradient(90deg, ${sortedStops(stops)
    .map((s) => `${hexToRgba(s.color, s.opacity)} ${s.pos}%`)
    .join(', ')})`;

export function GradientControl({ label, value, defaultValue, onChange, help }: GradientControlProps) {
  const def = defaultValue ?? DEFAULT_GRADIENT;
  const g = value ?? def;
  const stops: GradientStop[] = g.stops.map((s, i) => (s.id ? s : { ...s, id: `k${i}` }));
  const canReset = !valuesEqual(g, def);

  const trackRef = useRef<HTMLDivElement>(null);
  const dragIdRef = useRef<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const commit = (next: Partial<GradientValue>) => onChange({ ...g, ...next, stops: next.stops ?? stops });
  const setStops = (nextStops: GradientStop[]) => onChange({ ...g, stops: nextStops });
  const updateStop = (id: string, patch: Partial<GradientStop>) =>
    setStops(stops.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const removeStop = (id: string) => {
    if (stops.length <= 2) return;
    setStops(stops.filter((s) => s.id !== id));
  };
  const addStop = () => {
    const ordered = sortedStops(stops);
    let gapStart = ordered[0];
    let best = -1;
    for (let i = 0; i < ordered.length - 1; i++) {
      const gap = ordered[i + 1].pos - ordered[i].pos;
      if (gap > best) {
        best = gap;
        gapStart = ordered[i];
      }
    }
    const next = ordered[ordered.indexOf(gapStart) + 1] ?? gapStart;
    const pos = Math.round((gapStart.pos + next.pos) / 2);
    setStops([...stops, { id: crypto.randomUUID(), pos, color: gapStart.color, opacity: gapStart.opacity }]);
  };

  const posFromClientX = (clientX: number): number => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    return Math.round(clamp(((clientX - rect.left) / rect.width) * 100, 0, 100));
  };

  const onHandleDown = (id: string) => (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedId(id);
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      /* no-op */
    }
    dragIdRef.current = id;
  };
  const onTrackMove = (e: React.PointerEvent) => {
    if (!dragIdRef.current) return;
    updateStop(dragIdRef.current, { pos: posFromClientX(e.clientX) });
  };
  const onTrackUp = () => {
    dragIdRef.current = null;
  };

  // Color the gradient shows at a given position (blend of the surrounding stops).
  const colorAt = (pos: number): { color: string; opacity: number } => {
    const ord = sortedStops(stops);
    if (pos <= ord[0].pos) return { color: ord[0].color, opacity: ord[0].opacity };
    const last = ord[ord.length - 1];
    if (pos >= last.pos) return { color: last.color, opacity: last.opacity };
    let i = 0;
    while (i < ord.length - 1 && ord[i + 1].pos < pos) i++;
    const a = ord[i];
    const b = ord[i + 1];
    const t = (pos - a.pos) / ((b.pos - a.pos) || 1);
    return { color: lerpHex(a.color, b.color, t), opacity: Math.round(a.opacity + (b.opacity - a.opacity) * t) };
  };

  // Click empty track → add a stop at that position (handles stopPropagation, so
  // clicking an existing handle drags it instead). Drag continues on the new stop.
  const onTrackDown = (e: React.PointerEvent) => {
    const pos = posFromClientX(e.clientX);
    const { color, opacity } = colorAt(pos);
    const id = crypto.randomUUID();
    setStops([...stops, { id, pos, color, opacity }]);
    setSelectedId(id);
    dragIdRef.current = id;
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      /* no-op */
    }
  };

  // Backspace / Delete removes the selected stop (unless a field is focused).
  // Keep the latest state in a ref so the window listener (registered once) reads
  // current values without re-subscribing on every render.
  const stateRef = useRef({ selectedId, stops, setStops });
  useEffect(() => {
    stateRef.current = { selectedId, stops, setStops };
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Backspace' && e.key !== 'Delete') return;
      const { selectedId: sel, stops: sts, setStops: set } = stateRef.current;
      if (!sel || sts.length <= 2) return;
      const el = document.activeElement as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
      e.preventDefault();
      set(sts.filter((s) => s.id !== sel));
      setSelectedId(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Clicking away from the gradient (but not into its color-picker/dropdown
  // popovers) deselects the active stop.
  useEffect(() => {
    const onDocDown = (e: PointerEvent) => {
      const t = e.target as Element | null;
      if (!t) return;
      if (t.closest('.dialkit-gradient-control') || t.closest('[data-dialkit-popover]')) return;
      setSelectedId((cur) => (cur == null ? cur : null));
    };
    window.addEventListener('pointerdown', onDocDown);
    return () => window.removeEventListener('pointerdown', onDocDown);
  }, []);

  return (
    <Folder title={label} help={help} defaultOpen={true} canReset={canReset} onReset={() => onChange(def)}>
      <div className="dialkit-gradient-control" style={{ display: 'flex', flexDirection: 'column', gap: CONTROL_GAP + 2 }}>
      {/* Type + Angle */}
      <div style={{ display: 'flex', gap: 8 }}>
        <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={SUBLABEL}>Type</span>
          <SelectField
            value={g.gradientType}
            options={[{ value: 'linear', label: 'Linear' }, { value: 'radial', label: 'Radial' }]}
            onChange={(val) => commit({ gradientType: val as GradientValue['gradientType'] })}
          />
        </label>
        <label style={{ width: 92, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={SUBLABEL}>Angle</span>
          <div style={{ ...FIELD, padding: 0, display: 'flex', alignItems: 'center', opacity: g.gradientType === 'radial' ? 0.4 : 1 }}>
            <ScrubNumber
              value={g.angle}
              min={0}
              max={360}
              suffix="°"
              align="left"
              disabled={g.gradientType === 'radial'}
              onChange={(n) => commit({ angle: n })}
            />
          </div>
        </label>
      </div>

      {/* Stop track — popover-style handles float above, tip pointing at the row middle */}
      <div
        ref={trackRef}
        onPointerDown={onTrackDown}
        onPointerMove={onTrackMove}
        onPointerUp={onTrackUp}
        onPointerCancel={onTrackUp}
        style={{
          position: 'relative',
          height: 26,
          marginTop: 12,
          cursor: 'copy',
          borderRadius: 'var(--dial-radius, 8px)',
          border: '1px solid var(--dial-border)',
          background: `${trackCss(stops)}, repeating-conic-gradient(#808080 0% 25%, #a0a0a0 0% 50%) 0 0 / 12px 12px`,
          touchAction: 'none',
        }}
      >
        {stops.map((s) => {
          const sel = s.id === selectedId;
          return (
            <div
              key={s.id}
              onPointerDown={onHandleDown(s.id!)}
              style={{ position: 'absolute', left: `${s.pos}%`, top: -10, transform: 'translateX(-50%)', cursor: dragIdRef.current === s.id ? 'grabbing' : 'grab', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.45))', zIndex: sel ? 2 : 1 }}
            >
              <svg width={22} height={24} viewBox="0 0 22 24" style={{ display: 'block', pointerEvents: 'none' }}>
                <path
                  d="M7 2 L15 2 Q19 2 19 6 L19 14 Q19 18 15 18 L13 18 L11 23 L9 18 L7 18 Q3 18 3 14 L3 6 Q3 2 7 2 Z"
                  fill={s.color}
                  stroke={sel ? 'var(--dial-text-focus)' : 'var(--dial-text-tertiary)'}
                  strokeWidth={sel ? 2.5 : 1.25}
                />
              </svg>
            </div>
          );
        })}
      </div>

      {/* Stops list */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={LABEL}>Stops</span>
        <button type="button" onClick={addStop} title="Add stop" className="dialkit-ghost-btn" style={{ width: 26, height: 26, fontSize: 17 }}>
          +
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {sortedStops(stops).map((s) => (
          <div
            key={s.id}
            onPointerDown={() => setSelectedId(s.id!)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: 4,
              margin: '0 -4px',
              borderRadius: 8,
              background: s.id === selectedId ? 'var(--dial-surface-active)' : 'transparent',
              boxShadow: s.id === selectedId ? 'inset 0 0 0 1px var(--dial-text-tertiary)' : 'none',
              transition: 'background 0.12s',
            }}
          >
            {/* Position — % lives in-cell (muted, inert); drag left/right to scrub. */}
            <div style={{ ...FIELD, width: 56, padding: 0, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
              <ScrubNumber value={s.pos} min={0} max={100} suffix="%" onChange={(n) => updateStop(s.id!, { pos: n })} />
            </div>
            {/* Standard color cell: swatch + hex + scrubbable opacity on the right. */}
            <ColorCell
              color={s.color}
              onColorChange={(hex) => updateStop(s.id!, { color: hex })}
              opacity={s.opacity}
              onOpacityChange={(n) => updateStop(s.id!, { opacity: n })}
              onColorAndOpacityChange={(hex, op) => updateStop(s.id!, { color: hex, opacity: op })}
              style={{ flex: 1 }}
            />
            <button
              type="button"
              title="Remove stop"
              onClick={() => removeStop(s.id!)}
              disabled={stops.length <= 2}
              className="dialkit-ghost-btn"
              style={{ width: 26, height: 32, fontSize: 15, flexShrink: 0 }}
            >
              −
            </button>
          </div>
        ))}
      </div>
      </div>
    </Folder>
  );
}

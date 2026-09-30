import { useRef, useState, type CSSProperties } from 'react';
import type { VectorValue } from '../store/DialStore';
import { READOUT } from './controlStyles';
import { Folder } from './Folder';
import { valuesEqual } from './valuesEqual';

/**
 * VectorControl — an X/Y pad for a single **authored** two-axis parameter.
 *
 * Use it only for values the user directly authors on a stable pad: light
 * direction, focus point, anchor, offset. Do NOT wire it to animation, physics,
 * pointer, or timeline state that merely happens to have x/y — authored, not
 * observed (see DESIGN.md → "Designing control panels").
 *
 * Value is normalized to [-1, 1] on each axis, center = (0, 0). Screen-natural
 * mapping: dragging left/up lowers x/y (top-left = -,-; bottom-right = +,+), so an
 * object driven by the value moves the same direction as the handle with no
 * renderer-side Y inversion. Shift locks to the dominant axis. Double-click resets
 * to the control default.
 */

interface VectorControlProps {
  label: string;
  value: VectorValue;
  defaultValue: VectorValue;
  onChange: (value: VectorValue) => void;
  help?: string;
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const round4 = (n: number) => {
  const r = Math.round(n * 1e4) / 1e4;
  return Object.is(r, -0) ? 0 : r;
};
const fmt = (n: number) => {
  const v = Object.is(n, -0) ? 0 : n;
  return v.toFixed(2);
};

export function VectorControl({ label, value, defaultValue, onChange, help }: VectorControlProps) {
  const padRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  // Axis value at drag start, for Shift axis-locking.
  const startRef = useRef<VectorValue>({ x: 0, y: 0 });

  const def = defaultValue ?? { x: 0, y: 0 };
  const v = value ?? def;
  const canReset = !valuesEqual(v, def);

  const valueFromEvent = (e: { clientX: number; clientY: number; shiftKey: boolean }): VectorValue => {
    const pad = padRef.current;
    if (!pad) return v;
    const rect = pad.getBoundingClientRect();
    let x = round4(clamp(((e.clientX - rect.left) / rect.width) * 2 - 1, -1, 1));
    let y = round4(clamp(((e.clientY - rect.top) / rect.height) * 2 - 1, -1, 1));
    if (e.shiftKey) {
      // Lock to the axis that moved more from the drag-start position.
      const dx = Math.abs(x - startRef.current.x);
      const dy = Math.abs(y - startRef.current.y);
      if (dx >= dy) y = startRef.current.y;
      else x = startRef.current.x;
    }
    return { x, y };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    try {
      padRef.current?.setPointerCapture(e.pointerId);
    } catch {
      // setPointerCapture throws if the pointer isn't active (some browsers,
      // synthetic events). Dragging still works via the move/up handlers.
    }
    startRef.current = v;
    setDragging(true);
    onChange(valueFromEvent(e));
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    onChange(valueFromEvent(e));
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    try {
      padRef.current?.releasePointerCapture?.(e.pointerId);
    } catch {
      /* no-op */
    }
    setDragging(false);
  };

  const handleLeft = `${((v.x + 1) / 2) * 100}%`;
  const handleTop = `${((v.y + 1) / 2) * 100}%`;

  const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 'var(--dial-row-height, 36px)',
    padding: '0 2px 0 4px',
  };
  const padStyle: CSSProperties = {
    position: 'relative',
    width: '100%',
    aspectRatio: '1 / 1',
    borderRadius: 'calc(var(--dial-radius, 8px) + 2px)',
    border: '1px solid var(--dial-border)',
    background:
      'radial-gradient(circle at center, var(--dial-border) 1px, transparent 1px)',
    backgroundSize: '14px 14px',
    backgroundPosition: 'center',
    cursor: dragging ? 'grabbing' : 'crosshair',
    touchAction: 'none',
    overflow: 'hidden',
    userSelect: 'none',
  };
  const crosshair = (horizontal: boolean): CSSProperties => ({
    position: 'absolute',
    // Fade the guides to 0% at the pad edges so they don't hard-stop at the border.
    background: `linear-gradient(${horizontal ? 'to right' : 'to bottom'}, transparent, var(--dial-border) 25%, var(--dial-border) 75%, transparent)`,
    ...(horizontal
      ? { left: 0, right: 0, top: '50%', height: 1 }
      : { top: 0, bottom: 0, left: '50%', width: 1 }),
  });
  const handleStyle: CSSProperties = {
    position: 'absolute',
    left: handleLeft,
    top: handleTop,
    width: 12,
    height: 12,
    borderRadius: '50%',
    background: '#fff',
    boxShadow: '0 1px 3px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,0,0,0.15)',
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none',
  };

  return (
    <Folder title={label} help={help} defaultOpen={true} canReset={canReset} onReset={() => onChange(def)}>
      <div className="dialkit-vector-control" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ ...headerStyle, justifyContent: 'flex-end' }}>
        <span style={{ ...READOUT, letterSpacing: '0.01em' }}>
          {fmt(v.x)}, {fmt(v.y)}
        </span>
      </div>
      <div
        ref={padRef}
        style={padStyle}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onDoubleClick={() => onChange(defaultValue ?? { x: 0, y: 0 })}
      >
        <div style={crosshair(true)} />
        <div style={crosshair(false)} />
        <div style={handleStyle} />
      </div>
      </div>
    </Folder>
  );
}

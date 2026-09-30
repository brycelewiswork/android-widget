import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { MUTED } from './controlStyles';

/**
 * ScrubNumber — a numeric field with Figma-style drag-to-scrub (press and drag
 * left/right to change the value; Shift = ×10) plus click-to-select for typing.
 * The optional `suffix` (%, °, …) renders in-cell and inactive — right-aligned,
 * muted, pointer-events off — so it doesn't eat lateral space. Matches the color
 * picker's number cells. Draws from `--dial-*` tokens; size it via `style`.
 */

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

interface ScrubNumberProps {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  disabled?: boolean;
  /** Wrapper sizing (width/height). */
  style?: CSSProperties;
  align?: CSSProperties['textAlign'];
}

export function ScrubNumber({ value, onChange, min = -Infinity, max = Infinity, step = 1, suffix, disabled, style, align = 'center' }: ScrubNumberProps) {
  const [text, setText] = useState(String(value));
  const [editing, setEditing] = useState(false);
  const focused = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrub = useRef<{ x: number; val: number; moved: boolean } | null>(null);

  useEffect(() => {
    if (!focused.current) setText(String(value));
  }, [value]);

  const commit = (raw: string) => {
    const n = parseFloat(raw);
    if (!Number.isNaN(n)) onChange(clamp(n, min, max));
  };

  const onPointerDown = (e: React.PointerEvent<HTMLInputElement>) => {
    if (disabled || e.button !== 0 || focused.current) return;
    e.preventDefault();
    scrub.current = { x: e.clientX, val: value, moved: false };
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* inactive pointer */ }
  };
  const onPointerMove = (e: React.PointerEvent<HTMLInputElement>) => {
    const st = scrub.current;
    if (!st) return;
    const dx = e.clientX - st.x;
    if (!st.moved && Math.abs(dx) < 3) return;
    st.moved = true;
    const mult = e.shiftKey ? 10 : 1;
    const next = clamp(st.val + Math.round(dx / 4) * step * mult, min, max);
    onChange(next);
    setText(String(next));
  };
  const onPointerUp = (e: React.PointerEvent<HTMLInputElement>) => {
    const st = scrub.current;
    scrub.current = null;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* no-op */ }
    if (st && !st.moved) { inputRef.current?.focus(); inputRef.current?.select(); }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', ...style }}>
      <input
        ref={inputRef}
        value={text}
        inputMode="numeric"
        disabled={disabled}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onFocus={(e) => { focused.current = true; setEditing(true); e.currentTarget.select(); }}
        onChange={(e) => setText(e.target.value)}
        onBlur={(e) => { focused.current = false; setEditing(false); commit(e.target.value); setText(String(value)); }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            const dir = e.key === 'ArrowUp' ? 1 : -1;
            const mult = e.shiftKey ? 10 : 1;
            const next = clamp(value + dir * step * mult, min, max);
            onChange(next);
            setText(String(next));
          } else if (e.key === 'Enter') {
            (e.target as HTMLInputElement).blur();
          }
        }}
        style={{
          width: '100%',
          height: '100%',
          background: 'transparent',
          border: 'none',
          outline: 'none',
          color: 'var(--dial-text-focus)',
          fontSize: 13,
          fontVariantNumeric: 'tabular-nums',
          textAlign: align,
          boxSizing: 'border-box',
          cursor: disabled ? 'default' : editing ? 'text' : 'ew-resize',
          touchAction: 'none',
          padding: suffix ? '0 15px 0 4px' : '0 4px',
        }}
        spellCheck={false}
      />
      {suffix && (
        <span style={{ ...MUTED, position: 'absolute', right: 5, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          {suffix}
        </span>
      )}
    </div>
  );
}

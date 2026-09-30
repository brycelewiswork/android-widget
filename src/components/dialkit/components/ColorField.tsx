import { useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { formatHex, formatHex8, parse } from 'culori';
import { ColorPicker } from '@/components/color/ColorPicker';

/**
 * ColorField — a color swatch that opens the shared ColorPicker and emits a hex.
 * Opacity is handled **the same way everywhere**:
 *   • Cells that keep opacity as a separate value (gradient stop, font color) pass
 *     `opacity` + `onOpacityChange`; the picker's alpha edits flow back to that value.
 *   • Standalone colors (the stock color control, palette bank) carry opacity in the
 *     hex itself (8-digit `#RRGGBBAA`) — ColorField reads the alpha from the value.
 * Either way, below 100% the swatch shows the Figma split chip (solid | checker).
 */

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** 6-digit hex (alpha stripped) — the opaque form of any color string. */
const solidHex = (color: string): string => (formatHex(parse(color)) ?? '#000000').toUpperCase();

/** Opacity 0–100 carried by a color string's alpha, or 100 if it has none. */
const alphaPctOf = (color: string): number => {
  const c = parse(color);
  return c && c.alpha != null ? Math.round(c.alpha * 100) : 100;
};

const hexToRgba = (hex: string, alphaPct: number): string => {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const r = parseInt(h.slice(0, 2), 16) || 0;
  const g = parseInt(h.slice(2, 4), 16) || 0;
  const b = parseInt(h.slice(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${clamp(alphaPct, 0, 100) / 100})`;
};

const CHECKER =
  'conic-gradient(#c4c4c4 0.25turn, #fff 0.25turn 0.5turn, #c4c4c4 0.5turn 0.75turn, #fff 0.75turn) 0 0 / 5px 5px';

interface ColorFieldProps {
  value: string;
  onChange: (hex: string) => void;
  /** Separate opacity 0–100. When given, it drives the split and the picker's alpha. */
  opacity?: number;
  onOpacityChange?: (n: number) => void;
  /**
   * Atomic color+opacity update. **Preferred** over the separate `onChange` +
   * `onOpacityChange` pair whenever a consumer keeps color and opacity on the same
   * object: the picker emits both dimensions from one edit, and firing two
   * independent patch-merges makes the second (opacity) clobber the first (color)
   * when each reads a stale closure of the shared value. One merged call avoids that.
   */
  onColorAndOpacityChange?: (hex: string, opacity: number) => void;
  size?: number;
  style?: CSSProperties;
  title?: string;
}

export function ColorField({ value, onChange, opacity, onOpacityChange, onColorAndOpacityChange, size = 26, style, title = 'Edit color' }: ColorFieldProps) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  const base = solidHex(value);
  const effOpacity = opacity != null ? opacity : alphaPctOf(value);
  const showSplit = effOpacity < 100;

  // Feed the picker the color AT its current opacity (append the alpha byte) so its
  // alpha slider starts in the right place.
  const alphaByte = Math.round((clamp(effOpacity, 0, 100) / 100) * 255).toString(16).padStart(2, '0').toUpperCase();
  const pickerValue = effOpacity < 100 ? base + alphaByte : base;

  return (
    <>
      <button
        type="button"
        title={title}
        onClick={(e) => setRect(e.currentTarget.getBoundingClientRect())}
        style={{
          position: 'relative',
          width: size,
          height: size,
          flexShrink: 0,
          borderRadius: 6,
          border: '1px solid var(--dial-border)',
          overflow: 'hidden',
          padding: 0,
          // Opaque colors: the solid fill. Translucent: the checker shows through the
          // right half (the two halves are painted as crisp adjacent elements below).
          background: showSplit ? CHECKER : base,
          cursor: 'pointer',
          ...style,
        }}
      >
        {showSplit && (
          <>
            {/* Left = full opacity, right = color at its opacity — they meet exactly
                at 50% (element edges, so the seam is pixel-crisp with no color bleed). */}
            <span style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: '50%', background: base }} />
            <span style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', right: 0, background: hexToRgba(base, effOpacity) }} />
          </>
        )}
      </button>
      {rect &&
        createPortal(
          <div data-dialkit-popover style={{ position: 'fixed', inset: 0, zIndex: 2147483600 }}>
            <div style={{ position: 'absolute', inset: 0 }} onClick={() => setRect(null)} />
            <div
              className="rounded-xl bg-surface-secondary inset-ring-1 inset-ring-stroke-faint shadow-[0_12px_36px_-6px_rgba(0,0,0,0.4)]"
              style={{
                position: 'absolute',
                left: clamp(rect.left, 8, window.innerWidth - 300),
                top: Math.min(rect.bottom + 6, window.innerHeight - 400),
              }}
            >
              <ColorPicker
                value={pickerValue}
                onChange={(oklch) => {
                  const parsed = parse(oklch);
                  const a = parsed?.alpha ?? 1;
                  const hex6 = (formatHex(parsed) || base).toUpperCase();
                  if (onColorAndOpacityChange) {
                    // Cell with a separate opacity field — write both in one merged
                    // patch so the opacity update can't clobber the color update.
                    onColorAndOpacityChange(hex6, Math.round(a * 100));
                  } else if (onOpacityChange) {
                    // Fallback split (two patches — safe only if they target
                    // independent state; prefer onColorAndOpacityChange otherwise).
                    onChange(hex6);
                    onOpacityChange(Math.round(a * 100));
                  } else {
                    // Standalone color — keep opacity in the hex (8-digit when translucent).
                    onChange((a < 1 ? (formatHex8(parsed) || hex6) : hex6).toUpperCase());
                  }
                }}
                onClose={() => setRect(null)}
              />
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

import { type CSSProperties } from 'react';
import { ColorField } from './ColorField';
import { ScrubNumber } from './ScrubNumber';
import { FIELD, selectOnFocus } from './controlStyles';
import { hex6, withAlphaOf } from './hexUtils';

/**
 * ColorCell — the one color cell used everywhere a color lives inside another
 * control (collection swatches, gradient stops, a font's color). A bordered field:
 * swatch (opens the shared ColorPicker) + hex input + an optional opacity on the
 * right. Opacity is a ScrubNumber — click-and-drag left/right, % shown in-cell.
 * Standardize on this instead of re-inlining swatch+hex row variants.
 */

interface ColorCellProps {
  color: string;
  onColorChange: (hex: string) => void;
  /** Pass both to show the opacity segment (0–100). Omit for a hex-only cell. */
  opacity?: number;
  onOpacityChange?: (n: number) => void;
  /**
   * Atomic color+opacity update for the picker. Pass this when color and opacity
   * live on the same object so a single picker edit writes them in one patch (see
   * ColorField — separate onColorChange/onOpacityChange would clobber each other).
   */
  onColorAndOpacityChange?: (hex: string, opacity: number) => void;
  swatchSize?: number;
  /** Extra wrapper styles (e.g. `flex: 1` when the cell shares a row). */
  style?: CSSProperties;
}

export function ColorCell({ color, onColorChange, opacity, onOpacityChange, onColorAndOpacityChange, swatchSize = 18, style }: ColorCellProps) {
  // Show the 6-digit RGB only — no leading `#`, and never the alpha byte (opacity is
  // its own field / the split chip). Edits keep whatever opacity the color carried.
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, ...FIELD, padding: '0 4px', ...style }}>
      <ColorField value={color} onChange={onColorChange} opacity={opacity} onOpacityChange={onOpacityChange} onColorAndOpacityChange={onColorAndOpacityChange} size={swatchSize} />
      <input
        value={hex6(color).replace(/^#/, '')}
        spellCheck={false}
        onChange={(e) => onColorChange(withAlphaOf(e.target.value, color))}
        onFocus={selectOnFocus}
        style={{
          flex: 1,
          minWidth: 0,
          background: 'transparent',
          border: 'none',
          outline: 'none',
          color: 'var(--dial-text-focus)',
          fontSize: 13,
          fontVariantNumeric: 'tabular-nums',
          textTransform: 'uppercase',
        }}
      />
      {opacity != null && onOpacityChange && (
        <>
          <span style={{ width: 1, height: 16, background: 'var(--dial-border)', flexShrink: 0 }} />
          <ScrubNumber value={opacity} min={0} max={100} suffix="%" style={{ width: 44, flexShrink: 0 }} onChange={onOpacityChange} />
        </>
      )}
    </div>
  );
}

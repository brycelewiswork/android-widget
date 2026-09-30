import { formatHex } from 'culori';
import type { PaletteValue } from '../store/DialStore';
import { READOUT, selectionRing } from './controlStyles';
import { Folder } from './Folder';
import { valuesEqual } from './valuesEqual';

/**
 * PaletteControl — a constrained token palette: pick a family (hue) on the left,
 * then a shade (lightness) from that hue's scale on the right. Use it for design-
 * token color choices, NOT free hex entry (that's the color control). Value is
 * `{ family, shade }`; resolve to a hex with `paletteHex(value)`.
 *
 * Everything is generated in OKLCH: 20 evenly-spaced hues + 5 subtly-tinted
 * neutrals, each with a light→dark lightness scale whose chroma tapers toward the
 * extremes so no step looks muddy. Each family circle previews that hue's MIDDLE
 * shade, so the grid and the scale stay in sync.
 */

const FAMILIES = 25;
const SHADES = 11;
const MID = Math.floor(SHADES / 2); // the middle of the scale (index 5)

const oklchHex = (l: number, c: number, h: number) => formatHex({ mode: 'oklch', l, c, h }) || '#000000';

const PALETTE: string[][] = Array.from({ length: FAMILIES }, (_, i) => {
  const isNeutral = i >= 20;
  const hue = isNeutral ? (i - 20) * 72 : i * 18;
  const baseC = isNeutral ? 0.02 : 0.16;
  return Array.from({ length: SHADES }, (_, s) => {
    const l = 0.95 - (s / (SHADES - 1)) * 0.74; // 0.95 (light) → 0.21 (dark)
    // Taper chroma toward the light/dark ends so the ramp reads smooth, not neon.
    const taper = Math.max(0.14, 1 - Math.abs(l - 0.62) / 0.5);
    return oklchHex(l, baseC * taper, hue);
  });
});

const clampI = (n: number, max: number) => Math.max(0, Math.min(max, Math.round(n)));

/** Resolve a palette selection to a hex string. */
export function paletteHex(value: PaletteValue): string {
  const fam = PALETTE[clampI(value?.family ?? 0, FAMILIES - 1)];
  return fam[clampI(value?.shade ?? MID, SHADES - 1)];
}

interface PaletteControlProps {
  label: string;
  value: PaletteValue;
  defaultValue: PaletteValue;
  onChange: (value: PaletteValue) => void;
  help?: string;
}

export function PaletteControl({ label, value, defaultValue, onChange, help }: PaletteControlProps) {
  const def = defaultValue ?? { family: 1, shade: MID };
  const v = value ?? def;
  const canReset = !valuesEqual(v, def);
  const famIdx = clampI(v.family, FAMILIES - 1);
  const shadeIdx = clampI(v.shade, SHADES - 1);
  const shades = PALETTE[famIdx];

  return (
    <Folder title={label} help={help} defaultOpen={true} canReset={canReset} onReset={() => onChange(def)}>
      <div className="dialkit-palette-control" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
        <span style={{ ...READOUT, textTransform: 'uppercase' }}>
          {paletteHex(v)}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        {/* Family grid — each circle previews the family's MIDDLE shade */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 9, justifyItems: 'center', alignItems: 'center', flex: 1 }}>
          {PALETTE.map((fam, fi) => (
            <button
              key={fi}
              type="button"
              title={`Family ${fi + 1}`}
              onClick={() => onChange({ family: fi, shade: shadeIdx })}
              style={{
                aspectRatio: '1 / 1',
                width: '76%',
                borderRadius: '50%',
                border: 'none',
                background: fam[MID],
                cursor: 'pointer',
                padding: 0,
                ...selectionRing(fi === famIdx),
              }}
            />
          ))}
        </div>
        {/* Shade scale — one continuous strip (no gaps), rounded only at the ends.
            The selected shade pops out as a rounded chip with the selection ring. */}
        <div style={{ display: 'flex', flexDirection: 'column', width: 24 }}>
          {shades.map((hex, si) => {
            const sel = si === shadeIdx;
            const first = si === 0;
            const last = si === SHADES - 1;
            return (
              <button
                key={si}
                type="button"
                title={`Shade ${si + 1}`}
                onClick={() => onChange({ family: famIdx, shade: si })}
                style={{
                  flex: 1,
                  minHeight: 13,
                  border: 'none',
                  background: hex,
                  cursor: 'pointer',
                  padding: 0,
                  position: 'relative',
                  borderTopLeftRadius: first ? 7 : 0,
                  borderTopRightRadius: first ? 7 : 0,
                  borderBottomLeftRadius: last ? 7 : 0,
                  borderBottomRightRadius: last ? 7 : 0,
                  ...(sel
                    ? { borderRadius: 6, zIndex: 2, ...selectionRing(true) }
                    : { zIndex: 1 }),
                }}
              />
            );
          })}
        </div>
      </div>
      </div>
    </Folder>
  );
}

import { type CSSProperties, type ReactNode } from 'react';
import type { FontPickerValue } from '../store/DialStore';
import { CONTROL_GAP, FIELD, SUBLABEL } from './controlStyles';
import { ColorCell } from './ColorCell';
import { Folder } from './Folder';
import { ScrubNumber } from './ScrubNumber';
import { SelectField } from './SelectField';
import { valuesEqual } from './valuesEqual';

/**
 * FontPickerControl — one compound control for a text style: family, weight,
 * size, case, and color/opacity. Keep typography atomic — never split these into
 * separate neighboring controls for the same text. Resolve to CSS with
 * `fontStyle(value)`.
 */

const FONTS = [
  { id: 'dm-sans', label: 'DM Sans', family: '"DM Sans Variable", system-ui, sans-serif' },
  { id: 'geist', label: 'Geist', family: '"Geist Variable", system-ui, sans-serif' },
  { id: 'dm-mono', label: 'DM Mono', family: '"DM Mono", ui-monospace, monospace' },
];
const FONT_MAP = Object.fromEntries(FONTS.map((f) => [f.id, f.family]));
const WEIGHTS = [300, 400, 500, 600, 700, 800];
const CASES = [
  { value: 'none', label: 'As typed' },
  { value: 'upper', label: 'UPPERCASE' },
  { value: 'lower', label: 'lowercase' },
  { value: 'title', label: 'Title Case' },
] as const;

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

function hexToRgba(hex: string, opacityPct: number): string {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const r = parseInt(h.slice(0, 2), 16) || 0;
  const g = parseInt(h.slice(2, 4), 16) || 0;
  const b = parseInt(h.slice(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${clamp(opacityPct, 0, 100) / 100})`;
}

/** Resolve a font-picker value to CSS text styles. */
export function fontStyle(value: FontPickerValue): CSSProperties {
  return {
    fontFamily: FONT_MAP[value.fontId] ?? FONTS[0].family,
    fontWeight: value.fontWeight,
    fontSize: value.fontSize,
    textTransform:
      value.textCase === 'upper' ? 'uppercase' : value.textCase === 'lower' ? 'lowercase' : value.textCase === 'title' ? 'capitalize' : 'none',
    color: hexToRgba(value.color, value.opacity),
  };
}

interface FontPickerControlProps {
  label: string;
  value: FontPickerValue;
  defaultValue: FontPickerValue;
  onChange: (value: FontPickerValue) => void;
  help?: string;
}


// Module-scoped so it isn't a fresh component type each render (which would remount
// the inputs and drop focus while typing).
function FpField({ title, children }: { title: string; children: ReactNode }) {
  return (
    <label style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={SUBLABEL}>{title}</span>
      {children}
    </label>
  );
}

export function FontPickerControl({ label, value, defaultValue, onChange, help }: FontPickerControlProps) {
  const v = value ?? defaultValue;
  const set = (patch: Partial<FontPickerValue>) => onChange({ ...v, ...patch });
  const canReset = !valuesEqual(v, defaultValue);

  return (
    <Folder title={label} help={help} defaultOpen={true} canReset={canReset} onReset={() => onChange(defaultValue)}>
      <div className="dialkit-font-picker-control" style={{ display: 'flex', flexDirection: 'column', gap: CONTROL_GAP + 2 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <FpField title="Font">
          <SelectField
            value={v.fontId}
            options={FONTS.map((f) => ({ value: f.id, label: f.label, style: { fontFamily: FONT_MAP[f.id] } }))}
            onChange={(id) => set({ fontId: id })}
            triggerStyle={{ fontFamily: FONT_MAP[v.fontId] }}
          />
        </FpField>
        <FpField title="Weight">
          <SelectField
            value={String(v.fontWeight)}
            options={WEIGHTS.map((w) => ({ value: String(w), label: String(w) }))}
            onChange={(w) => set({ fontWeight: Number(w) })}
          />
        </FpField>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <FpField title="Size">
          <div style={{ ...FIELD, padding: 0, display: 'flex', alignItems: 'center' }}>
            <ScrubNumber value={v.fontSize} min={1} max={400} onChange={(n) => set({ fontSize: n })} />
          </div>
        </FpField>
        <FpField title="Case">
          <SelectField
            value={v.textCase}
            options={CASES.map((c) => ({ value: c.value, label: c.label }))}
            onChange={(c) => set({ textCase: c as FontPickerValue['textCase'] })}
          />
        </FpField>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={SUBLABEL}>Color</span>
        <ColorCell
          color={v.color}
          onColorChange={(hex) => set({ color: hex })}
          opacity={v.opacity}
          onOpacityChange={(n) => set({ opacity: n })}
          onColorAndOpacityChange={(hex, op) => set({ color: hex, opacity: op })}
        />
      </div>
      </div>
    </Folder>
  );
}

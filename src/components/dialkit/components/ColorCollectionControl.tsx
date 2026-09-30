import type { ColorCollectionValue } from '../store/DialStore';
import { CONTROL_GAP } from './controlStyles';
import { ColorCell } from './ColorCell';
import { Folder } from './Folder';
import { valuesEqual } from './valuesEqual';

/**
 * ColorCollectionControl — an editable bank of colors (palette shades, bead
 * colors, accent set). Use it when the user edits the *actual set* — colors can
 * be added and removed — not for a fixed number of distinct roles (those are
 * separate color controls). Items in one bank stay unlabeled; the section title
 * names the bank.
 */

const FALLBACK = ['#F812F0', '#1D0DC9', '#DD8808', '#C1FF00'];

interface ColorCollectionControlProps {
  label: string;
  value: ColorCollectionValue;
  defaultValue: ColorCollectionValue;
  onChange: (value: ColorCollectionValue) => void;
  help?: string;
}

export function ColorCollectionControl({ label, value, defaultValue, onChange, help }: ColorCollectionControlProps) {
  const colors = Array.isArray(value) && value.length ? value : FALLBACK;
  const def = defaultValue ?? FALLBACK;
  const canReset = !valuesEqual(colors, def);

  const setAt = (i: number, hex: string) => onChange(colors.map((c, idx) => (idx === i ? hex : c)));
  const add = () => onChange([...colors, colors[colors.length - 1] ?? '#888888']);
  const removeLast = () => {
    if (colors.length <= 1) return;
    onChange(colors.slice(0, -1));
  };

  return (
    <Folder title={label} help={help} defaultOpen={true} canReset={canReset} onReset={() => onChange(def)}>
      <div className="dialkit-color-collection-control" style={{ display: 'flex', flexDirection: 'column', gap: CONTROL_GAP }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <button type="button" title="Remove last" onClick={removeLast} disabled={colors.length <= 1} className="dialkit-ghost-btn" style={{ width: 26, height: 26, fontSize: 16 }}>
            −
          </button>
          <button type="button" title="Add color" onClick={add} className="dialkit-ghost-btn" style={{ width: 26, height: 26, fontSize: 17 }}>
            +
          </button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {colors.map((c, i) => (
          <ColorCell key={i} color={c} onColorChange={(hex) => setAt(i, hex)} />
        ))}
      </div>
      </div>
    </Folder>
  );
}

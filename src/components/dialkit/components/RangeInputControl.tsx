import type { RangeInputValue } from '../store/DialStore';
import { CONTROL_GAP, NUM_FIELD } from './controlStyles';
import { Folder } from './Folder';
import { ScrubNumber } from './ScrubNumber';
import { valuesEqual } from './valuesEqual';

/**
 * RangeInputControl — two compact numeric fields for a lower/upper bound or a
 * from/to range (e.g. min/max frequency, near/far depth). Use this when the two
 * values are typed precisely; use a future range *slider* when they're swept.
 */

interface RangeInputControlProps {
  label: string;
  value: RangeInputValue;
  defaultValue: RangeInputValue;
  onChange: (value: RangeInputValue) => void;
  help?: string;
}

export function RangeInputControl({ label, value, defaultValue, onChange, help }: RangeInputControlProps) {
  const def = defaultValue ?? { start: 0, end: 100 };
  const v = value ?? def;
  const canReset = !valuesEqual(v, def);

  return (
    <Folder title={label} help={help} defaultOpen={true} canReset={canReset} onReset={() => onChange(def)}>
      <div className="dialkit-range-input-control" style={{ display: 'flex', flexDirection: 'column', gap: CONTROL_GAP - 2 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {/* Drag left/right to scrub; click to type. */}
          <div style={{ ...NUM_FIELD, flex: 1, padding: 0, display: 'flex', alignItems: 'center' }}>
            <ScrubNumber value={v.start} onChange={(n) => onChange({ ...v, start: n })} />
          </div>
          <div style={{ ...NUM_FIELD, flex: 1, padding: 0, display: 'flex', alignItems: 'center' }}>
            <ScrubNumber value={v.end} onChange={(n) => onChange({ ...v, end: n })} />
          </div>
        </div>
      </div>
    </Folder>
  );
}

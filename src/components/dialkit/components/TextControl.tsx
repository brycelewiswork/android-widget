import { selectOnFocus } from './controlStyles';
import { HelpDot } from './HelpDot';

interface TextControlProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  help?: string;
}

export function TextControl({ label, value, onChange, placeholder, help }: TextControlProps) {
  return (
    <div className="dialkit-text-control">
      <label className="dialkit-text-label" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>{label}<HelpDot text={help} /></label>
      <input
        type="text"
        className="dialkit-text-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={selectOnFocus}
        placeholder={placeholder}
      />
    </div>
  );
}

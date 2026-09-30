import { SegmentedControl } from './SegmentedControl';
import type { ShortcutConfig } from '../store/DialStore';
import { formatToggleShortcut } from '../shortcut-utils';
import { HelpDot } from './HelpDot';

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  shortcut?: ShortcutConfig;
  shortcutActive?: boolean;
  help?: string;
}

export function Toggle({ label, checked, onChange, shortcut, shortcutActive, help }: ToggleProps) {
  return (
    <div className="dialkit-labeled-control">
      <span className="dialkit-labeled-control-label">
        {label}
        {help && <span style={{ marginLeft: 5, display: 'inline-flex', verticalAlign: 'middle' }}><HelpDot text={help} /></span>}
        {shortcut && (
          <span className={`dialkit-shortcut-pill${shortcutActive ? ' dialkit-shortcut-pill-active' : ''}`}>
            {formatToggleShortcut(shortcut)}
          </span>
        )}
      </span>
      <SegmentedControl
        options={[
          { value: 'off' as const, label: 'Off' },
          { value: 'on' as const, label: 'On' },
        ]}
        value={checked ? 'on' : 'off'}
        onChange={(val) => onChange(val === 'on')}
      />
    </div>
  );
}

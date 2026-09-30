import { useState, useRef, useEffect, useCallback, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { getDialKitPortalRoot, getDropdownPosition } from '../dropdown-position';
import { ICON_CHEVRON } from '../icons';
import { FIELD } from './controlStyles';

/**
 * SelectField — a compact dropdown for the sub-selects inside compound controls
 * (gradient type, font weight, …). A FIELD-styled trigger + chevron opens the same
 * styled popover the `select` control type uses (`dialkit-select-dropdown` /
 * `-option`) — not the OS-native menu, which can't be themed. For a labeled
 * top-level choice use SelectControl.
 */

export interface SelectFieldOption {
  value: string;
  label: string;
  /** Per-option styles (e.g. a font preview `fontFamily`). */
  style?: CSSProperties;
}

interface SelectFieldProps {
  value: string;
  options: SelectFieldOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  /** Extra styles for the trigger (e.g. preview the selected font). */
  triggerStyle?: CSSProperties;
}

export function SelectField({ value, options, onChange, disabled, triggerStyle }: SelectFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number; above: boolean } | null>(null);
  const selected = options.find((o) => o.value === value);

  const updatePos = useCallback(() => {
    const el = triggerRef.current;
    if (!el || !portalTarget) return;
    const dropdownHeight = 8 + options.length * 34;
    setPos(getDropdownPosition(el, portalTarget, { dropdownHeight }));
  }, [options.length, portalTarget]);

  useEffect(() => {
    setPortalTarget(getDialKitPortalRoot(triggerRef.current) ?? document.body);
  }, []);

  useEffect(() => {
    if (isOpen) updatePos();
  }, [isOpen, updatePos]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((o) => !o)}
        style={{
          ...FIELD,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 6,
          cursor: disabled ? 'not-allowed' : 'pointer',
          textAlign: 'left',
          ...triggerStyle,
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected?.label ?? value}
        </span>
        <motion.svg
          className="dialkit-select-chevron"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ type: 'spring', visualDuration: 0.2, bounce: 0.15 }}
        >
          <path d={ICON_CHEVRON} />
        </motion.svg>
      </button>

      {portalTarget && createPortal(
        <AnimatePresence>
          {isOpen && pos && (
            <motion.div
              ref={dropdownRef}
              data-dialkit-popover
              className="dialkit-select-dropdown"
              initial={{ opacity: 0, y: pos.above ? 8 : -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: pos.above ? 8 : -8, scale: 0.95 }}
              transition={{ type: 'spring', visualDuration: 0.15, bounce: 0 }}
              style={{
                position: 'absolute',
                left: pos.left,
                top: pos.top,
                width: pos.width,
                transformOrigin: pos.above ? 'bottom' : 'top',
              }}
            >
              {options.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  className="dialkit-select-option"
                  data-selected={String(o.value === value)}
                  style={o.style}
                  onClick={() => {
                    onChange(o.value);
                    setIsOpen(false);
                  }}
                >
                  {o.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>,
        portalTarget
      )}
    </>
  );
}

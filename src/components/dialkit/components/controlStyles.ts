import type { CSSProperties, FocusEvent } from 'react';

/**
 * Shared style tokens for the custom dialkit controls (vector, gradient, palette,
 * curves, …). Every control draws from these so spacing, field sizing, label
 * weight, and color-token usage stay identical across the panel. All colors are
 * `--dial-*` tokens, so controls re-theme with dialkit automatically.
 */

/** Vertical gap between the label and body of a control. */
export const CONTROL_GAP = 8;

/** Primary control label (the entity/section name). */
export const LABEL: CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  color: 'var(--dial-text-label)',
};

/** Sub-field label inside a compound control (Font, Weight, Size…). */
export const SUBLABEL: CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: 'var(--dial-text-label)',
};

/** Right-aligned numeric/hex readout beside a label. */
export const READOUT: CSSProperties = {
  fontSize: 13,
  color: 'var(--dial-text-label)',
  fontVariantNumeric: 'tabular-nums',
};

/** Text/number/select input surface. */
export const FIELD: CSSProperties = {
  background: 'var(--dial-surface)',
  border: '1px solid var(--dial-border)',
  borderRadius: 'var(--dial-radius, 8px)',
  color: 'var(--dial-text-focus)',
  fontSize: 13,
  height: 32,
  padding: '0 8px',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};

/** FIELD for numeric values (tabular figures). */
export const NUM_FIELD: CSSProperties = { ...FIELD, fontVariantNumeric: 'tabular-nums' };

/** Square icon button (add/remove/±). */
export const ICON_BTN: CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: 8,
  border: '1px solid var(--dial-border)',
  background: 'var(--dial-surface)',
  color: 'var(--dial-text-label)',
  cursor: 'pointer',
  display: 'grid',
  placeItems: 'center',
  fontSize: 15,
  flexShrink: 0,
};

/** Muted suffix / unit text (%, °, …). */
export const MUTED: CSSProperties = { color: 'var(--dial-text-tertiary)', fontSize: 12 };

/**
 * onFocus handler: select the whole field so clicking to edit selects its contents.
 * Deferred to the next frame so the click that focused the field doesn't place a
 * caret and collapse the selection (a plain `.select()` in onFocus loses to that).
 * A second click on an already-focused field still positions the caret normally.
 */
export const selectOnFocus = (e: FocusEvent<HTMLInputElement>): void => {
  const el = e.currentTarget;
  setTimeout(() => {
    if (document.activeElement === el) el.select();
  }, 0);
};

/**
 * Selection ring for swatches/handles: a gap in the panel background, then a
 * high-contrast ring. The ring uses `--dial-text-focus` (white on the dark panel,
 * near-black on light) so the selected state reads on either theme.
 */
export const selectionRing = (active: boolean): CSSProperties =>
  active ? { boxShadow: '0 0 0 2px var(--dial-glass-bg, #212121), 0 0 0 4px var(--dial-text-focus)' } : {};

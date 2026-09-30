/**
 * Hex helpers for the color text fields. Opacity may live in a color's alpha byte
 * (#RRGGBBAA), but we only ever *show* the 6-digit RGB — the alpha is conveyed by
 * the split chip and edited via the picker, not typed here. String-based (no color
 * parsing) so a field mid-edit round-trips partial input instead of snapping to a
 * normalized value.
 */

const expand3 = (h: string) => h.split('').map((c) => c + c).join('');

/** RGB-only hex for display (alpha stripped); partial input is returned as-is. */
export function hex6(color: string): string {
  const h = color.replace(/^#/, '');
  if (/^[0-9a-fA-F]{3}$/.test(h)) return '#' + expand3(h).toUpperCase();
  if (/^[0-9a-fA-F]{8}$/.test(h)) return '#' + h.slice(0, 6).toUpperCase();
  return '#' + h.toUpperCase();
}

/** The alpha byte ('AA') a color carries, or '' if it has none. */
export function alphaByteOf(color: string): string {
  const h = color.replace(/^#/, '');
  return /^[0-9a-fA-F]{8}$/.test(h) ? h.slice(6, 8).toUpperCase() : '';
}

/** Newly-typed RGB, re-carrying `previous`'s alpha once the RGB is a complete hex. */
export function withAlphaOf(rgbInput: string, previous: string): string {
  const rgb = rgbInput.replace(/#/g, '');
  if (/^[0-9a-fA-F]{3}$/.test(rgb)) return '#' + (expand3(rgb) + alphaByteOf(previous)).toUpperCase();
  if (/^[0-9a-fA-F]{6}$/.test(rgb)) return '#' + (rgb + alphaByteOf(previous)).toUpperCase();
  return '#' + rgb.toUpperCase(); // partial — keep as typed, no alpha yet
}

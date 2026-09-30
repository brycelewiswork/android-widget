import {
  converter,
  formatHex,
  formatRgb,
  parse,
  type Color as CuloriColor,
  type Oklch,
} from "culori"

/**
 * Thin wrapper around culori for the picker. The system stores everything as
 * oklch — these helpers convert *to* oklch for storage, and *from* oklch to
 * whatever input mode the designer prefers.
 */

export type PickerMode = "hex" | "rgb" | "css" | "hsl" | "hsb" | "okl"

export type Oklch4 = { mode: "oklch"; l: number; c: number; h?: number; alpha?: number }

const toOklch = converter("oklch")
const toRgb = converter("rgb")
const toHsl = converter("hsl")
const toHsv = converter("hsv")

/** Parse any CSS color (hex, rgb, hsl, oklch, named) → oklch object. */
export function parseToOklch(input: string): Oklch4 | null {
  const parsed = parse(input)
  if (!parsed) return null
  const o = toOklch(parsed) as Oklch | undefined
  if (!o) return null
  return {
    mode: "oklch",
    l: clamp01(o.l ?? 0),
    c: Math.max(0, o.c ?? 0),
    h: o.h ?? 0,
    alpha: o.alpha == null ? 1 : clamp01(o.alpha),
  }
}

/** Body of `oklch(...)` minus the wrapper, formatted to 3 decimals. */
export function oklchBody(o: Oklch4): string {
  const l = round(o.l, 3)
  const c = round(o.c, 3)
  const h = round(o.h ?? 0, 3)
  const a = o.alpha ?? 1
  const base = `${l} ${c} ${h}`
  if (a >= 0.999) return base
  return `${base} / ${round(a * 100, 1)}%`
}

export function oklchCss(o: Oklch4): string {
  return `oklch(${oklchBody(o)})`
}

/** Format an oklch color into a string in the requested picker mode. */
export function formatInMode(o: Oklch4, mode: PickerMode): string {
  const culoriColor: Oklch = { mode: "oklch", l: o.l, c: o.c, h: o.h, alpha: o.alpha }
  switch (mode) {
    case "hex": {
      const hex = formatHex(culoriColor)
      return hex ?? "#000000"
    }
    case "rgb": {
      const rgb = toRgb(culoriColor)
      if (!rgb) return "rgb(0, 0, 0)"
      return formatRgb(rgb)
    }
    case "css":
      return oklchCss(o)
    case "hsl": {
      const hsl = toHsl(culoriColor)
      if (!hsl) return "hsl(0, 0%, 0%)"
      const h = round(hsl.h ?? 0, 0)
      const s = round((hsl.s ?? 0) * 100, 0)
      const l = round((hsl.l ?? 0) * 100, 0)
      return `hsl(${h}, ${s}%, ${l}%)`
    }
    case "hsb": {
      const hsv = toHsv(culoriColor)
      if (!hsv) return "hsb(0, 0%, 0%)"
      const h = round(hsv.h ?? 0, 0)
      const s = round((hsv.s ?? 0) * 100, 0)
      const v = round((hsv.v ?? 0) * 100, 0)
      return `hsb(${h}, ${s}%, ${v}%)`
    }
    case "okl":
      return oklchCss(o)
  }
}

/** Read HSV components from an oklch color — for SV square + hue slider. */
export function oklchToHsv(o: Oklch4): { h: number; s: number; v: number; a: number } {
  const culoriColor: Oklch = { mode: "oklch", l: o.l, c: o.c, h: o.h, alpha: o.alpha }
  const hsv = toHsv(culoriColor)
  return {
    h: hsv?.h ?? o.h ?? 0,
    s: hsv?.s ?? 0,
    v: hsv?.v ?? 0,
    a: o.alpha ?? 1,
  }
}

export function hsvToOklch(h: number, s: number, v: number, a: number): Oklch4 {
  const hsv: CuloriColor = { mode: "hsv", h, s, v, alpha: a }
  const o = toOklch(hsv) as Oklch | undefined
  if (!o) return { mode: "oklch", l: 0, c: 0, h: 0, alpha: a }
  return {
    mode: "oklch",
    l: clamp01(o.l ?? 0),
    c: Math.max(0, o.c ?? 0),
    h: o.h ?? h,
    alpha: clamp01(a),
  }
}

/** Convenience for the SV square: build a hex preview from raw HSV components. */
export function hsvToHex(h: number, s: number, v: number, a = 1): string {
  return formatHex({ mode: "hsv", h, s, v, alpha: a } as CuloriColor) ?? "#000000"
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n))
}
function round(n: number, places: number) {
  const p = Math.pow(10, places)
  return Math.round(n * p) / p
}

import { converter, formatHex, inGamut } from "culori"
import { type Oklch4, oklchCss, parseToOklch } from "./color-convert"

/**
 * OKLCH ramp engine — generates 13-step tonal scales in the shape this
 * template already uses.
 *
 * The imported Apple system colors in `index.css` turn out to be perfectly
 * regular: every one of the 12 families is reproducible from just three
 * numbers (the lightness, chroma, and hue of its 500 step) plus two universal
 * profiles shared by all of them. Those profiles are `L_PROFILE` and
 * `C_PROFILE` below, reverse-engineered from the palette itself — regenerating
 * the 12 families from their 500 anchors lands within ±0.001 of the committed
 * values on every channel of all 312 swatches.
 *
 * That means anything generated here sits next to the Apple families as a peer
 * rather than an approximation. The full derivation — including why these ramps
 * deliberately overshoot sRGB — is in ../../Project-Base/docs/oklch-ramps.md.
 */

// ─── The scale ───────────────────────────────────────────────────────────────

/** The 13 stops. Adds 150 and 850 to the conventional 11-step scale. */
export const STEPS = [50, 100, 150, 200, 300, 400, 500, 600, 700, 800, 850, 900, 950] as const

export type Step = (typeof STEPS)[number]

/**
 * Where each step sits between the 500 anchor and the ramp's end.
 * 0 = at the anchor, 1 = at the end (`lightEnd` below 500, `darkEnd` above).
 * Symmetric about 500 — the light and dark halves are mirror images.
 */
export const L_PROFILE: Record<Step, number> = {
  50: 1, 100: 0.85, 150: 0.72, 200: 0.6, 300: 0.4, 400: 0.18,
  500: 0,
  600: 0.18, 700: 0.4, 800: 0.6, 850: 0.72, 900: 0.85, 950: 1,
}

/**
 * Chroma at each step as a multiple of the anchor's chroma. Peaks at 500 and
 * falls away in both directions — the curve that gives the Apple families
 * their punch. Not symmetric: the dark half holds chroma noticeably better
 * than the light half (950 keeps 35% where 50 keeps only 12%).
 */
export const C_PROFILE: Record<Step, number> = {
  50: 0.12, 100: 0.22, 150: 0.32, 200: 0.42, 300: 0.62, 400: 0.82,
  500: 1,
  600: 0.92, 700: 0.8, 800: 0.65, 850: 0.55, 900: 0.45, 950: 0.35,
}

/** Every family in `index.css` converges on these, so generated ramps do too. */
export const LIGHT_END = 0.97
export const DARK_END = 0.2

/** Median lightness of the 12 Apple 500s — the fallback anchor lightness. */
const DEFAULT_ANCHOR_L = 0.68

// ─── Gamut ───────────────────────────────────────────────────────────────────

export type Gamut = "srgb" | "p3" | "rec2020"

const inSrgb = inGamut("rgb")
const inP3 = inGamut("p3")
const inRec2020 = inGamut("rec2020")

function gamutTest(space: Gamut) {
  return space === "srgb" ? inSrgb : space === "p3" ? inP3 : inRec2020
}

/** Is this color displayable in the given space? */
export function inSpace(color: Oklch4, space: Gamut): boolean {
  return gamutTest(space)({ mode: "oklch", l: color.l, c: color.c, h: color.h })
}

const maxChromaCache = new Map<string, number>()

/**
 * Highest chroma that still fits in `space` at this lightness and hue.
 *
 * The OKLCH gamut boundary is irregular — it peaks around purple at mid
 * lightness and pinches hard toward cyan and toward both ends of the L axis —
 * so this binary-searches rather than using a formula. Results are memoized on
 * a quantized key, which keeps it cheap enough for slider-driven UI.
 */
export function maxChroma(l: number, h: number, space: Gamut = "srgb"): number {
  const key = `${space}:${l.toFixed(4)}:${(((h % 360) + 360) % 360).toFixed(2)}`
  const hit = maxChromaCache.get(key)
  if (hit !== undefined) return hit

  const test = gamutTest(space)
  let lo = 0
  let hi = 0.5
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2
    if (test({ mode: "oklch", l, c: mid, h })) lo = mid
    else hi = mid
  }
  maxChromaCache.set(key, lo)
  return lo
}

/** Pull chroma down until the color fits, holding lightness and hue fixed. */
export function clampToGamut(color: Oklch4, space: Gamut = "srgb"): Oklch4 {
  if (inSpace(color, space)) return color
  return { ...color, c: maxChroma(color.l, color.h ?? 0, space) }
}

// ─── Chroma strategies ───────────────────────────────────────────────────────

/**
 * How chroma is distributed across the ramp.
 *
 * - `profile` — the Apple curve. Use this for anything meant to sit alongside
 *   the imported families.
 * - `flat` — one chroma everywhere. Tonal's tinted neutrals.
 * - `max` — a percentage of the gamut ceiling at each step's own lightness.
 *   Tonal's vibrant section. Peaks mid-tone on its own, because the gamut does.
 */
export type ChromaStrategy =
  | { kind: "profile"; chroma: number }
  | { kind: "flat"; chroma: number }
  | { kind: "max"; percent?: number; space?: Gamut }

export type RampOptions = {
  /** Lightness of the 500 step. */
  lightness?: number
  /** Hue, held constant across every step. */
  hue?: number
  chroma?: ChromaStrategy
  lightEnd?: number
  darkEnd?: number
  /**
   * Clamp every step into a gamut. Defaults to `"none"`, which is what the
   * imported Apple families do — 151 of their 312 swatches sit outside sRGB
   * (they are authored for Display P3). Clamping to sRGB will visibly
   * desaturate the extremes relative to those families.
   */
  gamut?: Gamut | "none"
}

export type RampEntry = { step: Step; color: Oklch4; css: string }

export type Ramp = {
  /** Ordered 50 → 950. */
  entries: RampEntry[]
  byStep: Record<Step, Oklch4>
  /** The resolved 500 anchor this ramp was generated from. */
  anchor: Oklch4
  /** Which step the input color was pinned to. */
  anchorStep: Step
  /** Anything worth knowing — clamped anchors, out-of-gamut steps. */
  notes: string[]
}

function chromaAt(step: Step, l: number, h: number, strategy: ChromaStrategy): number {
  switch (strategy.kind) {
    case "profile":
      return strategy.chroma * C_PROFILE[step]
    case "flat":
      return strategy.chroma
    case "max":
      return ((strategy.percent ?? 100) / 100) * maxChroma(l, h, strategy.space ?? "srgb")
  }
}

// ─── The builder ─────────────────────────────────────────────────────────────

/**
 * Build a ramp from an explicit 500 anchor. The other generators all resolve
 * their input down to this call.
 */
export function buildRamp(opts: RampOptions = {}): Ramp {
  const lightEnd = opts.lightEnd ?? LIGHT_END
  const darkEnd = opts.darkEnd ?? DARK_END
  const hue = ((opts.hue ?? 0) % 360 + 360) % 360
  const strategy = opts.chroma ?? { kind: "profile", chroma: 0.15 }
  const gamut = opts.gamut ?? "none"
  const notes: string[] = []

  let anchorL = opts.lightness ?? DEFAULT_ANCHOR_L
  if (anchorL < darkEnd || anchorL > lightEnd) {
    notes.push(
      `Anchor lightness ${anchorL.toFixed(3)} sits outside the ramp bounds ` +
        `[${darkEnd}, ${lightEnd}] — clamped.`,
    )
    anchorL = Math.min(lightEnd, Math.max(darkEnd, anchorL))
  }

  const byStep = {} as Record<Step, Oklch4>
  const entries: RampEntry[] = []

  for (const step of STEPS) {
    const end = step < 500 ? lightEnd : darkEnd
    const l = anchorL + L_PROFILE[step] * (end - anchorL)
    const c = Math.max(0, chromaAt(step, l, hue, strategy))

    let color: Oklch4 = { mode: "oklch", l, c, h: hue, alpha: 1 }
    if (gamut !== "none") color = clampToGamut(color, gamut)

    byStep[step] = color
    entries.push({ step, color, css: oklchCss(color) })
  }

  return {
    entries,
    byStep,
    anchor: byStep[500],
    anchorStep: 500,
    notes,
  }
}

// ─── 1. Tonal sections ───────────────────────────────────────────────────────

/**
 * Tonal's neutral section — pure achromatic gray, C = 0 at every step.
 *
 * Note this is *not* the same as the existing `--color-neutral-*` tokens,
 * which are Tailwind's own 11-step scale spanning L 0.985 → 0.145. This ramp
 * uses the 13 stops and the accent ladder's 0.97 → 0.20 bounds, so it lines up
 * with the color families instead.
 */
export function neutralRamp(opts: Omit<RampOptions, "chroma" | "hue"> = {}): Ramp {
  return buildRamp({
    ...opts,
    hue: 0,
    lightness: opts.lightness ?? midpoint(opts),
    chroma: { kind: "flat", chroma: 0 },
  })
}

/**
 * Tonal's tinted neutrals — a whisper of hue over the neutral ladder.
 *
 * Chroma is flat rather than curved: a tinted neutral should read as the same
 * temperature at every step, which the profile curve would break by making the
 * mid-tones eight times more colorful than the tints.
 */
export function tintedNeutralRamp(
  hue: number,
  opts: Omit<RampOptions, "chroma" | "hue"> & { chroma?: number } = {},
): Ramp {
  return buildRamp({
    ...opts,
    hue,
    lightness: opts.lightness ?? midpoint(opts),
    chroma: { kind: "flat", chroma: opts.chroma ?? 0.01 },
  })
}

/**
 * Tonal's vibrant section — every step pushed to the gamut ceiling for its own
 * lightness. Chroma peaks mid-ramp without being told to, because that is
 * where the OKLCH gamut is widest.
 *
 * `percent` backs off from the boundary. Use the same value across hues to get
 * families that read as equally vivid — equal *absolute* chroma would not,
 * since cyan's ceiling is roughly a third of purple's.
 */
export function vibrantRamp(
  hue: number,
  opts: Omit<RampOptions, "chroma" | "hue"> & { percent?: number; space?: Gamut } = {},
): Ramp {
  return buildRamp({
    ...opts,
    hue,
    lightness: opts.lightness ?? midpoint(opts),
    chroma: { kind: "max", percent: opts.percent ?? 100, space: opts.space ?? "srgb" },
  })
}

function midpoint(opts: { lightEnd?: number; darkEnd?: number }): number {
  return ((opts.lightEnd ?? LIGHT_END) + (opts.darkEnd ?? DARK_END)) / 2
}

// ─── 2. A ramp from a hue ────────────────────────────────────────────────────

/**
 * Build a family from nothing but a hue angle.
 *
 * Chroma defaults to 90% of what the hue can reach at the anchor's lightness,
 * so the same call across different hues yields families of matching vividness
 * rather than matching numbers.
 */
export function rampFromHue(
  hue: number,
  opts: Omit<RampOptions, "hue" | "chroma"> & {
    /** Anchor chroma as a percentage of the hue's ceiling. Default 90. */
    percent?: number
    /** Absolute anchor chroma. Overrides `percent`. */
    chroma?: number
    /** Which space `percent` is measured against. Default `"p3"`. */
    space?: Gamut
  } = {},
): Ramp {
  const lightness = opts.lightness ?? DEFAULT_ANCHOR_L
  const space = opts.space ?? "p3"
  const chroma = opts.chroma ?? ((opts.percent ?? 90) / 100) * maxChroma(lightness, hue, space)

  return buildRamp({ ...opts, hue, lightness, chroma: { kind: "profile", chroma } })
}

// ─── 3. A ramp through a given color ─────────────────────────────────────────

export type AnchorStep = Step | "auto"

/**
 * Build a family that passes exactly through a color you already have.
 *
 * The input is pinned to one step and the profiles are solved backwards to
 * recover the 500 anchor the ramp needs — so the color you supplied survives
 * into the output untouched, rather than being approximated by the nearest
 * generated swatch. This is how the Apple families themselves are shaped: a
 * brand color at 500, interpolated out to fixed ends.
 *
 * `anchor` defaults to 500 (your color is the family's base). Pass a step to
 * pin it elsewhere — `rampThroughColor("#e8f0ff", { anchor: 100 })` treats it
 * as a tint and builds a full-strength family beneath it. `"auto"` picks the
 * step that places the color most naturally in a well-formed ramp.
 */
export function rampThroughColor(
  input: string | Oklch4,
  opts: Omit<RampOptions, "lightness" | "hue" | "chroma"> & { anchor?: AnchorStep } = {},
): Ramp | null {
  const parsed = typeof input === "string" ? parseToOklch(input) : input
  if (!parsed) return null

  const lightEndIn = opts.lightEnd ?? LIGHT_END
  const darkEndIn = opts.darkEnd ?? DARK_END
  const hue = parsed.h ?? 0
  const notes: string[] = []

  const step = opts.anchor === "auto" || opts.anchor === undefined
    ? opts.anchor === "auto"
      ? autoAnchor(parsed.l, lightEndIn, darkEndIn)
      : 500
    : opts.anchor

  // Anchoring at an end means the input *defines* that end, since the profile
  // pins those steps to the bounds — there is no anchor lightness to solve for.
  let lightEnd = lightEndIn
  let darkEnd = darkEndIn
  let anchorL: number

  if (step === 50) {
    lightEnd = parsed.l
    anchorL = (lightEnd + darkEnd) / 2
    notes.push(`Anchored at 50, so 50 defines the ramp's light end (${parsed.l.toFixed(3)}).`)
  } else if (step === 950) {
    darkEnd = parsed.l
    anchorL = (lightEnd + darkEnd) / 2
    notes.push(`Anchored at 950, so 950 defines the ramp's dark end (${parsed.l.toFixed(3)}).`)
  } else {
    const p = L_PROFILE[step]
    const end = step < 500 ? lightEnd : darkEnd
    anchorL = (parsed.l - p * end) / (1 - p)
  }

  const anchorC = parsed.c / C_PROFILE[step]

  if (anchorL < darkEnd || anchorL > lightEnd) {
    const tooLight = anchorL > lightEnd
    notes.push(
      `Pinning this color to step ${step} implies a 500 lightness of ` +
        `${anchorL.toFixed(3)}, outside [${darkEnd}, ${lightEnd}]. Clamped — the ` +
        `input will not land exactly on step ${step}. It is too ${
          tooLight ? "light" : "dark"
        } to sit that ${tooLight ? "deep in" : "high up"} the ramp; try a ` +
        `${tooLight ? "lower" : "higher"} step number, or "auto".`,
    )
    anchorL = Math.min(lightEnd, Math.max(darkEnd, anchorL))
  }

  const ramp = buildRamp({
    ...opts,
    lightEnd,
    darkEnd,
    hue,
    lightness: anchorL,
    chroma: { kind: "profile", chroma: anchorC },
  })

  return { ...ramp, anchorStep: step, notes: [...notes, ...ramp.notes] }
}

/**
 * Pick the step that makes the input part of the most natural ramp — the one
 * whose implied 500 anchor lands closest to typical mid-ramp lightness while
 * staying inside the bounds.
 */
function autoAnchor(l: number, lightEnd: number, darkEnd: number): Step {
  // A color outside the ramp's bounds can only be held by an end step, which
  // redefines that end instead of solving for an anchor. Every interior step
  // would need an out-of-range 500 and get clamped.
  if (l >= lightEnd) return 50
  if (l <= darkEnd) return 950

  let best: Step = 500
  let bestScore = Infinity

  for (const step of STEPS) {
    if (step === 50 || step === 950) continue
    const p = L_PROFILE[step]
    const end = step < 500 ? lightEnd : darkEnd
    const anchorL = (l - p * end) / (1 - p)
    if (anchorL < darkEnd || anchorL > lightEnd) continue

    const score = Math.abs(anchorL - DEFAULT_ANCHOR_L)
    if (score < bestScore) {
      bestScore = score
      best = step
    }
  }
  return best
}

// ─── Inspection ──────────────────────────────────────────────────────────────

export type GamutReport = {
  space: Gamut
  outside: Array<{ step: Step; chroma: number; ceiling: number; overBy: number }>
  allInside: boolean
}

/** Which steps of a ramp fall outside a space, and by how much. */
export function gamutReport(ramp: Ramp, space: Gamut = "srgb"): GamutReport {
  const outside: GamutReport["outside"] = []
  for (const { step, color } of ramp.entries) {
    if (inSpace(color, space)) continue
    const ceiling = maxChroma(color.l, color.h ?? 0, space)
    outside.push({ step, chroma: color.c, ceiling, overBy: color.c - ceiling })
  }
  return { space, outside, allInside: outside.length === 0 }
}

/**
 * Largest hue spread across a set of colors, in degrees. Above ~10° the drift
 * is visible — the classic symptom of a ramp built in HSL, where blue slides
 * toward purple as it lightens.
 */
export function hueDrift(colors: Array<string | Oklch4>): number {
  const hues: number[] = []
  for (const c of colors) {
    const p = typeof c === "string" ? parseToOklch(c) : c
    // Near-achromatic colors have a meaningless hue — including them would
    // report drift that nobody can see.
    if (p && p.c > 0.002) hues.push(((p.h ?? 0) % 360 + 360) % 360)
  }
  if (hues.length < 2) return 0

  // Compare against the circular mean so a ramp straddling 0° doesn't report
  // a spurious ~360° spread.
  const mx = hues.reduce((a, h) => a + Math.cos((h * Math.PI) / 180), 0) / hues.length
  const my = hues.reduce((a, h) => a + Math.sin((h * Math.PI) / 180), 0) / hues.length
  const mean = (Math.atan2(my, mx) * 180) / Math.PI

  return Math.max(...hues.map((h) => Math.abs(((h - mean + 540) % 360) - 180))) * 2
}

// ─── Contrast ────────────────────────────────────────────────────────────────

const toRgb = converter("rgb")

/** WCAG 2 contrast ratio, 1–21. Use for formal conformance claims. */
export function wcagRatio(fg: string | Oklch4, bg: string | Oklch4): number {
  const f = luminance(fg)
  const b = luminance(bg)
  const [hi, lo] = f > b ? [f, b] : [b, f]
  return (hi + 0.05) / (lo + 0.05)
}

function luminance(color: string | Oklch4): number {
  const p = typeof color === "string" ? parseToOklch(color) : color
  if (!p) return 0
  const rgb = toRgb({ mode: "oklch", l: p.l, c: p.c, h: p.h })
  if (!rgb) return 0
  const ch = (v: number) => {
    const x = Math.min(1, Math.max(0, v))
    return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * ch(rgb.r) + 0.7152 * ch(rgb.g) + 0.0722 * ch(rgb.b)
}

// APCA-W3 0.1.9 constants.
const APCA = {
  trc: 2.4,
  r: 0.2126729, g: 0.7151522, b: 0.072175,
  normBG: 0.56, normTXT: 0.57, revTXT: 0.62, revBG: 0.65,
  blkThrs: 0.022, blkClmp: 1.414,
  scale: 1.14, loOffset: 0.027, loClip: 0.1,
  deltaYmin: 0.0005,
} as const

function apcaY(color: string | Oklch4): number {
  const p = typeof color === "string" ? parseToOklch(color) : color
  if (!p) return 0
  const rgb = toRgb({ mode: "oklch", l: p.l, c: p.c, h: p.h })
  if (!rgb) return 0
  const ch = (v: number) => Math.min(1, Math.max(0, v)) ** APCA.trc
  const y = APCA.r * ch(rgb.r) + APCA.g * ch(rgb.g) + APCA.b * ch(rgb.b)
  // Soft-clamp near-black, where perceived contrast falls off faster than
  // luminance does.
  return y < APCA.blkThrs ? y + (APCA.blkThrs - y) ** APCA.blkClmp : y
}

/**
 * APCA lightness contrast (Lc), roughly -108…+106.
 *
 * Signed by polarity: positive is dark text on a light background, negative is
 * light on dark. Compare the absolute value against the thresholds — 60 to
 * pass for body text, 75 for comfortable, 45 for large text, 30 for UI parts.
 *
 * More perceptually faithful than WCAG 2, and a natural partner to OKLCH since
 * both are built on perceived lightness. WCAG 2 is still what you cite for
 * legal conformance.
 */
export function apcaLc(text: string | Oklch4, background: string | Oklch4): number {
  const ytxt = apcaY(text)
  const ybg = apcaY(background)
  if (Math.abs(ybg - ytxt) < APCA.deltaYmin) return 0

  let sapc: number
  let out: number
  if (ybg > ytxt) {
    sapc = (ybg ** APCA.normBG - ytxt ** APCA.normTXT) * APCA.scale
    out = sapc < APCA.loClip ? 0 : sapc - APCA.loOffset
  } else {
    sapc = (ybg ** APCA.revBG - ytxt ** APCA.revTXT) * APCA.scale
    out = sapc > -APCA.loClip ? 0 : sapc + APCA.loOffset
  }
  return out * 100
}

/** Whichever of black or white reads better on this background, per APCA. */
export function readableOn(background: string | Oklch4): "black" | "white" {
  return Math.abs(apcaLc("#000", background)) >= Math.abs(apcaLc("#fff", background))
    ? "black"
    : "white"
}

/** Steps of a ramp that carry text of a given size against a background. */
export function stepsPassing(
  ramp: Ramp,
  background: string | Oklch4,
  threshold = 60,
): Step[] {
  return ramp.entries
    .filter(({ color }) => Math.abs(apcaLc(color, background)) >= threshold)
    .map(({ step }) => step)
}

// ─── Output ──────────────────────────────────────────────────────────────────

/** Fixed 3-decimal L and C, matching how `index.css` writes its values. */
function cssValue(c: Oklch4): string {
  const h = Math.round((c.h ?? 0) * 100) / 100
  return `oklch(${c.l.toFixed(3)} ${c.c.toFixed(3)} ${h})`
}

/**
 * Emit a ramp as CSS custom properties in this project's naming, ready to
 * paste into `index.css`.
 *
 * Tailwind v4 needs the tokens in two places: a `--color-<name>-<step>` entry
 * in the `@theme inline` block to mint the utilities, and the literal values in
 * `:root`. Pass `theme: true` for the former, which emits the `var()`
 * indirection the existing families use.
 */
export function rampToCss(
  name: string,
  ramp: Ramp,
  opts: { theme?: boolean; indent?: string; dark?: boolean } = {},
): string {
  const indent = opts.indent ?? "    "
  const slug = opts.dark ? `${name}-dark` : name

  return ramp.entries
    .map(({ step, color }) =>
      opts.theme
        ? `${indent}--color-${slug}-${step}: var(--color-${slug}-${step});`
        : `${indent}--color-${slug}-${step}: ${cssValue(color)};`,
    )
    .join("\n")
}

/**
 * The full three-block paste for a new family: `@theme inline` declarations,
 * `:root` values, and the `.dark` remapping the other families use.
 */
export function rampToTokenBlocks(
  name: string,
  light: Ramp,
  dark?: Ramp,
): { theme: string; root: string; dark: string } {
  const themeLines = [rampToCss(name, light, { theme: true })]
  if (dark) themeLines.push(rampToCss(name, dark, { theme: true, dark: true }))

  const rootLines = [rampToCss(name, light)]
  if (dark) rootLines.push(rampToCss(name, dark, { dark: true }))

  const darkLines = dark
    ? STEPS.map((s) => `    --color-${name}-${s}: var(--color-${name}-dark-${s});`).join("\n")
    : ""

  return { theme: themeLines.join("\n"), root: rootLines.join("\n"), dark: darkLines }
}

/**
 * Hex for each step.
 *
 * Hex *is* sRGB, so out-of-gamut steps are gamut-mapped first — chroma pulled
 * down with lightness and hue held. Handing them straight to `formatHex` would
 * clip each RGB channel independently instead, which shifts the hue and can
 * flatten several distinct steps onto the same value. Since 151 of the Apple
 * swatches sit outside sRGB, that difference is not academic here.
 *
 * Use `gamutReport(ramp, "srgb")` to see which steps this will move.
 */
export function rampToHex(ramp: Ramp): Record<Step, string> {
  const out = {} as Record<Step, string>
  for (const { step, color } of ramp.entries) {
    const safe = clampToGamut(color, "srgb")
    out[step] =
      formatHex({ mode: "oklch", l: safe.l, c: safe.c, h: safe.h }) ?? "#000000"
  }
  return out
}

// ─── Figma ───────────────────────────────────────────────────────────────────

/**
 * Figma has no OKLCH. Its variables and fills are sRGB, so everything below
 * exports gamut-mapped hex via `rampToHex` — the OKLCH original is carried
 * along as metadata so nothing is silently lost.
 */

export type NamedRamp = { name: string; ramp: Ramp }

function escapeXml(s: string): string {
  return s.replace(/[&<>"']/g, (ch) =>
    ch === "&" ? "&amp;" : ch === "<" ? "&lt;" : ch === ">" ? "&gt;" : ch === '"' ? "&quot;" : "&apos;",
  )
}

/**
 * A swatch sheet as SVG — the no-plugin route into Figma. Drag the file onto
 * the canvas and it arrives as grouped, named rectangles with real fills,
 * ready to be selected and turned into styles or variables.
 *
 * Each rect carries `id="<name>-<step>"`, which is what Figma reads as the
 * layer name.
 */
export function rampsToSvg(
  ramps: NamedRamp[],
  opts: { swatch?: number; gap?: number; labels?: boolean } = {},
): string {
  const size = opts.swatch ?? 88
  const gap = opts.gap ?? 8
  const labels = opts.labels ?? true
  const labelH = labels ? 30 : 0
  const titleH = 26
  const rowH = titleH + size + labelH + 20

  const width = STEPS.length * size + (STEPS.length - 1) * gap
  const height = ramps.length * rowH

  const rows = ramps.map(({ name, ramp }, r) => {
    const hex = rampToHex(ramp)
    const y = r * rowH
    const swatches = ramp.entries.map(({ step, color }, i) => {
      const x = i * (size + gap)
      const rect =
        `<rect id="${escapeXml(name)}-${step}" x="${x}" y="${y + titleH}" ` +
        `width="${size}" height="${size}" rx="10" fill="${hex[step]}"/>`
      if (!labels) return rect
      // Keep labels legible on the swatch's own value rather than assuming a
      // page background.
      const onSwatch = readableOn(color) === "black" ? "#000000" : "#ffffff"
      return (
        rect +
        `<text x="${x + 10}" y="${y + titleH + 20}" font-family="ui-monospace, monospace" ` +
        `font-size="11" fill="${onSwatch}" fill-opacity="0.75">${step}</text>` +
        `<text x="${x}" y="${y + titleH + size + 18}" font-family="ui-monospace, monospace" ` +
        `font-size="10" fill="#8a8a8e">${hex[step]}</text>`
      )
    })
    return (
      `<g id="${escapeXml(name)}">` +
      `<text x="0" y="${y + 16}" font-family="ui-sans-serif, system-ui" font-size="13" ` +
      `font-weight="600" fill="#8a8a8e">${escapeXml(name)}</text>` +
      swatches.join("") +
      `</g>`
    )
  })

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
    `viewBox="0 0 ${width} ${height}">` +
    rows.join("") +
    `</svg>`
  )
}

/**
 * W3C Design Tokens (DTCG) JSON — the format Tokens Studio and the Figma
 * variable-import plugins read. Produces one token group per ramp.
 *
 * `$value` is gamut-mapped hex because that is what importers accept; the
 * exact OKLCH is preserved in `$description` and under `$extensions` so the
 * source of truth survives the round trip.
 */
export function rampsToDtcg(ramps: NamedRamp[]): string {
  const out: Record<string, Record<string, unknown>> = {}

  for (const { name, ramp } of ramps) {
    const hex = rampToHex(ramp)
    const group: Record<string, unknown> = {}
    for (const { step, color } of ramp.entries) {
      group[String(step)] = {
        $type: "color",
        $value: hex[step],
        $description: cssValue(color),
        $extensions: {
          "work.brycelewis.oklch": {
            l: +color.l.toFixed(4),
            c: +color.c.toFixed(4),
            h: +(color.h ?? 0).toFixed(2),
            outsideSrgb: !inSpace(color, "srgb"),
          },
        },
      }
    }
    out[name] = group
  }

  return JSON.stringify(out, null, 2)
}

// Apple-style Liquid Glass modes. Four materials — small, medium, large, clear —
// each defined for light and dark backdrops. These are the GLOBAL source of
// truth: tune them in the Liquid Glass playground (/components/liquid-glass),
// then paste the locked-in numbers back into GLASS_DEFAULTS here. Real
// components reference a mode via `<LiquidGlass mode="medium">` or
// `useLiquidGlassMode("medium", { radius })` and never hard-code raw params.
//
// A "mode" is the MATERIAL only (refraction strength, blur, bevel, tint). The
// element supplies its own `radius` — a button, sheet, window, and dialog share
// a material but round their corners differently.
//
//   small  → thin, crisp chrome: buttons, chips, segmented controls
//   medium → standard panels: cards, popovers, toolbars
//   large  → heavy, immersive surfaces: sheets, windows, modal dialogs
//   clear  → near-transparent, refraction-forward: controls over photos/video

export type GlassMode = "small" | "medium" | "large" | "clear"

export const GLASS_MODES: GlassMode[] = ["small", "medium", "large", "clear"]

export type GlassTone = "light" | "dark"

/** Elevation token — keys into the system `--shadow-*` scale (index.css). */
export type GlassShadow = "none" | "2xs" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl"

export const GLASS_SHADOWS: GlassShadow[] = [
  "none",
  "2xs",
  "xs",
  "sm",
  "md",
  "lg",
  "xl",
  "2xl",
]

/**
 * The system elevation scale, as concrete box-shadow strings.
 *
 * These MIRROR the `--shadow-*` tokens defined in `src/index.css` (the source of
 * truth). We keep a typed copy here because Tailwind v4 inlines those tokens into
 * the `shadow-*` utilities and does NOT expose them as runtime `var(--shadow-*)`,
 * so an inline style (like the glass drop shadow, which must also carry the rim
 * light) can't reference them directly. If the scale changes in index.css, update
 * it here too.
 */
export const SYSTEM_SHADOWS: Record<GlassShadow, string> = {
  none: "",
  "2xs": "0 1px 2px oklch(0 0 0 / 3%)",
  xs: "0 1px 3px oklch(0 0 0 / 4%), 0 1px 2px oklch(0 0 0 / 3%)",
  sm: "0 2px 4px oklch(0 0 0 / 5%), 0 1px 2px oklch(0 0 0 / 3%)",
  md: "0 4px 8px oklch(0 0 0 / 6%), 0 2px 4px oklch(0 0 0 / 4%)",
  lg: "0 8px 16px oklch(0 0 0 / 8%), 0 4px 8px oklch(0 0 0 / 4%)",
  xl: "0 16px 32px oklch(0 0 0 / 10%), 0 8px 16px oklch(0 0 0 / 5%)",
  "2xl": "0 24px 48px oklch(0 0 0 / 14%), 0 12px 24px oklch(0 0 0 / 6%)",
}

/**
 * The stacked fill layers, mirroring the Apple/Glass Figma component. Each is a
 * concrete CSS color (8-digit hex from the Figma tokens); "" means the layer is
 * omitted. Blend modes are structural and fixed:
 *   base → normal · highlight → overlay · glass → normal
 * (The optional accent + opacity layers are component options, not tokens.)
 */
export type GlassFills = {
  /** Base tint — the body fill. Normal blend. */
  base: string
  /** Highlight layer. Overlay blend. */
  highlight: string
  /** Glass layer — the topmost fill. Normal blend. "" = none. */
  glass: string
  /** Drop-shadow tint (Apple/Glass `fill-shadow-*` token). Multiply-blended. */
  shadow: string
}

export type GlassMaterial = {
  /** Peak edge displacement in px — how hard the bevel bends the backdrop. */
  strength: number
  /** Frosted backdrop blur in px. */
  blur: number
  /** Frost (0–1) — Figma's Frost: couples extra backdrop blur with a white
   * milky veil, clear → opaque-frosted. Independent of `fills` and `blur`. */
  frost: number
  /** Fraction of the half-extent the bevel ramps over (0.1–1). */
  bevel: number
  /** Glass thickness in px (kube `glassThickness`) — high = a sharp lens right
   * at the rim, low = a broad soft band across the whole bevel. */
  thickness: number
  /** Depth (Figma's "Depth") — directional inner-shadow intensity (0–1) that
   * fakes 3D glass thickness: dark on the light-facing inner wall, faint
   * highlight opposite. Separate from refraction `thickness`. */
  depth: number
  /** Stacked fill layers (Apple/Glass token values), per variant + theme. */
  fills: GlassFills
  /** Master intensity of the edge lighting (0 = flat, 1 = max). */
  lightStrength: number
  /** Rim width in px — a FIXED thickness, independent of the element's size. */
  edgeWidth: number
  /** Direction the rim specular is aimed, in degrees clockwise from top (0 =
   * bright edge at the top). The gradient is brightest on the edge facing this
   * and fades to the opposite edge. */
  specularAngle: number
  /** Soft inner-glow radius in px (the all-around white edge glow). */
  specularGlow: number
  /** Strength (0–1) of the fainter highlight on the edge OPPOSITE the light. */
  specularBacklight: number
  /** Drop-shadow horizontal offset in px. */
  shadowOffsetX: number
  /** Drop-shadow vertical offset in px (down = positive). */
  shadowOffsetY: number
  /** Drop-shadow blur radius in px. */
  shadowBlur: number
  /** Drop-shadow spread in px. */
  shadowSpread: number
  /** Corner profile: 0 = circular `border-radius`, ~0.6 = Apple squircle. */
  cornerSmoothing: number
}

export type GlassModeDefaults = Record<GlassMode, Record<GlassTone, GlassMaterial>>

/**
 * Baked defaults. Eight presets = 4 modes × {light, dark}.
 *
 * `tuned()` is the user's tuned LIGHT base; `tunedDark()` is that base with the
 * dark-mode edge-light. All eight cells are user-tuned in the playground and
 * baked here — each spreads the matching base and overrides only what diverges
 * (refraction weight, depth, frost, fills, shadow). Both factories return a
 * fresh copy per cell so the presets stay independent.
 */
const tuned = (): GlassMaterial => ({
  strength: 50,
  blur: 2,
  frost: 0,
  bevel: 0.45,
  thickness: 65,
  depth: 0.06,
  fills: { base: "#ffffff59", highlight: "#ffffff47", glass: "", shadow: "#0000001a" },
  lightStrength: 0.7,
  edgeWidth: 1.5,
  specularAngle: 135,
  specularGlow: 6,
  specularBacklight: 0.6,
  shadowOffsetX: 0,
  shadowOffsetY: 8,
  shadowBlur: 32,
  shadowSpread: 0,
  cornerSmoothing: 0.6,
})

// Dark mode shares the light base but uses the user's dialed-in dark edge-light.
const tunedDark = (): GlassMaterial => ({
  ...tuned(),
  lightStrength: 0.3,
  edgeWidth: 1.5,
  specularAngle: 315,
  specularGlow: 5.5,
  specularBacklight: 0.55,
})

export const GLASS_DEFAULTS: GlassModeDefaults = {
  small: {
    light: tuned(),
    // small · dark — user-tuned: deeper depth + proper dark fills.
    dark: {
      ...tunedDark(),
      depth: 0.21,
      fills: { base: "#1414196b", highlight: "#f2f2f229", glass: "#00000029", shadow: "#0000001a" },
    },
  },
  medium: {
    // medium · light — user-tuned: a touch of frost + a more opaque base fill.
    light: {
      ...tuned(),
      frost: 0.25,
      fills: { base: "#ffffff66", highlight: "#ffffff47", glass: "", shadow: "#0000001a" },
    },
    // medium · dark — user-tuned: heavier refraction + dark fills.
    dark: {
      ...tunedDark(),
      strength: 70,
      blur: 12,
      thickness: 80,
      depth: 0.2,
      fills: { base: "#1414196b", highlight: "#f2f2f229", glass: "#0000001c", shadow: "#0000001a" },
    },
  },
  large: {
    // large · light — user-tuned: heavy refraction, brighter highlight/edge, big shadow.
    light: {
      ...tuned(),
      strength: 90,
      frost: 0.35,
      thickness: 110,
      depth: 0.07,
      lightStrength: 0.76,
      shadowBlur: 50,
      fills: { base: "#ffffff66", highlight: "#ffffff80", glass: "", shadow: "#0000001a" },
    },
    // large · dark — user-tuned: more blur/frost/depth, no specular glow, dark fills.
    // NOTE: shadowBlur assumed 50 (Elevation section was cut off in the screenshot).
    dark: {
      ...tunedDark(),
      blur: 10,
      frost: 0.35,
      depth: 0.12,
      lightStrength: 0.4,
      specularGlow: 0,
      specularBacklight: 0.5,
      shadowBlur: 50,
      fills: { base: "#1414198c", highlight: "#f2f2f229", glass: "#0000001c", shadow: "#0000001a" },
    },
  },
  clear: {
    // clear · light — user-tuned: near-transparent (faint base, no highlight) + frost.
    light: {
      ...tuned(),
      frost: 0.15,
      lightStrength: 0.6,
      specularAngle: 315,
      specularBacklight: 0.4,
      fills: { base: "#ffffff0d", highlight: "", glass: "", shadow: "#00000014" },
    },
    // clear · dark — user-tuned: a little more blur/depth, softer edge, dark fills.
    dark: {
      ...tunedDark(),
      blur: 4,
      depth: 0.1,
      lightStrength: 0.4,
      specularGlow: 6,
      specularBacklight: 0.3,
      fills: { base: "#1414196b", highlight: "#f2f2f229", glass: "#00000026", shadow: "#00000014" },
    },
  },
}

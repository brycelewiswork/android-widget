/**
 * Token registry — single source of truth shared by the Colors page (viewer)
 * and the color editor (picker + save/load). Adding a new semantic token:
 *   1. Add its `--var` to `src/index.css` (light in `:root`, dark in `.dark`)
 *   2. Add an entry here in the right section
 * The viewer and editor pick it up automatically.
 */

export type ThemeMode = "light" | "dark"

export type Token = {
  /** Human-readable name shown above the swatch */
  name: string
  /** CSS custom property name, including the leading `--` */
  cssVar: string
  /** Tailwind utility hint shown alongside the swatch */
  utility: string
  /** Base oklch() *body* (no wrapping `oklch(…)`) per mode. */
  base: { light: string; dark: string }
}

export type TokenSection = {
  id: string
  title: string
  description: string
  tokens: Token[]
}

export const SECTIONS: TokenSection[] = [
  {
    id: "surfaces",
    title: "Surfaces",
    description: "Layered backgrounds for depth and hierarchy",
    tokens: [
      { name: "Surface", cssVar: "--surface", utility: "bg-surface", base: { light: "0.979 0 0", dark: "0.159 0 0" } },
      { name: "Surface Secondary", cssVar: "--surface-secondary", utility: "bg-surface-secondary", base: { light: "1 0 0", dark: "0.205 0 0" } },
      { name: "Surface Tertiary", cssVar: "--surface-tertiary", utility: "bg-surface-tertiary", base: { light: "0.973 0 0", dark: "0.256 0 0" } },
    ],
  },
  {
    id: "labels",
    title: "Labels",
    description: "Text hierarchy with tinted neutrals and opacity",
    tokens: [
      { name: "Label", cssVar: "--label", utility: "text-label", base: { light: "0.336 0.005 107", dark: "1 0 0 / 90%" } },
      { name: "Label Secondary", cssVar: "--label-secondary", utility: "text-label-secondary", base: { light: "0.359 0.012 286 / 60%", dark: "1 0 0 / 55%" } },
      { name: "Label Tertiary", cssVar: "--label-tertiary", utility: "text-label-tertiary", base: { light: "0 0 0 / 25%", dark: "1 0 0 / 25%" } },
    ],
  },
  {
    id: "strokes",
    title: "Strokes",
    description: "Border tokens for separators and containers",
    tokens: [
      { name: "Stroke Faint", cssVar: "--stroke-faint", utility: "border-stroke-faint", base: { light: "0.931 0 0", dark: "1 0 0 / 8%" } },
      { name: "Stroke Strong", cssVar: "--stroke-strong", utility: "border-stroke-strong", base: { light: "0.919 0.007 269", dark: "1 0 0 / 12%" } },
    ],
  },
  {
    id: "interactive",
    title: "Interactive",
    description: "Action colors for buttons, focus rings, and status",
    tokens: [
      { name: "Primary", cssVar: "--primary", utility: "bg-primary", base: { light: "0.205 0 0", dark: "0.922 0 0" } },
      { name: "Primary Foreground", cssVar: "--primary-foreground", utility: "text-primary-foreground", base: { light: "0.985 0 0", dark: "0.205 0 0" } },
      { name: "Destructive", cssVar: "--destructive", utility: "bg-destructive", base: { light: "0.577 0.245 27.325", dark: "0.704 0.191 22.216" } },
      { name: "Ring", cssVar: "--ring", utility: "ring-ring", base: { light: "0.708 0 0", dark: "0.556 0 0" } },
    ],
  },
  {
    id: "sidebar",
    title: "Sidebar",
    description: "Navigation chrome — scoped to sidebar components",
    tokens: [
      { name: "Sidebar", cssVar: "--sidebar", utility: "bg-sidebar", base: { light: "0.985 0 0", dark: "0.205 0 0" } },
      { name: "Sidebar Foreground", cssVar: "--sidebar-foreground", utility: "text-sidebar-foreground", base: { light: "0.336 0.005 107", dark: "1 0 0 / 90%" } },
      { name: "Sidebar Primary", cssVar: "--sidebar-primary", utility: "bg-sidebar-primary", base: { light: "0.205 0 0", dark: "0.488 0.243 264.376" } },
      { name: "Sidebar Primary FG", cssVar: "--sidebar-primary-foreground", utility: "text-sidebar-primary-foreground", base: { light: "0.985 0 0", dark: "0.985 0 0" } },
      { name: "Sidebar Accent", cssVar: "--sidebar-accent", utility: "bg-sidebar-accent", base: { light: "0.973 0 0", dark: "0.256 0 0" } },
      { name: "Sidebar Accent FG", cssVar: "--sidebar-accent-foreground", utility: "text-sidebar-accent-foreground", base: { light: "0.336 0.005 107", dark: "1 0 0 / 90%" } },
      { name: "Sidebar Border", cssVar: "--sidebar-border", utility: "border-sidebar-border", base: { light: "0.931 0 0", dark: "0.205 0 0" } },
      { name: "Sidebar Ring", cssVar: "--sidebar-ring", utility: "ring-sidebar-ring", base: { light: "0.708 0 0", dark: "0.556 0 0" } },
    ],
  },
]

/**
 * Fills reference primitives via `var(...)` chains rather than holding
 * direct color values. Editing them means *replacing* that var reference
 * with a literal oklch — handled correctly by the picker / storage.
 */
export const FILLS: Token[] = [
  { name: "Fill Primary", cssVar: "--fill-primary", utility: "bg-fill-primary", base: { light: "0 0 0 / 10%", dark: "1 0 0 / 10%" } },
  { name: "Fill Secondary", cssVar: "--fill-secondary", utility: "bg-fill-secondary", base: { light: "0 0 0 / 8%", dark: "1 0 0 / 8%" } },
  { name: "Fill Tertiary", cssVar: "--fill-tertiary", utility: "bg-fill-tertiary", base: { light: "0 0 0 / 5%", dark: "1 0 0 / 5%" } },
  { name: "Fill Quaternary", cssVar: "--fill-quaternary", utility: "bg-fill-quaternary", base: { light: "0 0 0 / 3%", dark: "1 0 0 / 3%" } },
  { name: "Fill Quinary", cssVar: "--fill-quinary", utility: "bg-fill-quinary", base: { light: "0 0 0 / 2%", dark: "1 0 0 / 2%" } },
]

export const FILLS_SECTION: TokenSection = {
  id: "fills",
  title: "Fills",
  description: "Translucent overlays — black in light mode, white in dark, referencing opacity primitives",
  tokens: FILLS,
}

export const ALL_SECTIONS: TokenSection[] = [
  SECTIONS[0],
  SECTIONS[1],
  SECTIONS[2],
  FILLS_SECTION,
  SECTIONS[3],
  SECTIONS[4],
]

export const ALL_TOKENS: Token[] = ALL_SECTIONS.flatMap((s) => s.tokens)

export function getToken(cssVar: string): Token | undefined {
  return ALL_TOKENS.find((t) => t.cssVar === cssVar)
}

/** Wraps an oklch body string for use as a CSS value */
export function wrapOklch(body: string): string {
  return `oklch(${body})`
}

/**
 * Fluid type + space engine — Utopia-style `clamp()` fluid sizing, organized as a
 * two-tier token system.
 *
 *   Primitive tokens  — the raw programmatic scale. Type steps −N…+M and space
 *                       t-shirt sizes (3xs…3xl) + one-up pairs. Emitted as
 *                       `--type-step-<n>` / `--space-<key>` custom properties in
 *                       plain `:root` (NOT a Tailwind namespace → no utilities).
 *   Semantic tokens   — role-based aliases that reference a primitive, declared in
 *                       `@theme inline` in index.css (`--spacing-inset-*` etc.) so
 *                       Tailwind generates `p-inset-m`, `gap-gutter-l`, … . Because
 *                       the alias value is `var(--space-*)`, overriding the
 *                       primitive at runtime updates every utility live.
 *
 * This module is the single source of truth for the clamp math. The reference
 * pages (/typography, /spacing, /grid, /clamp) import the `compute*` helpers to
 * render tables and previews; `applyFluid` writes the primitives to the DOM;
 * `saveFluid`/`loadFluid` persist per-project (per localStorage origin);
 * `exportFluidCss` emits a paste-ready block to bake settled values into index.css.
 *
 * The default clamp strings are also baked statically into `:root` in index.css so
 * the scale renders correctly with no JS (no FOUC); `applyFluid` only overrides
 * them when a saved config exists.
 */

const STORAGE_KEY = "fluid-settings"
const ROOT_PX = 16

export type SpaceStepKey =
  | "5xs" | "4xs" | "3xs" | "2xs" | "xs" | "s"
  | "m" | "l" | "xl" | "2xl" | "3xl" | "4xl" | "5xl"

export type FluidConfig = {
  // ── FOUNDATION ── the shared inputs (six numbers) every scale derives from.
  //    Owned by the /foundations page; type/space/grid/clamp only consume them.
  /** Viewport bounds (px) the whole system interpolates between. */
  viewport: { min: number; max: number }
  /** Base font size (px) at the min / max viewport. Drives type step 0 AND the
   *  space scale (space steps are multiples of this base). One value, not two. */
  base: { min: number; max: number }
  /** Modular-scale ratio at the min / max viewport. `detailMin`/`detailMax` are a
   *  separate, usually gentler ratio applied ONLY to the sub-body (negative) steps,
   *  so the small end can compress (Apple-style: many tightly-spaced label sizes)
   *  while the heading end stays coarse. Default them to `min`/`max` for a single
   *  uniform ratio. Type-only — spacing derives from multipliers, not this. */
  ratio: { min: number; max: number; detailMin: number; detailMax: number }

  // ── TYPE-ONLY ── refinements that shape the type scale, nothing else.
  type: {
    /** How many steps below / above the base (step 0) to generate. */
    negativeSteps: number
    positiveSteps: number
    weightHeading: number
    weightBody: number
    lhHeading: number
    lhBody: number
    lsHeading: number
    lsBody: number
    /** Font family for headings / body. `DEFAULT_FONT` = the bundled DM Sans;
     *  any other value is loaded on demand from Google Fonts. */
    fontHeading: string
    fontBody: string
    /** Per-step custom role names (step number → name), keyed by step as a string.
     *  Overrides the built-in `TYPE_ROLES` name and names otherwise-unnamed steps;
     *  each generates a `.text-<name>` utility (injected live + emitted by Copy CSS). */
    roleNames: Record<string, string>
    /** Steps switched off — kept in the scale (so indices/ratio stay put) but
     *  greyed in the Preview and excluded from the Copy CSS export. */
    disabledSteps: number[]
  }

  // ── SPACE-ONLY ── each step is an editable multiple of the base; `down`/`up`
  //    control how many steps are active (Utopia-style add/remove). Base = `s` = 1.
  space: {
    /** Editable multiplier of the base for every step key in the vocabulary. */
    multipliers: Record<SpaceStepKey, number>
    /** How many steps below / above the base are active. */
    down: number
    up: number
    /** User-defined [lower, upper] pairs that jump more than one step. */
    customPairs: [SpaceStepKey, SpaceStepKey][]
  }
}

/** Steps below the base `s`, ordered nearest-base → outward. */
export const SPACE_DOWN_KEYS: SpaceStepKey[] = ["xs", "2xs", "3xs", "4xs", "5xs"]
/** Steps above the base, ordered nearest-base → outward. */
export const SPACE_UP_KEYS: SpaceStepKey[] = ["m", "l", "xl", "2xl", "3xl", "4xl", "5xl"]
/** Full step vocabulary, small → large (base `s` in the middle). */
export const SPACE_STEP_ORDER: SpaceStepKey[] = [...[...SPACE_DOWN_KEYS].reverse(), "s", ...SPACE_UP_KEYS]

/** The four semantic space roles (padding / vertical gap / horizontal gap / 2D gap). */
export const SPACE_ROLE_NAMES = ["inset", "stack", "inline", "gutter"] as const
export type SpaceRole = (typeof SPACE_ROLE_NAMES)[number]

/** Default multiplier of the base for each step — Utopia's canonical scale
 *  (0.25…6), with headroom at the extremes. Every one is editable. */
export const SPACE_MULTIPLIERS: Record<SpaceStepKey, number> = {
  "5xs": 0.0625, "4xs": 0.125, "3xs": 0.25, "2xs": 0.5, xs: 0.75, s: 1,
  m: 1.5, l: 2, xl: 3, "2xl": 4, "3xl": 6, "4xl": 8, "5xl": 12,
}

/** The active step keys (small → large) for the current down/up counts. */
export function activeSpaceKeys(space: FluidConfig["space"]): SpaceStepKey[] {
  const down = SPACE_DOWN_KEYS.slice(0, Math.max(0, Math.min(space.down, SPACE_DOWN_KEYS.length)))
  const up = SPACE_UP_KEYS.slice(0, Math.max(0, Math.min(space.up, SPACE_UP_KEYS.length)))
  return [...down.reverse(), "s", ...up]
}

/** The bundled default family (DM Sans). Any other value in `fontHeading` /
 *  `fontBody` is treated as a Google Fonts family name and loaded on demand. */
export const DEFAULT_FONT = "DM Sans"

/** Comfortable default: 16px→18px base across 360→1240, minor-third → major-third. */
export const FLUID_DEFAULTS: FluidConfig = {
  viewport: { min: 360, max: 1240 },
  base: { min: 16, max: 18 },
  ratio: { min: 1.2, max: 1.25, detailMin: 1.075, detailMax: 1.075 },
  type: {
    negativeSteps: 6,
    positiveSteps: 5,
    weightHeading: 600,
    weightBody: 400,
    lhHeading: 1.2,
    lhBody: 1.5,
    lsHeading: -0.02,
    lsBody: 0,
    fontHeading: DEFAULT_FONT,
    fontBody: DEFAULT_FONT,
    roleNames: {},
    disabledSteps: [],
  },
  space: {
    multipliers: { ...SPACE_MULTIPLIERS },
    down: 3,
    up: 5,
    customPairs: [],
  },
}

/** Semantic type role → primitive step. Legacy h1…h6/body/sm/xs map onto the same
 *  steps so existing call sites keep working (see the type utilities in index.css). */
export const TYPE_ROLES: { role: string; step: number; legacy?: string }[] = [
  { role: "display", step: 5, legacy: "h1" },
  { role: "heading", step: 4, legacy: "h2" },
  { role: "h3", step: 3 },
  { role: "title", step: 2, legacy: "h4" },
  { role: "h5", step: 1 },
  { role: "body", step: 0, legacy: "h6" },
  { role: "caption", step: -1, legacy: "sm" },
  { role: "eyebrow", step: -2, legacy: "xs" },
]

const round = (n: number, p = 4) => {
  const f = 10 ** p
  return Math.round(n * f) / f
}

export type ClampResult = {
  minPx: number
  maxPx: number
  minRem: number
  maxRem: number
  slopeVw: number
  interceptRem: number
  /** The CSS `clamp(...)` string. */
  css: string
}

/**
 * Utopia's fluid clamp. Interpolates a value from `minPx` at the min viewport to
 * `maxPx` at the max viewport, expressed in rem + vw so it scales with the root.
 */
export function calculateClamp(
  minPx: number,
  maxPx: number,
  viewport: { min: number; max: number },
): ClampResult {
  const { min: minVw, max: maxVw } = viewport
  const slope = maxVw === minVw ? 0 : (maxPx - minPx) / (maxVw - minVw)
  const interceptPx = minPx - slope * minVw
  const minRem = round(minPx / ROOT_PX)
  const maxRem = round(maxPx / ROOT_PX)
  const interceptRem = round(interceptPx / ROOT_PX)
  const slopeVw = round(slope * 100)
  // Guard against inverted bounds under extreme tuning so the CSS stays valid.
  const lo = Math.min(minRem, maxRem)
  const hi = Math.max(minRem, maxRem)
  const css = `clamp(${lo}rem, ${interceptRem}rem + ${slopeVw}vw, ${hi}rem)`
  return { minPx, maxPx, minRem, maxRem, slopeVw, interceptRem, css }
}

/** Resolve a computed clamp to its actual px at a given viewport width — powers
 *  the preview scrubbers (what a token renders at 360px, 768px, 1240px, …). */
export function resolveClamp(c: ClampResult, viewportPx: number): number {
  const preferredPx = c.interceptRem * ROOT_PX + (c.slopeVw / 100) * viewportPx
  const lo = Math.min(c.minPx, c.maxPx)
  const hi = Math.max(c.minPx, c.maxPx)
  return Math.min(hi, Math.max(lo, preferredPx))
}

export type TypeStep = ClampResult & { step: number }

/** Compute every type step from −negativeSteps to +positiveSteps. */
export function computeTypeScale(cfg: FluidConfig): TypeStep[] {
  const { negativeSteps, positiveSteps } = cfg.type
  const { min: baseMin, max: baseMax } = cfg.base
  const { min: ratioMin, max: ratioMax, detailMin, detailMax } = cfg.ratio
  const steps: TypeStep[] = []
  for (let n = -negativeSteps; n <= positiveSteps; n++) {
    // Sub-body (negative) steps use the gentler detail ratio; body + headings use the main ratio.
    const rMin = n < 0 ? detailMin : ratioMin
    const rMax = n < 0 ? detailMax : ratioMax
    const minPx = baseMin * rMin ** n
    const maxPx = baseMax * rMax ** n
    steps.push({ step: n, ...calculateClamp(round(minPx, 3), round(maxPx, 3), cfg.viewport) })
  }
  return steps
}

export type SpaceToken = ClampResult & { key: string; mult?: number }

export type SpaceScale = {
  singles: SpaceToken[]
  /** Auto one-up pairs between each adjacent active step. */
  pairs: SpaceToken[]
  /** User-defined pairs that jump more than one step (e.g. s-l). */
  customPairs: SpaceToken[]
}

/** Fluid from the lower step's min to the upper step's max — space that grows a
 *  whole step (or more) as the viewport widens. */
function pairToken(
  lo: SpaceStepKey,
  hi: SpaceStepKey,
  cfg: FluidConfig,
): SpaceToken {
  const { min: baseMin, max: baseMax } = cfg.base
  const m = cfg.space.multipliers
  return {
    key: `${lo}-${hi}`,
    ...calculateClamp(round(baseMin * m[lo], 3), round(baseMax * m[hi], 3), cfg.viewport),
  }
}

/** Compute the space t-shirt scale + one-up pairs + custom pairs. */
export function computeSpaceScale(cfg: FluidConfig): SpaceScale {
  const { multipliers } = cfg.space
  const { min: baseMin, max: baseMax } = cfg.base
  const keys = activeSpaceKeys(cfg.space)
  const active = new Set<SpaceStepKey>(keys)
  const singles: SpaceToken[] = keys.map((key) => {
    const mult = multipliers[key]
    return { key, mult, ...calculateClamp(round(baseMin * mult, 3), round(baseMax * mult, 3), cfg.viewport) }
  })
  const pairs: SpaceToken[] = keys.slice(0, -1).map((lo, i) => pairToken(lo, keys[i + 1], cfg))
  // Custom pairs, skipping any that reference a step no longer active.
  const customPairs: SpaceToken[] = (cfg.space.customPairs ?? [])
    .filter(([lo, hi]) => active.has(lo) && active.has(hi))
    .map(([lo, hi]) => pairToken(lo, hi, cfg))
  return { singles, pairs, customPairs }
}

export type GridConfig = {
  /** Number of columns in the design grid. */
  columns: number
  /** Gutter step at the min / max viewport — together they form a fluid gutter. */
  gutterMin: SpaceStepKey
  gutterMax: SpaceStepKey
  /** Edge-margin step at the min / max viewport (container inline padding). */
  marginMin: SpaceStepKey
  marginMax: SpaceStepKey
  /** Container max width (px). */
  maxWidthPx: number
  /** Min column width (px) for the bonus wrap-aware (auto-fit) grid. */
  minColumnPx: number
}

export const GRID_DEFAULTS: GridConfig = {
  columns: 12,
  gutterMin: "s",
  gutterMax: "l",
  marginMin: "m",
  marginMax: "xl",
  maxWidthPx: 1240,
  minColumnPx: 240,
}

export type GridSpaceValue = {
  /** The CSS value: a single-step var, or `var(--space-lo-hi, clamp(…))` for a pair. */
  value: string
  minPx: number
  maxPx: number
}

/** A fluid grid dimension from a min-viewport step to a max-viewport step —
 *  a single step if they match, else the pair clamp (Utopia's `s → l` gutter). */
function gridSpaceValue(minKey: SpaceStepKey, maxKey: SpaceStepKey, cfg: FluidConfig): GridSpaceValue {
  const m = cfg.space.multipliers
  const minPx = round(cfg.base.min * m[minKey], 3)
  const maxPx = round(cfg.base.max * m[maxKey], 3)
  if (minKey === maxKey) return { value: `var(--space-${minKey})`, minPx, maxPx }
  const clamp = calculateClamp(minPx, maxPx, cfg.viewport).css
  // Reference the named pair token when it's an ascending pair (with the clamp as
  // a fallback, Utopia-style); otherwise emit the clamp directly.
  const ascending = SPACE_STEP_ORDER.indexOf(minKey) < SPACE_STEP_ORDER.indexOf(maxKey)
  const value = ascending ? `var(--space-${minKey}-${maxKey}, ${clamp})` : clamp
  return { value, minPx, maxPx }
}

/**
 * A fixed N-column design grid (Utopia-style): a fluid gutter and fluid edge
 * margin (each min-step → max-step) in a centered max-width container. Emits CSS
 * custom properties plus `.u-container` / `.u-grid`, and an auto-fit template for
 * the bonus wrap-aware grid.
 */
export function computeGrid(grid: GridConfig, fluid: FluidConfig) {
  const gutter = gridSpaceValue(grid.gutterMin, grid.gutterMax, fluid)
  const margin = gridSpaceValue(grid.marginMin, grid.marginMax, fluid)
  const maxWidthRem = round(grid.maxWidthPx / ROOT_PX, 4)
  const fixedTemplateColumns = `repeat(${grid.columns}, minmax(0, 1fr))`
  const autoFitTemplateColumns = `repeat(auto-fit, minmax(min(${grid.minColumnPx}px, 100%), 1fr))`
  const css = [
    ":root {",
    `  --grid-max-width: ${maxWidthRem}rem;`,
    `  --grid-gutter: ${gutter.value};`,
    `  --grid-margin: ${margin.value};`,
    `  --grid-columns: ${grid.columns};`,
    "}",
    "",
    ".u-container {",
    "  max-width: var(--grid-max-width);",
    "  margin-inline: auto;",
    "  padding-inline: var(--grid-margin);",
    "}",
    "",
    ".u-grid {",
    "  display: grid;",
    "  grid-template-columns: repeat(var(--grid-columns), minmax(0, 1fr));",
    "  gap: var(--grid-gutter);",
    "}",
  ].join("\n")
  return { gutter, margin, maxWidthRem, fixedTemplateColumns, autoFitTemplateColumns, css }
}

/** Inject a Google Fonts stylesheet for `family` (idempotent). Uses the v1 CSS
 *  API, which tolerantly serves whatever weights a family actually has (css2
 *  returns 400 for a weight a font lacks — fatal for arbitrary user input).
 *  Exported so the font picker can lazily render each option in its own face. */
export function loadGoogleFont(family: string): void {
  if (typeof document === "undefined") return
  const fam = family.trim()
  if (!fam || fam === DEFAULT_FONT) return
  const id = `gfont-${fam.toLowerCase().replace(/\s+/g, "-")}`
  if (document.getElementById(id)) return
  const link = document.createElement("link")
  link.id = id
  link.rel = "stylesheet"
  const name = fam.replace(/\s+/g, "+")
  link.href = `https://fonts.googleapis.com/css?family=${name}:100,200,300,400,500,600,700,800,900&display=swap`
  document.head.appendChild(link)
}

/** Point a `--font-*` var at the chosen family (loading it first if it's a
 *  non-default Google font), or back at the bundled DM Sans stack. */
function applyFontFamily(root: HTMLElement, varName: string, family: string): void {
  const fam = family?.trim()
  if (!fam || fam === DEFAULT_FONT) {
    root.style.setProperty(varName, "var(--font-sans)")
    return
  }
  loadGoogleFont(fam)
  root.style.setProperty(varName, `"${fam}", var(--font-sans)`)
}

/** A user-typed role name → a valid CSS class fragment (a–z, 0–9, dashes). */
export function sanitizeRoleName(raw: string): string {
  return raw.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
}

/** The effective role name for a step: a custom name (if set) wins, else the
 *  built-in TYPE_ROLES role, else "" (an unnamed raw primitive). */
export function resolveRoleName(step: number, cfg: FluidConfig): string {
  const custom = (cfg.type.roleNames[step] ?? "").trim()
  if (custom) return custom
  return TYPE_ROLES.find((r) => r.step === step)?.role ?? ""
}

/** Live-inject `.text-<name>` utilities for the custom role names, so a name
 *  typed on /typography works immediately (mirrors the font-loading pattern).
 *  Built-in role utilities already ship statically in index.css. */
function applyRoleUtilities(cfg: FluidConfig): void {
  if (typeof document === "undefined") return
  const id = "fluid-role-utilities"
  let el = document.getElementById(id) as HTMLStyleElement | null
  if (!el) {
    el = document.createElement("style")
    el.id = id
    document.head.appendChild(el)
  }
  const rules: string[] = []
  for (const [step, raw] of Object.entries(cfg.type.roleNames)) {
    if (cfg.type.disabledSteps.includes(Number(step))) continue
    const name = sanitizeRoleName(raw)
    if (name) rules.push(`.text-${name} { font-size: var(--type-step-${step}); }`)
  }
  el.textContent = rules.join("\n")
}

/** Write the primitive tokens + type meta to the document root. */
export function applyFluid(cfg: FluidConfig): void {
  const root = document.documentElement

  for (const s of computeTypeScale(cfg)) {
    root.style.setProperty(`--type-step-${s.step}`, s.css)
  }

  const space = computeSpaceScale(cfg)
  for (const t of [...space.singles, ...space.pairs, ...space.customPairs]) {
    root.style.setProperty(`--space-${t.key}`, t.css)
  }

  root.style.setProperty("--type-weight-heading", String(cfg.type.weightHeading))
  root.style.setProperty("--type-weight-body", String(cfg.type.weightBody))
  root.style.setProperty("--type-lh-heading", String(cfg.type.lhHeading))
  root.style.setProperty("--type-lh-body", String(cfg.type.lhBody))
  root.style.setProperty("--type-ls-heading", `${cfg.type.lsHeading}em`)
  root.style.setProperty("--type-ls-body", `${cfg.type.lsBody}em`)

  applyFontFamily(root, "--font-heading", cfg.type.fontHeading)
  applyFontFamily(root, "--font-body", cfg.type.fontBody)

  applyRoleUtilities(cfg)
}

/** Deep-merge a persisted (possibly partial) config over the defaults. */
function mergeConfig(partial: Partial<FluidConfig> | null | undefined): FluidConfig {
  if (!partial) return structuredClone(FLUID_DEFAULTS)
  return {
    viewport: { ...FLUID_DEFAULTS.viewport, ...partial.viewport },
    base: { ...FLUID_DEFAULTS.base, ...partial.base },
    ratio: { ...FLUID_DEFAULTS.ratio, ...partial.ratio },
    type: { ...FLUID_DEFAULTS.type, ...partial.type },
    space: {
      multipliers: { ...FLUID_DEFAULTS.space.multipliers, ...partial.space?.multipliers },
      down: partial.space?.down ?? FLUID_DEFAULTS.space.down,
      up: partial.space?.up ?? FLUID_DEFAULTS.space.up,
      customPairs: partial.space?.customPairs ?? FLUID_DEFAULTS.space.customPairs,
    },
  }
}

export function saveFluid(cfg: FluidConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg))
  applyFluid(cfg)
}

export function loadFluid(): FluidConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return mergeConfig(JSON.parse(raw) as Partial<FluidConfig>)
  } catch {
    // Ignore corrupt or unavailable localStorage; fall back to defaults.
  }
  return structuredClone(FLUID_DEFAULTS)
}

export function initFluidSystem(): void {
  applyFluid(loadFluid())
}

/**
 * Emit a paste-ready CSS block baking the current config's primitives (the
 * tunable layer) plus the static semantic aliases + type utilities, so a sketch
 * can freeze settled values into `src/index.css`.
 */
export function exportFluidCss(cfg: FluidConfig): string {
  const type = computeTypeScale(cfg)
  const space = computeSpaceScale(cfg)
  const { type: t } = cfg
  // Disabled steps are excluded from the baked output entirely.
  const disabled = new Set(t.disabledSteps)

  const primitives = [
    "  /* ── Fluid type primitives (steps) ── */",
    ...type.filter((s) => !disabled.has(s.step)).map((s) => `  --type-step-${s.step}: ${s.css};`),
    "",
    "  /* ── Fluid space primitives ── */",
    ...space.singles.map((s) => `  --space-${s.key}: ${s.css};`),
    ...space.pairs.map((s) => `  --space-${s.key}: ${s.css};`),
    ...space.customPairs.map((s) => `  --space-${s.key}: ${s.css};`),
    "",
    "  /* ── Type meta (non-fluid) ── */",
    `  --type-weight-heading: ${t.weightHeading};`,
    `  --type-weight-body: ${t.weightBody};`,
    `  --type-lh-heading: ${t.lhHeading};`,
    `  --type-lh-body: ${t.lhBody};`,
    `  --type-ls-heading: ${t.lsHeading}em;`,
    `  --type-ls-body: ${t.lsBody}em;`,
  ].join("\n")

  // Non-default fonts: a self-contained @import + the family vars.
  const fontImports: string[] = []
  const fontVars: string[] = []
  for (const [family, varName] of [[t.fontHeading, "--font-heading"], [t.fontBody, "--font-body"]] as const) {
    const fam = family?.trim()
    if (!fam || fam === DEFAULT_FONT) continue
    fontImports.push(`@import url("https://fonts.googleapis.com/css?family=${fam.replace(/\s+/g, "+")}:100,200,300,400,500,600,700,800,900&display=swap");`)
    fontVars.push(`  ${varName}: "${fam}", var(--font-sans);`)
  }

  const spaceKeys = activeSpaceKeys(cfg.space)
  const aliases = SPACE_ROLE_NAMES
    .flatMap((role) => spaceKeys.map((k) => `  --spacing-${role}-${k}: var(--space-${k});`))
    .join("\n")

  // Only emit role utilities whose step is actually in the active scale — a role
  // whose step was removed (positive/negative steps shrunk) would otherwise bake a
  // utility pointing at an undefined primitive.
  const minStep = -cfg.type.negativeSteps
  const maxStep = cfg.type.positiveSteps
  const roleUtils = TYPE_ROLES.filter(
    (r) => r.step >= minStep && r.step <= maxStep && !disabled.has(r.step)
  ).flatMap((r) => {
    const lines = [`  .text-${r.role} { font-size: var(--type-step-${r.step}); }`]
    if (r.legacy) lines.push(`  .text-${r.legacy} { font-size: var(--type-step-${r.step}); }`)
    return lines
  })
  // Custom role names typed on /typography, for active + enabled steps only.
  const customUtils = Object.entries(cfg.type.roleNames).flatMap(([step, raw]) => {
    const n = Number(step)
    const name = sanitizeRoleName(raw)
    if (!name || n < minStep || n > maxStep || disabled.has(n)) return []
    return [`  .text-${name} { font-size: var(--type-step-${step}); }`]
  })
  const typeUtils = [...roleUtils, ...customUtils].join("\n")

  return [
    ...(fontImports.length ? [...fontImports, ""] : []),
    ":root {",
    fontVars.length ? [primitives, "", "  /* ── Type fonts ── */", ...fontVars].join("\n") : primitives,
    "}",
    "",
    "@theme inline {",
    aliases,
    "}",
    "",
    "@layer utilities {",
    typeUtils,
    "}",
    "",
  ].join("\n")
}

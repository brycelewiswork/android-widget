import { useEffect, useMemo, useRef, useState } from "react"
import { useDialKit, DialStore } from "@/components/dialkit"
import { IconX } from "@tabler/icons-react"
import { LiquidGlass } from "@/components/ui/liquid-glass"
import {
  GLASS_DEFAULTS,
  GLASS_MODES,
  type GlassMode,
  type GlassTone,
  type GlassMaterial,
  type GlassModeDefaults,
} from "@/components/ui/glass-modes"
import { PageShell, PageHeader, SectionHeader } from "@/components/PageLayout"
import { cn } from "@/lib/utils"

// Fills are stored as 8-digit hex (#rrggbbaa). The dial edits color + alpha
// separately, so split/recombine here. alpha 0 → "" (the "no layer" sentinel).
function splitHex8(hex8: string): { color: string; alpha: number } {
  const h = (hex8 || "").replace("#", "")
  if (h.length === 8) return { color: `#${h.slice(0, 6)}`, alpha: parseInt(h.slice(6, 8), 16) / 255 }
  if (h.length === 6) return { color: `#${h}`, alpha: 1 }
  return { color: "#000000", alpha: 0 }
}
function combineHex8(color: string, alpha: number): string {
  if (alpha <= 0.001) return ""
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
    .toString(16)
    .padStart(2, "0")
  const c = color.replace("#", "").slice(0, 6).padEnd(6, "0")
  return `#${c}${a}`
}

// ---------------------------------------------------------------------------
// Liquid Glass playground — Apple's four glass modes (small / medium / large /
// clear), each tunable in light AND dark = 8 presets.
//
// Rather than repeat the same seven controls eight times, the dial shows ONE
// control set plus an "Editing" dropdown that selects which of the 8 presets is
// being tuned. The full preset table lives in React state; switching the
// dropdown swaps that preset's values into the controls, and edits commit
// straight back. Everything persists to localStorage and survives reloads.
// ---------------------------------------------------------------------------

const PANEL_NAME = "Liquid Glass"
const STORAGE_KEY = "liquid-glass-modes-v1"
const TONES: GlassTone[] = ["light", "dark"]

type TargetKey = `${GlassMode}:${GlassTone}`

const SELECT_OPTIONS = GLASS_MODES.flatMap((mode) =>
  TONES.map((tone) => ({
    value: `${mode}:${tone}` as TargetKey,
    label: `${mode[0].toUpperCase()}${mode.slice(1)} · ${tone[0].toUpperCase()}${tone.slice(1)}`,
  })),
)

const round = (n: number, p = 2) => {
  const f = 10 ** p
  return Math.round(n * f) / f
}

/** Merge baked defaults with any persisted tuning (tolerant of partial/old data). */
function loadModes(): GlassModeDefaults {
  let stored: Partial<GlassModeDefaults> = {}
  try {
    stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}")
  } catch {
    stored = {}
  }
  const out = {} as GlassModeDefaults
  for (const mode of GLASS_MODES) {
    const merge = (tone: GlassTone): GlassMaterial => {
      const base = GLASS_DEFAULTS[mode][tone]
      const m = { ...base, ...(stored?.[mode]?.[tone] ?? {}) } as GlassMaterial
      // Backfill numeric fields added after a preset was first persisted —
      // older saves serialize a missing value as `null`, which must not stick.
      if (!Number.isFinite(m.thickness)) m.thickness = base.thickness
      if (!Number.isFinite(m.frost)) m.frost = base.frost
      if (!Number.isFinite(m.depth)) m.depth = base.depth
      if (!Number.isFinite(m.specularAngle)) m.specularAngle = base.specularAngle
      if (!Number.isFinite(m.specularGlow)) m.specularGlow = base.specularGlow
      if (!Number.isFinite(m.specularBacklight)) m.specularBacklight = base.specularBacklight
      if (!Number.isFinite(m.shadowOffsetX)) m.shadowOffsetX = base.shadowOffsetX
      if (!Number.isFinite(m.shadowOffsetY)) m.shadowOffsetY = base.shadowOffsetY
      if (!Number.isFinite(m.shadowBlur)) m.shadowBlur = base.shadowBlur
      if (!Number.isFinite(m.shadowSpread)) m.shadowSpread = base.shadowSpread
      if (!Number.isFinite(m.cornerSmoothing)) m.cornerSmoothing = base.cornerSmoothing
      return m
    }
    out[mode] = { light: merge("light"), dark: merge("dark") }
  }
  return out
}

function roundMaterial(m: GlassMaterial): GlassMaterial {
  return {
    strength: round(m.strength, 0),
    blur: round(m.blur, 1),
    frost: round(m.frost, 2),
    bevel: round(m.bevel, 2),
    thickness: round(m.thickness, 0),
    depth: round(m.depth, 2),
    fills: {
      base: m.fills.base,
      highlight: m.fills.highlight,
      glass: m.fills.glass,
      shadow: m.fills.shadow,
    },
    lightStrength: round(m.lightStrength, 2),
    edgeWidth: round(m.edgeWidth, 1),
    specularAngle: round(m.specularAngle, 0),
    specularGlow: round(m.specularGlow, 1),
    specularBacklight: round(m.specularBacklight, 2),
    shadowOffsetX: round(m.shadowOffsetX, 0),
    shadowOffsetY: round(m.shadowOffsetY, 0),
    shadowBlur: round(m.shadowBlur, 0),
    shadowSpread: round(m.shadowSpread, 0),
    cornerSmoothing: round(m.cornerSmoothing, 2),
  }
}

/** Stable identity for comparing two materials (rounded, key-order fixed). */
function materialKey(m: GlassMaterial): string {
  const r = roundMaterial(m)
  return JSON.stringify([
    r.strength,
    r.blur,
    r.frost,
    r.bevel,
    r.thickness,
    r.depth,
    r.fills.base,
    r.fills.highlight,
    r.fills.glass,
    r.fills.shadow,
    r.lightStrength,
    r.edgeWidth,
    r.specularAngle,
    r.specularGlow,
    r.specularBacklight,
    r.shadowOffsetX,
    r.shadowOffsetY,
    r.shadowBlur,
    r.shadowSpread,
    r.cornerSmoothing,
  ])
}

function snapshot(modes: GlassModeDefaults): GlassModeDefaults {
  const out = {} as GlassModeDefaults
  for (const mode of GLASS_MODES) {
    out[mode] = { light: roundMaterial(modes[mode].light), dark: roundMaterial(modes[mode].dark) }
  }
  return out
}

// ── Previews ───────────────────────────────────────────────────────────────

const IMG_BRAT = "/images/album-art/12_charli-xcx_brat.jpg"
const IMG_MOTOMAMI = "/images/album-art/17_rosalia_motomami.jpg"
const IMG_NFR = "/images/album-art/06_lana-del-rey_norman-fucking-rockwell.jpg"
const IMG_CTRL = "/images/album-art/08_sza_ctrl.jpg"

type Backdrop = {
  key: string
  label: string
  theme: GlassTone
  surface?: "bg-surface" | "bg-surface-secondary" | "bg-surface-tertiary"
  image?: string
}

// Every glass type is shown over this same set of backdrops — including BOTH
// light and dark glass over photos (album art).
const BACKDROPS: Backdrop[] = [
  { key: "l-1", label: "Light · surface", theme: "light", surface: "bg-surface" },
  { key: "l-2", label: "Light · secondary", theme: "light", surface: "bg-surface-secondary" },
  { key: "l-3", label: "Light · tertiary", theme: "light", surface: "bg-surface-tertiary" },
  { key: "d-1", label: "Dark · surface", theme: "dark", surface: "bg-surface" },
  { key: "d-2", label: "Dark · secondary", theme: "dark", surface: "bg-surface-secondary" },
  { key: "d-3", label: "Dark · tertiary", theme: "dark", surface: "bg-surface-tertiary" },
  { key: "img-l1", label: "Light · over photo", theme: "light", image: IMG_BRAT },
  { key: "img-l2", label: "Light · over photo", theme: "light", image: IMG_CTRL },
  { key: "img-d1", label: "Dark · over photo", theme: "dark", image: IMG_MOTOMAMI },
  { key: "img-d2", label: "Dark · over photo", theme: "dark", image: IMG_NFR },
]

const MODE_BLURB: Record<GlassMode, string> = {
  small: "Thin, crisp chrome — buttons, chips, segmented controls.",
  medium: "Standard panels — cards, popovers, toolbars.",
  large: "Heavy, immersive surfaces — sheets, windows, dialogs.",
  clear: "Near-transparent, refraction-forward — controls over media.",
}

// One sample over a single backdrop: a large square panel and a button below
// it, same width, both rendered in the section's glass type so you can compare
// how the material reads at a large element size vs a small one.
function ExampleTile({
  mode,
  backdrop,
  material,
  accent,
  opacity,
}: {
  mode: GlassMode
  backdrop: Backdrop
  material: GlassMaterial
  accent?: string
  opacity?: boolean
}) {
  const isImage = !!backdrop.image
  const tone: GlassTone = backdrop.theme
  const text = tone === "dark" ? "text-white" : "text-neutral-900"
  const subText = tone === "dark" ? "text-white/55" : "text-neutral-500"
  const labelText = tone === "dark" ? "text-white/70" : "text-neutral-500"
  // accent (color-tint) is Apple-gated to small; opacity applies to all.
  const glassProps = { accent: mode === "small" ? accent : undefined, opacity }
  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-2xl p-inset-l pb-inset-l",
        !isImage && backdrop.theme,
        !isImage && backdrop.surface,
        !isImage && "inset-ring-1 inset-ring-stroke-faint",
      )}
      style={
        isImage
          ? {
              backgroundColor: "#1f2937",
              backgroundImage: `url(${backdrop.image})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : undefined
      }
    >
      <div className="flex w-full max-w-[260px] flex-col gap-stack-s">
        {/* Spherical icon button — anchored right, button-height. */}
        <div className="flex justify-end">
          <LiquidGlass
            mode={mode}
            tone={tone}
            material={material}
            radius={24}
            {...glassProps}
            className={cn("flex size-12 items-center justify-center", text)}
          >
            <IconX size={18} />
          </LiquidGlass>
        </div>

        {/* Large square — a window / panel. */}
        <LiquidGlass
          mode={mode}
          tone={tone}
          material={material}
          radius={28}
          {...glassProps}
          className={cn(
            "flex aspect-square w-full flex-col items-center justify-center gap-stack-3xs",
            text,
          )}
        >
          <span className="text-base font-semibold">Liquid Glass</span>
          <span className={cn("text-xs capitalize", subText)}>{mode}</span>
        </LiquidGlass>

        {/* Button — a small control. */}
        <LiquidGlass
          mode={mode}
          tone={tone}
          material={material}
          radius={24}
          {...glassProps}
          className={cn(
            "flex h-12 w-full items-center justify-center text-sm font-semibold capitalize",
            text,
          )}
        >
          {mode}
        </LiquidGlass>
      </div>

      <span
        className={cn(
          "pointer-events-none absolute bottom-2 left-3 font-mono text-[10px] tracking-wide",
          labelText,
        )}
      >
        {backdrop.label}
      </span>
    </div>
  )
}

// A major section per glass type, with one sample over each backdrop.
function ModeSection({
  mode,
  modes,
  accent,
  opacity,
}: {
  mode: GlassMode
  modes: GlassModeDefaults
  accent?: string
  opacity?: boolean
}) {
  // Group all light backdrops, then all dark, each in its own complete grid.
  const groups: GlassTone[] = ["light", "dark"]
  return (
    <section className="space-y-stack-s">
      <SectionHeader
        title={mode[0].toUpperCase() + mode.slice(1)}
        description={MODE_BLURB[mode]}
      />
      {groups.map((tone) => (
        <div key={tone} className="grid gap-gutter-s sm:grid-cols-2">
          {BACKDROPS.filter((b) => b.theme === tone).map((b) => (
            <ExampleTile
              key={b.key}
              mode={mode}
              backdrop={b}
              material={modes[mode][tone]}
              accent={accent}
              opacity={opacity}
            />
          ))}
        </div>
      ))}
    </section>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────--

type DialValues = {
  editing: TargetKey
  tinted: boolean
  accent: string
  opacity: boolean
  fill: {
    baseColor: string
    baseAlpha: number
    highlightColor: string
    highlightAlpha: number
    glassColor: string
    glassAlpha: number
  }
  refraction: {
    strength: number
    blur: number
    frost: number
    bevel: number
    thickness: number
    depth: number
    cornerSmoothing: number
  }
  edgeLight: {
    lightStrength: number
    edgeWidth: number
    specularAngle: number
    specularGlow: number
    specularBacklight: number
  }
  elevation: {
    shadowColor: string
    shadowAlpha: number
    shadowOffsetX: number
    shadowOffsetY: number
    shadowBlur: number
    shadowSpread: number
  }
}

export function LiquidGlassPage() {
  // The full 8-preset table — source of truth for previews + persistence.
  const [modes, setModes] = useState<GlassModeDefaults>(loadModes)
  const seed = useRef(modes).current // initial values seed the dial defaults

  // Static dial config: a target dropdown + one shared control group, organised
  // into collapsible (open-by-default) sections.
  const dialConfig = useMemo(() => {
    const first = seed.small.light
    const fb = splitHex8(first.fills.base)
    const fh = splitHex8(first.fills.highlight)
    const fg = splitHex8(first.fills.glass)
    return {
      editing: { type: "select", options: SELECT_OPTIONS, default: "small:light" },
      tinted: false,
      accent: { type: "color", default: "#0091ff" },
      opacity: false,
      fill: {
        baseColor: { type: "color", default: fb.color },
        baseAlpha: [fb.alpha, 0, 1, 0.01],
        highlightColor: { type: "color", default: fh.color },
        highlightAlpha: [fh.alpha, 0, 1, 0.01],
        glassColor: { type: "color", default: fg.color },
        glassAlpha: [fg.alpha, 0, 1, 0.01],
      },
      refraction: {
        strength: [first.strength, 0, 150],
        blur: [first.blur, 0, 40],
        frost: [first.frost, 0, 1, 0.05],
        bevel: [first.bevel, 0.1, 1, 0.05],
        thickness: [first.thickness, 0, 200, 5],
        depth: [first.depth, 0, 0.5, 0.01],
        cornerSmoothing: [first.cornerSmoothing, 0, 1, 0.05],
      },
      edgeLight: {
        lightStrength: [first.lightStrength, 0, 1, 0.02],
        edgeWidth: [first.edgeWidth, 0.5, 24, 0.5],
        specularAngle: [first.specularAngle, 0, 360, 5],
        specularGlow: [first.specularGlow, 0, 30, 0.5],
        specularBacklight: [first.specularBacklight, 0, 1, 0.05],
      },
      elevation: {
        shadowColor: { type: "color", default: splitHex8(first.fills.shadow).color },
        shadowAlpha: [splitHex8(first.fills.shadow).alpha, 0, 1, 0.01],
        shadowOffsetX: [first.shadowOffsetX, -40, 40, 1],
        shadowOffsetY: [first.shadowOffsetY, -40, 40, 1],
        shadowBlur: [first.shadowBlur, 0, 100, 1],
        shadowSpread: [first.shadowSpread, -40, 40, 1],
      },
      reset: { type: "action", label: "Reset all to defaults" },
    }
  }, [seed])

  const cfg = useDialKit(PANEL_NAME, dialConfig as never, {
    onAction: (action) => {
      if (action === "reset") {
        try {
          localStorage.removeItem(STORAGE_KEY)
        } catch {
          /* ignore */
        }
        location.reload()
      }
    },
  }) as unknown as DialValues

  const [editMode, editTone] = cfg.editing.split(":") as [GlassMode, GlassTone]
  const prevEditing = useRef<TargetKey>(cfg.editing)
  const switching = cfg.editing !== prevEditing.current

  // Live material currently held by the shared controls.
  const live: GlassMaterial = {
    strength: cfg.refraction.strength,
    blur: cfg.refraction.blur,
    frost: cfg.refraction.frost,
    bevel: cfg.refraction.bevel,
    thickness: cfg.refraction.thickness,
    depth: cfg.refraction.depth,
    cornerSmoothing: cfg.refraction.cornerSmoothing,
    fills: {
      base: combineHex8(cfg.fill.baseColor, cfg.fill.baseAlpha),
      highlight: combineHex8(cfg.fill.highlightColor, cfg.fill.highlightAlpha),
      glass: combineHex8(cfg.fill.glassColor, cfg.fill.glassAlpha),
      shadow: combineHex8(cfg.elevation.shadowColor, cfg.elevation.shadowAlpha),
    },
    lightStrength: cfg.edgeLight.lightStrength,
    edgeWidth: cfg.edgeLight.edgeWidth,
    specularAngle: cfg.edgeLight.specularAngle,
    specularGlow: cfg.edgeLight.specularGlow,
    specularBacklight: cfg.edgeLight.specularBacklight,
    shadowOffsetX: cfg.elevation.shadowOffsetX,
    shadowOffsetY: cfg.elevation.shadowOffsetY,
    shadowBlur: cfg.elevation.shadowBlur,
    shadowSpread: cfg.elevation.shadowSpread,
  }

  const findPanelId = () => DialStore.getPanels().find((p) => p.name === PANEL_NAME)?.id

  // On target switch → load that preset into the controls. Otherwise → commit
  // the live control values back into the selected preset.
  useEffect(() => {
    const panelId = findPanelId()
    if (!panelId) return

    if (cfg.editing !== prevEditing.current) {
      const m = modes[editMode][editTone]
      const fb = splitHex8(m.fills.base)
      const fh = splitHex8(m.fills.highlight)
      const fg = splitHex8(m.fills.glass)
      const fs = splitHex8(m.fills.shadow)
      DialStore.updateValue(panelId, "refraction.strength", m.strength)
      DialStore.updateValue(panelId, "refraction.blur", m.blur)
      DialStore.updateValue(panelId, "refraction.frost", m.frost)
      DialStore.updateValue(panelId, "refraction.bevel", m.bevel)
      DialStore.updateValue(panelId, "refraction.thickness", m.thickness)
      DialStore.updateValue(panelId, "refraction.depth", m.depth)
      DialStore.updateValue(panelId, "refraction.cornerSmoothing", m.cornerSmoothing)
      DialStore.updateValue(panelId, "fill.baseColor", fb.color)
      DialStore.updateValue(panelId, "fill.baseAlpha", fb.alpha)
      DialStore.updateValue(panelId, "fill.highlightColor", fh.color)
      DialStore.updateValue(panelId, "fill.highlightAlpha", fh.alpha)
      DialStore.updateValue(panelId, "fill.glassColor", fg.color)
      DialStore.updateValue(panelId, "fill.glassAlpha", fg.alpha)
      DialStore.updateValue(panelId, "edgeLight.lightStrength", m.lightStrength)
      DialStore.updateValue(panelId, "edgeLight.edgeWidth", m.edgeWidth)
      DialStore.updateValue(panelId, "edgeLight.specularAngle", m.specularAngle)
      DialStore.updateValue(panelId, "edgeLight.specularGlow", m.specularGlow)
      DialStore.updateValue(panelId, "edgeLight.specularBacklight", m.specularBacklight)
      DialStore.updateValue(panelId, "elevation.shadowColor", fs.color)
      DialStore.updateValue(panelId, "elevation.shadowAlpha", fs.alpha)
      DialStore.updateValue(panelId, "elevation.shadowOffsetX", m.shadowOffsetX)
      DialStore.updateValue(panelId, "elevation.shadowOffsetY", m.shadowOffsetY)
      DialStore.updateValue(panelId, "elevation.shadowBlur", m.shadowBlur)
      DialStore.updateValue(panelId, "elevation.shadowSpread", m.shadowSpread)
      prevEditing.current = cfg.editing
      return
    }

    const committed = modes[editMode][editTone]
    if (materialKey(committed) !== materialKey(live)) {
      setModes((prev) => ({
        ...prev,
        [editMode]: { ...prev[editMode], [editTone]: live },
      }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg])

  // Effective table for previews: the edited cell shows live values (unless a
  // switch is mid-flight, in which case the committed value is correct).
  const effectiveModes: GlassModeDefaults = useMemo(() => {
    const out = {} as GlassModeDefaults
    for (const mode of GLASS_MODES) {
      out[mode] = { light: modes[mode].light, dark: modes[mode].dark }
    }
    if (!switching) {
      out[editMode] = { ...out[editMode], [editTone]: live }
    }
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modes, cfg, switching])

  // Persist the committed table.
  const settings = JSON.stringify(snapshot(modes), null, 2)
  const lastWrite = useRef("")
  useEffect(() => {
    if (settings !== lastWrite.current) {
      lastWrite.current = settings
      try {
        localStorage.setItem(STORAGE_KEY, settings)
      } catch {
        /* ignore */
      }
    }
  }, [settings])

  return (
    <PageShell>
      <PageHeader
        title="Liquid Glass — Modes"
        description={
          "Apple's four glass modes (small, medium, large, clear), each tuned for light and dark — eight presets in all. Each type has its own section below, shown over every light/dark surface and over photos. Pick a preset from the Editing dropdown in the floating dial (bottom-right) to tune it; changes persist across reloads. Apply a mode anywhere with the LiquidGlass component's mode prop or the useLiquidGlassMode hook."
        }
      />

      {GLASS_MODES.map((mode) => (
        <ModeSection
          key={mode}
          mode={mode}
          modes={effectiveModes}
          accent={cfg.tinted ? cfg.accent : undefined}
          opacity={cfg.opacity}
        />
      ))}

      <section className="space-y-stack-s">
        <SectionHeader
          title="Current settings"
          description="Live, persisted values for all 8 presets. Paste into GLASS_DEFAULTS in src/components/ui/glass-modes.ts to lock in the global defaults."
        />
        <pre className="overflow-x-auto rounded-xl bg-surface-secondary p-inset-s font-mono text-xs text-label inset-ring-1 inset-ring-stroke-faint">
          {settings}
        </pre>
      </section>
    </PageShell>
  )
}

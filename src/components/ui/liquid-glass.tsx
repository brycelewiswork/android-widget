import * as React from "react"
import { useId, useMemo } from "react"
import useMeasure from "react-use-measure"
import { parse } from "culori"
import { getSvgPath } from "figma-squircle"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import {
  GLASS_DEFAULTS,
  SYSTEM_SHADOWS,
  type GlassMode,
  type GlassTone,
  type GlassMaterial,
  type GlassFills,
  type GlassShadow,
} from "./glass-modes"

/** Apply an alpha to any CSS color string, returning an `rgba()` string. */
export function withAlpha(color: string, alpha: number): string {
  const c = parse(color)
  if (!c || c.mode !== "rgb") return color
  const to255 = (v: number | undefined) => Math.round((v ?? 0) * 255)
  return `rgba(${to255(c.r)}, ${to255(c.g)}, ${to255(c.b)}, ${alpha})`
}

// Hand-rolled liquid-glass effect (zero-dep), per kube.io/blog/liquid-glass-css-svg.
//
// The trick: an SVG <feDisplacementMap> warps whatever is *behind* the element
// (its backdrop) using a displacement map we generate on a canvas. The map is an
// RGBA image where each pixel encodes a 2D offset vector:
//   r = 128 + x*127   (red   channel → horizontal displacement)
//   g = 128 + y*127   (green channel → vertical   displacement)
//   b = 128, a = 255  (unused / opaque)
// 128 is "no displacement"; 0..255 maps to roughly -128..+127px once scaled.
//
// We push pixels outward near the edges and leave the center untouched, which
// reads as light refracting through a thick glass bevel. Combined with a blur,
// a faint tint, and an inset highlight, it looks like Apple's Liquid Glass.
//
// SVG filters in `backdrop-filter` are Chrome/Chromium-only today. On browsers
// that don't support it we fall back to a plain frosted blur (still legible,
// just without the edge refraction).

type LiquidGlassOptions = {
  /** Peak edge displacement in px — how hard the bevel bends the backdrop. */
  strength?: number
  /** Frosted blur applied to the backdrop, in px. */
  blur?: number
  /** Frost (0–1) — the "frosted glass" amount (Figma's Frost). Adds extra
   * backdrop blur AND a white milky veil together, so the glass goes from clear
   * to opaque-frosted. Independent of `fills` and the raw `blur`. */
  frost?: number
  /** Fraction of the half-extent over which the bevel ramps (0–1). */
  bevel?: number
  /**
   * Glass thickness in px (kube `glassThickness`). The refracted ray travels
   * through this much glass before landing, so it controls where the bend
   * concentrates: HIGH = a sharp lens right at the rim (thick slab), LOW =
   * a broader, softer band spread across the whole bevel (thin sheet).
   */
  thickness?: number
  /**
   * Depth (Figma's "Depth"): a directional INNER shadow that fakes the glass's
   * 3D thickness — a soft dark on the light-facing inner wall (the darkened
   * top-left region on Apple's buttons) plus a faint highlight on the opposite
   * one. 0 = flat, ~0.15 = a believable slab. A separate shading effect, NOT a
   * byproduct of refraction (bending a flat backdrop never darkens it).
   */
  depth?: number
  /**
   * Stacked fill layers (Apple/Glass model). When provided, rendered as
   * `base → highlight(overlay) → [accent×2] → [opacity] → glass`. Falls back to
   * the single `tint` background when omitted (legacy/raw usage).
   */
  fills?: GlassFills
  /** Accent color (hex) → the two color-tint layers (25% + 80%). Apple: small only. */
  accent?: string
  /** Add the white-50% "make it more opaque" overlay layer (accessibility). */
  opacity?: boolean
  /** Single glass tint — used only when `fills` is omitted (rgba/oklch/hex). */
  tint?: string
  /** Corner radius in px for both the element and the displacement falloff. */
  radius?: number
  /** Master edge-lighting opacity (0 = no edge light, ~0.45 = default). */
  lightStrength?: number
  /** Rim width in px — fixed, independent of element size. */
  edgeWidth?: number
  /** Direction the rim highlight is aimed, degrees clockwise from top. */
  specularAngle?: number
  /** Soft inner-glow radius in px (the all-around edge glow). */
  specularGlow?: number
  /** Strength (0–1) of the fainter highlight on the edge OPPOSITE the light. */
  specularBacklight?: number
  /** Drop-shadow horizontal offset in px. */
  shadowOffsetX?: number
  /** Drop-shadow vertical offset in px (down = positive). */
  shadowOffsetY?: number
  /** Drop-shadow blur radius in px. */
  shadowBlur?: number
  /** Drop-shadow spread in px (grow/shrink the shadow shape). */
  shadowSpread?: number
  /** Glass tone — only affects theme-aware shading (e.g. Depth pushes more
   * blackness into the inner shadow on dark glass). Defaults to "light". */
  tone?: GlassTone
  /**
   * Corner profile: 0 = circular `border-radius` (default), up to ~1 = a hard
   * Apple squircle (≈0.6 is the iOS look). When > 0 the element is clipped to a
   * superellipse (`clip-path`) and the refraction/rim trace the same shape —
   * BUT clip-path eats `box-shadow`, so the hook drops the element's shadow and
   * returns it as `shadow` for you to put on an UNCLIPPED wrapper.
   */
  cornerSmoothing?: number
  /** Elevation drop shadow — keys into the system `--shadow-*` scale. */
  shadow?: GlassShadow
}

type LiquidGlassProps = LiquidGlassOptions & {
  /**
   * Apple-style glass mode — resolves the material (strength/blur/bevel/tint)
   * from GLASS_DEFAULTS for the current theme. Explicit option props still win
   * when passed. Omit to use raw option props directly.
   */
  mode?: GlassMode
  /** Force a tone instead of following the resolved theme (used by the playground). */
  tone?: GlassTone
  /** Live material override — bypasses GLASS_DEFAULTS (used by the playground dial). */
  material?: GlassMaterial
  /**
   * Render as a different element so the glass can BE the surface (a `header`,
   * `nav`, `aside`, `button`, …) with its content as children — the iOS/macOS
   * "glass material on a view" pattern. Defaults to `div`. To use glass as a
   * standalone absolute background layer instead, give it `className="absolute
   * inset-0"` and put your content in a sibling with `position` + a z-index ≥ 0.
   */
  as?: React.ElementType
  className?: string
  style?: React.CSSProperties
  children?: React.ReactNode
}

const isChromium =
  typeof navigator !== "undefined" &&
  /chrome|chromium|edg/i.test(navigator.userAgent) &&
  !/firefox/i.test(navigator.userAgent)

/**
 * Build the RGBA displacement map that drives the refraction — the kube.io
 * method (real optics), not a flat shift.
 *
 * The glass has a curved edge described by a height field f(x) (the "convex
 * squircle" `y = ⁴√(1-(1-x)⁴)`): flat in the interior, curving steeply down at
 * the rim. For each pixel in the bevel band we take the surface normal (the
 * gradient of f) and refract a straight-down view ray through it with Snell's
 * law (air n=1 → glass n=1.5). The horizontal landing offset of the refracted
 * ray IS the displacement — large and sharp at the rim, zero in the flat
 * centre. That curved profile is what reads as a real lens; the displacement
 * magnitude is then scaled by `strength` (the feDisplacementMap `scale`).
 */
const REFRACT_ETA = 1 / 1.5 // air → glass

// The shape is ONE source of truth: Figma/iOS corner smoothing (`figma-squircle`,
// the same engine behind our `<Squircle>`). It generalises every case — a plain
// rounded rect (smoothing 0), a true squircle (smoothing > 0), and, when the
// radius reaches the half-extent, a perfect circle/pill (the smoothing handles
// run out of edge and collapse to an arc) — with NO special-casing on our side.
function squircleSvgPath(w: number, h: number, radius: number, smoothing: number): string {
  const r = Math.max(0, Math.min(radius, w / 2, h / 2))
  return getSvgPath({
    width: w,
    height: h,
    cornerRadius: r,
    cornerSmoothing: Math.max(0, Math.min(1, smoothing)),
    preserveSmoothing: true,
  })
}

/**
 * A per-pixel signed-distance field for the squircle, driving BOTH maps so the
 * refraction and rim trace the exact same silhouette as the clip-path:
 *  - `dist[i]`  signed distance to the boundary, POSITIVE inside (px).
 *  - `nx,ny[i]` the outward unit normal (− gradient of the distance field).
 *
 * We rasterise the Figma path to a mask, run an O(pixels) distance transform
 * (dead-reckoning), then read normals off the field's gradient. Exact for any
 * corner profile, and fast enough to memoise per size/shape.
 */
// 3×3 box blur (edge-clamped) — smooths the distance field so the derived rim
// normals don't read blocky.
function boxBlur3(src: Float32Array, w: number, h: number): Float32Array {
  const out = new Float32Array(src.length)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let s = 0
      let c = 0
      for (let dy = -1; dy <= 1; dy++) {
        const yy = y + dy
        if (yy < 0 || yy >= h) continue
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx
          if (xx < 0 || xx >= w) continue
          s += src[yy * w + xx]
          c++
        }
      }
      out[y * w + x] = s / c
    }
  }
  return out
}

type ShapeField = { w: number; h: number; dist: Float32Array; nx: Float32Array; ny: Float32Array }

function buildShapeField(
  width: number,
  height: number,
  radius: number,
  smoothing: number,
): ShapeField | null {
  if (typeof document === "undefined" || width <= 0 || height <= 0) return null
  const w = Math.max(1, Math.round(width))
  const h = Math.max(1, Math.round(height))
  const canvas = document.createElement("canvas")
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext("2d")
  if (!ctx) return null
  ctx.fillStyle = "#fff"
  ctx.fill(new Path2D(squircleSvgPath(w, h, radius, smoothing)))
  const alpha = ctx.getImageData(0, 0, w, h).data
  const n = w * h
  const inside = new Uint8Array(n)
  for (let i = 0; i < n; i++) inside[i] = alpha[i * 4 + 3] > 127 ? 1 : 0

  // Dead-reckoning distance transform: each pixel propagates the nearest known
  // boundary point from its neighbours over a forward + backward sweep.
  const bxArr = new Int32Array(n).fill(-1)
  const byArr = new Int32Array(n).fill(-1)
  const dist = new Float32Array(n)
  dist.fill(1e9)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x
      const m = inside[i]
      // Off-canvas counts as OUTSIDE — the shape's straight edges sit on the
      // canvas border (the path fills the full w×h), so an inside pixel there is
      // a boundary pixel even though it has no neighbour beyond the edge.
      const left = x > 0 ? inside[i - 1] : 0
      const right = x < w - 1 ? inside[i + 1] : 0
      const up = y > 0 ? inside[i - w] : 0
      const down = y < h - 1 ? inside[i + w] : 0
      if (m && (left !== m || right !== m || up !== m || down !== m)) {
        dist[i] = 0
        bxArr[i] = x
        byArr[i] = y
      }
    }
  }
  const relax = (i: number, x: number, y: number, ni: number) => {
    const bxn = bxArr[ni]
    if (bxn < 0) return
    const byn = byArr[ni]
    const dx = x - bxn
    const dy = y - byn
    const nd = Math.sqrt(dx * dx + dy * dy)
    if (nd < dist[i]) {
      dist[i] = nd
      bxArr[i] = bxn
      byArr[i] = byn
    }
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x
      if (x > 0) relax(i, x, y, i - 1)
      if (y > 0) relax(i, x, y, i - w)
      if (x > 0 && y > 0) relax(i, x, y, i - w - 1)
      if (x < w - 1 && y > 0) relax(i, x, y, i - w + 1)
    }
  }
  for (let y = h - 1; y >= 0; y--) {
    for (let x = w - 1; x >= 0; x--) {
      const i = y * w + x
      if (x < w - 1) relax(i, x, y, i + 1)
      if (y < h - 1) relax(i, x, y, i + w)
      if (x < w - 1 && y < h - 1) relax(i, x, y, i + w + 1)
      if (x > 0 && y < h - 1) relax(i, x, y, i + w - 1)
    }
  }
  // Signed (positive inside), then smoothed — the discrete distance transform is
  // a touch blocky, which would make the rim lighting chunky. A box blur of the
  // (locally linear) field leaves the straight edges as-is and rounds the corners.
  const raw = new Float32Array(n)
  for (let i = 0; i < n; i++) raw[i] = inside[i] ? dist[i] : -dist[i]
  const signed = boxBlur3(boxBlur3(raw, w, h), w, h)
  const nx = new Float32Array(n)
  const ny = new Float32Array(n)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x
      const gl = x > 0 ? signed[i - 1] : signed[i]
      const gr = x < w - 1 ? signed[i + 1] : signed[i]
      const gt = y > 0 ? signed[i - w] : signed[i]
      const gb = y < h - 1 ? signed[i + w] : signed[i]
      // ∇signed points INWARD (distance grows toward the centre) → outward = −∇.
      const ox = -(gr - gl) * 0.5
      const oy = -(gb - gt) * 0.5
      const l = Math.hypot(ox, oy) || 1
      nx[i] = ox / l
      ny[i] = oy / l
    }
  }
  return { w, h, dist: signed, nx, ny }
}

function buildDisplacementMap(field: ShapeField | null, bevel: number, thickness: number): string {
  if (typeof document === "undefined" || !field) return ""
  const { w, h, dist, nx: fnx, ny: fny } = field
  const canvas = document.createElement("canvas")
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext("2d")
  if (!ctx) return ""

  const img = ctx.createImageData(w, h)
  const { data } = img
  const hx = w / 2
  const hy = h / 2
  // Bezel width in px: how far the curved refracting edge reaches inward.
  const bezel = Math.max(2, Math.min(hx, hy) * bevel)
  // Glass thickness in px (kube `glassThickness`): the refracted ray crosses
  // `surfaceHeight*bezel + glassThickness` of glass before landing.
  const glassThickness = Math.max(0, thickness)

  // Convex-squircle surface height: x = 0 at the edge, 1 at the flat interior.
  // Clamp x to [0,1] — sampling outside that range takes a fourth root of a
  // negative number (NaN), which would corrupt the rim pixels into a fixed shift.
  const surface = (x: number) => {
    const c = x < 0 ? 0 : x > 1 ? 1 : x
    return Math.pow(1 - Math.pow(1 - c, 4), 0.25)
  }

  // Precompute the 1D refraction profile across the bezel: tan(refraction angle)
  // per Snell's law, normalised to its own peak so `strength` sets the px shift.
  const STEPS = 256
  const profile = new Float32Array(STEPS + 1)
  let maxMag = 1e-6
  for (let i = 0; i <= STEPS; i++) {
    const t = i / STEPS // 0 at edge → 1 at flat interior
    const sh = surface(t) // surface height at this bezel position (0 edge → 1 in)
    const dd = 0.002
    const slope = (surface(t + dd) - surface(t - dd)) / (2 * dd)
    // Surface normal in the cross-section (horizontal = inward, vertical = up).
    const nl = Math.hypot(slope, 1)
    const nx = -slope / nl
    const ny = 1 / nl
    // Incident view ray straight down I = (0,-1) → cosθ = -dot(I,N) = ny.
    const cosi = ny
    const k = 1 - REFRACT_ETA * REFRACT_ETA * (1 - cosi * cosi)
    let mag = 0
    if (k >= 0) {
      const cost = Math.sqrt(k)
      const fac = REFRACT_ETA * cosi - cost
      const tx = fac * nx
      const tyv = -REFRACT_ETA + fac * ny // downward (negative)
      const tangent = tx / Math.abs(tyv) // tan of refracted angle (inward axis)
      // Landing offset = tan × distance the ray travels through the glass. The
      // thickness term is what gives the glass volume: with a thick slab the
      // bend concentrates hard at the rim; thin → a broad, soft band.
      mag = tangent * (sh * bezel + glassThickness)
    }
    profile[i] = mag
    if (Math.abs(mag) > maxMag) maxMag = Math.abs(mag)
  }
  const inv = 1 / maxMag
  for (let i = 0; i <= STEPS; i++) profile[i] *= inv

  for (let p = 0; p < w * h; p++) {
    const i = p * 4
    const distInside = dist[p] // signed, positive inside, from the shape field
    let ox = 0
    let oy = 0
    if (distInside >= 0 && distInside < bezel) {
      const mag = profile[Math.round((distInside / bezel) * STEPS)]
      // Refracted ray bends toward the interior → sample inward (−outward normal).
      ox = -fnx[p] * mag
      oy = -fny[p] * mag
    }
    data[i] = Math.max(0, Math.min(255, 128 + ox * 127))
    data[i + 1] = Math.max(0, Math.min(255, 128 + oy * 127))
    data[i + 2] = 128
    data[i + 3] = 255
  }

  ctx.putImageData(img, 0, 0)
  return canvas.toDataURL()
}

export type UseLiquidGlass = {
  /** Callback ref — attach to the glass element so it can be measured. */
  ref: (node: HTMLElement | SVGElement | null) => void
  /** Spread onto the glass element's `style` (backdrop-filter, tint, elevation, isolation). */
  style: React.CSSProperties
  /**
   * All decoration layers (fill stack + rim specular + the displacement
   * `<filter>`). Render these as direct children of the glass element, before
   * your content — they sit at z-index:-1 so content always paints above them.
   */
  svg: React.ReactNode
  /** True when the SVG refraction path is active (Chromium + measured). */
  ready: boolean
  /** The drop-shadow CSS string. On the squircle path (`cornerSmoothing > 0`)
   * it is NOT in `style` (clip-path would clip it) — put it on an unclipped
   * wrapper element instead. */
  shadow: string | undefined
  /** Resolved corner smoothing (0 = circular). > 0 means the consumer should
   * wrap for the shadow (the `<LiquidGlass>` component does this automatically). */
  cornerSmoothing: number
}

/**
 * Apply the liquid-glass effect to *any* element you control (a real
 * `<button>`, a `motion.div`, …). The backdrop-filter must live on the element
 * itself — not a child layer — for it to refract what's painted behind it, so
 * this hook hands back the `ref`, `style`, and the `<filter>` SVG to splice in.
 */
// All decoration layers (fills + rim specular/shade) sit at z-index -1 so they
// paint ABOVE the element's backdrop-filter but BELOW any content/children —
// the glass tints the refracted backdrop, never the text on top of it.
const DECORATION_Z = -1
// Soft drop shadow: a single plain box-shadow — fully tunable (offset/blur/
// spread/tint). A (non-inset) box-shadow paints OUTSIDE the border box, so it
// never sits under the translucent body, and it follows the element's border-
// radius — no mask or decoration layer needed. `tint` is the per-variant
// `fill-shadow-*` token.
function softShadow(
  tint: string,
  offsetX: number,
  offsetY: number,
  blur: number,
  spread: number,
): string | undefined {
  if (!tint) return undefined
  return `${offsetX}px ${offsetY}px ${blur}px ${spread}px ${tint}`
}

/** Shared style for a stacked fill layer. */
function fillLayer(
  key: string,
  background: string,
  blend?: React.CSSProperties["mixBlendMode"],
  opacity?: number,
): React.ReactNode {
  if (!background) return null
  return (
    <div
      key={key}
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        zIndex: DECORATION_Z,
        borderRadius: "inherit",
        background,
        mixBlendMode: blend,
        opacity,
        pointerEvents: "none",
      }}
    />
  )
}

export function useLiquidGlass({
  strength = 60,
  blur = 2,
  frost = 0,
  bevel = 0.45,
  thickness = 100,
  depth = 0.12,
  fills,
  accent,
  opacity: opaque = false,
  tint = "rgba(255,255,255,0.12)",
  radius = 28,
  lightStrength = 0.45,
  edgeWidth = 5,
  specularAngle = 315,
  specularGlow = 6,
  specularBacklight = 0.6,
  shadowOffsetX = 0,
  shadowOffsetY = 8,
  shadowBlur = 32,
  shadowSpread = 0,
  tone = "light",
  cornerSmoothing = 0,
  shadow = "lg",
}: LiquidGlassOptions = {}): UseLiquidGlass {
  const [ref, bounds] = useMeasure()
  const rawId = useId()
  const filterId = `liquid-glass-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`

  // Supersample the shape field/maps so the thin specular rim anti-aliases
  // ONE shape (Figma corner-smoothing) drives the displacement map + the clip —
  // generalised across rounded rect / squircle / circle / pill, no special cases.
  const field = useMemo(
    () => buildShapeField(bounds.width, bounds.height, radius, cornerSmoothing),
    [bounds.width, bounds.height, radius, cornerSmoothing],
  )

  const map = useMemo(
    () => buildDisplacementMap(field, bevel, thickness),
    [field, bevel, thickness],
  )
  // The displacement map is generated at the element's pixel size; the feImage
  // must be placed at those exact px (NOT width="100%") inside an over-sized
  // filter region — see the filter wiring below.
  const mapW = Math.max(1, Math.round(bounds.width))
  const mapH = Math.max(1, Math.round(bounds.height))

  // ── Rim specular ───────────────────────────────────────────────────────────
  // Inset box-shadows (the Apple-glass CodePen technique): a crisp white edge
  // toward `specularAngle` + a fainter opposite edge (`specularBacklight`) + a
  // soft all-around inner glow (`specularGlow` radius). Smooth + GPU + ~free, and
  // it follows the rounded outline so the bright/dead edges read consistently at
  // any size or aspect. Trade-off vs a path-based rim: tracks `border-radius`,
  // not the exact squircle, so corners are a hair rounder than the silhouette.
  const specularBoxShadow = (() => {
    const a = Math.max(0, Math.min(1, lightStrength))
    if (a <= 0 || bounds.width <= 0) return undefined
    const rad = (specularAngle * Math.PI) / 180
    const Lx = Math.sin(rad)
    const Ly = -Math.cos(rad)
    const k = Math.max(0.75, edgeWidth) // line width = inset offset toward the light
    const blur = Math.max(0, specularGlow) // soft inner glow radius
    const back = Math.max(0, Math.min(1, specularBacklight)) // opposite-edge strength
    const lit = (al: number) => `rgba(255,255,255,${(a * al).toFixed(3)})`
    // inset offset = −L lands the crisp highlight on the light-FACING edge.
    return (
      `inset ${(-Lx * k).toFixed(2)}px ${(-Ly * k).toFixed(2)}px 0 0 ${lit(1)}, ` +
      `inset ${(Lx * k).toFixed(2)}px ${(Ly * k).toFixed(2)}px 0 0 ${lit(back)}, ` +
      `inset 0 0 ${blur.toFixed(1)}px 0 ${lit(0.5)}`
    )
  })()

  const ready = isChromium && map !== ""

  // Frost couples extra backdrop blur with a white veil (rendered below). The
  // raw `blur` is the clear-glass floor; frost ramps it up to a heavy frost.
  const frostAmt = Math.max(0, Math.min(1, frost))
  const frostBlur = blur + frostAmt * 20
  const backdropFilter = ready
    ? `blur(${frostBlur}px) url(#${filterId})`
    : `blur(${Math.max(frostBlur, 8)}px)`

  const elevation = SYSTEM_SHADOWS[shadow]

  // Depth — a directional INNER shadow (Figma's "Depth"). Light from `specularAngle`
  // lands a soft dark on the light-facing inner wall (the darkened top-left on
  // Apple glass). In LIGHT mode a faint white highlight sits on the opposite
  // wall; in DARK mode that white is dropped — depth only ever adds blackness on
  // dark glass (white-on-dark would read as the dominant effect, which is wrong).
  const depthShadow = (() => {
    const d = Math.max(0, Math.min(1, depth))
    if (d <= 0 || bounds.height <= 0) return null
    // Depth shares the specular's light axis — one light source for both the rim
    // highlight and the inner-wall shadow.
    const a = (specularAngle * Math.PI) / 180
    const Lx = Math.sin(a)
    const Ly = -Math.cos(a)
    const minDim = Math.min(bounds.width, bounds.height) || 40
    const dist = Math.max(2, minDim * 0.07)
    const soft = Math.max(6, minDim * 0.22)
    // On DARK glass, black-on-dark barely reads, so push the inner shadow much
    // harder to keep the light-facing wall (top-left) visibly darkened.
    const darkMul = tone === "dark" ? 1.6 : 0.6
    const darkA = Math.min(1, darkMul * d).toFixed(3)
    // White highlight is LIGHT-mode only; on dark glass depth adds blackness, not
    // whiteness (a white inner highlight reads far too strongly on a dark backdrop).
    const lightA = (tone === "dark" ? 0 : 0.5 * d).toFixed(3)
    // Dark on the light-facing wall: offset AWAY from the light (−L) darkens the
    // top-left for a 315° light. White on the far wall (light mode): offset TOWARD it.
    const boxShadow =
      `inset ${(-Lx * dist).toFixed(1)}px ${(-Ly * dist).toFixed(1)}px ${soft.toFixed(1)}px rgba(0,0,0,${darkA}), ` +
      `inset ${(Lx * dist).toFixed(1)}px ${(Ly * dist).toFixed(1)}px ${soft.toFixed(1)}px rgba(255,255,255,${lightA})`
    return (
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          zIndex: DECORATION_Z,
          borderRadius: "inherit",
          boxShadow,
          pointerEvents: "none",
        }}
      />
    )
  })()

  // Soft drop shadow from the shadow tint on the fills path; the system
  // elevation scale on the legacy/raw path.
  const shadowCss = fills
    ? softShadow(fills.shadow, shadowOffsetX, shadowOffsetY, shadowBlur, shadowSpread)
    : elevation || undefined

  // Clip ONLY a true squircle — a shape `border-radius` can't represent. A
  // circle/pill (radius ≥ half) or smoothing 0 is a plain rounded rect, so it
  // uses border-radius (no clip → no shadow wrapper needed). The clip matches the
  // field exactly: both come from `figma-squircle`.
  const minHalf = Math.min(bounds.width, bounds.height) / 2
  const clipPath =
    cornerSmoothing > 0 && bounds.width > 0 && radius < minHalf - 0.5
      ? `path("${squircleSvgPath(bounds.width, bounds.height, radius, cornerSmoothing)}")`
      : undefined

  const style: React.CSSProperties = {
    borderRadius: radius,
    // With stacked fills the body color comes from the layers, not the element.
    backgroundColor: fills ? "transparent" : tint,
    backdropFilter,
    WebkitBackdropFilter: `blur(${Math.max(blur, 8)}px)`,
    // A plain box-shadow never paints under the element — BUT clip-path clips it
    // away, so on the squircle path (cornerSmoothing > 0) we drop it here and
    // hand it back via `shadow` for an unclipped wrapper (gated on intent, not
    // the measured clip, so the wrapper decision is stable across the first paint).
    boxShadow: cornerSmoothing > 0 ? undefined : shadowCss,
    clipPath,
    WebkitClipPath: clipPath,
    // REQUIRED for the layering contract below: this establishes a local
    // stacking context so the z-index:-1 decoration layers are contained inside
    // this element (above its backdrop-filter, below its content) and can never
    // slip behind the element or escape into a parent. Do not remove.
    isolation: "isolate",
  }

  // ── Local stacking model ───────────────────────────────────────────────────
  // Within this element's stacking context, painting goes (bottom → top):
  //   1. backdrop-filter (the refracted/frosted backdrop) + tint background
  //   2. DECORATION LAYERS  (z-index: -1, pointer-events: none) ── below
  //   3. content / children (normal flow, z-index ≥ 0)          ── above
  //
  // The decorations MUST be direct children at z-index:-1 (not wrapped): a
  // wrapper with z-index/isolation would form its own stacking context and the
  // fills' blend modes (overlay / plus-lighter) would then blend against a
  // transparent wrapper instead of the glass surface. Negative z keeps them
  // below in-flow content regardless of child DOM order, and `pointer-events:
  // none` lets clicks fall through to the content. Order within the stack:
  //   base → highlight(overlay) → accent×2 → opacity(overlay) → glass
  //        → rim shade → rim specular(plus-lighter)
  const fillLayers = fills
    ? [
        fillLayer("base", fills.base),
        fillLayer("highlight", fills.highlight, "overlay"),
        accent ? fillLayer("accent-a", accent, undefined, 0.25) : null,
        // Figma tints the 2nd accent layer with "Plus Darker" (Linear Burn), which
        // CSS mix-blend-mode can't do (only plus-lighter exists). `multiply` is the
        // closest supported darken-toward-the-tint blend.
        accent ? fillLayer("accent-b", accent, "multiply", 0.8) : null,
        opaque ? fillLayer("opacity", "#ffffff", "overlay", 0.5) : null,
        fillLayer("glass", fills.glass),
      ]
    : null

  // Frost veil — a white milky layer over the (extra-blurred) backdrop, the
  // "opaqueness" half of frost. Tone-aware (lighter on dark glass) and sits
  // BELOW the tint fills, so the design tokens layer on top of the frost.
  const frostVeil =
    frostAmt > 0 ? (
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          zIndex: DECORATION_Z,
          borderRadius: "inherit",
          background: `rgba(255,255,255,${(frostAmt * (tone === "dark" ? 0.42 : 0.55)).toFixed(3)})`,
          pointerEvents: "none",
        }}
      />
    ) : null

  const svg = (
    <>
      {frostVeil}
      {fillLayers}
      {ready ? (
        <svg
          aria-hidden
          width="0"
          height="0"
          style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        >
          {/* Filter region extends 50% past every edge (NOT a tight 0/100%).
              feDisplacementMap pulls backdrop from up to `scale`px away; with a
              tight region those samples fall outside the source and Chrome
              clamps/repeats the edge pixel — which reads as a flat translation/
              smear at the rim instead of refraction. The 200% region gives the
              bent rays real backdrop to sample, so the edge actually warps.
              (Matches the kube / liquid-glass-demo filter wiring.) */}
          <filter
            id={filterId}
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
            colorInterpolationFilters="sRGB"
          >
            <feImage
              href={map}
              x="0"
              y="0"
              width={mapW}
              height={mapH}
              result="map"
              preserveAspectRatio="none"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="map"
              scale={strength}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </svg>
      ) : null}

      {/* Depth inner shadow — sits above the refraction/fills, below the thin
          rim specular so the edge highlight stays crisp on top. */}
      {depthShadow}

      {/* Rim specular highlight — inset box-shadows (crisp light-facing edge +
          fainter opposite edge + soft inner glow). Smooth, GPU, follows the
          rounded outline. */}
      {specularBoxShadow ? (
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            zIndex: DECORATION_Z,
            borderRadius: "inherit",
            boxShadow: specularBoxShadow,
            pointerEvents: "none",
          }}
        />
      ) : null}
    </>
  )

  return { ref, style, svg, ready, shadow: shadowCss, cornerSmoothing }
}

/** Convert a material (stacked fills + params) into raw useLiquidGlass options. */
function materialToOptions(material: GlassMaterial, radius?: number): LiquidGlassOptions {
  return {
    strength: material.strength,
    blur: material.blur,
    frost: material.frost,
    bevel: material.bevel,
    thickness: material.thickness,
    depth: material.depth,
    fills: material.fills,
    radius,
    lightStrength: material.lightStrength,
    edgeWidth: material.edgeWidth,
    specularAngle: material.specularAngle,
    specularGlow: material.specularGlow,
    specularBacklight: material.specularBacklight,
    shadowOffsetX: material.shadowOffsetX,
    shadowOffsetY: material.shadowOffsetY,
    shadowBlur: material.shadowBlur,
    shadowSpread: material.shadowSpread,
    cornerSmoothing: material.cornerSmoothing,
  }
}

/**
 * Mode-aware glass. Resolves the material from GLASS_DEFAULTS for the given mode
 * and the current theme (or an explicit `tone`), then returns the same shape as
 * `useLiquidGlass`. This is the path real components should use:
 *
 *   const glass = useLiquidGlassMode("large", { radius: 28 })
 *   <div ref={glass.ref} style={glass.style}>{glass.svg}…</div>
 */
export function useLiquidGlassMode(
  mode: GlassMode,
  opts: {
    radius?: number
    tone?: GlassTone
    material?: GlassMaterial
    /** Accent color (color-tint layers). Honored only for `small`, like Apple. */
    accent?: string
    /** Add the white opacity overlay (accessibility boost). */
    opacity?: boolean
    /** Squircle corner profile (0 = circular, ~0.6 = iOS). */
    cornerSmoothing?: number
  } = {},
): UseLiquidGlass {
  const { resolvedTheme } = useTheme()
  const tone: GlassTone = opts.tone ?? (resolvedTheme === "dark" ? "dark" : "light")
  const material = opts.material ?? GLASS_DEFAULTS[mode][tone]
  return useLiquidGlass({
    ...materialToOptions(material, opts.radius),
    tone,
    // Explicit prop wins; otherwise the preset's own corner profile.
    cornerSmoothing: opts.cornerSmoothing ?? material.cornerSmoothing,
    accent: mode === "small" ? opts.accent : undefined,
    opacity: opts.opacity,
  })
}

/**
 * Render the glass element + decorations + content. Two shapes:
 *  - circular (cornerSmoothing 0): a SINGLE element carrying the glass style,
 *    box-shadow, decorations, and content — exactly as before.
 *  - squircle (cornerSmoothing > 0): clip-path eats box-shadow, so the OUTER
 *    element (`Comp`) carries the shadow + layout, the refraction lives in an
 *    absolute, clipped inner div, and content rides on top inside the wrapper.
 */
function renderGlassShell(
  Comp: React.ElementType,
  glass: UseLiquidGlass,
  className: string | undefined,
  style: React.CSSProperties | undefined,
  children: React.ReactNode,
  dataAttrs: Record<string, string>,
): React.ReactElement {
  // `Comp` is a polymorphic element type rendered with arbitrary pass-through
  // data attributes; its props collapse to `never` under TS. Cast through `any`,
  // mirroring `SquircleShadow` in @/components/squircle.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Tag = Comp as any
  if (glass.cornerSmoothing > 0) {
    return (
      <Tag
        {...dataAttrs}
        className={cn("relative isolate", className)}
        style={{ ...style, boxShadow: glass.shadow, borderRadius: glass.style.borderRadius }}
      >
        {/* The clipped glass fills the wrapper and sits BEHIND the content
            (zIndex -1) so the wrapper's flex still lays the content out on top —
            the glass refracts the backdrop, never the text. */}
        <div
          ref={glass.ref}
          aria-hidden
          style={{ ...glass.style, position: "absolute", inset: 0, zIndex: -1 }}
        >
          {glass.svg}
        </div>
        {children}
      </Tag>
    )
  }
  return (
    <Tag
      {...dataAttrs}
      ref={glass.ref}
      className={cn("relative isolate", className)}
      style={{ ...glass.style, ...style }}
    >
      {glass.svg}
      {children}
    </Tag>
  )
}

function RawGlass({
  as: Comp = "div",
  className,
  style,
  children,
  ...options
}: LiquidGlassOptions & {
  as?: React.ElementType
  className?: string
  style?: React.CSSProperties
  children?: React.ReactNode
}) {
  const glass = useLiquidGlass(options)
  return renderGlassShell(Comp, glass, className, style, children, {
    "data-liquid-glass": "",
  })
}

function ModeGlass({
  mode,
  tone,
  material,
  radius,
  accent,
  opacity,
  cornerSmoothing,
  as: Comp = "div",
  className,
  style,
  children,
}: {
  mode: GlassMode
  tone?: GlassTone
  material?: GlassMaterial
  radius?: number
  accent?: string
  opacity?: boolean
  cornerSmoothing?: number
  as?: React.ElementType
  className?: string
  style?: React.CSSProperties
  children?: React.ReactNode
}) {
  const glass = useLiquidGlassMode(mode, { radius, tone, material, accent, opacity, cornerSmoothing })
  return renderGlassShell(Comp, glass, className, style, children, {
    "data-liquid-glass": "",
    "data-glass-mode": mode,
  })
}

export function LiquidGlass({
  mode,
  tone,
  material,
  as,
  className,
  style,
  children,
  ...options
}: LiquidGlassProps) {
  // Branch at the component level so each path's hooks stay unconditional.
  if (mode) {
    return (
      <ModeGlass
        mode={mode}
        tone={tone}
        material={material}
        radius={options.radius}
        accent={options.accent}
        opacity={options.opacity}
        cornerSmoothing={options.cornerSmoothing}
        as={as}
        className={className}
        style={style}
      >
        {children}
      </ModeGlass>
    )
  }
  return (
    <RawGlass {...options} as={as} className={className} style={style}>
      {children}
    </RawGlass>
  )
}

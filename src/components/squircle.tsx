import * as React from "react"
import { Squircle as RawSquircle, squircleObserver } from "corner-smoothing"

// `Options` isn't exported from corner-smoothing's barrel, so we mirror it.
export type SquircleOptions = {
  cornerRadius: number
  topLeftCornerRadius?: number
  topRightCornerRadius?: number
  bottomRightCornerRadius?: number
  bottomLeftCornerRadius?: number
  cornerSmoothing?: number
  preserveSmoothing?: boolean
  borderWidth?: number
}

const DEFAULT_SMOOTHING = 0.6

// ---------------------------------------------------------------------------
// Parametric shadow system
//
// Builds stacked `drop-shadow()` filters with progressively larger offsets,
// wider blurs, and decreasing opacities — mimicking a real penumbra. Applied
// via `filter:` on a wrapper so the shadow follows the squircled child's
// silhouette (Chrome can't paint drop-shadow outside a clip-path on the same
// element).
// ---------------------------------------------------------------------------

export type ShadowOptions = {
  /** Elevation on a 0.5–5 scale. Higher = bigger, softer shadow. */
  elevation?: number
  /** Light source angle in degrees. 0 = top (shadow falls down),
   *  90 = left (shadow falls right), 180 = bottom (shadow falls up). */
  direction?: number
  /** CSS color for shadow tint. Default: black at varying opacity. */
  color?: string
  /** Number of stacked layers (default 4). More = smoother falloff. */
  layers?: number
}

export function buildShadow(opts: ShadowOptions = {}): string {
  const {
    elevation = 2.5,
    direction = 0,
    color,
    layers = 4,
  } = opts

  const rad = (direction * Math.PI) / 180
  const sinA = Math.sin(rad)
  const cosA = Math.cos(rad)

  // Opacity now scales with elevation so low tiers are subtle (matching
  // Tailwind's 5% at 2xs) and high tiers are heavier (matching 2xl's 25%).
  // Multi-layer stacking compounds visually, so per-layer opacity stays
  // lower than a single-layer box-shadow would need.
  const baseOpacity = 0.02 + (elevation / 5) * 0.08

  const parts: string[] = []
  for (let i = 0; i < layers; i++) {
    const progress = (i + 1) / layers
    const p2 = progress * progress

    const ox = Math.round(sinA * elevation * p2 * 6 * 10) / 10
    const oy = Math.round(cosA * elevation * p2 * 6 * 10) / 10
    const blur = Math.round(elevation * p2 * 12 * 10) / 10
    const layerFalloff = 0.3 + 0.7 * (layers - i) / layers
    const opacity = Math.round(baseOpacity * layerFalloff * 1000) / 1000

    if (color) {
      parts.push(`drop-shadow(${ox}px ${oy}px ${blur}px ${color})`)
    } else {
      parts.push(`drop-shadow(${ox}px ${oy}px ${blur}px rgba(0, 0, 0, ${opacity}))`)
    }
  }
  return parts.join(" ")
}

// Preset tiers aligned with Tailwind v4's shadow scale (2xs → 2xl).
export const SQUIRCLE_SHADOW = {
  "2xs": buildShadow({ elevation: 0.5 }),
  xs:    buildShadow({ elevation: 1 }),
  sm:    buildShadow({ elevation: 1.5 }),
  md:    buildShadow({ elevation: 2.5 }),
  lg:    buildShadow({ elevation: 3.5 }),
  xl:    buildShadow({ elevation: 4.5 }),
  "2xl": buildShadow({ elevation: 5 }),
} as const

export type SquircleShadowKey = keyof typeof SQUIRCLE_SHADOW

export const SQUIRCLE_RADIUS = {
  sm: 6,
  md: 8,
  lg: 10,
  xl: 14,
  "2xl": 18,
  "3xl": 22,
  "4xl": 26,
} as const

export type SquircleRadiusKey = keyof typeof SQUIRCLE_RADIUS

type SquircleShadowProp = boolean | SquircleShadowKey | string

type SquircleProps = SquircleOptions & {
  as?: React.ElementType
  children?: React.ReactNode
  className?: string
  /**
   * Elevation. `true` uses `md`. Pass a key for a preset, or any custom
   * `filter` value (e.g. `"drop-shadow(0 4px 8px ...)"`).
   *
   * When set, the wrapper component switches from a single clip-path'd
   * element to a parent (filter) + child (clip-path) pair, since the two
   * don't visibly coexist on the same element.
   */
  shadow?: SquircleShadowProp
  /** Class applied to the outer shadow wrapper (only used when `shadow`). */
  shadowClassName?: string
  // Allow any additional HTML/data attributes through.
  [key: string]: unknown
}

function resolveShadow(shadow: SquircleShadowProp | undefined): string | undefined {
  if (!shadow) return undefined
  if (shadow === true) return SQUIRCLE_SHADOW.md
  if (typeof shadow === "string" && shadow in SQUIRCLE_SHADOW) {
    return SQUIRCLE_SHADOW[shadow as SquircleShadowKey]
  }
  return shadow as string
}

export const Squircle = React.forwardRef<HTMLElement, SquircleProps>(
  function Squircle(props, ref) {
    const {
      cornerSmoothing = DEFAULT_SMOOTHING,
      shadow,
      shadowClassName,
      ...rest
    } = props
    const filterValue = resolveShadow(shadow as SquircleShadowProp | undefined)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Cmp = RawSquircle as any
    const inner = (
      <Cmp ref={ref} cornerSmoothing={cornerSmoothing} {...rest} />
    )
    if (!filterValue) return inner
    // `filter` doesn't apply to `display: contents` elements, so the wrapper
    // has to take up box. Default to `inline-block` so it doesn't force
    // block layout around inline use; pass `shadowClassName` (e.g. "block w-full")
    // to override for block-level surfaces like Card.
    return (
      <div
        data-squircle-shadow=""
        className={shadowClassName as string | undefined}
        style={{ filter: filterValue, display: "inline-block" }}
      >
        {inner}
      </div>
    )
  },
)

export function useSquircle<T extends HTMLElement>(
  ref: React.RefObject<T | null>,
  options: SquircleOptions,
) {
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = squircleObserver(el, {
      cornerSmoothing: DEFAULT_SMOOTHING,
      ...options,
    })
    return () => observer.disconnect()
    // `options` is intentionally excluded; the individual fields below are the
    // real inputs, and the object identity changes every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    ref,
    options.cornerRadius,
    options.cornerSmoothing,
    options.preserveSmoothing,
    options.borderWidth,
    options.topLeftCornerRadius,
    options.topRightCornerRadius,
    options.bottomLeftCornerRadius,
    options.bottomRightCornerRadius,
  ])
}

type ButtonSize =
  | "default"
  | "xs"
  | "sm"
  | "lg"
  | "icon"
  | "icon-xs"
  | "icon-sm"
  | "icon-lg"

export function radiusForButtonSize(size: ButtonSize | null | undefined): number {
  switch (size) {
    case "xs":
    case "sm":
    case "icon-xs":
    case "icon-sm":
      return SQUIRCLE_RADIUS.md
    default:
      return SQUIRCLE_RADIUS.lg
  }
}

/**
 * Standalone wrapper that adds an elevation shadow around any squircled
 * (or non-squircled) child. Use when you can't pass `shadow` directly to
 * `<Squircle>` — e.g. when the child is rendered by a third-party
 * component like base-ui's render prop.
 *
 * The wrapper is `inline-block` by default so it doesn't break inline
 * layouts (Button, Badge). Pass `block` via `className` for full-width
 * surfaces.
 */
export function SquircleShadow({
  shadow,
  className,
  style,
  children,
  as: As = "div",
  ...rest
}: {
  shadow: boolean | SquircleShadowKey | string
  className?: string
  style?: React.CSSProperties
  children: React.ReactNode
  as?: React.ElementType
} & Record<string, unknown>) {
  const filterValue = resolveShadow(shadow)
  if (!filterValue) return <>{children}</>
  // `As` is a polymorphic element type; rendered with arbitrary pass-through
  // props (`...rest`, data attributes) its props collapse to `never`. Cast
  // through `any`, mirroring the `RawSquircle as any` cast above.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Tag = As as any
  return (
    <Tag
      data-squircle-shadow=""
      className={className}
      style={{ filter: filterValue, display: "inline-block", ...style }}
      {...rest}
    >
      {children}
    </Tag>
  )
}

export { squircleObserver }

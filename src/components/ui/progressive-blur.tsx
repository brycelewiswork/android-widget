import { motion, type HTMLMotionProps } from "motion/react"
import { cn } from "@/lib/utils"

type LinearBlurSide = "top" | "bottom" | "left" | "right"

type CommonProps = {
  /** Peak blur radius in px. Used when `blurLevels` is not provided. */
  strength?: number
  /** Number of stacked layers when computing from `strength`. */
  steps?: number
  /**
   * Explicit array of blur values (in px) per layer, ordered from lightest
   * to heaviest. Overrides `strength` and `steps`. Lets you shape the ramp
   * non-uniformly — e.g. `[1, 2, 4, 16, 64]` ramps gently then jumps hard.
   */
  blurLevels?: number[]
  /** How much of the element's length the blur ramps over (0–100). */
  falloffPercentage?: number
  /** Optional color overlay applied on top of the blur. */
  tint?: string
}

const DEFAULT_STRENGTH = 64
const DEFAULT_STEPS = 8

function computeBlurLevels(strength: number, steps: number): number[] {
  return Array.from({ length: steps }, (_, i) =>
    strength * Math.pow(0.5, steps - 1 - i),
  )
}

function maskColor(opacity: 0 | 1) {
  return `rgba(0,0,0,${opacity})`
}

const SIDE_TO_GRADIENT_DIRECTION: Record<LinearBlurSide, string> = {
  top: "to bottom",
  bottom: "to top",
  left: "to right",
  right: "to left",
}

// ---------------------------------------------------------------------------

export type LinearBlurProps = CommonProps &
  Omit<HTMLMotionProps<"div">, "children"> & {
    /** Which edge is the focal point of the heaviest blur. */
    side?: LinearBlurSide
  }

export function LinearBlur({
  side = "top",
  strength = DEFAULT_STRENGTH,
  steps = DEFAULT_STEPS,
  blurLevels,
  falloffPercentage = 100,
  tint = "transparent",
  className,
  style,
  ...motionProps
}: LinearBlurProps) {
  const levels = blurLevels ?? computeBlurLevels(strength, steps)
  const direction = SIDE_TO_GRADIENT_DIRECTION[side]
  return (
    <motion.div
      data-progressive-blur="linear"
      data-side={side}
      className={cn("pointer-events-none absolute inset-0", className)}
      style={style}
      {...motionProps}
    >
      {levels.map((blur, i) => {
        const end = ((i + 1) / levels.length) * falloffPercentage
        const start = end * 0.5
        const gradient = `linear-gradient(${direction}, ${maskColor(1)} 0%, ${maskColor(1)} ${start}%, ${maskColor(0)} ${end}%)`
        return (
          <div
            key={i}
            className="pointer-events-none absolute inset-0 rounded-[inherit]"
            style={{
              backdropFilter: `blur(${blur}px)`,
              WebkitBackdropFilter: `blur(${blur}px)`,
              maskImage: gradient,
              WebkitMaskImage: gradient,
              ...(tint !== "transparent" ? { backgroundColor: tint } : {}),
            }}
          />
        )
      })}
    </motion.div>
  )
}

// ---------------------------------------------------------------------------

export type RadialBlurProps = CommonProps &
  Omit<HTMLMotionProps<"div">, "children"> & {
    /**
     * Where the heaviest blur sits.
     * - `'edge'` (default): blur is heaviest at the perimeter, sharp at center.
     * - `'center'`: blur is heaviest at the center, sharp at the edges.
     */
    origin?: "edge" | "center"
  }

export function RadialBlur({
  origin = "edge",
  strength = DEFAULT_STRENGTH,
  steps = DEFAULT_STEPS,
  blurLevels,
  falloffPercentage = 100,
  tint = "transparent",
  className,
  style,
  ...motionProps
}: RadialBlurProps) {
  const levels = blurLevels ?? computeBlurLevels(strength, steps)
  return (
    <motion.div
      data-progressive-blur="radial"
      data-origin={origin}
      className={cn("pointer-events-none absolute inset-0", className)}
      style={style}
      {...motionProps}
    >
      {levels.map((blur, i) => {
        const end = ((i + 1) / levels.length) * falloffPercentage
        const start = end * 0.5
        const gradient =
          origin === "edge"
            ? `radial-gradient(circle at center, ${maskColor(0)} ${100 - end}%, ${maskColor(1)} ${100 - start}%, ${maskColor(1)} 100%)`
            : `radial-gradient(circle at center, ${maskColor(1)} 0%, ${maskColor(1)} ${start}%, ${maskColor(0)} ${end}%)`
        return (
          <div
            key={i}
            className="pointer-events-none absolute inset-0 rounded-[inherit]"
            style={{
              backdropFilter: `blur(${blur}px)`,
              WebkitBackdropFilter: `blur(${blur}px)`,
              maskImage: gradient,
              WebkitMaskImage: gradient,
              ...(tint !== "transparent" ? { backgroundColor: tint } : {}),
            }}
          />
        )
      })}
    </motion.div>
  )
}

import type { SpringOptions } from "motion/react"

// ---------------------------------------------------------------------------
// Spring presets
// ---------------------------------------------------------------------------

/** Apple-inspired springs — slight overshoot, polished feel. */
export const SPRING = {
  gentle:   { stiffness: 120, damping: 14, mass: 1 } satisfies SpringOptions,
  smooth:   { stiffness: 200, damping: 20, mass: 1 } satisfies SpringOptions,
  snappy:   { stiffness: 300, damping: 25, mass: 0.8 } satisfies SpringOptions,
  bouncy:   { stiffness: 150, damping: 8, mass: 0.8 } satisfies SpringOptions,
  magnetic: { stiffness: 26.7, damping: 4.1, mass: 0.2 } satisfies SpringOptions,
} as const

/**
 * Professional / fast springs — higher damping, near-critically-damped,
 * minimal overshoot. Same names as `SPRING` so you can swap one for the
 * other without changing anything else.
 */
export const SPRING_FAST = {
  gentle:   { stiffness: 200, damping: 26, mass: 0.8 } satisfies SpringOptions,
  smooth:   { stiffness: 300, damping: 30, mass: 0.7 } satisfies SpringOptions,
  snappy:   { stiffness: 400, damping: 35, mass: 0.5 } satisfies SpringOptions,
  bouncy:   { stiffness: 250, damping: 18, mass: 0.7 } satisfies SpringOptions,
  magnetic: { stiffness: 50, damping: 8, mass: 0.2 } satisfies SpringOptions,
} as const

export type SpringPresetKey = keyof typeof SPRING

// ---------------------------------------------------------------------------
// Easing curves for motion's `ease` prop
// ---------------------------------------------------------------------------

export const EASE = {
  apple:      [0.22, 1, 0.36, 1] as const,
  standard:   [0.2, 0, 0, 1] as const,
  emphasized: [0.2, 0, 0, 1.2] as const,
  decelerate: [0, 0, 0.58, 1] as const,
  accelerate: [0.42, 0, 1, 1] as const,
  linear:     "linear" as const,
  easeIn:     [0.50, 0.05, 0.70, 0.18] as const,
  easeOut:    [0.22, 0.62, 0.35, 1] as const,
  easeInOut:  [0.65, 0.05, 0.35, 1] as const,
} as const

// ---------------------------------------------------------------------------
// GSAP easings (string tokens for gsap.to / gsap.from / timelines)
// ---------------------------------------------------------------------------

export const GSAP_EASE = {
  gentle:     "power1.out",
  smooth:     "power2.out",
  snappy:     "power3.out",
  aggressive: "power4.out",
  bounce:     "back.out(1.7)",
  elastic:    "elastic.out(1, 0.3)",
  linear:     "none",
} as const

// ---------------------------------------------------------------------------
// Duration tokens (seconds — motion uses seconds, GSAP uses seconds)
// ---------------------------------------------------------------------------

export const DURATION = {
  instant: 0.1,
  fast:    0.2,
  normal:  0.3,
  slow:    0.5,
  slower:  0.7,
} as const

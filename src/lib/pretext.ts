import * as React from "react"
import {
  prepare,
  prepareWithSegments,
  layout,
  layoutNextLineRange,
  measureLineStats,
  type PreparedTextWithSegments,
} from "@chenglou/pretext"

// ---------------------------------------------------------------------------
// React adapters for Cheng Lou's Pretext (https://chenglou.me/pretext/).
//
// Pretext is a pure-JS text measurement & layout engine that side-steps
// `getBoundingClientRect`/`offsetHeight` reflows. Use it whenever you need
// the *height* or *natural width* of a block of text BEFORE the browser
// paints it — for layout prediction (masonry, virtualized chat, tight
// bubbles), or for animating to a target height without a measure-and-set
// double render.
//
// Heads-up on font strings: Pretext wants a real CSS font shorthand
// (e.g. `500 16px "DM Sans Variable"`). `system-ui` is unsafe on macOS per
// upstream docs — pass an explicit family. `cssFontFromElement(el)` derives
// a safe string from any DOM node's computed styles.
// ---------------------------------------------------------------------------

export type PretextFontOptions = {
  whiteSpace?: "normal" | "pre-wrap"
  wordBreak?: "normal" | "keep-all"
  letterSpacing?: number
}

/**
 * Build a Pretext-compatible CSS `font` shorthand from a DOM element's
 * computed styles. Pretext takes one string (`'500 16px "DM Sans"'`) — this
 * normalizes the parts the engine actually consumes (weight, size, family).
 */
export function cssFontFromElement(el: HTMLElement | null): string {
  if (!el) return '400 16px "DM Sans Variable", sans-serif'
  const cs = getComputedStyle(el)
  const family = cs.fontFamily || '"DM Sans Variable", sans-serif'
  const weight = cs.fontWeight || "400"
  const size = cs.fontSize || "16px"
  const style = cs.fontStyle && cs.fontStyle !== "normal" ? `${cs.fontStyle} ` : ""
  return `${style}${weight} ${size} ${family}`
}

/**
 * Sample everything Pretext needs from a DOM element's computed styles —
 * font shorthand, lineHeight in pixels, and letterSpacing in pixels. Lets
 * callers style with design-system token classes (e.g. `text-sm leading-snug`)
 * instead of hardcoding `text-[Npx] leading-[Npx]`, and have Pretext mirror
 * whatever the CSS actually computed.
 */
export function pretextStyleFromElement(el: HTMLElement | null): {
  font: string
  lineHeight: number
  letterSpacing: number
  fontSize: number
} {
  if (!el) {
    return {
      font: '400 16px "DM Sans Variable", sans-serif',
      lineHeight: 24,
      letterSpacing: 0,
      fontSize: 16,
    }
  }
  const cs = getComputedStyle(el)
  const font = cssFontFromElement(el)
  const fontSize = parseFloat(cs.fontSize) || 16
  // computed `line-height` is `normal` or a px value. Normal ≈ 1.2 for most
  // sans fonts in modern browsers; this matches what Pretext sees on the
  // canvas it measures with.
  const rawLh = cs.lineHeight
  const lineHeight =
    rawLh === "normal" || !rawLh ? Math.round(fontSize * 1.2) : parseFloat(rawLh) || fontSize * 1.2
  const letterSpacing =
    !cs.letterSpacing || cs.letterSpacing === "normal" ? 0 : parseFloat(cs.letterSpacing) || 0
  return { font, lineHeight, letterSpacing, fontSize }
}

/**
 * Measure the height of a paragraph at a given `maxWidth` and `lineHeight`,
 * without DOM reflow. Re-runs only when its inputs change.
 *
 * Returns `null` until the first measurement completes (so consumers can
 * show a placeholder on the very first render).
 */
export function usePretextHeight(
  text: string,
  font: string,
  maxWidth: number,
  lineHeight: number,
  options?: PretextFontOptions,
): { height: number; lineCount: number } | null {
  return React.useMemo(() => {
    if (!text || !font || maxWidth <= 0 || lineHeight <= 0) return null
    const prepared = prepare(text, font, options)
    return layout(prepared, maxWidth, lineHeight)
  }, [text, font, maxWidth, lineHeight, options?.whiteSpace, options?.wordBreak, options?.letterSpacing])
}

/**
 * Finds the narrowest `maxWidth` that still fits `text` in exactly
 * `lineCount` lines — the classic "tight chat-bubble" problem.
 *
 * Binary-searches between `minWidth` (natural-word floor) and `maxWidth`
 * (caller-supplied ceiling) using Pretext's pure-JS measurement, so this
 * is O(log n) measurements with zero DOM reflow.
 */
export function findTightWidth(
  text: string,
  font: string,
  options: {
    /** Hard upper bound — usually the container width. */
    maxWidth: number
    /** Hard lower bound — usually the width of the longest single word. */
    minWidth?: number
    lineHeight?: number
    pretextOptions?: PretextFontOptions
  },
): { width: number; lineCount: number; height: number } | null {
  const { maxWidth, minWidth = 0, lineHeight = 1.4, pretextOptions } = options
  // Guard early-render zero/missing state — callers often pass `font ?? ""`
  // and `lineHeight ?? 0` while a hidden probe samples computed styles.
  if (!text || !font || maxWidth <= 0 || lineHeight <= 0) return null
  const prepared = prepare(text, font, pretextOptions)
  // Target: minimum line count achievable at `maxWidth`. We want a tighter
  // width that still yields that same line count.
  const target = layout(prepared, maxWidth, lineHeight).lineCount
  if (target === 0) return { width: 0, lineCount: 0, height: 0 }

  let lo = Math.max(1, minWidth)
  let hi = maxWidth
  let best = maxWidth
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2)
    const { lineCount } = layout(prepared, mid, lineHeight)
    if (lineCount <= target) {
      best = mid
      hi = mid - 1
    } else {
      lo = mid + 1
    }
  }
  const final = layout(prepared, best, lineHeight)
  return { width: best, lineCount: final.lineCount, height: final.height }
}

/**
 * React hook form of {@link findTightWidth}.
 */
export function useTightWidth(
  text: string,
  font: string,
  maxWidth: number,
  minWidth = 0,
  lineHeight = 1.4,
  options?: PretextFontOptions,
): { width: number; lineCount: number; height: number } | null {
  return React.useMemo(
    () => findTightWidth(text, font, { maxWidth, minWidth, lineHeight, pretextOptions: options }),
    [text, font, maxWidth, minWidth, lineHeight, options?.whiteSpace, options?.wordBreak, options?.letterSpacing],
  )
}

/**
 * Manual line walker — useful when you need per-line widths or want to
 * stop early. Mirrors Pretext's segment API but boxed up for React.
 */
export function preparedSegments(
  text: string,
  font: string,
  options?: PretextFontOptions,
): PreparedTextWithSegments {
  return prepareWithSegments(text, font, options)
}

export { layout, prepare, layoutNextLineRange, measureLineStats }

/**
 * rAF-debounced number — defers `value` updates by one animation frame.
 *
 * Use it as a shock-absorber between a ResizeObserver-driven width and
 * any expensive layout recompute (Pretext, motion height animations,
 * corner-smoothing clip-path regeneration). Without it, every observer
 * tick can synchronously trigger work that resizes the element, which
 * fires the observer again — that's the loop that crashes Chrome with
 * `STATUS_BREAKPOINT` near responsive breakpoints.
 */
export function useDebouncedFrame(value: number): number {
  const [deferred, setDeferred] = React.useState(value)
  React.useEffect(() => {
    const id = requestAnimationFrame(() => setDeferred(value))
    return () => cancelAnimationFrame(id)
  }, [value])
  return deferred
}

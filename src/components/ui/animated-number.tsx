import { useRef, useState, useEffect, type CSSProperties } from "react"

// Apple-style "blur ticker": each digit blurs and slides as it changes, with the
// old glyph exiting in the direction of travel and the new one entering behind it.
// Keyframes live in index.css (digit-up-in / digit-up-out / digit-down-* / digit-fade-in).
// Blur radius + slide distance are driven by the --digit-blur / --digit-travel CSS
// vars set on the root span, so they're tunable per-instance (e.g. via dialkit).

function isDigit(char: string): boolean {
  return char >= "0" && char <= "9"
}

type ExitSlot = { char: string; animKey: number }

export type AnimatedNumberProps = {
  /** Current numeric value. */
  value: number
  /** Format function — converts the number to its display string. */
  format?: (value: number) => string
  /** Font size, weight, color, tracking go here. */
  className?: string
  /** Per-digit animation duration in ms. */
  duration?: number
  /** Delay per digit position to the right of the leftmost change, in ms. */
  stagger?: number
  /** Blur radius at the peak of the transition, in px. */
  blur?: number
  /** Slide distance the old/new glyphs travel, in % of glyph height. */
  travel?: number
  /**
   * Prefix of the keyframe set to use: `<prefix>-up-in`, `-up-out`, `-down-in`,
   * `-down-out`, `-fade-in`. Defaults to the index.css set ("digit").
   */
  keyframes?: string
  /** Easing for the slide keyframes; the curve shape lives in the keyframes themselves when "linear". */
  ease?: string
}

export function AnimatedNumber({
  value,
  format = String,
  className,
  duration = 600,
  stagger = 20,
  blur = 8,
  travel = 60,
  keyframes = "digit",
  ease = "linear",
}: AnimatedNumberProps) {
  const k = keyframes
  const ENTER_UP = `${k}-up-in ${duration}ms ${ease} both`
  const EXIT_UP = `${k}-up-out ${duration}ms ${ease} both`
  const ENTER_DOWN = `${k}-down-in ${duration}ms ${ease} both`
  const EXIT_DOWN = `${k}-down-out ${duration}ms ${ease} both`
  const FADE_IN = `${k}-fade-in ${duration}ms cubic-bezier(0, 0, 0.2, 1) both`
  const FADE_OUT = `${k}-up-out ${duration}ms ${ease} both`

  const formatted = format(value)
  const prevFormattedRef = useRef<string>(formatted)
  const prevValueRef = useRef<number>(value)
  const changeCounterRef = useRef<number>(0)
  const animKeyCounterRef = useRef<number>(0)
  const leftmostChangedRef = useRef<number>(Infinity)
  /** Positions whose character actually changed; unchanged ones (a trailing "m") hold still. */
  const changedRef = useRef<Set<number>>(new Set())

  const [direction, setDirection] = useState<"up" | "down" | "same">("same")
  const [exitSlots, setExitSlots] = useState<Map<number, ExitSlot>>(new Map())

  useEffect(() => {
    if (value === prevValueRef.current) return

    setDirection(value > prevValueRef.current ? "up" : "down")
    changeCounterRef.current += 1

    const prevFormatted = prevFormattedRef.current
    const newFormatted = format(value)
    const maxLen = Math.max(prevFormatted.length, newFormatted.length)

    // Only the leftmost changed position (and everything to its right) animates.
    let leftmostChanged = maxLen
    for (let i = 0; i < maxLen; i++) {
      if ((prevFormatted[i] ?? "") !== (newFormatted[i] ?? "")) {
        leftmostChanged = i
        break
      }
    }
    leftmostChangedRef.current = leftmostChanged
    changedRef.current = new Set(
      Array.from({ length: maxLen }, (_, i) => i).filter((i) => i >= leftmostChanged && prevFormatted[i] !== newFormatted[i]),
    )

    setExitSlots((prev) => {
      const next = new Map(prev)
      for (let i = leftmostChanged; i < maxLen; i++) {
        const prevChar = prevFormatted[i]
        const newChar = newFormatted[i]
        if (prevChar !== undefined && prevChar !== newChar) {
          next.set(i, { char: prevChar, animKey: ++animKeyCounterRef.current })
        }
      }
      return next
    })

    prevValueRef.current = value
    prevFormattedRef.current = newFormatted
  }, [value, format])

  const changeKey = changeCounterRef.current

  const rootStyle = {
    "--digit-blur": `${blur}px`,
    "--digit-travel": `${travel}%`,
  } as CSSProperties

  return (
    <span className={`tabular-nums${className ? ` ${className}` : ""}`} style={rootStyle}>
      {Array.from(formatted).map((char, index) => {
        const shouldAnimate = changedRef.current.has(index)
        const exitSlot = exitSlots.get(index)
        const enterAnim = shouldAnimate
          ? isDigit(char)
            ? direction === "up"
              ? ENTER_UP
              : direction === "down"
                ? ENTER_DOWN
                : FADE_IN
            : FADE_IN
          : undefined
        const exitAnim = exitSlot
          ? isDigit(exitSlot.char)
            ? direction === "up"
              ? EXIT_UP
              : direction === "down"
                ? EXIT_DOWN
                : FADE_OUT
            : FADE_OUT
          : undefined

        const staggerDelay = shouldAnimate
          ? `${(index - leftmostChangedRef.current) * stagger}ms`
          : undefined

        return (
          <span
            key={index}
            style={{ position: "relative", display: "inline-block", verticalAlign: "bottom" }}
          >
            {/* Entering glyph — remounts on each change to restart its animation. */}
            <span
              key={`enter-${index}-${changeKey}`}
              style={{ display: "block", animation: enterAnim, animationDelay: staggerDelay }}
            >
              {char}
            </span>

            {/* Exiting glyph — overlaid during the transition, removed on animationend. */}
            {exitSlot && (
              <span
                key={exitSlot.animKey}
                aria-hidden="true"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  display: "block",
                  animation: exitAnim,
                  animationDelay: staggerDelay,
                  pointerEvents: "none",
                }}
                onAnimationEnd={() => {
                  setExitSlots((prev) => {
                    if (prev.get(index)?.animKey !== exitSlot.animKey) return prev
                    const next = new Map(prev)
                    next.delete(index)
                    return next
                  })
                }}
              >
                {exitSlot.char}
              </span>
            )}
          </span>
        )
      })}
    </span>
  )
}

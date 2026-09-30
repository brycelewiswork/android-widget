import * as React from "react"
import { motion, AnimatePresence, type Transition } from "motion/react"
import useMeasure from "react-use-measure"
import { cn } from "@/lib/utils"
import { Squircle, SQUIRCLE_RADIUS } from "@/components/squircle"
import { SPRING, EASE, DURATION } from "@/lib/motion"
import { prepare, layout } from "@chenglou/pretext"
import { pretextStyleFromElement } from "@/lib/pretext"

// ---------------------------------------------------------------------------
// Accordion — accordion whose open/close animation springs to a
// *predicted* pixel height instead of `height: auto`.
//
// Why: spring physics can't actually animate to `auto` — motion fakes it by
// freezing the auto-resolved height at start, which makes the transition
// jump if content reflows mid-animation, and disables true overshoot. By
// asking Pretext to compute the body's height *before* paint, we get a real
// numeric target for the spring and the smoothest possible motion.
//
// Items take a single string (`body`) so Pretext can measure it. For richer
// bodies, render plain text via the `body` prop and decorate around it.
// ---------------------------------------------------------------------------

export type AccordionItem = {
  value: React.Key
  title: string
  body: string
}

type AccordionProps = {
  items: AccordionItem[]
  /**
   * Width the body text will render at. Defaults to the container's
   * measured inner width (via ResizeObserver), so the accordion is
   * width-responsive out of the box. Pass a number to override.
   */
  bodyWidth?: number
  /** Horizontal padding subtracted from container width when auto-measuring. */
  bodyPadding?: number
  /**
   * Visual variant.
   * - `"cards"` (default): each item is its own squircled card with its
   *   own background and outline. Use when the accordion sits on a plain
   *   page background and needs to provide its own surfaces.
   * - `"flat"`: items are borderless rows separated by a divider, with no
   *   per-item background. Use when the accordion is already inside a
   *   card / section surface and you don't want card-on-card stacking.
   */
  variant?: "cards" | "flat"
  /** Spring or tween used for both open & close. */
  transition?: Transition
  className?: string
  defaultExpanded?: React.Key | null
}

export function Accordion({
  items,
  bodyWidth,
  bodyPadding = 32,
  variant = "cards",
  transition,
  className,
  defaultExpanded = null,
}: AccordionProps) {
  const [expanded, setExpanded] = React.useState<React.Key | null>(defaultExpanded)
  const probeRef = React.useRef<HTMLDivElement>(null)
  const [containerRef, rawBounds] = useMeasure()
  const containerW = Math.round(rawBounds.width)
  const [style, setStyle] = React.useState<ReturnType<typeof pretextStyleFromElement> | null>(null)

  // Sample the body's computed font once mounted. The hidden probe inherits
  // the same Tailwind classes as the real body so Pretext sees the same font.
  React.useLayoutEffect(() => {
    setStyle(pretextStyleFromElement(probeRef.current))
  }, [])

  // Resolved text-render width: caller override, else container width
  // minus padding, else null (skip measurement until container size known).
  const measuredWidth =
    bodyWidth ?? (containerW > 0 ? Math.max(40, containerW - bodyPadding) : null)

  const heights = React.useMemo(() => {
    if (!style || measuredWidth === null) return null
    const out: Record<string, number> = {}
    for (const it of items) {
      const prepared = prepare(it.body, style.font, {
        letterSpacing: style.letterSpacing || undefined,
      })
      const { height } = layout(prepared, measuredWidth, style.lineHeight)
      out[String(it.value)] = height
    }
    return out
  }, [items, style, measuredWidth])

  const springT: Transition = transition ?? { type: "spring", ...SPRING.smooth }

  const isFlat = variant === "flat"

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex w-full flex-col",
        isFlat ? "divide-y divide-stroke-faint" : "gap-2",
        className,
      )}
    >
      {/* Hidden probe — same text classes as the real body, so computed
          styles (and therefore Pretext's measurement) match. */}
      <div
        ref={probeRef}
        aria-hidden
        className="pointer-events-none absolute -z-1 text-body text-label-secondary opacity-0"
        style={{ position: "absolute", visibility: "hidden", height: 0 }}
      >
        probe
      </div>

      {items.map((it) => {
        const isOpen = expanded === it.value
        const targetHeight = heights?.[String(it.value)]

        const trigger = (
          <button
            type="button"
            onClick={() => setExpanded(isOpen ? null : it.value)}
            aria-expanded={isOpen}
            className={cn(
              "flex w-full items-center justify-between gap-3 text-left text-label transition-colors",
              isFlat
                ? "py-3 hover:text-label-secondary"
                : "px-4 py-3 hover:bg-fill-quaternary",
            )}
          >
            <span className="text-body font-medium">{it.title}</span>
            <motion.span
              aria-hidden
              animate={{ rotate: isOpen ? 90 : 0 }}
              transition={{ duration: DURATION.fast, ease: EASE.easeOut }}
              className="text-label-tertiary"
            >
              ›
            </motion.span>
          </button>
        )

        const body = (
          <AnimatePresence initial={false}>
            {isOpen && (
              <motion.div
                key="body"
                initial={{ height: 0, opacity: 0 }}
                animate={{
                  height: targetHeight !== undefined ? targetHeight + (isFlat ? 16 : 24) : "auto",
                  opacity: 1,
                }}
                exit={{ height: 0, opacity: 0 }}
                transition={springT}
                style={{ overflow: "hidden" }}
              >
                <div
                  className={cn(
                    "text-body text-label-secondary",
                    isFlat ? "pb-4" : "px-4 pb-4",
                  )}
                >
                  {it.body}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )

        if (isFlat) {
          return (
            <div key={String(it.value)}>
              {trigger}
              {body}
            </div>
          )
        }

        return (
          <Squircle
            key={String(it.value)}
            as="div"
            cornerRadius={SQUIRCLE_RADIUS.lg}
            className="overflow-hidden rounded-lg bg-surface-secondary inset-ring-1 inset-ring-stroke-faint/60"
          >
            {trigger}
            {body}
          </Squircle>
        )
      })}
    </div>
  )
}

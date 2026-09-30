import * as React from "react"
import { cn } from "@/lib/utils"
import { pretextStyleFromElement, useTightWidth } from "@/lib/pretext"

// ---------------------------------------------------------------------------
// <TightText> — renders text in the narrowest box that fits it in the
// same number of lines a normal wrap at `maxWidth` would produce. Solves
// the chat-bubble problem (no ragged 3-word last line; no orphan widows).
//
// Uses Pretext's pure-JS measurement under the hood, so there's no
// measure-and-relayout double render. Font + lineHeight are sampled from
// the rendered element's computed styles — set them with normal Tailwind
// classes (`text-body`, `leading-snug`, etc.), not magic numbers.
// ---------------------------------------------------------------------------

type TightTextProps = {
  children: string
  /** Container ceiling. */
  maxWidth?: number
  /** Floor (e.g. min readable width). */
  minWidth?: number
  className?: string
}

export function TightText({
  children,
  maxWidth = 320,
  minWidth = 64,
  className,
}: TightTextProps) {
  const measureRef = React.useRef<HTMLSpanElement>(null)
  const [style, setStyle] =
    React.useState<ReturnType<typeof pretextStyleFromElement> | null>(null)

  // Sample font + lineHeight once mounted so they match whatever Tailwind
  // / inherited CSS applies. Re-runs if className changes (e.g. caller
  // swaps `text-body` for `text-h5`).
  React.useLayoutEffect(() => {
    setStyle(pretextStyleFromElement(measureRef.current))
  }, [className])

  const fit = useTightWidth(
    children,
    style?.font ?? "",
    maxWidth,
    minWidth,
    style?.lineHeight ?? 0,
  )

  return (
    <span
      ref={measureRef}
      className={cn("inline-block leading-snug", className)}
      style={{ width: fit ? fit.width : undefined, maxWidth }}
    >
      {children}
    </span>
  )
}

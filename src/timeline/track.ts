import { remainingEvents, takenEvents, TRACK, type EventKind, type TimelineConfig, type TimelineEvent } from "./model"

/*
 * The shift timeline's geometry and layout, shared by its two drawings: the
 * static one the widgets use (ShiftTimelineStatic — Android widgets can't
 * animate) and the animated reference (ShiftTimelineV2). Figma "Union",
 * 357.404 × 26, with its own curve values.
 */

export const INK = "#2c2935" // Figma content/primary — glyphs and dots
export const TRACK_FILL = "#b0b0b0" // Figma Union fill
export const PROGRESS_FILL = "#000000" // elapsed part of the shift (wireframe: black)

export const CAP_R = TRACK.barHeight / 2
/** The space between a bar's round cap and what's next — tighter than the model's 8.6 (TRACK.gap). */
export const GAP = 5
/** How far left of a checkpoint's centre the gap's cut reaches: bulge radius + gap + the cap's own radius. */
export const CUT = TRACK.r + GAP + CAP_R
export const DOT_R = 2.5
export const CY = TRACK.height / 2

/** Bulge centre → the end of the break's own bar (its round cap's outer edge). Fixed per kind, not per minute. */
export const SPAN: Record<EventKind, number> = { break: 44, meal: 68 }
/** The cut at a break's end: the gap plus the round cap on either side of it. */
export const END_CUT = GAP + 2 * CAP_R
export const START_X: number = TRACK.r
export const END_X = TRACK.width - TRACK.r
/** Closest a bulge sits after the start bulge: its join, a visible cap, the gap, the bulge. */
export const FIRST_STEP = TRACK.join + CAP_R + GAP + TRACK.r

export type Checkpoint = {
  event: TimelineEvent
  /** Bulge centre. */
  x: number
  /** Where the break's bar ends; the end gap's cut runs from `cut` for END_CUT. `null` when it runs into the end bulge. */
  cut: number | null
}

/**
 * Lays the day out along the track. Time no longer maps linearly: each
 * checkpoint's break takes SPAN of bar whatever its length, so the time
 * still to come is squeezed into what's left. The past never moves — a new
 * checkpoint only re-scales what comes after it.
 */
export function layout(config: TimelineConfig) {
  const { shiftEnd } = config
  const segments: { t0: number; t1: number; x0: number; x1: number }[] = []
  const checkpoints: Checkpoint[] = []
  let cur = { t: config.shiftStart, x: START_X }
  let minX = START_X + FIRST_STEP
  for (const { event, at } of takenEvents(config)) {
    // Taken during another break: it starts once that one ends.
    const start = Math.max(at, cur.t)
    const open = shiftEnd > cur.t ? cur.x + ((start - cur.t) / (shiftEnd - cur.t)) * (END_X - cur.x) : END_X
    const x = Math.min(Math.max(open, minX), END_X - FIRST_STEP)
    segments.push({ t0: cur.t, t1: start, x0: cur.x, x1: x })
    // No room for the end gap and some bar after it: the break runs into the end bulge.
    const fits = END_X - x >= SPAN[event.kind] + END_CUT + JOIN_COVERED
    const fullEnd = fits ? x + SPAN[event.kind] : END_X
    // The break's fill starts already past the bulge's join, so the join is black (and
    // round) from the moment it's taken, never the flat end of a short fill.
    const fillFrom = Math.min(x + JOIN_COVERED, fullEnd)
    // Once it's ended, the break's bar fits the time it actually took: shorter if ended early,
    // longer if it ran over (as far as the room before the end bulge allows), and the shift's
    // bar picks up from there. Until then it keeps its planned length.
    const ended = config.breakEnds?.[event.id]
    const end = ended ?? start + event.duration
    const used = ended === undefined ? 1 : Math.max(0, (ended - start) / event.duration)
    const longest = END_X - END_CUT - JOIN_COVERED
    const barEnd = fits ? Math.min(fillFrom + (fullEnd - fillFrom) * used, Math.max(fullEnd, longest)) : END_X
    segments.push({ t0: start, t1: end, x0: fillFrom, x1: barEnd })
    checkpoints.push({ event, x, cut: fits ? barEnd - CAP_R : null })
    // The bar resumes past the gap; at the break's end the black fills its round cap.
    cur = { t: end, x: fits ? barEnd + GAP + 2 * CAP_R : END_X }
    minX = cur.x + CUT
  }
  segments.push({ t0: cur.t, t1: shiftEnd, x0: cur.x, x1: END_X })

  const xOf = (t: number) => {
    if (t <= config.shiftStart) return START_X
    const seg = segments.find((g) => t < g.t1) ?? segments[segments.length - 1]
    if (t >= seg.t1) return seg.x1
    return seg.x0 + ((t - seg.t0) / (seg.t1 - seg.t0)) * (seg.x1 - seg.x0)
  }
  const nowX = config.now === null ? null : xOf(config.now)

  // Breaks and meals still to come: spread evenly after the elapsed time and the
  // last break's bar, up to the end bulge's left edge (as in V1).
  const anchor = Math.max(START_X + TRACK.r, config.now !== null && config.now > config.shiftStart ? nowX! : 0, cur.x)
  const limit = END_X - TRACK.r
  const upcoming = remainingEvents(config)
  const dots = anchor < limit ? upcoming.map((e, i) => ({ e, x: anchor + ((i + 1) / (upcoming.length + 1)) * (limit - anchor) })) : []

  return { checkpoints, nowX, dots }
}

/** The curved join between a bulge at `cx` and the bar, on the `side` facing the bar. Figma's own curve values. */
export function joinPath(cx: number, side: 1 | -1) {
  const x = (d: number) => cx + side * d
  return `M${x(9.923)} 4.6027 C${x(11.488)} 6.4506 ${x(13.579)} 8 ${x(TRACK.join)} 8 L${x(TRACK.join)} 18 C${x(13.579)} 18 ${x(11.488)} 19.5494 ${x(9.923)} 21.3973 Z`
}

/**
 * A bulge's join ends in a flat edge `TRACK.join` past its centre. A black
 * fill shorter than that plus its round cap would end on that flat edge, so
 * the black join is drawn only once the fill is long enough to cover it.
 */
export const JOIN_COVERED = TRACK.join + CAP_R


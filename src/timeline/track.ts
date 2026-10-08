import { remainingEvents, takenEvents, TRACK, type EventKind, type TimelineConfig, type TimelineEvent } from "./model"

/*
 * The shift timeline's geometry and layout, shared by its drawings: the static
 * one the widgets use (ShiftTimelineStatic — Android widgets can't animate), in
 * wireframe and hi-fi, and the animated reference (ShiftTimelineV2).
 */

export const INK = "#2c2935" // Figma content/primary — glyphs and dots
export const TRACK_FILL = "#b0b0b0" // Figma Union fill
export const PROGRESS_FILL = "#000000" // elapsed part of the shift (wireframe: black)

/**
 * A track's measurements. The wireframe uses Figma "Union" (357.404 × 26); the
 * hi-fi uses the Material timeline (Android---iOS-Widgets 100:380, 344 × 28).
 * Same anatomy — round bulges, a curved join, a 10px bar with round caps —
 * just different numbers.
 */
export type TrackGeometry = {
  width: number
  height: number
  /** Bulge radius. */
  r: number
  barTop: number
  barHeight: number
  /** How far the curved join reaches out from a bulge's centre. */
  join: number
  /** The join's curve, from where it leaves the bulge: start point and two control points (dx from centre, y). */
  curve: { x0: number; y0: number; x1: number; y1: number; x2: number }
  /** Space between a bar's round cap and what's next. */
  gap: number
  /** Bulge centre → the end of the break's own bar. */
  span: Record<EventKind, number>
  dotR: number
}

export const WIREFRAME_TRACK: TrackGeometry = {
  width: TRACK.width,
  height: TRACK.height,
  r: TRACK.r,
  barTop: TRACK.barTop,
  barHeight: TRACK.barHeight,
  join: TRACK.join,
  curve: { x0: 9.923, y0: 4.6027, x1: 11.488, y1: 6.4506, x2: 13.579 },
  gap: 5,
  span: { break: 44, meal: 68 },
  dotR: 2.5,
}

/** Figma's Material timeline (Timeline / Base Track 99:340, Active Track 97:338): 28px bulges, 4px gaps. */
export const HIFI_TRACK: TrackGeometry = {
  width: 344,
  height: 28,
  r: 14,
  barTop: 9,
  barHeight: 10,
  join: 16.5209,
  curve: { x0: 11.4686, y0: 5.96942, x1: 12.6586, y1: 7.66591, x2: 14.4486 },
  gap: 4,
  // Figma's break and meal segments are both 55 wide: the 28px bulge, then bar to 41 past its centre.
  span: { break: 41, meal: 41 },
  dotR: 2,
}

export type Checkpoint = {
  event: TimelineEvent
  /** Bulge centre. */
  x: number
  /** Where the break's bar ends; the end gap's cut runs from `cut` for END_CUT. `null` when it runs into the end bulge. */
  cut: number | null
}

export type Track = ReturnType<typeof makeTrack>

/** Everything a drawing needs for one geometry: derived measurements, the layout, and the join's path. */
export function makeTrack(g: TrackGeometry) {
  const CAP_R = g.barHeight / 2
  const GAP = g.gap
  /** How far left of a checkpoint's centre the gap's cut reaches: bulge radius + gap + the cap's own radius. */
  const CUT = g.r + GAP + CAP_R
  const CY = g.height / 2
  /** The cut at a break's end: the gap plus the round cap on either side of it. */
  const END_CUT = GAP + 2 * CAP_R
  const START_X = g.r
  const END_X = g.width - g.r
  /** Closest a bulge sits after the start bulge: its join, a visible cap, the gap, the bulge. */
  const FIRST_STEP = g.join + CAP_R + GAP + g.r
  /**
   * A bulge's join ends in a flat edge `join` past its centre. A progress fill
   * shorter than that plus its round cap would end on that flat edge, so the
   * filled join is drawn only once the fill is long enough to cover it.
   */
  const JOIN_COVERED = g.join + CAP_R

  /** The curved join between a bulge at `cx` and the bar, on the `side` facing the bar. Figma's own curve values. */
  function joinPath(cx: number, side: 1 | -1) {
    const x = (d: number) => cx + side * d
    const { x0, y0, x1, y1, x2 } = g.curve
    const top = g.barTop
    const bottom = g.barTop + g.barHeight
    const flip = (y: number) => g.height - y
    return `M${x(x0)} ${y0} C${x(x1)} ${y1} ${x(x2)} ${top} ${x(g.join)} ${top} L${x(g.join)} ${bottom} C${x(x2)} ${bottom} ${x(x1)} ${flip(y1)} ${x(x0)} ${flip(y0)} Z`
  }

  /**
   * Lays the day out along the track. Time no longer maps linearly: each
   * checkpoint's break takes its span of bar whatever its length, so the time
   * still to come is squeezed into what's left. The past never moves — a new
   * checkpoint only re-scales what comes after it.
   */
  function layout(config: TimelineConfig) {
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
      const fits = END_X - x >= g.span[event.kind] + END_CUT + JOIN_COVERED
      const fullEnd = fits ? x + g.span[event.kind] : END_X
      // The break's fill starts already past the bulge's join, so the join is filled (and
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
      // The bar resumes past the gap; at the break's end the fill takes its round cap.
      cur = { t: end, x: fits ? barEnd + GAP + 2 * CAP_R : END_X }
      minX = cur.x + CUT
    }
    segments.push({ t0: cur.t, t1: shiftEnd, x0: cur.x, x1: END_X })

    const xOf = (t: number) => {
      if (t <= config.shiftStart) return START_X
      const seg = segments.find((s) => t < s.t1) ?? segments[segments.length - 1]
      if (t >= seg.t1) return seg.x1
      return seg.x0 + ((t - seg.t0) / (seg.t1 - seg.t0)) * (seg.x1 - seg.x0)
    }
    const nowX = config.now === null ? null : xOf(config.now)

    // Breaks and meals still to come: spread evenly after the elapsed time and the
    // last break's bar, up to the end bulge's left edge.
    const anchor = Math.max(START_X + g.r, config.now !== null && config.now > config.shiftStart ? nowX! : 0, cur.x)
    const limit = END_X - g.r
    const upcoming = remainingEvents(config)
    const dots = anchor < limit ? upcoming.map((e, i) => ({ e, x: anchor + ((i + 1) / (upcoming.length + 1)) * (limit - anchor) })) : []

    return { checkpoints, nowX, dots }
  }

  return { g, CAP_R, GAP, CUT, CY, END_CUT, START_X, END_X, FIRST_STEP, JOIN_COVERED, joinPath, layout }
}

/** The wireframe track, as named exports (Timeline 2's animated reference uses these). */
export const WIRE = makeTrack(WIREFRAME_TRACK)
export const HIFI = makeTrack(HIFI_TRACK)
export const { CAP_R, GAP, CUT, CY, END_CUT, START_X, END_X, FIRST_STEP, JOIN_COVERED, joinPath, layout } = WIRE
export const SPAN = WIREFRAME_TRACK.span
export const DOT_R = WIREFRAME_TRACK.dotR

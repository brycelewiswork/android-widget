/*
 * The shift timeline's data: a shift, the breaks and meals inside it, and the
 * time of day. Everything the track draws (marker positions, progress, which
 * event is active) is derived from this, so a sub-state is just a config.
 */

export type EventKind = "break" | "meal"

export type TimelineEvent = {
  id: string
  kind: EventKind
  /** Minutes since midnight. */
  start: number
  /** Length in minutes. */
  duration: number
}

export type TimelineConfig = {
  /** Minutes since midnight. */
  shiftStart: number
  shiftEnd: number
  events: TimelineEvent[]
  /** Time of day in minutes since midnight; `null` is a static track with no progress. */
  now: number | null
  /**
   * No upcoming shift: draw only the track's outline and keep the label row's
   * height, with nothing in it — so the widget's layout doesn't move.
   */
  empty?: boolean
  /** Breaks and meals already taken: event id → the time of day it was taken. */
  taken?: Record<string, number>
  /**
   * Wall-clock time (ms) a checkpoint last appeared or went away (take, reset,
   * scrubbing back) — lets the track animate the render that follows it.
   */
  lastChangeAt?: number
  /**
   * Wall-clock time (ms) the time of day last crossed the shift's start, either
   * way. The widgets rebuild on that crossing (it changes their state), so the
   * fresh timeline reads this to play the start bulge filling or emptying.
   */
  lastStartCrossAt?: number
  /** Same, for crossing the shift's end — plays the end bulge filling or emptying. */
  lastEndCrossAt?: number
  /**
   * The shift is finished (clocked out): the track fills to the end, the end
   * bulge fills, and the gaps close up. `lastCompleteAt` stamps the change, as
   * the other stamps do, so the track plays it.
   */
  complete?: boolean
  lastCompleteAt?: number
  /** Time of day the worker clocked in / out (the widget pages' live widget). */
  clockIn?: number
  clockOut?: number
  /**
   * The worker's next shift after this one, for what the widget shows once the
   * clock-out celebration is over: none, one starting 1.5h after this one ends
   * (a double), or the same hours tomorrow.
   */
  nextShift?: NextShift
  /** When the worker opened the app after clocking out (they've seen their earnings there). */
  seenAt?: number
  /** The worker's hourly pay, for the estimated earnings shown after clocking out. */
  payRate?: number
  /** Breaks and meals ended early: event id → when. Otherwise one ends after its planned length. */
  breakEnds?: Record<string, number>
}

export type NextShift = "none" | "soon" | "tomorrow"

/** Start of the next shift in minutes from this shift's midnight (past 1440 is tomorrow), or undefined. */
export function nextShiftStart(config: TimelineConfig): number | undefined {
  if (config.nextShift === "soon") return config.shiftEnd + 90
  if (config.nextShift === "tomorrow") return config.shiftStart + 24 * 60
  return undefined
}

export type EventStatus = "done" | "active" | "upcoming"

export type Phase =
  | { kind: "empty" }
  | { kind: "static" }
  | { kind: "before" }
  | { kind: "working" }
  | { kind: "on-event"; event: TimelineEvent; index: number }
  | { kind: "after" }

// ── Geometry (Figma "Union", 357.404 × 26) ─────────────────────────────────

export const TRACK = {
  width: 357.404,
  height: 26,
  /** Bulge radius; the start and end bulges sit at r and width − r. */
  r: 13,
  /** The bar between bulges: y 8–18. */
  barTop: 8,
  barHeight: 10,
  /** How far the curved join reaches out from a bulge's centre. */
  join: 16.001,
  /** Space between the bar's round cap and a checkpoint's bulge (from the 5× reference: ~8.6). */
  gap: 8.6,
} as const

const START_X = TRACK.r
const END_X = TRACK.width - TRACK.r
/**
 * The closest two checkpoints (or the start and a checkpoint) can sit: the
 * earlier bulge's join, a visible round cap, the gap, then the next bulge.
 */
const CHECKPOINT_STEP = TRACK.join + TRACK.barHeight / 2 + TRACK.gap + TRACK.r

/** x of a time of day on the track, clamped to the shift. */
export function xAt(config: TimelineConfig, minutes: number) {
  const span = config.shiftEnd - config.shiftStart
  const t = span > 0 ? (minutes - config.shiftStart) / span : 0
  return START_X + Math.min(1, Math.max(0, t)) * (END_X - START_X)
}

/** Taken events, in the order they were taken, that have happened by `now`. */
export function takenEvents(config: TimelineConfig): { event: TimelineEvent; at: number }[] {
  const { taken = {}, now } = config
  return config.events
    .filter((e) => taken[e.id] !== undefined && (now === null || taken[e.id] <= now))
    .map((e) => ({ event: e, at: taken[e.id] }))
    .sort((a, b) => a.at - b.at)
}

/**
 * The break or meal underway at `now`, if any. A break only ends when the
 * worker ends it (End break, or clocking out) — it can't end itself, so one
 * that runs past its planned length is still underway. `due` is when it was
 * planned to end.
 */
export function activeBreak(config: TimelineConfig): { event: TimelineEvent; at: number; due: number } | undefined {
  const { now } = config
  if (now === null) return undefined
  const found = takenEvents(config)
    .filter((t) => {
      const ended = config.breakEnds?.[t.event.id]
      return t.at <= now && (ended === undefined || now < ended)
    })
    .map((t) => ({ ...t, due: t.at + t.event.duration }))
  return found[found.length - 1]
}

/** Breaks can be taken only while the shift is underway. */
export const canTake = (config: TimelineConfig) =>
  !config.empty && config.now !== null && config.now >= config.shiftStart && config.now < config.shiftEnd

/** Planned events not taken yet, in plan order. */
export function remainingEvents(config: TimelineConfig): TimelineEvent[] {
  const done = new Set(takenEvents(config).map((t) => t.event.id))
  return sortedEvents(config).filter((e) => !done.has(e.id))
}

/**
 * Where each marker sits. A taken break or meal sits where it was taken.
 * Ones still to come never mark a time to take them — they're spread evenly
 * between the leading edge of the elapsed time (the start bulge's right edge,
 * before it begins; past the last checkpoint's bulge after one) and the end
 * bulge's left edge. So the edge never reaches a dot: as the day goes on,
 * they compress toward the end, and drop out when there's no room left.
 */
export function markerXs(config: TimelineConfig): { start: number; end: number; events: Map<string, number> } {
  const { now } = config
  const placed = new Map<string, number>()
  let anchor = Math.max(START_X + TRACK.r, now === null || now <= config.shiftStart ? 0 : xAt(config, now))
  // Back-to-back breaks: a checkpoint sits where it was taken, but never closer
  // than CHECKPOINT_STEP after the bulge before it, so the icons sit side by side.
  let prev: number = START_X
  for (const { event, at } of takenEvents(config)) {
    const x = Math.max(xAt(config, at), prev + CHECKPOINT_STEP)
    placed.set(event.id, x)
    prev = x
    anchor = Math.max(anchor, x + TRACK.r)
  }
  const limit = END_X - TRACK.r
  const upcoming = remainingEvents(config)
  if (anchor < limit) upcoming.forEach((e, i) => placed.set(e.id, anchor + ((i + 1) / (upcoming.length + 1)) * (limit - anchor)))
  return { start: START_X, end: END_X, events: placed }
}


// ── Derived state ──────────────────────────────────────────────────────────

export const sortedEvents = (config: TimelineConfig) => [...config.events].sort((a, b) => a.start - b.start)

export function phaseOf(config: TimelineConfig): Phase {
  if (config.empty) return { kind: "empty" }
  const { now } = config
  if (now === null) return { kind: "static" }
  if (now < config.shiftStart) return { kind: "before" }
  if (now >= config.shiftEnd) return { kind: "after" }
  const events = sortedEvents(config)
  const index = events.findIndex((e) => now >= e.start && now < e.start + e.duration)
  return index >= 0 ? { kind: "on-event", event: events[index], index } : { kind: "working" }
}

export function statusOf(config: TimelineConfig, event: TimelineEvent): EventStatus {
  const { now } = config
  if (now === null || now < event.start) return "upcoming"
  return now < event.start + event.duration ? "active" : "done"
}

/** Event dots need this much room between them, and from the end bulges' edges. */
const DOT_GAP = 8

/**
 * Events whose dot sits too close to a neighbour (or under an end bulge) to
 * read, judged on the before-the-shift layout — later in the day the dots
 * compress toward the end on purpose.
 */
export function crowdedEvents(config: TimelineConfig): Set<string> {
  const { start, end, events } = markerXs({ ...config, now: null })
  const dots = [...events].map(([id, x]) => ({ id, x })).sort((a, b) => a.x - b.x)
  const crowded = new Set<string>()
  dots.forEach((d, i) => {
    if (d.x - start < TRACK.r + DOT_GAP || end - d.x < TRACK.r + DOT_GAP) crowded.add(d.id)
    if (i > 0 && d.x - dots[i - 1].x < DOT_GAP) {
      crowded.add(d.id)
      crowded.add(dots[i - 1].id)
    }
  })
  return crowded
}

// ── Formatting ─────────────────────────────────────────────────────────────

/** 540 → "9:00 am", 1020 → "5:00 pm", 0 → "12:00 am". */
export function clockTime(minutes: number) {
  const m = ((Math.round(minutes) % 1440) + 1440) % 1440
  const h = Math.floor(m / 60)
  const suffix = h < 12 ? "am" : "pm"
  return `${h % 12 || 12}:${String(m % 60).padStart(2, "0")} ${suffix}`
}


// ── Break plan by shift length ─────────────────────────────────────────────
// A pretend rule shaped like California's: a rest break once a shift reaches
// 3.5h, then one more every 4h (2 at 6h, 3 at 10h…); a meal over 5h and a
// second over 10h. An 8h 9-to-5 gets two breaks and a lunch.

export const BREAK_MINUTES = 15
export const MEAL_MINUTES = 30
const PLAN_STEP = 15

export function plannedCounts(lengthMinutes: number) {
  const hours = lengthMinutes / 60
  const breaks = hours < 3.5 ? 0 : 1 + Math.floor((hours - 2) / 4)
  const meals = hours > 10 ? 2 : hours > 5 ? 1 : 0
  return { breaks, meals }
}

/**
 * The planned breaks and meals for a shift: evenly spaced in time (so a break
 * taken on time doesn't jump when it begins), meals toward the middle —
 * B·M·B for a 9-to-5, B·M·B·M·B for a 12h shift.
 */
export function planEvents(shiftStart: number, shiftEnd: number): TimelineEvent[] {
  const { breaks, meals } = plannedCounts(shiftEnd - shiftStart)
  return arrangeEvents(breaks, meals, shiftStart, shiftEnd)
}

/** Every way to pick `k` of `0…n-1`, in order. Small n only (≤ 8 events). */
function combinations(n: number, k: number, from = 0): number[][] {
  if (k === 0) return [[]]
  const out: number[][] = []
  for (let i = from; i <= n - k; i++) for (const rest of combinations(n, k - 1, i + 1)) out.push([i, ...rest])
  return out
}

/**
 * The order breaks and meals run in. Meals are placed, in priority: never two
 * in a row, off the shift's first and last slots (first worse than last), then
 * as close as possible to evenly spread — B·M·B, B·M·B·M, B·M·B·M·B,
 * B·M·B·B·M·B.
 */
function arrangeKinds(breaks: number, meals: number): EventKind[] {
  const n = breaks + meals
  let best: number[] = []
  let bestScore = -Infinity
  for (const slots of combinations(n, meals)) {
    const adjacent = slots.slice(1).filter((x, i) => x - slots[i] === 1).length
    const ends = (slots.includes(0) ? 101 : 0) + (slots.includes(n - 1) && n > 1 ? 100 : 0)
    const drift = slots.reduce((sum, x, k) => sum + Math.abs(x - (((k + 1) * (n + 1)) / (meals + 1) - 1)), 0)
    const score = -adjacent * 1000 - ends - drift
    if (score > bestScore) [best, bestScore] = [slots, score]
  }
  const mealSlots = new Set(best)
  return Array.from({ length: n }, (_, i) => (mealSlots.has(i) ? "meal" : "break"))
}

/**
 * `breaks` + `meals` laid out the planned way: arranged by `arrangeKinds`,
 * evenly spaced in time. `ids` (per kind, in order) are reused so markers
 * keep their identity across edits.
 */
export function arrangeEvents(
  breaks: number,
  meals: number,
  shiftStart: number,
  shiftEnd: number,
  ids: Partial<Record<EventKind, string[]>> = {},
): TimelineEvent[] {
  const kinds = arrangeKinds(breaks, meals)
  const used: Record<EventKind, number> = { break: 0, meal: 0 }
  return kinds.map((kind, i) => {
    const t = shiftStart + ((i + 1) / (kinds.length + 1)) * (shiftEnd - shiftStart)
    const nth = used[kind]++
    return {
      id: ids[kind]?.[nth] ?? `${kind === "meal" ? "m" : "b"}${nth + 1}`,
      kind,
      start: Math.round(t / PLAN_STEP) * PLAN_STEP,
      duration: kind === "meal" ? MEAL_MINUTES : BREAK_MINUTES,
    }
  })
}


// ── Presets: the sub-states ────────────────────────────────────────────────

const at = (h: number, m = 0) => h * 60 + m

const NINE_TO_FIVE = { shiftStart: at(9), shiftEnd: at(17) }
/** A shift with its planned breaks and meals. A 9-to-5: breaks at 11 am and 3 pm, lunch at 1 pm. */
const planned = (shiftStart: number, shiftEnd: number, now: number | null): TimelineConfig => ({
  shiftStart,
  shiftEnd,
  events: planEvents(shiftStart, shiftEnd),
  now,
})
const nineToFive = (now: number | null) => planned(NINE_TO_FIVE.shiftStart, NINE_TO_FIVE.shiftEnd, now)

export const PRESETS = [
  { id: "planned", label: "Planned 9-to-5", note: "Move through the day with time of day", config: nineToFive(null) },
  { id: "empty", label: "Empty", note: "No upcoming shifts", config: { ...nineToFive(null), empty: true } },
] as const satisfies readonly { id: string; label: string; note: string; config: TimelineConfig }[]

export type PresetId = (typeof PRESETS)[number]["id"]

/** Fresh copy of a preset's config (presets are shared constants). */
export const presetConfig = (id: PresetId): TimelineConfig => {
  const c = PRESETS.find((p) => p.id === id)!.config
  return { ...c, events: c.events.map((e) => ({ ...e })) }
}

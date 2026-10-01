import type { Precision } from "@/store/useWidgetStore"
import { activeBreak, clockTime, nextShiftStart, remainingEvents, type TimelineConfig, type TimelineEvent } from "@/timeline/model"
import { formatElapsed, formatUntil, type StateContent, type WidgetStateId } from "./states"

/*
 * The live widget on each size page: the widget state, live minutes and real
 * clock times that follow the shift timeline plus the worker's own actions
 * (clock in / out, breaks), all from useTimelineStore.
 */

export type LiveStatus =
  | { kind: "empty" }
  | { kind: "off" }
  | { kind: "working" }
  /** `due`: when it was planned to end. It keeps going past that until it's ended. */
  | { kind: "break"; meal: boolean; start: number; due: number }
  | { kind: "out" }

export function liveStatus(config: TimelineConfig): LiveStatus {
  if (config.empty) return { kind: "empty" }
  const { now, clockIn, clockOut } = config
  if (now === null || clockIn === undefined || clockIn > now) return { kind: "off" }
  if (clockOut !== undefined && clockOut <= now) return { kind: "out" }
  const active = activeBreak(config)
  return active ? { kind: "break", meal: active.event.kind === "meal", start: active.at, due: active.due } : { kind: "working" }
}

/*
 * Calm precision: a clock that ticks every minute reads as pressure, so the
 * live widget counts in coarse steps and gets finer only as a moment that
 * matters gets close. Countdowns round down, so it never promises more slack
 * than there is.
 *   Upcoming: half hours past an hour out (as in Exact), then 15m steps, then
 *     5m steps in the last 15, then minutes in the last 5.
 *   On the clock: 15m steps, after a welcome for the first 15 (see welcome).
 *   Break and meal: 5m steps, then minutes in the last 5.
 *   Shift ending: 5m steps, then minutes in the last 5.
 */
const floorTo = (minutes: number, step: number) => Math.floor(minutes / step) * step

function calmUntil(minutes: number) {
  if (minutes > 60) return minutes
  if (minutes > 15) return Math.max(15, floorTo(minutes, 15))
  if (minutes > 5) return floorTo(minutes, 5)
  return minutes
}
const calmEnding = (minutes: number) => (minutes > 5 ? floorTo(minutes, 5) : minutes)

/**
 * Right after clocking in, the count-up would read "0m" — and this is the one
 * moment someone is sure to be looking. So greet them for the time of day and
 * confirm the clock-in time in the subtitle instead. Shown for the first 15
 * minutes in Calm (until the first step), the first minute in Exact.
 */
function welcome(clockIn: number): Partial<StateContent> {
  const h = Math.floor((((clockIn % 1440) + 1440) % 1440) / 60)
  const lead = h >= 5 && h < 12 ? "Morning, you're in" : h >= 12 && h < 17 ? "Afternoon, you're in" : h >= 17 && h < 22 ? "Evening, you're in" : "You're in, night owl"
  return { lead, value: "", ticker: undefined, sub: `Clocked in at ${clockTime(clockIn)}` }
}

/*
 * A nudge toward a break or meal still unused late in the shift — asked twice,
 * briefly, then quiet (a question that stays up stops being read):
 *   First ask: 15 minutes from two hours before the end.
 *   Last chance: the 10 minutes before it stops fitting (its length plus a
 *     15-minute buffer before the end — 30–40m left for a break, 45–55m for a meal).
 * Otherwise it's the usual on-the-clock widget. A meal goes first: it's the
 * longer one, so the first to run out of room. Taking it ends the nudge, so the
 * widget never needs to know whether they said no.
 */
const FIRST_ASK_FROM = 120
const FIRST_ASK_FOR = 15
const LAST_ASK_FOR = 10
const ROOM_BUFFER = 15

function suggestedBreak(config: TimelineConfig, now: number): { event: TimelineEvent; last: boolean } | undefined {
  const left = config.shiftEnd - now
  const room = (e: TimelineEvent) => e.duration + ROOM_BUFFER
  const remaining = remainingEvents(config)
  const pick = remaining.find((e) => e.kind === "meal" && left >= room(e)) ?? remaining.find((e) => e.kind === "break" && left >= room(e))
  if (!pick) return undefined
  if (left <= room(pick) + LAST_ASK_FOR) return { event: pick, last: true }
  if (left <= FIRST_ASK_FROM && left > FIRST_ASK_FROM - FIRST_ASK_FOR) return { event: pick, last: false }
  return undefined
}

/** How long the clock-out celebration stays up before the widget moves on to what's next. */
const CELEBRATE_FOR = 60
/** …or this long when the next shift starts within NEXT_SHIFT_SOON of clocking out (a double). */
const CELEBRATE_BRIEFLY = 15
const NEXT_SHIFT_SOON = 120
const DAY = 24 * 60
/** Pay rate when none is set (the panel's default). */
export const DEFAULT_PAY_RATE = 18

/**
 * Pay for the shift just finished: clock-in to clock-out at the hourly rate,
 * less meals (unpaid; rest breaks are paid). An estimate — no overtime, tips
 * or deductions.
 */
export function estimatedEarnings(config: TimelineConfig) {
  const { clockIn, clockOut, taken = {}, breakEnds = {} } = config
  if (clockIn === undefined || clockOut === undefined) return 0
  const meals = config.events
    .filter((e) => e.kind === "meal" && taken[e.id] !== undefined)
    .reduce((sum, e) => sum + Math.max(0, Math.min(breakEnds[e.id] ?? clockOut, clockOut) - taken[e.id]), 0)
  return (Math.max(0, clockOut - clockIn - meals) / 60) * (config.payRate ?? DEFAULT_PAY_RATE)
}

const money = (dollars: number) => dollars.toLocaleString("en-US", { style: "currency", currency: "USD" })

/**
 * The 4×1's meal / break icon buttons on the clock: only the kinds with one
 * still to take. None left: the single Clock Out button instead.
 */
function compactActions(config: TimelineConfig): Partial<StateContent> {
  const left = new Set(remainingEvents(config).map((e) => e.kind))
  // Meal secondary, break primary (last, black); whichever is left alone becomes the primary.
  const icons = [left.has("meal") && "meal", left.has("break") && "coffee"].filter((i): i is "coffee" | "meal" => !!i)
  return icons.length ? { compactStyle: "pair", compactIcons: icons } : { compactStyle: "primary-icon", compact: "timeclock" }
}

/**
 * The shift's end, once it's near: "Shift ends in 15m" in its last hour, then
 * past it "Time to clock out" / "Shift ended 10m ago" (nothing can clock them
 * out but them). Undefined earlier in the shift.
 */
function shiftEndWidget(config: TimelineConfig, now: number, calm: boolean): LiveWidget | undefined {
  const left = config.shiftEnd - now
  if (left <= 0) {
    const over = calm ? calmEnding(Math.floor(-left)) : Math.floor(-left)
    if (over < 1) {
      return {
        state: "overtime",
        copy: { lead: "Time to clock out", value: "", trail: undefined, ticker: undefined, sub: `Shift ended at ${clockTime(config.shiftEnd)}` },
        timeline: config,
      }
    }
    return { state: "overtime", minutes: over, timeline: config }
  }
  if (left <= 60) return { state: "ending", minutes: calm ? calmEnding(Math.floor(left)) : Math.ceil(left), timeline: config }
  return undefined
}

/**
 * What's left to take, as actions: both → the primary plus a second one beside
 * it on the 4×2 / 4×3 (`alt`); one → just that as the primary; none → Clock Out.
 * The primary is the break unless `meal` puts the meal first (a meal nudge).
 */
function onClockActions(config: TimelineConfig, meal = false): Partial<StateContent> {
  const left = new Set(remainingEvents(config).map((e) => e.kind))
  const take = { break: { icon: "coffee", label: "Take break" }, meal: { icon: "meal", label: "Take meal" } } as const
  const kinds = (meal ? (["meal", "break"] as const) : (["break", "meal"] as const)).filter((k) => left.has(k))
  if (kinds.length === 0) return { primary: { icon: "timeclock", label: "Clock Out" }, alt: undefined }
  return { primary: take[kinds[0]], alt: kinds[1] ? take[kinds[1]] : undefined }
}

/** 540 → "9 am", 570 → "9:30 am" — the headline's start time. */
const shortTime = (minutes: number) => clockTime(minutes).replace(":00", "")

export type LiveWidget = {
  state: WidgetStateId
  minutes?: number
  copy?: Partial<StateContent>
  /** What the 4×2 / 4×3 timeline draws: no progress until clocked in, frozen at clock-out. */
  timeline: TimelineConfig
}

export function liveWidget(config: TimelineConfig, precision: Precision = "exact"): LiveWidget {
  const calm = precision === "calm"
  const status = liveStatus(config)
  const now = config.now ?? config.shiftStart
  switch (status.kind) {
    case "empty":
      return { state: "no-shifts", timeline: config }
    case "out": {
      const out = config.clockOut!
      const next = nextShiftStart(config)
      // The celebration ends at the first of: its hour (15m when the next shift is
      // within 2h — that matters more), midnight (it says "today"), or opening the app.
      const soon = next !== undefined && next - out <= NEXT_SHIFT_SOON
      const midnight = (Math.floor(out / DAY) + 1) * DAY
      const until = Math.min(out + (soon ? CELEBRATE_BRIEFLY : CELEBRATE_FOR), midnight)
      const seen = config.seenAt !== undefined && config.seenAt >= out
      if (now < until && !seen) {
        return {
          state: "shift-done",
          copy: { sub: `Est. earnings ${money(estimatedEarnings(config))}` },
          // The day done: the track fills out and closes up (see the timeline's finish).
          timeline: { ...config, now: out, complete: true },
        }
      }
      // Then what's next: the next shift's countdown, or nothing scheduled.
      if (next !== undefined && next > now) {
        const minutes = Math.ceil(next - now)
        return {
          state: "upcoming",
          minutes: calm ? calmUntil(minutes) : minutes,
          copy: { trail: `at ${shortTime(next)}` },
          // Its own day: the plan, nothing elapsed or taken yet.
          timeline: { ...config, now: null, taken: {}, clockIn: undefined, clockOut: undefined },
        }
      }
      return { state: "no-shifts", timeline: { ...config, now: out } }
    }
    case "off": {
      const notStarted = { ...config, now: config.now === null ? null : Math.min(now, config.shiftStart - 1) }
      if (config.now === null || now < config.shiftStart) {
        return {
          state: "upcoming",
          minutes: config.now === null ? undefined : (calm ? calmUntil : (m: number) => m)(Math.ceil(config.shiftStart - now)),
          copy: { trail: `at ${shortTime(config.shiftStart)}` },
          timeline: notStarted,
        }
      }
      // Past the start and not clocked in yet ("now" rather than "0m ago").
      const late = calm ? calmEnding(Math.floor(now - config.shiftStart)) : Math.floor(now - config.shiftStart)
      if (late < 1) return { state: "upcoming", copy: { lead: "Shift starts now", value: "", trail: undefined, ticker: undefined }, timeline: notStarted }
      return {
        state: "upcoming",
        copy: {
          lead: "Shift started",
          value: formatElapsed(late),
          trail: "ago",
          ticker: { slot: "value", minutes: late, format: formatElapsed },
        },
        timeline: notStarted,
      }
    }
    case "break": {
      const meal = status.meal
      const primary = meal ? { primary: { icon: "timeclock", label: "End meal" } as const } : {}
      const back = `Back by ${clockTime(status.due)}`
      // The shift's end outranks a break that's run over: past the end it's time to clock
      // out, and in the last hour an overdue break reads as the shift ending. (Clocking out
      // ends the break too.)
      const end = shiftEndWidget(config, now, calm)
      if (end && (now >= config.shiftEnd || now >= status.due)) return end
      // The first minute: a send-off instead of the countdown, the return time underneath.
      if (now - status.start < 1) {
        return {
          state: "break",
          copy: { lead: meal ? "Enjoy your meal" : "Enjoy your break", value: "", ticker: undefined, sub: back, ...primary },
          timeline: config,
        }
      }
      // Past its planned end and not ended yet (a break can't end itself): say how long ago
      // it was due, as "Shift started … ago" does before clocking in.
      if (now >= status.due) {
        const over = Math.floor(now - status.due)
        if (over < 1) {
          return { state: "break", copy: { lead: meal ? "Meal's over" : "Break's over", value: "", ticker: undefined, sub: back, ...primary }, timeline: config }
        }
        const late = calm ? calmEnding(over) : over
        return {
          state: "break",
          copy: {
            lead: meal ? "Meal ended" : "Break ended",
            value: formatElapsed(late),
            trail: "ago",
            ticker: { slot: "value", minutes: late, format: formatElapsed },
            sub: `Due back at ${clockTime(status.due)}`,
            ...primary,
          },
          timeline: config,
        }
      }
      return {
        state: "break",
        // In Calm, 5m steps (exact in the last 5), rounded down so it never promises more break than is left.
        minutes: calm ? calmEnding(Math.floor(status.due - now)) : Math.ceil(status.due - now),
        copy: { sub: back, ...(meal && { lead: "Meal ends in" }), ...primary },
        timeline: config,
      }
    }
    case "working": {
      const left = config.shiftEnd - now
      const suggest = suggestedBreak(config, now)
      if (suggest) {
        const meal = suggest.event.kind === "meal"
        const until = formatUntil(Math.floor(left))
        return {
          state: "break-nudge",
          copy: {
            ...compactActions(config),
            sub: suggest.last ? `Last chance, ${until} left` : `${until} until you're off`,
            ...onClockActions(config, meal),
            ...(meal && { lead: "Time for your meal?" }),
          },
          timeline: config,
        }
      }
      const end = shiftEndWidget(config, now, calm)
      if (end) return end
      const worked = Math.floor(now - config.clockIn!)
      if (worked < (calm ? 15 : 1)) return { state: "clocked-in", copy: { ...welcome(config.clockIn!), ...compactActions(config), ...onClockActions(config) }, timeline: config }
      return {
        state: "clocked-in",
        minutes: calm ? floorTo(worked, 15) : worked,
        copy: { sub: `Shift ends at ${clockTime(config.shiftEnd)}`, ...compactActions(config), ...onClockActions(config) },
        timeline: config,
      }
    }
  }
}

import type { Precision } from "@/store/useWidgetStore"
import { activeBreak, clockTime, nextShiftStart, remainingEvents, type TimelineConfig, type TimelineEvent } from "@/timeline/model"
import { CLOCK_OUT_TITLES, formatElapsed, formatUntil, type IconName, type StateContent, type WidgetStateId } from "./states"

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
function shiftEndWidget(config: TimelineConfig, now: number, calm: boolean, working = false): LiveWidget | undefined {
  const left = config.shiftEnd - now
  // Figma: near the end, an unused break comes along as the secondary action; with both kinds
  // unused, they're icon squares (like Message) before Clock out.
  const unused = working ? leftToTake(config) : []
  const extras: Partial<StateContent> =
    unused.length === 1 ? { alt: TAKE[unused[0]] } : unused.length > 1 ? { squares: unused.map((k) => TAKE[k].icon) } : {}
  if (left <= 0) {
    const over = calm ? calmEnding(Math.floor(-left)) : Math.floor(-left)
    if (over < 1) {
      return {
        state: "overtime",
        copy: { lead: "Time to clock out", value: "", trail: undefined, ticker: undefined, sub: `Shift ended at ${clockTime(config.shiftEnd)}`, ...extras },
        timeline: config,
      }
    }
    return { state: "overtime", minutes: over, copy: extras, timeline: config }
  }
  if (left <= 60) return { state: "ending", minutes: calm ? calmEnding(Math.floor(left)) : Math.ceil(left), copy: extras, timeline: config }
  return undefined
}

/**
 * What's left to take, as actions: both → the primary plus a second one beside
 * it on the 4×2 / 4×3 (`alt`); one → just that as the primary; none → Clock Out.
 * The primary is the break unless `meal` puts the meal first (a meal nudge).
 */
const TAKE = { break: { icon: "coffee", label: "Take break" }, meal: { icon: "meal", label: "Take meal" } } as const satisfies Record<string, { icon: IconName; label: string }>

/** The kinds of break still to take today: meal first, then break. */
function leftToTake(config: TimelineConfig): ("meal" | "break")[] {
  const left = new Set(remainingEvents(config).map((e) => e.kind))
  return (["meal", "break"] as const).filter((k) => left.has(k))
}

function onClockActions(config: TimelineConfig, meal = false): Partial<StateContent> {
  const left = new Set(remainingEvents(config).map((e) => e.kind))
  const kinds = (meal ? (["meal", "break"] as const) : (["break", "meal"] as const)).filter((k) => left.has(k))
  if (kinds.length === 0) return { primary: { icon: "timeclock", label: "Clock out" }, alt: undefined }
  return { primary: TAKE[kinds[0]], alt: kinds[1] ? TAKE[kinds[1]] : undefined }
}

const DAY_MINUTES = 24 * 60

/**
 * The next shift, seen from between shifts. On its own day it's the countdown
 * ("Next shift in 2h at 9 am"); before that, no clock ticking toward it — just
 * when they're next on: "Off until tomorrow" / "Off until Sunday", "Next shift at 9 am".
 */
function nextShiftWidget(config: TimelineConfig, next: number, now: number, calm: boolean): LiveWidget {
  // The next shift's own day, on its plan: nothing elapsed or taken yet.
  const timeline = { ...config, now: null, taken: {}, breakEnds: {}, clockIn: undefined, clockOut: undefined, complete: undefined }
  const days = Math.floor(next / DAY_MINUTES) - Math.floor(now / DAY_MINUTES)
  if (days <= 0) {
    const minutes = Math.ceil(next - now)
    return { state: "upcoming", minutes: calm ? calmUntil(minutes) : minutes, copy: { trail: `at ${shortTime(next)}` }, timeline }
  }
  const day = new Date()
  day.setDate(day.getDate() + days)
  const until = days === 1 ? "tomorrow" : day.toLocaleDateString("en-US", { weekday: "long" })
  return { state: "off", copy: { lead: `Off until ${until}`, sub: `Next shift at ${shortTime(next)}` }, timeline }
}

/** 540 → "9am", 570 → "9:30am" — the headline's start time (Figma: "at 9am"). */
const shortTime = (minutes: number) => clockTime(minutes).replace(":00", "").replace(" ", "")

export type LiveWidget = {
  state: WidgetStateId
  minutes?: number
  copy?: Partial<StateContent>
  /** What the 4×2 / 4×3 timeline draws: no progress until clocked in, frozen at clock-out. */
  timeline: TimelineConfig
}

/**
 * What the live widget shows. Offline (`config.offlineAt`), it still runs on
 * what it last knew, but the subtitle says so: "Offline • updated 9:41 am".
 */
export function liveWidget(config: TimelineConfig, precision: Precision = "exact"): LiveWidget {
  const live = liveWidgetOnline(config, precision)
  const { offlineAt, now } = config
  if (offlineAt === undefined || now === null || now < offlineAt || config.empty) return live
  return { ...live, copy: { ...live.copy, sub: `Offline • updated ${clockTime(offlineAt)}` } }
}

function liveWidgetOnline(config: TimelineConfig, precision: Precision): LiveWidget {
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
          // One of Figma's four titles, the same for the whole celebration (picked by the clock-out minute).
          copy: { lead: CLOCK_OUT_TITLES[Math.floor(out) % CLOCK_OUT_TITLES.length], sub: `Est. earnings ${money(estimatedEarnings(config))}` },
          // The day done: the track fills out and closes up (see the timeline's finish).
          timeline: { ...config, now: out, complete: true },
        }
      }
      // Then what's next: between shifts until the next one's day, then its countdown — or nothing scheduled.
      if (next !== undefined && next > now) return nextShiftWidget(config, next, now, calm)
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
      const back = `back by ${clockTime(status.due)}`
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
            // Figma: "Time for your [break]?" first, then "Take a break?" as the last chance.
            lead: suggest.last ? (meal ? "Take a meal?" : "Take a break?") : meal ? "Time for your meal?" : "Time for your break?",
          },
          timeline: config,
        }
      }
      const end = shiftEndWidget(config, now, calm, true)
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

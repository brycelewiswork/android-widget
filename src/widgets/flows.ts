import { presetConfig, type TimelineConfig } from "@/timeline/model"
import { WIDGET_STATES, type StateContent, type WidgetStateId } from "./states"

/*
 * The paths a worker takes through the widget's states, for the size pages'
 * state documentation. Each step is a state; `via` is what moves them into it
 * (the label on the arrow before it). A flow without arrows (All states) is
 * just the reference set.
 */

export type FlowStep = {
  state: WidgetStateId
  via?: string
  /** Shown above the widget in place of the state's name (a variant, like offline). */
  label?: string
  /** Copy on top of the state's default (the offline subtitle). */
  copy?: Partial<StateContent>
}
export type Flow = { id: string; label: string; note: string; steps: readonly FlowStep[]; arrows?: boolean }

export const FLOWS: readonly Flow[] = [
  {
    id: "shift",
    label: "Shift day",
    note: "A shift from start to finish: clock in, take a break, wrap up, clock out.",
    steps: [
      { state: "upcoming" },
      { state: "clocked-in", via: "Clock in" },
      { state: "break", via: "Take break" },
      { state: "clocked-in", via: "End break" },
      { state: "ending", via: "Last hour" },
      { state: "shift-done", via: "Clock out" },
      { state: "off", via: "An hour later" },
    ],
  },
  {
    id: "between",
    label: "Between shifts",
    note: "Where the widget spends most of its time: calm until the day of the next shift, then counting down to it.",
    steps: [
      { state: "shift-done" },
      { state: "off", via: "An hour later" },
      { state: "upcoming", via: "Day of the shift" },
      { state: "clocked-in", via: "Clock in" },
    ],
  },
  {
    id: "breaks",
    label: "Breaks",
    note: "A break still unused late in the shift: asked twice, briefly, then taken.",
    steps: [
      { state: "clocked-in" },
      { state: "break-nudge", via: "2h left, one unused" },
      { state: "break", via: "Take break" },
      { state: "clocked-in", via: "End break" },
    ],
  },
  {
    id: "late",
    label: "Running late",
    note: "Still clocked in after the shift's planned end — only they can clock out.",
    steps: [
      { state: "ending" },
      { state: "overtime", via: "Shift end passes" },
      { state: "shift-done", via: "Clock out" },
    ],
  },
  {
    id: "offline",
    label: "Offline",
    note: "No connection: the widget keeps showing what it last knew, and the subtitle says since when. Any state can be offline.",
    steps: [
      { state: "clocked-in" },
      {
        state: "clocked-in",
        via: "Connection lost",
        label: "On the clock, offline",
        copy: { sub: "Offline · updated 3:12 pm" },
      },
      { state: "clocked-in", via: "Back online" },
    ],
  },
  {
    id: "no-shifts",
    label: "No shifts",
    note: "Signed in with nothing on the schedule.",
    steps: [{ state: "loading" }, { state: "no-shifts", via: "Nothing scheduled" }],
  },
  {
    id: "signed-out",
    label: "Signed out",
    note: "Not signed in yet, then signing in and finding a shift.",
    steps: [
      { state: "signed-out" },
      { state: "loading", via: "Sign in" },
      { state: "upcoming", via: "Shift found" },
    ],
  },
  {
    id: "all",
    label: "All states",
    note: "Every state, with its default copy.",
    steps: WIDGET_STATES.map(({ id }) => ({ state: id })),
    arrows: false,
  },
]

// ── Each state's day, for its timeline ─────────────────────────────────────
// A planned 9-to-5 (breaks 11 am and 3 pm, lunch 1 pm) at the moment each
// state's default copy describes, so the 4×2 / 4×3 tracks show that part of
// the day — progress, the breaks taken by then, the finished track.

const at = (h: number, m = 0) => h * 60 + m
/** Morning break 11:00–11:15 and lunch 1:00–1:30, taken on time. */
const MORNING = { taken: { b1: at(11), m1: at(13) }, breakEnds: { b1: at(11, 15), m1: at(13, 30) } }
/** …and the afternoon break, 3:00–3:15. */
const ALL_DAY = { taken: { ...MORNING.taken, b2: at(15) }, breakEnds: { ...MORNING.breakEnds, b2: at(15, 15) } }

const DAYS: Partial<Record<WidgetStateId, Partial<TimelineConfig>>> = {
  // "Next shift in 2h at 9 am"
  upcoming: { now: at(7) },
  // "On the clock for 6h 12m": past both morning breaks, the afternoon one still to come.
  "clocked-in": { now: at(15, 12), ...MORNING },
  // "Take a break?": two hours left with the afternoon break unused.
  "break-nudge": { now: at(15), ...MORNING },
  // "Break ends in 12m": three minutes into the morning break.
  break: { now: at(11, 34), taken: { b1: at(11, 31) } },
  // "Shift ends in 15m" / "Shift ended 10m ago": every break taken.
  ending: { now: at(16, 45), ...ALL_DAY },
  overtime: { now: at(17, 10), ...ALL_DAY },
  // "Nice work today!": clocked out at 5, the track finished.
  "shift-done": { now: at(17), ...ALL_DAY, complete: true },
}

/** The timeline a state's documentation draws (the planned 9-to-5 for states with no day of their own). */
export function demoTimeline(state: WidgetStateId): TimelineConfig {
  return { ...presetConfig("planned"), ...DAYS[state] }
}

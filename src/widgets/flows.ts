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
  /** The timeline's day on top of the state's own (see demoTimeline), when the step is a different moment. */
  day?: Partial<TimelineConfig>
}
export type Flow = { id: string; label: string; note: string; steps: readonly FlowStep[]; arrows?: boolean }

const at = (h: number, m = 0) => h * 60 + m
const TAKE_BREAK = { icon: "coffee", label: "Take break" } as const
const TAKE_MEAL = { icon: "meal", label: "Take meal" } as const
const END_MEAL = { icon: "timeclock", label: "End meal" } as const

/**
 * The live widget's moments the states' defaults don't show (src/widgets/live.ts),
 * each on a 9-to-5 with the morning break at 11:31 and lunch at 1.
 */
const VARIATIONS: readonly FlowStep[] = [
  // At the start time, not clocked in: words instead of "0m".
  { state: "upcoming", label: "Shift starts now", copy: { lead: "Shift starts now", value: "", trail: undefined }, day: { now: at(8, 59) } },
  { state: "upcoming", label: "Late to clock in", copy: { lead: "Shift started", value: "10m", trail: "ago" }, day: { now: at(8, 59) } },
  // The first 15m on the clock: a greeting for the time of day instead of the count.
  {
    state: "clocked-in",
    label: "Welcome",
    copy: { lead: "Morning, you're in", value: "", sub: "Clocked in at 9:02 am" },
    day: { now: at(9, 10), taken: {}, breakEnds: {} },
  },
  // The first ask, when the one left is the meal: it goes first.
  {
    state: "break-nudge",
    label: "Meal reminder",
    copy: { lead: "Time for your meal?", primary: TAKE_MEAL, alt: TAKE_BREAK },
    day: { now: at(15), taken: { b1: at(11, 31) }, breakEnds: { b1: at(11, 46) } },
  },
  // The last ask: the 10m before it stops fitting (30–40m left for a break, 45–55m for a meal).
  {
    state: "break-nudge",
    label: "Second reminder (last chance)",
    copy: { sub: "Last chance, 40m left", primary: TAKE_BREAK, alt: undefined, compactIcons: ["coffee"] },
    day: { now: at(16, 20), taken: { b1: at(11, 31), m1: at(13) }, breakEnds: { b1: at(11, 46), m1: at(13, 30) } },
  },
  // The first minute of a break or meal: a send-off instead of the countdown.
  { state: "break", label: "Break sent off", copy: { lead: "Enjoy your break", value: "", sub: "Back by 11:46 am" }, day: { now: at(11, 31) } },
  {
    state: "break",
    label: "Meal countdown",
    copy: { lead: "Meal ends in", value: "25m", sub: "Back by 1:30 pm", primary: END_MEAL },
    day: { now: at(13, 5), taken: { b1: at(11, 31), m1: at(13) }, breakEnds: { b1: at(11, 46) } },
  },
  // Due back: it doesn't end itself, so it says when it was due.
  { state: "break", label: "Break due", copy: { lead: "Break's over", value: "", sub: "Back by 11:46 am" }, day: { now: at(11, 46) } },
  { state: "break", label: "Break overdue", copy: { lead: "Break ended", value: "5m", trail: "ago", sub: "Due back at 11:46 am" }, day: { now: at(11, 51) } },
  // The minute the shift's planned end arrives, still clocked in.
  { state: "overtime", label: "Time to clock out", copy: { lead: "Time to clock out", value: "", trail: undefined, sub: "Shift ended at 5:00 pm" }, day: { now: at(17) } },
  // Next shift 2+ days out: the weekday instead of "tomorrow".
  { state: "off", label: "Off until a weekday", copy: { lead: "Off until Sunday" } },
]

export const FLOWS: readonly Flow[] = [
  {
    id: "shift",
    label: "Shift day",
    note: "A shift from start to finish: clock in (the button spins while it waits on the server), take a break, wrap up, clock out.",
    steps: [
      { state: "upcoming" },
      // A tapped button waits on the server: its icon becomes a spinner until the action lands.
      { state: "upcoming", via: "Tap Clock In", label: "Clocking in", copy: { busy: "timeclock" } },
      { state: "clocked-in", via: "Confirmed" },
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
    id: "variations",
    label: "Variations",
    note: "Copy the live widget swaps in at particular moments, on top of each state's default. Timings are for Calm.",
    steps: VARIATIONS,
    arrows: false,
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
export function demoTimeline(state: WidgetStateId, day?: Partial<TimelineConfig>): TimelineConfig {
  return { ...presetConfig("planned"), ...DAYS[state], ...day }
}

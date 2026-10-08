import type { WidgetSize } from "./sizes"

/*
 * The eleven states every widget can be in, and the content each one shows.
 * One content model feeds every size; each size's layout picks the slots it
 * has room for (2×2: headline + primary; 4×1: headline + compact button;
 * 4×2: + timeline + secondary; 4×3: + schedule). Edit copy here.
 */

export const WIDGET_STATES = [
  { id: "signed-out", label: "Signed out" },
  { id: "loading", label: "Updating" },
  { id: "no-shifts", label: "Nothing scheduled" },
  { id: "upcoming", label: "Upcoming shift" },
  { id: "clocked-in", label: "On the clock" },
  { id: "break-nudge", label: "Break suggested" },
  { id: "break", label: "On break" },
  { id: "ending", label: "Shift ending soon" },
  { id: "overtime", label: "Past shift end" },
  { id: "shift-done", label: "Shift complete" },
  { id: "off", label: "Between shifts" },
] as const

export type WidgetStateId = (typeof WIDGET_STATES)[number]["id"]

export type IconName = "timeclock" | "coffee" | "meal" | "message" | "xmark" | "login" | "calendar"

export type Action = { icon: IconName; label: string }

export type ScheduleRow = {
  day: string
  place: string
  from: string
  to: string
  /** Active segment inside the 101px track: [left, width] in px. */
  bar: readonly [number, number]
}

export type StateContent = {
  lead: string
  value: string
  trail?: string
  sub: string
  /**
   * Whether the 4×2 / 4×3 show the shift timeline (its data lives in
   * src/timeline). `"empty"` draws its outline with no times, so a state with
   * no shift keeps the same layout.
   */
  timeline?: boolean | "empty"
  primary: Action
  /** The 2×2 shows it icon-only; the 4×2 / 4×3 as a small icon-only square at the row's start. */
  secondary?: Action
  /**
   * A second action beside the primary, not black — on the clock, Take meal
   * beside Take break. The 4×2 / 4×3 put it between the secondary and the
   * primary; the 2×2 shows it in the secondary's slot instead.
   */
  alt?: Action
  /** The 4×1's single square button. */
  compact: IconName
  /**
   * How the 4×1 shows its action:
   * - `"icon"` (default): square fill button with `compact`
   * - `"primary-icon"`: square black button with `compact`
   * - `"primary"`: labelled black button with `primary`
   * - `"pair"`: an icon square for each of `compactIcons`, the last one black
   */
  compactStyle?: "icon" | "primary-icon" | "primary" | "pair"
  /** `"pair"`: the 4×1's icon squares, secondary first and the primary (black) last — on the clock: meal, break. */
  compactIcons?: readonly IconName[]
  /** 4×3 only. `"empty"` renders the nothing-scheduled line. */
  schedule?: readonly ScheduleRow[] | "empty"
  /** Render every slot as a skeleton bone. */
  loading?: boolean
  /**
   * The headline slot driven by the live clock. Layouts render it as a rolling
   * number (`minutes` through `format`); `value`/`trail` still hold the same
   * text for anything that just wants a string.
   */
  ticker?: { slot: "value" | "trail"; minutes: number; format: (minutes: number) => string }
  /** The button (by its icon) waiting on the server after a tap: it shows a spinner in place of its icon. */
  busy?: IconName
}

// ── Time ───────────────────────────────────────────────────────────────────
// States with a clock in them. `minutes` is the live value from the live
// widget (src/widgets/live.ts); each state turns it into the copy it shows.

const hm = (minutes: number) => [Math.floor(minutes / 60), Math.floor(minutes % 60)] as const

/*
 * Durations use h / m / d, lowercase and unspaced ("6h 12m"), as in Figma.
 * Clock times (not durations) always carry am/pm.
 */

/**
 * Next shift in: minutes under an hour ("45m"); then whole half hours, rounded down
 * ("1.5h", "2h", "2.5h"); from a day out, days + whole hours ("1d 3h").
 */
export function formatUntil(minutes: number) {
  if (minutes < 60) return `${minutes}m`
  // Rounded down, like every countdown here: never promise more time than there is.
  const halfHours = Math.floor(minutes / 30) / 2
  if (halfHours < 24) return `${halfHours}h`
  const hours = Math.floor(minutes / 60)
  const d = Math.floor(hours / 24)
  const h = hours % 24
  return h === 0 ? `${d}d` : `${d}d ${h}h`
}

/** On the clock, counting up: "45m", "6h", "6h 12m". */
export function formatElapsed(minutes: number) {
  const [h, m] = hm(minutes)
  if (h === 0) return `${m}m`
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

/** Break and shift ending: always minutes ("12m", "60m"). */
export const formatMinutes = (minutes: number) => `${minutes}m`

/** Copy for a clock-driven slot: the formatted text plus the ticker that animates it. */
const timed = (slot: "value" | "trail", format: (minutes: number) => string) => (minutes: number): Partial<StateContent> => ({
  [slot]: format(minutes),
  ticker: { slot, minutes, format },
})

type StateDef = StateContent & {
  sizes?: Partial<Record<WidgetSize, Partial<StateContent>>>
  /** Copy that depends on the live time, applied after the per-size overrides. */
  time?: (minutes: number, size: WidgetSize) => Partial<StateContent>
}

const PLACE = "Starbucks Woodlawn Creek"
const SCHEDULE: readonly ScheduleRow[] = [
  { day: "Mon", place: "Downtown", from: "10am", to: "6pm", bar: [18.445, 57.487] },
  { day: "Tue", place: "Downtown", from: "10am", to: "4pm", bar: [18.445, 49.781] },
  { day: "Thu", place: "Airport", from: "12am", to: "8pm", bar: [40.206, 47.175] },
]
const MESSAGE: Action = { icon: "message", label: "Message" }
/**
 * The 4×2 / 4×3 keep a small Message square at the start of the row in every
 * on-shift state, so a state change only swaps the actions after it (Clock In
 * → Take meal + Take break → End break → Clock Out). The 2×2 drops it where
 * there's one clear thing to do.
 */
const WIDE_MESSAGE = { "4x2": { secondary: MESSAGE }, "4x3": { secondary: MESSAGE } } as const
/** On the clock, the 4×2 / 4×3 offer both: Take meal beside the primary Take break. */
const TAKE_MEAL: Action = { icon: "meal", label: "Take meal" }
const WIDE_ON_CLOCK = { "4x2": { alt: TAKE_MEAL }, "4x3": { alt: TAKE_MEAL } } as const

const UPCOMING: StateDef = {
  // "Next shift in 2h at 9 am": the countdown rolls, the start time stays.
  lead: "Next shift in",
  value: "2h",
  trail: "at 9 am",
  sub: PLACE,
  timeline: true,
  // Before the shift there's one thing to do. On the 2×2, clocking in slides it
  // right to make room for Message, and it becomes Take break.
  primary: { icon: "timeclock", label: "Clock In" },
  compact: "timeclock",
  schedule: SCHEDULE,
  sizes: { ...WIDE_MESSAGE, "4x1": { compactStyle: "primary-icon" } },
  time: timed("value", formatUntil),
}

const STATES: Record<WidgetStateId, StateDef> = {
  "signed-out": {
    lead: "Sign in to see",
    value: "your shifts",
    sub: "👋 We saved you a spot",
    primary: { icon: "login", label: "Sign in" },
    compact: "login",
    sizes: { "2x2": { lead: "Sign in", value: "to see shifts" }, "4x1": { compactStyle: "primary-icon" } },
  },
  loading: { ...UPCOMING, loading: true },
  // A true empty state: there is no next shift to name. "Nothing today, next
  // one Monday" is an upcoming shift, not this.
  "no-shifts": {
    lead: "No upcoming",
    value: "shifts",
    sub: "We'll let you know",
    timeline: "empty",
    primary: { icon: "calendar", label: "View Schedule" },
    compact: "calendar",
    schedule: "empty",
    sizes: {
      "2x2": { primary: { icon: "calendar", label: "Schedule" } },
      // "View Schedule" plus the icon squeezes the headline onto two lines.
      "4x1": { compactStyle: "primary", primary: { icon: "calendar", label: "Schedule" } },
    },
  },
  upcoming: UPCOMING,
  "clocked-in": {
    lead: "On the clock for",
    value: "6h 12m",
    // Once on the clock the place is known; what's useful is when it's over.
    sub: "Shift ends at 5:00 pm",
    timeline: true,
    primary: { icon: "coffee", label: "Take break" },
    secondary: MESSAGE,
    compact: "coffee",
    schedule: SCHEDULE,
    sizes: {
      // Take meal takes Message's slot beside Take break (Wireframe2x2 shows `alt` there).
      "2x2": { lead: "On the clock", value: "6h 12m", alt: TAKE_MEAL },
      // No "for": beside the buttons, "On the clock for 15h 59m" wraps. Break and
      // meal as two icon buttons (the live widget drops one once it's used up).
      "4x1": { lead: "On the clock", compactStyle: "pair", compactIcons: ["meal", "coffee"] },
      ...WIDE_ON_CLOCK,
    },
    time: timed("value", formatElapsed),
  },
  // On the clock late in the shift with a break or meal still unused (see
  // suggestedBreak in live.ts): ask instead of counting, with the time left as
  // the reason. The live widget swaps in "Time for your meal?" / Take meal.
  "break-nudge": {
    lead: "Take a break?",
    value: "",
    sub: "2h until you're off",
    timeline: true,
    primary: { icon: "coffee", label: "Take break" },
    secondary: MESSAGE,
    compact: "coffee",
    schedule: SCHEDULE,
    sizes: { ...WIDE_ON_CLOCK, "2x2": { alt: TAKE_MEAL }, "4x1": { compactStyle: "pair", compactIcons: ["meal", "coffee"] } },
  },
  break: {
    lead: "Break ends in",
    value: "12m",
    sub: "Back by 11:46 am",
    timeline: true,
    // On a break there's one thing to do: on the 2×2, clock-in's move in reverse —
    // Message leaves and the primary fills the row as End break.
    primary: { icon: "timeclock", label: "End break" },
    compact: "xmark",
    schedule: SCHEDULE,
    sizes: { ...WIDE_MESSAGE, "4x1": { compactStyle: "primary-icon" } },
    time: timed("value", formatMinutes),
  },
  ending: {
    lead: "Shift ends in",
    value: "15m",
    sub: "Finish line in sight",
    timeline: true,
    // One thing left to do: on the 2×2, Message leaves and Clock Out fills the row.
    primary: { icon: "timeclock", label: "Clock Out" },
    compact: "timeclock",
    schedule: SCHEDULE,
    sizes: { ...WIDE_MESSAGE, "4x1": { compactStyle: "primary" } },
    time: timed("value", formatMinutes),
  },
  // Just clocked out (the live widget shows it for an hour): a celebration up
  // top, and what the shift earned underneath. The bar shows the day done.
  // Still clocked in after the shift's planned end. Plain and neutral — staying
  // late can be on purpose — saying how long ago it ended (like "Break ended 5m
  // ago"), with Clock Out as the one thing to do. The live widget opens with
  // "Time to clock out" for the first minute.
  overtime: {
    lead: "Shift ended",
    value: "10m",
    trail: "ago",
    sub: "You're still clocked in",
    timeline: true,
    primary: { icon: "timeclock", label: "Clock Out" },
    compact: "timeclock",
    schedule: SCHEDULE,
    sizes: { ...WIDE_MESSAGE, "4x1": { compactStyle: "primary" } },
    time: timed("value", formatElapsed),
  },
  // Between shifts — most of the time this widget is on someone's phone. Calm,
  // no countdown: when they're next on, without a clock ticking toward it. The
  // countdown ("Next shift in 2h") takes over on the day of the shift itself.
  off: {
    lead: "Off until tomorrow",
    value: "",
    sub: "Next shift at 9 am",
    timeline: true,
    primary: { icon: "calendar", label: "View Schedule" },
    compact: "calendar",
    schedule: SCHEDULE,
    sizes: {
      "2x2": { primary: { icon: "calendar", label: "Schedule" } },
      "4x1": { compactStyle: "primary", primary: { icon: "calendar", label: "Schedule" } },
    },
  },
  "shift-done": {
    lead: "Nice work today! 🎉",
    value: "",
    sub: "Est. earnings $142.50",
    timeline: true,
    primary: { icon: "calendar", label: "View Schedule" },
    compact: "calendar",
    schedule: SCHEDULE,
    sizes: {
      "2x2": { primary: { icon: "calendar", label: "Schedule" } },
      "4x1": { compactStyle: "primary", primary: { icon: "calendar", label: "Schedule" } },
    },
  },
}

/**
 * The content a given size shows in a given state: per-size overrides, then
 * the live time (when the state has one and `minutes` is given).
 */
export function contentFor(state: WidgetStateId, size: WidgetSize, minutes?: number): StateContent {
  const { sizes, time, ...base } = STATES[state]
  const content = { ...base, ...sizes?.[size] }
  return time && minutes !== undefined ? { ...content, ...time(minutes, size) } : content
}

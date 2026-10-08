/*
 * Open questions and decisions about the new widget: gaps from
 * cross-referencing the current production widget (shift-widget-states.html:
 * a Pixel 9 emulator, API 36, develop @ 0f0d4c3bef) on 2026-10-01, gaps found
 * while designing, and the directions settled during the design work (Bryce,
 * 2026-09-30 → 10-01) with their reasons, so they aren't refought. Shown on
 * /questions. Edit this list as answers come in:
 * move an item's status, and say what was decided in `decision`.
 */

export type GapStatus = "open" | "hifi" | "decided"

export type Gap = {
  id: string
  title: string
  /** What the gap is, and why it matters. */
  detail: string
  status: GapStatus
  /** Who or what has to answer it, for an open item. */
  needs?: string
  /** What was decided, and why — for a decided item. */
  decision?: string
  /** Where it came from: a screenshot in the current-widget file, or the design work. */
  source: string
  /** For a decided item, what it's about — the page groups decisions by area. */
  area?: DecisionArea
}

export const DECISION_AREAS = ["What the widget shows", "Timeline", "Time and copy", "States", "Buttons", "Motion"] as const
export type DecisionArea = (typeof DECISION_AREAS)[number]

export const GAP_STATUSES: { id: GapStatus; label: string; note: string }[] = [
  { id: "open", label: "Open", note: "Needs a design or product answer." },
  { id: "hifi", label: "Hi-fi pass", note: "Comes with the high-fidelity versions." },
  { id: "decided", label: "Decided", note: "Settled — and why, so it isn't reopened by accident." },
]

export const GAPS: Gap[] = [
  // ── Open ────────────────────────────────────────────────────────────────
  {
    id: "timeclock-off",
    title: "Time clock turned off for the company",
    detail:
      "Some businesses use Homebase only for scheduling; the current widget then shows no actions at all. Every new on-shift state assumes Clock In, breaks and Clock Out exist. Needs a schedule-only version: Upcoming and Between shifts with just View Schedule, and no on-the-clock states.",
    status: "open",
    needs: "Design",
    source: "Today's widget, with the time clock turned off: no actions at all",
  },
  {
    id: "unscheduled-clock-in",
    title: "Clocking in with no scheduled shift",
    detail:
      "The current widget offers Clock In when nothing is scheduled, so unscheduled clock-in exists today. The new design shows Clock In only with a scheduled shift. Either that's a deliberate removal, or we need an on-the-clock state with no shift end: no “Shift ends at”, no timeline end, no break plan, no ending soon.",
    status: "open",
    needs: "Product: is unscheduled clock-in staying?",
    source: "Today's widget, with nothing scheduled: still offers Clock In",
  },
  {
    id: "open-ended",
    title: "Shifts with no end time",
    detail:
      "Shifts can be open-ended (“Tomorrow 9:00 AM”, no end). The timeline, “Shift ends at”, Shift ending soon, Past shift end and the break plan all assume an end.",
    status: "open",
    needs: "Design",
    source: "Today's widget, next shift tomorrow: “Tomorrow 9:00 AM”, no end time",
  },
  {
    id: "permission-actions",
    title: "Actions that depend on permissions",
    detail:
      "The current widget drops buttons by company setting: no Message when messaging is off, no Clock Out on a breaks-only time clock. Our 4×2 / 4×3 rows assume a Message square and a fixed set. Needs a rule for what fills the row when an action isn't available.",
    status: "open",
    needs: "Design",
    source: "Today's widget, clocked in on a breaks-only time clock, and with messaging off",
  },
  {
    id: "picker-preview",
    title: "Widget picker previews",
    detail:
      "Android shows a static preview image in the widget picker. The current one is stale (old purple, a mic icon, “Artem”). Each of our four sizes needs one — easy to forget, because it isn't a state.",
    status: "open",
    needs: "Design, then engineering",
    source: "Today's widget picker preview (stale: old purple, mic icon, “Artem”)",
  },
  {
    id: "session-expired",
    title: "Session expired vs never signed in",
    detail:
      "“Log in, please” (not authorized) is a separate case from a fresh install. Our Signed out could take a “Sign in again” variant, so someone who was signed in isn't greeted like a stranger.",
    status: "open",
    needs: "Design",
    source: "Today's widget when not authorized: “Log in, please”",
  },
  {
    id: "long-text",
    title: "Long names",
    detail:
      "A long location (“Maplewood Heights Shopping Center — North Entrance Kiosk”) clips badly today. Ours isn't stress-tested; subtitles cut off with an ellipsis, but there's no rule yet for what wraps and what truncates, per size.",
    status: "open",
    needs: "Design",
    source: "Today's widget with a long location and role: the role row clips",
  },
  {
    id: "sizing",
    title: "Resizing, and growing downward",
    detail:
      "The current widget's default placement is 3×2, and it grows downward to fit its text. Ours are fixed 2×2, 4×1, 4×2 and 4×3. Confirm 3×2 isn't a target, and find out what Android lets a widget do when resized (responsive layouts per size, scrolling, growing) — if ours can grow downward, it can use the room too.",
    status: "open",
    needs: "Engineering: what Android widgets can do",
    source: "Today's widget: a 3×2 default placement that grows downward",
  },
  {
    id: "clock-in-fails",
    title: "When a tap doesn't go through",
    detail:
      "A tapped button spins while it waits on the server (documented in the Shift day flow), but nothing shows what happens when it fails. A clock-in that fails must say so (“Couldn't clock in. Tap to try again.”) — otherwise someone believes they're on the clock when they aren't.",
    status: "open",
    needs: "Design",
    source: "Design work",
  },
  {
    id: "offline-empty",
    title: "Offline with nothing cached",
    detail:
      "Offline is a subtitle on whatever the widget last knew (“Offline • updated 9:41 am”). With nothing cached at all — a fresh install, no connection — there's nothing to show it on, and it needs a true “Can't connect” state.",
    status: "open",
    needs: "Design",
    source: "Design work",
  },
  {
    id: "first-name",
    title: "Using their first name",
    detail:
      "The current widget greets people by name (“Good morning, Jane”). Where we have it, a name could warm up the clock-in welcome or Between shifts — within the headline's width.",
    status: "open",
    needs: "Design: where it earns its space",
    source: "Today's widget: “Good morning, Jane”",
  },

  {
    id: "prototype-motion",
    title: "Motion in the prototype that Android can't do",
    detail:
      "The widgets still roll their digits, crossfade text through a blur, slide their buttons between states, and move the buttons a beat after the timeline. None of it is buildable. Either keep it as clearly-labelled presentation polish, or switch it off so the prototype shows only what ships.",
    status: "open",
    needs: "Design: keep or strip",
    source: "Engineering feedback, Oct 6",
  },
  {
    id: "exact-or-calm",
    title: "Calm steps vs a live ticking timer",
    detail:
      "Calm time counts in coarse steps so the widget doesn't pressure people. Android's built-in timer ticks every second on its own, and Keyvan wants an exact minute count. A ticking “On break for 08:12” is accurate and cheap to build, but it's the minute-by-minute pressure Calm was meant to avoid. Which states, if any, get a live timer?",
    status: "open",
    needs: "Design, with Keyvan",
    source: "Engineering feedback, Oct 6",
  },

  // ── Hi-fi pass ──────────────────────────────────────────────────────────
  {
    id: "dark-mode",
    title: "Dark mode",
    detail: "The current widget has no dark theme; the new one needs one, for every state and size.",
    status: "hifi",
    source: "Today's widget in dark mode: no dark theme",
  },
  {
    id: "offline-colour",
    title: "A colour for offline",
    detail: "The offline subtitle is text only in the wireframes; hi-fi needs a colour (and maybe a glyph) for it.",
    status: "hifi",
    source: "Design work",
  },

  // ── Decided ─────────────────────────────────────────────────────────────
  {
    id: "find-cover",
    area: "What the widget shows",
    title: "Find cover",
    detail: "The current widget puts Find cover beside Clock In and Message on the next shift.",
    status: "decided",
    decision: "Not doing it: three actions is too many buttons for a widget, and its icon doesn't read.",
    source: "Today's widget, next shift: Clock In, Message and Find cover",
  },
  {
    id: "earnings-early",
    area: "What the widget shows",
    title: "Estimated earnings before or during the shift",
    detail: "The current widget shows “EST. $65.00” on the next shift and while clocked in.",
    status: "decided",
    decision: "Earnings only after clocking out, as part of the celebration — the right information at the right time.",
    source: "Today's widget, next shift and clocked in: “CASHIER | EST. $65.00”",
  },
  {
    id: "role",
    area: "What the widget shows",
    title: "Role or position",
    detail: "The current widget shows the role (“CASHIER”) on every shift.",
    status: "decided",
    decision: "Not shown. It isn't what someone needs at a glance.",
    source: "Today's widget, next shift and clocked in: “CASHIER | EST. $65.00”",
  },
  {
    id: "end-time-early",
    area: "What the widget shows",
    title: "The shift's end time before it starts",
    detail: "The current widget shows the range (“9:00 AM – 5:00 PM”) on the next shift.",
    status: "decided",
    decision:
      "Just about to work, people only need to know when they start; the end comes in once they're on the clock (“Shift ends at 5:00 pm”). Matches how people think about their shift.",
    source: "Today's widget, next shift: “Today 9:00 AM – 5:00 PM”",
  },
  {
    id: "open-app",
    area: "Buttons",
    title: "An open-the-app button",
    detail: "The current widget has an open-in-app icon while clocked in.",
    status: "decided",
    decision: "Not needed: tapping the widget itself opens the app.",
    source: "Today's widget, clocked in: an open-in-app icon beside Message and Take break",
  },

  // ── Decided during the design work ──────────────────────────────────────
  {
    id: "timeline-2",
    area: "Timeline",
    title: "Breaks with their own bar — drawn static",
    detail:
      "Timeline 1 marked a taken break as a single bulge, as if it were instant. Timeline 2 gave each break its own bar after its bulge, then a second gap, then the shift's bar carrying on — and animated every change. Engineering (Oct 6): Android widgets are snapshots, so nothing can animate and a bar can't fill smoothly.",
    status: "decided",
    decision:
      "Timeline 2's design, drawn static, is the Timeline every widget uses. A break has a start and an end, so it gets its own bar; ending early or late resizes it to the time taken. The bar steps forward with each update (every 5 minutes in the prototype) and jumps straight away on an event — clock in, a break taken or ended, clock out. Timeline 1 is gone; the animated Timeline 2 stays as a reference.",
    source: "Design work, and engineering's feedback on what Android widgets can do",
  },
  {
    id: "dots-not-times",
    area: "Timeline",
    title: "Breaks still to come are dots, not times",
    detail: "Untaken breaks and meals could sit at their planned times on the bar.",
    status: "decided",
    decision:
      "They're plain, identical dots spaced evenly between the elapsed time and the end bulge, compressing toward the end as the day goes on — never reached by the black. Placed at their times, a dot would read as “take a break now”, and when to break isn't the widget's call.",
    source: "Design work",
  },
  {
    id: "timeline-finish",
    area: "Timeline",
    title: "Clocking out shows the day finished",
    detail: "After clock-out the timeline could just stop where the time was.",
    status: "decided",
    decision:
      "The finished day is its own look: the whole track black, the end bulge filled, every gap closed (bulges and icons in place), unused break dots gone — one solid piece. Drawn as a state, not animated in.",
    source: "Design work",
  },
  {
    id: "timeline-icons",
    area: "Timeline",
    title: "One timeclock glyph at both ends",
    detail: "The ends had separate clock-in / clock-out glyphs.",
    status: "decided",
    decision: "Figma's filled Timeclock (Timekeeping Iconography 106:7134) at both ends: at 12px the arrows on the old glyphs couldn't be seen. Meals use the Figma rice bowl (Timekeeping Iconography 104:6450): outline on buttons, filled on the timeline.",
    source: "Design work",
  },
  {
    id: "calm-time",
    area: "Time and copy",
    title: "Calm time, not minute-by-minute",
    detail: "A countdown that ticks every minute before a shift, or a count-up on the clock, reads as pressure.",
    status: "decided",
    decision:
      "Calm is the default (being revisited — see “Calm steps vs a live ticking timer”): half hours far out, 15-minute steps on the clock, 5-minute steps as a moment gets close, exact only in the last 5 minutes. Countdowns round down, so the widget never promises more time than there is. Exact stays as a switch in the panel. It also suits how rarely Android widgets can refresh.",
    source: "Design work",
  },
  {
    id: "words-not-zero",
    area: "Time and copy",
    title: "Words at the moments people look",
    detail: "“On the clock for 0m”, “Break ended 0m ago”, “Shift started 0m ago”.",
    status: "decided",
    decision:
      "The moments someone is sure to be looking get words instead: “Morning, you're in” (by time of day) on clocking in, “Enjoy your break” for its first minute, “Break's over”, “Shift starts now”, “Time to clock out”.",
    source: "Design work",
  },
  {
    id: "work-positive",
    area: "Time and copy",
    title: "Work is never the bad guy",
    detail: "Shift-ending lines like “Freedom is near” and “The couch is calling”.",
    status: "decided",
    decision:
      "Copy can celebrate and reward effort (“Great work today”, “You've earned this”), but never implies work drains people or is something to escape. The Claude prompt for these lines says so too.",
    source: "Design work",
  },
  {
    id: "context-at-the-right-time",
    area: "Time and copy",
    title: "Only what matters now",
    detail: "Location, end time, earnings and role could all show all the time.",
    status: "decided",
    decision:
      "Each state carries what matters at that moment. Before a shift: when it starts (and where). On the clock: when it ends — the location is known by then. After: what it earned. Between shifts: when they're next on, with no clock ticking.",
    source: "Design work",
  },
  {
    id: "breaks-dont-end",
    area: "States",
    title: "Breaks only end when the worker ends them",
    detail: "A break could end itself after its planned length.",
    status: "decided",
    decision:
      "It can't — so past its time the widget says “Break ended 5m ago” · “Due back at 12:08 pm” with End break. Near the shift's end that gives way: the shift ending (or past it) outranks an overdue break, and Clock Out also ends the break.",
    source: "Design work",
  },
  {
    id: "nudge-twice",
    area: "States",
    title: "Break nudges: twice, briefly",
    detail: "An unused break late in the shift could be suggested continuously.",
    status: "decided",
    decision:
      "Asked twice — 15 minutes from two hours out, then a 10-minute last chance before it stops fitting — and quiet otherwise. A question that stays up stops being read. Meals go first (they need the most room).",
    source: "Design work",
  },
  {
    id: "celebration",
    area: "States",
    title: "The clock-out celebration, and how long it lasts",
    detail: "“Nice work today! 🎉” with estimated earnings, after clocking out.",
    status: "decided",
    decision:
      "An hour, or 15 minutes when the next shift is within 2 hours; never past midnight (it says “today”); gone as soon as they open the app. Then Between shifts, or the next shift's countdown on its day. Earnings: clock-in to clock-out at the rate, meals unpaid.",
    source: "Design work",
  },
  {
    id: "between-shifts",
    area: "States",
    title: "Between shifts is its own calm state",
    detail: "Most of the time the widget is on someone's phone, they're between shifts.",
    status: "decided",
    decision:
      "“Off until tomorrow / Sunday” · “Next shift at 9 am”, with no countdown. The countdown (“Next shift in 2h at 9 am”) only takes over on the day of the shift.",
    source: "Design work",
  },
  {
    id: "offline-subtitle",
    area: "States",
    title: "Offline is a subtitle, not a state",
    detail: "No connection could replace whatever the widget shows.",
    status: "decided",
    decision: "The widget keeps showing what it last knew, and the subtitle says so: “Offline • updated 9:41 am”. Any state can be offline.",
    source: "Design work",
  },
  {
    id: "pending-in-button",
    area: "Buttons",
    title: "Waiting on the server: a spinner in the button",
    detail: "A tap could show a separate “Clocking in…” state.",
    status: "decided",
    decision:
      "The tapped button swaps its icon for a spinner until the action lands; no extra state. Shown as the “Clocking in” step of the Shift day flow; the prototype's own buttons act instantly.",
    source: "Design work",
  },
  {
    id: "one-primary",
    area: "Buttons",
    title: "One primary action at a time",
    detail: "Before a shift, on a break, ending, past the end, after: what's the one thing to do?",
    status: "decided",
    decision:
      "One black primary — Clock In, End break, Clock Out, View Schedule. On the clock it's Take break, with Take meal beside it as the lighter button (and on the 4×1, meal is the lighter icon square).",
    source: "Design work",
  },
  {
    id: "wide-rows",
    area: "Buttons",
    title: "4×2 / 4×3: Message stays, nothing resizes",
    detail: "The primary could grow to fill the row when it's alone, and shrink when Message returns.",
    status: "decided",
    decision:
      "A small icon-only Message square keeps the row's start in every on-shift state; Take meal + Take break share the rest on the clock. A state change only swaps what the buttons say. (The 2×2 does slide its primary between one wide button and two squares, and shows Take meal in Message's place on the clock.)",
    source: "Design work",
  },
  {
    id: "android-motion",
    area: "Motion",
    title: "What Android widgets can and can't animate",
    detail:
      "Engineering (Oct 6): a widget is a snapshot the app sends the home screen, frozen until the next one, and frequent updates drain the battery and get throttled.",
    status: "decided",
    decision:
      "Design within it. Can: a system timer that ticks by itself (“starts in 12:34”, “on break for 08:12”), a progress bar that steps on each update, and Android 12+'s launch animation into the app on tap. Can't: rolling digits, text crossfades, sliding buttons, a smoothly filling bar, or animated state changes — those are instant redraws.",
    source: "Engineering feedback, Oct 6",
  },
]

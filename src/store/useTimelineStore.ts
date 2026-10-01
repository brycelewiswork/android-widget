import { useEffect } from "react"
import { create } from "zustand"
import { persist } from "zustand/middleware"
import {
  activeBreak,
  arrangeEvents,
  canTake,
  planEvents,
  remainingEvents,
  presetConfig,
  type EventKind,
  type NextShift,
  type PresetId,
  type TimelineConfig,
  type TimelineEvent,
} from "@/timeline/model"

/*
 * The shift timeline every 4×2 / 4×3 widget draws, edited on /timeline.
 * The config is persisted; playback (running) is session-only.
 */

/** Playback speeds for the time of day: 60× runs a minute a second. */
export const SPEEDS = [1, 60, 600] as const
export type Speed = (typeof SPEEDS)[number]

/** Enough for a 24h shift under the plan rule (6 breaks + 2 meals). */
export const MAX_EVENTS = 8
/** How far before/after the shift the time-of-day scrubber reaches. */
export const SCRUB_PAD_MINUTES = 60

type TimelineState = {
  config: TimelineConfig
  /** The preset the config came from; `null` once edited by hand. */
  preset: PresetId | null
  running: boolean
  speed: Speed
  applyPreset: (id: PresetId) => void
  setNow: (now: number | null) => void
  setShift: (start: number, end: number) => void
  addEvent: (kind: EventKind) => void
  /** Take the next planned break (or meal) now. No-op outside the shift or when none are left. */
  take: (kind: EventKind) => void
  /** Clear every break and meal taken today (leaving clock-in and out as they are). */
  resetTaken: () => void
  /** Live widget: clock in now (starting the time at the shift's start if there is none). */
  clockIn: () => void
  /** Live widget: clock out now, ending any break underway. */
  clockOut: () => void
  /** Live widget: end the break or meal underway now. */
  endBreak: () => void
  /** Live widget: undo clocking in and out, leaving the day's breaks and meals as they are. */
  resetClock: () => void
  setPayRate: (payRate: number) => void
  setNextShift: (nextShift: NextShift) => void
  /** Live widget: the worker opens the app (and sees their earnings there). */
  openApp: () => void
  removeEvent: (id: string) => void
  setRunning: (running: boolean) => void
  setSpeed: (speed: Speed) => void
  tick: (realSeconds: number) => void
}

const edit = (config: TimelineConfig) => ({ config, preset: null })

/** Re-lays the shift's events after adding or removing one, keeping each marker's id. */
function relayout(config: TimelineConfig, events: TimelineEvent[]): TimelineConfig {
  const sorted = [...events].sort((a, b) => a.start - b.start)
  const ids = {
    break: sorted.filter((e) => e.kind === "break").map((e) => e.id),
    meal: sorted.filter((e) => e.kind === "meal").map((e) => e.id),
  }
  return {
    ...config,
    events: arrangeEvents(ids.break.length, ids.meal.length, config.shiftStart, config.shiftEnd, ids),
    // A changed plan starts the day's breaks over.
    taken: {},
  }
}
export const useTimelineStore = create<TimelineState>()(
  persist(
    (set, get) => ({
      config: presetConfig("planned"),
      preset: "planned",
      running: false,
      speed: SPEEDS[1],
      applyPreset: (id) => set({ config: presetConfig(id), preset: id, running: false }),
      // Scrubbing back before a break was taken un-takes it, so the day stays consistent.
      setNow: (now) =>
        set((s) => {
          const before = s.config.taken ?? {}
          const taken = Object.fromEntries(Object.entries(before).filter(([, at]) => now !== null && at <= now))
          const untook = Object.keys(taken).length < Object.keys(before).length
          const kept = (t: number | undefined) => (t !== undefined && now !== null && t <= now ? t : undefined)
          const unclockedOut = s.config.clockOut !== undefined && kept(s.config.clockOut) === undefined
          const breakEnds = Object.fromEntries(Object.entries(s.config.breakEnds ?? {}).filter(([id, at]) => taken[id] !== undefined && now !== null && at <= now))
          const past = (t: number | null, mark: number) => t !== null && t >= mark
          const crossed = past(s.config.now, s.config.shiftStart) !== past(now, s.config.shiftStart)
          const crossedEnd = past(s.config.now, s.config.shiftEnd) !== past(now, s.config.shiftEnd)
          return edit({
            ...s.config,
            now,
            taken,
            breakEnds,
            clockIn: kept(s.config.clockIn),
            clockOut: kept(s.config.clockOut),
            seenAt: kept(s.config.seenAt),
            ...(untook && { lastChangeAt: Date.now() }),
            ...(crossed && { lastStartCrossAt: Date.now() }),
            ...(crossedEnd && { lastEndCrossAt: Date.now() }),
            ...(unclockedOut && { lastCompleteAt: Date.now() }),
          })
        }),
      take: (kind) =>
        set((s) => {
          const { config } = s
          const next = remainingEvents(config).find((e) => e.kind === kind)
          if (!next || !canTake(config)) return s
          return edit({ ...config, taken: { ...config.taken, [next.id]: config.now! }, lastChangeAt: Date.now() })
        }),
      resetTaken: () =>
        set((s) =>
          Object.keys(s.config.taken ?? {}).length ? edit({ ...s.config, taken: {}, breakEnds: {}, lastChangeAt: Date.now() }) : s,
        ),
      resetClock: () =>
        set((s) =>
          edit({
            ...s.config,
            clockIn: undefined,
            clockOut: undefined,
            seenAt: undefined,
            ...(s.config.clockOut !== undefined && { lastCompleteAt: Date.now() }),
          }),
        ),
      clockIn: () =>
        set((s) => {
          const now = s.config.now ?? s.config.shiftStart
          return edit({ ...s.config, now, clockIn: now, clockOut: undefined })
        }),
      clockOut: () =>
        set((s) => {
          const { config } = s
          if (config.now === null) return s
          const active = activeBreak(config)
          return edit({
            ...config,
            clockOut: config.now,
            lastCompleteAt: Date.now(),
            ...(active && { breakEnds: { ...config.breakEnds, [active.event.id]: config.now } }),
          })
        }),
      endBreak: () =>
        set((s) => {
          const active = activeBreak(s.config)
          if (!active || s.config.now === null) return s
          // Stamped like a take, so the track animates the break's bar settling (and the buttons follow).
          return edit({ ...s.config, breakEnds: { ...s.config.breakEnds, [active.event.id]: s.config.now }, lastChangeAt: Date.now() })
        }),
      setPayRate: (payRate) => set((s) => ({ config: { ...s.config, payRate } })),
      setNextShift: (nextShift) => set((s) => ({ config: { ...s.config, nextShift } })),
      openApp: () => set((s) => (s.config.now === null ? s : { config: { ...s.config, seenAt: s.config.now } })),
      // A new shift length re-plans its breaks and meals (see planEvents).
      setShift: (shiftStart, shiftEnd) =>
        set((s) => edit({ ...s.config, shiftStart, shiftEnd, events: planEvents(shiftStart, shiftEnd), taken: {} })),
      // Adding or removing re-lays the whole set the planned way (B·M·B…), evenly spaced.
      addEvent: (kind) =>
        set((s) => {
          const { config } = s
          if (config.events.length >= MAX_EVENTS) return s
          const event: TimelineEvent = { id: `${kind[0]}${Date.now().toString(36)}`, kind, start: Infinity, duration: 0 }
          return edit(relayout(config, [...config.events, event]))
        }),
      removeEvent: (id) => set((s) => edit(relayout(s.config, s.config.events.filter((e) => e.id !== id)))),
      setRunning: (running) => {
        const { config } = get()
        // Starting from the static Figma track begins at the start of the shift.
        if (running && config.now === null) set(edit({ ...config, now: config.shiftStart }))
        set({ running })
      },
      setSpeed: (speed) => set({ speed }),
      tick: (realSeconds) => {
        const { config, speed } = get()
        if (config.now === null) return
        const limit = config.shiftEnd + SCRUB_PAD_MINUTES
        const now = config.now + (realSeconds * speed) / 60
        set(now >= limit ? { config: { ...config, now: limit }, running: false } : { config: { ...config, now } })
      },
    }),
    {
      name: "android-widget:timeline",
      version: 4,
      // Earlier versions had other presets and hand-placed breaks; start over on the planned 9-to-5.
      migrate: () => ({ config: presetConfig("planned"), preset: "planned", speed: SPEEDS[1] }) as unknown as TimelineState,
      partialize: (s) => ({ config: s.config, preset: s.preset, speed: s.speed }),
    },
  ),
)

/** Advances the time of day while playing. Mount once on the timeline page. */
export function useTimelineDriver() {
  const running = useTimelineStore((s) => s.running)
  useEffect(() => {
    if (!running) return
    let last = performance.now()
    const id = window.setInterval(() => {
      const t = performance.now()
      useTimelineStore.getState().tick((t - last) / 1000)
      last = t
    }, 100)
    return () => window.clearInterval(id)
  }, [running])
}

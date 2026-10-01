import {
  IconCoffee,
  IconPlayerPauseFilled,
  IconPlayerPlayFilled,
  IconPlus,
  IconX,
} from "@tabler/icons-react"
import useMeasure from "react-use-measure"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { MAX_EVENTS, SCRUB_PAD_MINUTES, SPEEDS, useTimelineStore } from "@/store/useTimelineStore"
import { useWidgetStore } from "@/store/useWidgetStore"
import { Page } from "@/widgets/Shell"
import { Widget, type TimelineVersionId } from "@/widgets/Widget"
import type { WidgetStateId } from "@/widgets/states"
import {
  canTake,
  clockTime,
  crowdedEvents,
  phaseOf,
  PRESETS,
  remainingEvents,
  sortedEvents,
  takenEvents,
  type Phase,
  type PresetId,
  type TimelineConfig,
} from "./model"
import { ShiftTimeline } from "./ShiftTimeline"
import { ShiftTimelineV2 } from "./ShiftTimelineV2"

/*
 * /timeline — the 4×2 / 4×3 shift timeline on its own. Centre: the track
 * enlarged, then inside both widgets at 1:1. Right: the preset, time of day,
 * the shift, and its breaks and meals.
 */

const PRESET_IDS = PRESETS.map((p) => p.id)

// ── What the widgets show for a timeline phase ─────────────────────────────

/** The widget state + live minutes that agree with the timeline. */
function widgetFor(config: TimelineConfig, phase: Phase): { state: WidgetStateId; minutes?: number } {
  const now = config.now ?? config.shiftStart
  switch (phase.kind) {
    case "empty":
      return { state: "no-shifts" }
    case "static":
    case "before":
      return { state: "upcoming", minutes: phase.kind === "before" ? Math.ceil(config.shiftStart - now) : undefined }
    // Breaks aren't wired to the widgets yet: during one, they read as working.
    case "on-event":
    case "working": {
      const left = config.shiftEnd - now
      return left <= 60 ? { state: "ending", minutes: Math.ceil(left) } : { state: "clocked-in", minutes: Math.floor(now - config.shiftStart) }
    }
    case "after":
      return { state: "clocked-in", minutes: Math.floor(config.shiftEnd - config.shiftStart) }
  }
}

function phaseLabel(phase: Phase) {
  switch (phase.kind) {
    case "empty":
      return "No upcoming shifts"
    case "static":
      return "Static — no time of day"
    case "before":
      return "Before the shift"
    case "working":
      return "Working"
    case "on-event":
      return phase.event.kind === "meal" ? "At lunch" : "On a break"
    case "after":
      return "After the shift"
  }
}

/**
 * The Figma meal glyph ("donut", Timekeeping Iconography 106:6971) drawn
 * through a mask so it takes the text colour, like the Tabler icons beside it.
 * The art is 22 of the 24px frame, hence the inset.
 */
export function MealIcon({ size, className = "" }: { size: number; className?: string }) {
  const mask = 'url("/widget/donut.svg") center / contain no-repeat'
  return (
    <span aria-hidden className={`inline-flex shrink-0 items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <span className="block bg-current" style={{ width: (size * 22) / 24, height: (size * 22) / 24, mask, WebkitMask: mask }} />
    </span>
  )
}

// ── Right panel ────────────────────────────────────────────────────────────

const DAY = 24 * 60
const SHIFT_STEP = 15
const MIN_SHIFT = 60
const DAY_TICKS = [0, 6 * 60, 12 * 60, 18 * 60, DAY]
const tickLabel = (m: number) => (m % DAY === 0 ? "12 am" : m === 720 ? "12 pm" : m < 720 ? `${m / 60} am` : `${m / 60 - 12} pm`)
/** 480 → "8h", 510 → "8h 30m" (the widgets' duration style). */
const formatLength = (m: number) => (m % 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m / 60}h`)


export function Segmented<T extends string | number>({ label, options, value, onChange, render }: {
  label: string; options: readonly T[]; value: T; onChange: (v: T) => void; render: (v: T) => string
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-1 rounded-xl bg-fill-quaternary p-1">
      {options.map((o) => (
        <button
          key={String(o)}
          type="button"
          role="radio"
          aria-checked={value === o}
          onClick={() => onChange(o)}
          className={`flex-1 cursor-pointer whitespace-nowrap rounded-lg px-2 py-1.5 text-sm transition-colors ${
            value === o ? "bg-surface-secondary text-label shadow-xs" : "text-label-secondary hover:text-label"
          }`}
        >
          {render(o)}
        </button>
      ))}
    </div>
  )
}

/** Time of day: readout, scrubber, play / static and speed. Shared with the widget pages' live panel. */
export function TimeOfDay({ status }: { status: string }) {
  const { config, running, speed, setNow, setRunning, setSpeed } = useTimelineStore()
  const min = config.shiftStart - SCRUB_PAD_MINUTES
  const max = config.shiftEnd + SCRUB_PAD_MINUTES
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-sm font-semibold text-label">Time of day</h2>
        <p className="text-xs text-label-secondary">{status}</p>
      </div>
      <p className="rounded-xl bg-surface px-4 py-3 font-mono text-2xl tabular-nums text-label inset-ring-1 inset-ring-stroke-faint">
        {config.now === null ? "—" : clockTime(config.now)}
      </p>
      <Slider
        value={[config.now ?? config.shiftStart]}
        min={min}
        max={max}
        step={1}
        onValueChange={([v]) => setNow(v)}
        aria-label="Time of day"
      />
      <div className="flex justify-between font-mono text-xs text-label-tertiary">
        <span>{clockTime(min)}</span>
        <span>{clockTime(max)}</span>
      </div>
      <div className="flex gap-2">
        <Button className="flex-1" onClick={() => setRunning(!running)}>
          {running ? <IconPlayerPauseFilled /> : <IconPlayerPlayFilled />}
          {running ? "Pause" : "Play"}
        </Button>
        <Button variant="outline" onClick={() => setNow(null)} disabled={config.now === null}>
          Static
        </Button>
      </div>
      <Segmented label="Speed" options={SPEEDS.slice(1)} value={speed} onChange={setSpeed} render={(s) => `${s}×`} />
    </section>
  )
}

/** The shift's range and its planned breaks and meals. Shared with the widget pages' live panel. */
export function ShiftControls() {
  const { config, setShift, addEvent, removeEvent } = useTimelineStore()
  const crowded = crowdedEvents(config)
  const events = sortedEvents(config)
  return (
    <>
    <section className="flex flex-col gap-3 border-t border-stroke-faint pt-5">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-label">Shift</h2>
        <span className="text-xs text-label-secondary">{formatLength(config.shiftEnd - config.shiftStart)}</span>
      </div>
      <p className="font-mono text-sm tabular-nums text-label">
        {clockTime(config.shiftStart)} – {clockTime(config.shiftEnd)}
      </p>
      {/* Two handles over the whole day, in 15-minute steps; at least an hour long. */}
      <Slider
        value={[config.shiftStart, config.shiftEnd]}
        min={0}
        max={DAY}
        step={SHIFT_STEP}
        minStepsBetweenValues={MIN_SHIFT / SHIFT_STEP}
        onValueChange={([start, end]) => setShift(start, end)}
        getAriaLabel={(i) => (i === 0 ? "Shift start" : "Shift end")}
        getAriaValueText={(_, v) => clockTime(v)}
      />
      <div className="relative h-4 font-mono text-[10px] text-label-tertiary">
        {DAY_TICKS.map((t) => (
          <span
            key={t}
            className="absolute top-0 -translate-x-1/2 whitespace-nowrap first:translate-x-0 last:-translate-x-full"
            style={{ left: `${(t / DAY) * 100}%` }}
          >
            {tickLabel(t)}
          </span>
        ))}
      </div>
    </section>

    <section className="flex flex-col gap-3 border-t border-stroke-faint pt-5">
      <h2 className="text-sm font-semibold text-label">Breaks and meals</h2>
      {events.length > 0 && (
        <ul className="flex flex-col gap-1">
          {events.map((e) => {
            return (
              <li key={e.id} className="flex items-center gap-2.5 rounded-lg bg-surface py-1.5 pr-1.5 pl-2.5 inset-ring-1 inset-ring-stroke-faint">
                {e.kind === "meal" ? (
                  <MealIcon size={16} className="text-label-secondary" />
                ) : (
                  <IconCoffee size={16} stroke={1.75} className="text-label-secondary" />
                )}
                <span className="flex-1 text-sm text-label">{e.kind === "meal" ? "Meal" : "Break"}</span>
                {crowded.has(e.id) && <span className="text-xs text-red-500">Too tight</span>}
                <button
                  type="button"
                  aria-label={`Remove ${e.kind}`}
                  onClick={() => removeEvent(e.id)}
                  className="flex size-7 cursor-pointer items-center justify-center rounded-md text-label-secondary hover:bg-fill-quaternary hover:text-label"
                >
                  <IconX size={14} stroke={2} />
                </button>
              </li>
            )
          })}
        </ul>
      )}
      <div className="grid grid-cols-2 gap-2">
        {(["break", "meal"] as const).map((kind) => (
          <Button key={kind} onClick={() => addEvent(kind)} disabled={events.length >= MAX_EVENTS}>
            <IconPlus />
            {kind === "break" ? "Break" : "Meal"}
          </Button>
        ))}
      </div>
    </section>
    </>
  )
}

/** Planned 9-to-5 / Empty, for pages whose left rail is taken. */
export function PresetPicker() {
  const { preset, applyPreset } = useTimelineStore()
  return (
    <Segmented label="Timeline preset" options={PRESET_IDS} value={preset ?? ("" as PresetId)} onChange={applyPreset} render={(id) => PRESETS.find((p) => p.id === id)!.label} />
  )
}

function TimelinePanel() {
  const { config, take, resetTaken } = useTimelineStore()
  const remaining = remainingEvents(config)
  const left = { break: remaining.filter((e) => e.kind === "break").length, meal: remaining.filter((e) => e.kind === "meal").length }
  const takenCount = takenEvents(config).length
  const takeable = canTake(config)
  const phase = phaseOf(config)

  if (config.empty) {
    return (
      <aside
        aria-label="Timeline controls"
        className="border-t border-stroke-faint bg-surface-secondary lg:fixed lg:inset-y-0 lg:right-0 lg:z-20 lg:w-72 lg:border-t-0 lg:border-l"
      >
        {/* The presets moved here from the old left rail. */}
        <div className="px-5 pt-5">
          <PresetPicker />
        </div>
        <p className="px-5 py-5 text-sm text-label-secondary">No shift, so there's no time of day to move through.</p>
      </aside>
    )
  }

  return (
    <aside
      aria-label="Timeline controls"
      className="border-t border-stroke-faint bg-surface-secondary lg:fixed lg:inset-y-0 lg:right-0 lg:z-20 lg:w-72 lg:overflow-y-auto lg:border-t-0 lg:border-l"
    >
      <div className="flex flex-col gap-6 px-5 py-5">
        <PresetPicker />
        <TimeOfDay status={phaseLabel(phase)} />

        <section className="flex flex-col gap-3 border-t border-stroke-faint pt-5">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-sm font-semibold text-label">Today</h2>
            <button
              type="button"
              onClick={resetTaken}
              disabled={takenCount === 0}
              className="cursor-pointer text-xs text-label-secondary hover:text-label disabled:cursor-default disabled:opacity-40 disabled:hover:text-label-secondary"
            >
              Reset
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {(["break", "meal"] as const).map((kind) => (
              <Button key={kind} onClick={() => take(kind)} disabled={!takeable || left[kind] === 0} className="justify-start">
                {kind === "break" ? <IconCoffee /> : <MealIcon size={16} />}
                <span className="flex-1 text-left">{kind === "break" ? "Take a break" : "Take a meal"}</span>
                <span className="font-mono tabular-nums opacity-60">{left[kind]} left</span>
              </Button>
            ))}
          </div>
          {!takeable && <p className="text-xs text-label-tertiary">Move the time into the shift to take one.</p>}
        </section>

        <ShiftControls />
      </div>
    </aside>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

const MAX_ZOOM = 2
const PAD = 24
/** Track + gap + 16px label line, in dp. */
const TRACK_BLOCK = { width: 357, height: 49 }

/** The track enlarged for inspection, fitted to the canvas (up to 2×). The widgets below are 1:1. */
function ZoomedTrack({ config, version }: { config: TimelineConfig; version: TimelineVersionId }) {
  const Track = version === 2 ? ShiftTimelineV2 : ShiftTimeline
  const [ref, bounds] = useMeasure()
  const zoom = bounds.width ? Math.min(MAX_ZOOM, (bounds.width - PAD * 2) / TRACK_BLOCK.width) : MAX_ZOOM
  return (
    <div ref={ref} className="w-full max-w-[762px]">
      <div className="rounded-2xl bg-[#cecece]" style={{ padding: PAD }}>
        <div style={{ width: TRACK_BLOCK.width * zoom, height: TRACK_BLOCK.height * zoom }}>
          <div className="widget origin-top-left bg-transparent" style={{ transform: `scale(${zoom})`, width: TRACK_BLOCK.width }}>
            <Track config={config} labelSize={16} />
          </div>
        </div>
      </div>
      <p className="mt-2 font-mono text-xs text-label-tertiary">
        {zoom.toFixed(2).replace(/\.?0+$/, "")}× · track 357.404 × 26 dp
      </p>
    </div>
  )
}

/** `version` picks the timeline drawing: the original, or version 2 (/timeline-2). Same data either way. */
export function TimelinePage({ version = 1 }: { version?: TimelineVersionId }) {
  const config = useTimelineStore((s) => s.config)
  const { fidelity, showBounds } = useWidgetStore()
  const phase = phaseOf(config)
  const { state, minutes } = widgetFor(config, phase)
  const next = sortedEvents(config).find((e) => config.now !== null && e.start > config.now)

  return (
    <Page sizes={["4x2", "4x3"]} panel={<TimelinePanel />}>
      <div className="flex flex-col gap-[var(--space-m-l)]">
        <section className="flex flex-col gap-3">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h1 className="text-sm font-semibold text-label">{version === 2 ? "Shift timeline, version 2" : "Shift timeline"}</h1>
            <span className="text-sm text-label-secondary">
              {phaseLabel(phase)}
              {next && ` · next at ${clockTime(next.start)}`}
            </span>
          </div>
          <ZoomedTrack config={config} version={version} />
        </section>

        <section className="flex flex-col gap-3">
          <p className="text-sm text-label-secondary">
            In the widgets as <span className="font-medium text-label">{state.replace("-", " ")}</span>, with the copy
            following the timeline
          </p>
          <div className="flex flex-wrap items-start gap-[var(--space-m-l)]">
            {(["4x2", "4x3"] as const).map((size) => (
              <figure key={size} className="flex flex-col gap-2">
                <Widget
                  size={size}
                  state={state}
                  minutes={minutes}
                  timeline={config}
                  timelineVersion={version}
                  fidelity={fidelity}
                  showBounds={showBounds}
                />
                <figcaption className="font-mono text-xs text-label-tertiary">{size.replace("x", " × ")}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      </div>
    </Page>
  )
}

export const TimelineV2Page = () => <TimelinePage version={2} />

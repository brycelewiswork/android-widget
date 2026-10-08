import { IconClockPlay, IconClockStop, IconCoffee, IconDeviceMobile, IconHelpCircle, IconPlayerStopFilled } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { useTimelineStore } from "@/store/useTimelineStore"
import { canTake, clockTime, nextShiftStart, remainingEvents, type NextShift } from "@/timeline/model"
import { useWidgetStore, type Precision } from "@/store/useWidgetStore"
import { EmptyNote, MealIcon, ResetButton, Segmented, ShiftControls, TimeOfDay } from "@/timeline/TimelinePage"
import { DEFAULT_PAY_RATE, estimatedEarnings, liveStatus, liveWidget, type LiveStatus } from "./live"

/*
 * Right rail on the size pages: drives the live widget at the top. Same time
 * of day, shift and breaks as /timeline (the same controls), plus clocking in and out.
 */

function statusLabel(status: LiveStatus, clockIn?: number) {
  switch (status.kind) {
    case "empty":
      return "No upcoming shifts"
    case "off":
      return "Not clocked in"
    case "working":
      return `On the clock since ${clockTime(clockIn!)}`
    case "break":
      return `${status.meal ? "At a meal" : "On a break"}, due back at ${clockTime(status.due)}`
    case "out":
      return "Clocked out"
  }
}

const NEXT_SHIFTS: readonly NextShift[] = ["none", "soon", "tomorrow", "later"]
const NEXT_SHIFT_LABEL: Record<NextShift, string> = { none: "None", soon: "In 1.5h", tomorrow: "Tomorrow", later: "In 3 days" }

const PRECISIONS: readonly Precision[] = ["exact", "calm"]
const PRECISION_NOTE: Record<Precision, string> = {
  exact: "Every minute, in every state.",
  calm: "A welcome on clocking in, then 15m steps. Countdowns to a shift, break or meal get finer as they get close: 5m steps, then exact in the last 5.",
}

function PrecisionSection() {
  const { precision, setPrecision } = useWidgetStore()
  return (
    <section className="flex flex-col gap-3 border-t border-stroke-faint pt-5">
      <div className="flex items-center gap-1.5">
        <h2 className="text-sm font-semibold text-label">Time precision</h2>
        {/* What the chosen mode does, on hover or focus. */}
        <span className="group relative flex">
          <button
            type="button"
            aria-label="About time precision"
            aria-describedby="precision-note"
            className="flex size-5 cursor-help items-center justify-center rounded-full text-label-tertiary hover:text-label focus-visible:text-label focus-visible:outline-2 focus-visible:outline-label"
          >
            <IconHelpCircle size={16} stroke={1.75} />
          </button>
          <span
            id="precision-note"
            role="tooltip"
            className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 w-56 -translate-x-1/2 rounded-lg bg-label px-3 py-2 text-xs text-surface opacity-0 shadow-md transition-opacity duration-150 group-focus-within:opacity-100 group-hover:opacity-100 group-hover:delay-200"
          >
            {PRECISION_NOTE[precision]}
          </span>
        </span>
      </div>
      <Segmented label="Time precision" options={PRECISIONS} value={precision} onChange={setPrecision} render={(p) => (p === "exact" ? "Exact" : "Calm")} />
    </section>
  )
}

export function LivePanel() {
  const store = useTimelineStore()
  const { config, resetClock, resetTaken, setPayRate, setNextShift, setOffline, openApp } = store
  const { clockIn, clockOut, endBreak, take } = store
  const shown = liveWidget(config).state
  const celebrating = shown === "shift-done"
  // Once the shift's end takes over the widget, Clock out is the one action (it ends the break too).
  const shiftEndShowing = shown === "ending" || shown === "overtime"
  const next = nextShiftStart(config)
  const status = liveStatus(config)
  const remaining = remainingEvents(config)
  const left = { break: remaining.filter((e) => e.kind === "break").length, meal: remaining.filter((e) => e.kind === "meal").length }
  const inShift = canTake(config)
  const clockTouched = config.clockIn !== undefined
  const breaksTouched = Object.keys(config.taken ?? {}).length > 0

  return (
    <aside
      aria-label="Live widget controls"
      className="border-t border-stroke-faint bg-surface-secondary lg:fixed lg:inset-y-0 lg:right-0 lg:z-20 lg:w-72 lg:overflow-y-auto lg:border-t-0 lg:border-l"
    >
      {status.kind === "empty" ? (
        <EmptyNote>No shift, so there's nothing to clock into.</EmptyNote>
      ) : (
        <div className="flex flex-col gap-6 px-5 py-5">
          <TimeOfDay status={`${clockTime(config.shiftStart)} – ${clockTime(config.shiftEnd)} shift`} />

          <section className="flex flex-col gap-3 border-t border-stroke-faint pt-5">
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-semibold text-label">Clock</h2>
                <ResetButton onClick={resetClock} disabled={!clockTouched} label="Reset clock-in and out" />
              </div>
              <p className="text-xs text-label-secondary">{statusLabel(status, config.clockIn)}</p>
            </div>

            <div className="flex flex-col gap-2">
              {(status.kind === "off" || status.kind === "out") && (
                <Button onClick={clockIn} className="justify-start">
                  <IconClockPlay />
                  Clock in
                </Button>
              )}
              {celebrating && (
                <Button variant="outline" onClick={openApp} className="justify-start">
                  <IconDeviceMobile />
                  Open the app
                </Button>
              )}
              {(status.kind === "working" || status.kind === "break") && (
                <Button variant={status.kind === "break" && shiftEndShowing ? "default" : "outline"} onClick={clockOut} className="justify-start">
                  <IconClockStop />
                  Clock out
                </Button>
              )}
            </div>
          </section>

          {/* Breaks and meals reset on their own, so trying them out again doesn't mean clocking back in. */}
          <section className="flex flex-col gap-3 border-t border-stroke-faint pt-5">
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-semibold text-label">Today</h2>
              <ResetButton onClick={resetTaken} disabled={!breaksTouched} label="Reset breaks and meals" />
            </div>
            <div className="flex flex-col gap-2">
              {status.kind === "working" &&
                (["break", "meal"] as const).map((kind) => (
                  <Button key={kind} onClick={() => take(kind)} disabled={!inShift || left[kind] === 0} className="justify-start">
                    {kind === "break" ? <IconCoffee /> : <MealIcon size={16} />}
                    <span className="flex-1 text-left">{kind === "break" ? "Take a break" : "Take a meal"}</span>
                    <span className="font-mono tabular-nums opacity-60">{left[kind]} left</span>
                  </Button>
                ))}
              {status.kind === "break" && !shiftEndShowing && (
                <Button onClick={endBreak} className="justify-start">
                  <IconPlayerStopFilled />
                  {status.meal ? "End meal" : "End break"}
                </Button>
              )}
            </div>
            {status.kind === "working" && !inShift && (
              <p className="text-xs text-label-tertiary">Breaks can be taken during the shift.</p>
            )}
            {(status.kind === "off" || status.kind === "out") && (
              <p className="text-xs text-label-tertiary">Clock in to take one.</p>
            )}
            {status.kind === "break" && shiftEndShowing && (
              <p className="text-xs text-label-tertiary">The shift's end has taken over; clocking out ends it.</p>
            )}
          </section>

          <ShiftControls />

          <PrecisionSection />

          {/* What happens after clocking out: the earnings shown, and what comes next. */}
          <section className="flex flex-col gap-3 border-t border-stroke-faint pt-5">
              <div className="flex flex-col gap-1.5">
                <p className="text-xs text-label-secondary">
                  Connection
                  {config.offlineAt !== undefined && <span className="text-label-tertiary"> · lost at {clockTime(config.offlineAt)}</span>}
                </p>
                <Segmented
                  label="Connection"
                  options={["online", "offline"] as const}
                  value={config.offlineAt === undefined ? "online" : "offline"}
                  onChange={(v) => setOffline(v === "offline")}
                  render={(v) => (v === "online" ? "Online" : "Offline")}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="text-xs text-label-secondary">
                  Next shift
                  {next !== undefined && (
                    <span className="text-label-tertiary">
                      {" · "}
                      {clockTime(next)}
                      {next >= 2 * 24 * 60 ? " in 3 days" : next >= 24 * 60 ? " tomorrow" : ""}
                    </span>
                  )}
                </p>
                <Segmented label="Next shift" options={NEXT_SHIFTS} value={config.nextShift ?? "none"} onChange={setNextShift} render={(n) => NEXT_SHIFT_LABEL[n]} />
              </div>
              <label className="flex items-center justify-between gap-3 text-xs text-label-secondary">
                <span>
                  Pay rate
                  {status.kind === "out" && (
                    <span className="text-label-tertiary">
                      {" · earned "}
                      {estimatedEarnings(config).toLocaleString("en-US", { style: "currency", currency: "USD" })}
                    </span>
                  )}
                </span>
                <span className="flex h-8 w-24 items-center gap-1 rounded-lg bg-surface px-2.5 inset-ring-1 inset-ring-stroke-strong">
                  <span className="font-mono text-label-tertiary">$</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step={0.5}
                    value={config.payRate ?? DEFAULT_PAY_RATE}
                    onChange={(e) => setPayRate(Math.max(0, Number(e.target.value) || 0))}
                    className="min-w-0 flex-1 bg-transparent font-mono text-sm tabular-nums text-label outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="font-mono text-label-tertiary">/h</span>
                </span>
              </label>
          </section>
        </div>
      )}
    </aside>
  )
}

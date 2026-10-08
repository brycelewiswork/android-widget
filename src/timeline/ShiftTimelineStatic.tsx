import { useId, type ReactNode } from "react"
import { clockTime, phaseOf, takenEvents, type TimelineConfig } from "./model"
import { INK, PROGRESS_FILL, TRACK_FILL, WIRE, type Track } from "./track"

/*
 * The shift timeline the widgets draw — what Android can actually build.
 *
 * Android widgets aren't live UI: the app hands the home screen a snapshot,
 * which stays put until the next one, and the system throttles frequent
 * updates. So nothing here animates, and the bar doesn't fill smoothly: it
 * steps forward when an update would be pushed — every few minutes
 * (UPDATE_EVERY), and straight away on an event (clock in, a break taken or
 * ended, clock out). State changes are instant redraws.
 *
 * Same design and layout as Timeline 2 (./track): each break owns a bar after
 * its bulge, sized to the time it took once ended; untaken breaks are dots
 * spaced toward the end; clocking out shows the day finished — full black, the
 * gaps closed. ShiftTimelineV2 keeps the animated version for reference.
 */

/** How often the widget would get a fresh snapshot, in minutes. The bar moves in these steps. */
const UPDATE_EVERY = 5

/**
 * The time of day as of the widget's last update: rounded down to the update
 * step, but never before the latest event (an event pushes its own update, and
 * rounding back past it would un-take a break).
 */
function updatedAt(config: TimelineConfig): number | null {
  const { now } = config
  if (now === null) return null
  const stepped = Math.floor(now / UPDATE_EVERY) * UPDATE_EVERY
  const events = [
    config.shiftStart,
    config.clockIn,
    config.clockOut,
    ...takenEvents(config).map((t) => t.at),
    ...Object.values(config.breakEnds ?? {}),
  ].filter((t): t is number => t !== undefined && t <= now)
  return Math.max(stepped, ...events)
}

/** A Figma glyph in its 14px box, centred on a bulge; `light` flips it for a black bulge. */
function Marker({ cx, src, w, h, dx, dy, light }: { cx: number; src: string; w: number; h: number; dx: number; dy: number; light?: boolean }) {
  return (
    <img
      alt=""
      src={`${import.meta.env.BASE_URL}widget/${src}.svg`}
      width={w}
      height={h}
      className="absolute block max-w-none"
      style={{ left: cx - 7 + dx, top: 6 + dy, width: w, height: h, filter: light ? "invert(1)" : undefined }}
    />
  )
}

/** What a marker stands for: the clock at either end, or a break / meal bulge. */
export type MarkerKind = "clock" | "break" | "meal"

/** How a track is coloured, and how its markers are drawn (`filled`: on the progress colour). */
export type TimelineSkin = {
  track: string
  progress: string
  dot: string
  marker: (kind: MarkerKind, cx: number, filled: boolean) => ReactNode
}

/** The wireframe: grey track, black progress, the Figma glyphs inverted on black. */
export const WIRE_SKIN: TimelineSkin = {
  track: TRACK_FILL,
  progress: PROGRESS_FILL,
  dot: INK,
  marker: (kind, cx, filled) =>
    kind === "clock" ? (
      <Marker key={`clock-${cx}`} cx={cx} src="timeclock-fill" w={12.2625} h={12.2625} dx={0.87} dy={0.87} light={filled} />
    ) : kind === "meal" ? (
      <Marker key={`meal-${cx}`} cx={cx} src="rice-bowl-filled" w={12.833} h={12.833} dx={0.583} dy={0.583} light />
    ) : (
      <Marker key={`break-${cx}`} cx={cx} src="coffee-sm" w={12.8568} h={12.2687} dx={0.58} dy={0.857} light />
    ),
}

export function ShiftTimelineStatic({
  config: live,
  labelSize = 13.5,
  track = WIRE,
  skin = WIRE_SKIN,
  labels = true,
}: {
  config: TimelineConfig
  labelSize?: number
  /** The geometry to draw on (wireframe by default; the hi-fi passes HIFI). */
  track?: Track
  skin?: TimelineSkin
  /** The start / end times under the track. Off when the layout draws its own. */
  labels?: boolean
}) {
  const maskId = useId()
  const { g, CAP_R, CUT, CY, END_CUT, END_X, JOIN_COVERED, START_X, joinPath, layout } = track
  // Drawn as of the last update, not the live minute.
  const config = { ...live, now: updatedAt(live) }
  const phase = phaseOf(config)
  const labelStyle = { fontSize: labelSize, letterSpacing: -labelSize / 100 }

  // No upcoming shift: just the bar (no end bulges) in the same 26px box, and an
  // empty label row of the same height, so the widget layout doesn't move.
  if (phase.kind === "empty") {
    return (
      <div className="flex w-full flex-col gap-[2px]" data-phase="empty">
        <svg width={g.width} height={g.height} viewBox={`0 0 ${g.width} ${g.height}`} className="overflow-visible" aria-hidden>
          <rect x={0} y={g.barTop} width={g.width} height={g.barHeight} rx={CAP_R} style={{ fill: skin.track }} />
        </svg>
        {labels && (
          <div aria-hidden className="font-bold" style={labelStyle}>
            {" "}
          </div>
        )}
      </div>
    )
  }

  const { checkpoints, nowX, dots: planned } = layout(config)
  const started = phase.kind !== "static" && phase.kind !== "before"
  const complete = !!config.complete
  // Clocked out, or past the end: the whole track is black.
  const done = phase.kind === "after" || complete
  // Breaks not taken don't count once the shift's finished.
  const dots = complete ? [] : planned
  const fillTo = done ? END_X : (nowX ?? START_X)

  return (
    <div className="flex w-full flex-col gap-[2px]" data-phase={phase.kind} data-updated={config.now ?? undefined}>
      <div className="relative" style={{ width: g.width, height: g.height }}>
        <svg
          width={g.width}
          height={g.height}
          viewBox={`0 0 ${g.width} ${g.height}`}
          className="absolute inset-0 overflow-visible"
          aria-hidden
        >
          <defs>
            {/* White keeps, black cuts: the gap before each break's bulge and at its bar's end, with
                round caps put back by white circles. Finished, the gaps are closed. */}
            <mask id={maskId} maskUnits="userSpaceOnUse" x={-4} y={-4} width={g.width + 8} height={g.height + 8}>
              <rect x={-4} y={-4} width={g.width + 8} height={g.height + 8} fill="white" />
              {!complete &&
                checkpoints.map(({ event, x, cut }) => (
                  <g key={event.id} data-gap={event.id}>
                    <rect x={x - CUT} y={-4} width={CUT} height={g.height + 8} fill="black" />
                    <circle cx={x - CUT} cy={CY} r={CAP_R} fill="white" />
                    {cut !== null && (
                      <>
                        <rect x={cut} y={-4} width={END_CUT} height={g.height + 8} fill="black" />
                        <circle cx={cut} cy={CY} r={CAP_R} fill="white" />
                        <circle cx={cut + END_CUT} cy={CY} r={CAP_R} fill="white" />
                      </>
                    )}
                  </g>
                ))}
            </mask>
          </defs>

          <g style={{ fill: skin.track }} mask={`url(#${maskId})`}>
            <circle cx={START_X} cy={CY} r={g.r} />
            <path d={joinPath(START_X, 1)} />
            <rect x={START_X} y={g.barTop} width={END_X - START_X} height={g.barHeight} />
            <path d={joinPath(END_X, -1)} />
            <circle cx={END_X} cy={CY} r={g.r} />
            {checkpoints.map(({ event, x }) => (
              <path key={event.id} d={joinPath(x, 1)} />
            ))}
          </g>

          {/* Elapsed time, as of the last update: a bar-height pill with a round leading end. */}
          {started && (
            <g style={{ fill: skin.progress }} mask={`url(#${maskId})`} data-progress={fillTo.toFixed(2)}>
              <circle cx={START_X} cy={CY} r={g.r} />
              {fillTo - START_X >= JOIN_COVERED && <path d={joinPath(START_X, 1)} />}
              <rect
                x={START_X}
                y={g.barTop}
                width={fillTo - START_X}
                height={g.barHeight}
                rx={Math.min(CAP_R, (fillTo - START_X) / 2)}
              />
              {done && (
                <>
                  <path d={joinPath(END_X, -1)} />
                  <circle cx={END_X} cy={CY} r={g.r} />
                </>
              )}
              {checkpoints.map(({ event, x }) => (
                <path key={event.id} d={joinPath(x, 1)} />
              ))}
              {/* Finished: each bulge joins the bar before it too — the day in one piece. */}
              {complete && checkpoints.map(({ event, x }) => <path key={`in-${event.id}`} d={joinPath(x, -1)} />)}
            </g>
          )}

          {checkpoints.map(({ event, x }) => (
            <circle key={event.id} data-checkpoint-bulge={event.kind} cx={x} cy={CY} r={g.r} style={{ fill: skin.progress }} />
          ))}
          {dots.map(({ e, x }) => (
            <circle key={e.id} data-event={e.kind} cx={x} cy={CY} r={g.dotR} style={{ fill: skin.dot }} />
          ))}
        </svg>

        {/* The clock at both ends; coffee and the rice bowl on breaks. */}
        {skin.marker("clock", START_X, started)}
        {checkpoints.map(({ event, x }) => skin.marker(event.kind === "meal" ? "meal" : "break", x, true))}
        {skin.marker("clock", END_X, done)}
      </div>
      {labels && (
        <div className="flex w-full items-center justify-between whitespace-nowrap font-bold" style={labelStyle}>
          <p>{clockTime(config.shiftStart)}</p>
          <p>{clockTime(config.shiftEnd)}</p>
        </div>
      )}
    </div>
  )
}

import { useId } from "react"
import { clockTime, phaseOf, takenEvents, TRACK, type TimelineConfig } from "./model"
import {
  CAP_R,
  CUT,
  CY,
  DOT_R,
  END_CUT,
  END_X,
  INK,
  JOIN_COVERED,
  joinPath,
  layout,
  PROGRESS_FILL,
  START_X,
  TRACK_FILL,
} from "./track"
import { TrackShape } from "./TrackShape"

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

export function ShiftTimelineStatic({ config: live, labelSize }: { config: TimelineConfig; labelSize: 13.5 | 16 }) {
  const maskId = useId()
  // Drawn as of the last update, not the live minute.
  const config = { ...live, now: updatedAt(live) }
  const phase = phaseOf(config)
  const labelStyle = { fontSize: labelSize, letterSpacing: -labelSize / 100 }

  // No upcoming shift: just the bar (no end bulges) in the same 26px box, and an
  // empty label row of the same height, so the widget layout doesn't move.
  if (phase.kind === "empty") {
    return (
      <div className="flex w-full flex-col gap-[2px]" data-phase="empty">
        <svg width={TRACK.width} height={TRACK.height} viewBox={`0 0 ${TRACK.width} ${TRACK.height}`} className="overflow-visible" aria-hidden>
          <rect x={0} y={TRACK.barTop} width={TRACK.width} height={TRACK.barHeight} rx={CAP_R} fill={TRACK_FILL} />
        </svg>
        <div aria-hidden className="font-bold" style={labelStyle}>
          {" "}
        </div>
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
      <div className="relative h-[26px] w-[357px]">
        <svg
          width={TRACK.width}
          height={TRACK.height}
          viewBox={`0 0 ${TRACK.width} ${TRACK.height}`}
          className="absolute inset-0 overflow-visible"
          aria-hidden
        >
          <defs>
            {/* White keeps, black cuts: the gap before each break's bulge and at its bar's end, with
                round caps put back by white circles. Finished, the gaps are closed. */}
            <mask id={maskId} maskUnits="userSpaceOnUse" x={-4} y={-4} width={TRACK.width + 8} height={TRACK.height + 8}>
              <rect x={-4} y={-4} width={TRACK.width + 8} height={TRACK.height + 8} fill="white" />
              {!complete &&
                checkpoints.map(({ event, x, cut }) => (
                  <g key={event.id} data-gap={event.id}>
                    <rect x={x - CUT} y={-4} width={CUT} height={TRACK.height + 8} fill="black" />
                    <circle cx={x - CUT} cy={CY} r={CAP_R} fill="white" />
                    {cut !== null && (
                      <>
                        <rect x={cut} y={-4} width={END_CUT} height={TRACK.height + 8} fill="black" />
                        <circle cx={cut} cy={CY} r={CAP_R} fill="white" />
                        <circle cx={cut + END_CUT} cy={CY} r={CAP_R} fill="white" />
                      </>
                    )}
                  </g>
                ))}
            </mask>
          </defs>

          <g fill={TRACK_FILL} mask={`url(#${maskId})`}>
            <TrackShape startX={START_X} endX={END_X} />
            {checkpoints.map(({ event, x }) => (
              <path key={event.id} d={joinPath(x, 1)} />
            ))}
          </g>

          {/* Elapsed time, as of the last update: a bar-height pill with a round leading end. */}
          {started && (
            <g fill={PROGRESS_FILL} mask={`url(#${maskId})`} data-progress={fillTo.toFixed(2)}>
              <circle cx={START_X} cy={CY} r={TRACK.r} />
              {fillTo - START_X >= JOIN_COVERED && <path d={joinPath(START_X, 1)} />}
              <rect
                x={START_X}
                y={TRACK.barTop}
                width={fillTo - START_X}
                height={TRACK.barHeight}
                rx={Math.min(CAP_R, (fillTo - START_X) / 2)}
              />
              {done && (
                <>
                  <path d={joinPath(END_X, -1)} />
                  <circle cx={END_X} cy={CY} r={TRACK.r} />
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
            <circle key={event.id} data-checkpoint-bulge={event.kind} cx={x} cy={CY} r={TRACK.r} fill={PROGRESS_FILL} />
          ))}
          {dots.map(({ e, x }) => (
            <circle key={e.id} data-event={e.kind} cx={x} cy={CY} r={DOT_R} fill={INK} />
          ))}
        </svg>

        {/* Figma's filled Timeclock (Timekeeping Iconography 106:7134) at both ends; coffee and the rice bowl on breaks. */}
        <Marker cx={START_X} src="timeclock-fill" w={12.2625} h={12.2625} dx={0.87} dy={0.87} light={started} />
        {checkpoints.map(({ event, x }) =>
          event.kind === "meal" ? (
            <Marker key={event.id} cx={x} src="rice-bowl-filled" w={12.833} h={12.833} dx={0.583} dy={0.583} light />
          ) : (
            <Marker key={event.id} cx={x} src="coffee-sm" w={12.8568} h={12.2687} dx={0.58} dy={0.857} light />
          ),
        )}
        <Marker cx={END_X} src="timeclock-fill" w={12.2625} h={12.2625} dx={0.87} dy={0.87} light={done} />
      </div>
      <div className="flex w-full items-center justify-between whitespace-nowrap font-bold" style={labelStyle}>
        <p>{clockTime(config.shiftStart)}</p>
        <p>{clockTime(config.shiftEnd)}</p>
      </div>
    </div>
  )
}

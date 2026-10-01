import { useId } from "react"
import { AnimatePresence, motion } from "motion/react"
import { DURATION, EASE, SPRING_FAST } from "@/lib/motion"
import { clockTime, phaseOf, remainingEvents, takenEvents, TRACK, type EventKind, type TimelineConfig, type TimelineEvent } from "./model"

/*
 * Version 2 of the shift timeline: started as an exact copy of ShiftTimeline
 * (2026-10-01) to be explored separately. Same data (./model), its own drawing.
 *
 * The shift timeline, from the 4×2 / 4×3 Figma frames (Union 357.404 × 26):
 * a 10px bar with 13px-radius bulges at the shift's start and end, carrying
 * Figma's clock-in / clock-out glyphs, built from Figma's own curve values.
 *
 * The bar is one continuous track (grey), with black laid over it up to now
 * (fully round leading end). Taking a break or meal makes a checkpoint: a mask
 * cuts a gap into the bar just before it, leaving a round cap, and a bulge
 * carrying the break's icon sits at the moment it was taken. Breaks and meals
 * still to come are plain dots. Checkpoints animate in and out — the gap opens
 * or closes, the bulge scales, the dots glide — on take, reset, and scrub-back.
 *
 * What's new in V2: a break has a defined end. Each checkpoint owns a fixed
 * length of bar after its bulge (SPAN, per kind) that fills over the break's
 * duration, then a second gap, then the shift's bar carries on. Once ended,
 * the break's bar resizes to the time it took (shorter or longer) and its gap
 * slides to match. Taking one
 * grows that break bar out of the bulge and everything after it makes room.
 *
 * Clocking out finishes the track (`config.complete`), as in V1: the black
 * runs the rest of the way, the end bulge fills from its centre, then every
 * gap — before each bulge and at each break's end — closes from both sides at
 * once, the bulges and icons staying put.
 */

const INK = "#2c2935" // Figma content/primary — glyphs and dots
const TRACK_FILL = "#b0b0b0" // Figma Union fill
const PROGRESS_FILL = "#000000" // elapsed part of the shift (wireframe: black)

const CAP_R = TRACK.barHeight / 2
/** How far left of a checkpoint's centre the gap's cut reaches: bulge radius + gap + the cap's own radius. */
/** The space between a bar's round cap and what's next — tighter than V1's 8.6 (TRACK.gap). */
const GAP = 5
const CUT = TRACK.r + GAP + CAP_R
const DOT_R = 2.5
const CY = TRACK.height / 2

// A checkpoint coming or going, all at once: the leftmost dot fades (or a dot
// fades back in), the gap opens (or closes), the other dots glide to their new
// spacing, and the bulge + icon scale in (or out) from where it was taken.
const MOTION = {
  fade: { duration: DURATION.fast * 0.75 },
  glide: { type: "spring", ...SPRING_FAST.snappy },
  pop: { type: "spring", ...SPRING_FAST.bouncy },
  /** Shrinking away doesn't overshoot. */
  unpop: { type: "spring", ...SPRING_FAST.snappy },
  gap: { type: "spring", ...SPRING_FAST.snappy },
  /** How long dots keep springing after a change; outside it they track the time instantly. */
  windowMs: 900,
} as const
const INSTANT = { duration: 0 }

/** Clocking out: run to the end, fill the end bulge, then close the gaps. On-screen movement, so ease-in-out. */
const FINISH = {
  run: { duration: DURATION.slow, ease: EASE.easeInOut },
  /** The end bulge fills as the black arrives. */
  fillDelay: DURATION.slow * 0.85,
  close: { duration: DURATION.slow, ease: EASE.easeInOut, delay: DURATION.slow + DURATION.normal },
  /** Long enough to cover all three beats. */
  windowMs: 2500,
} as const

/** Where a gap before a bulge closes to: the middle of the visible gap, between the bar's cap and the bulge. */
const gapMiddle = (x: number) => (x - CUT + CAP_R + (x - TRACK.r)) / 2

/** Bulge centre → the end of the break's own bar (its round cap's outer edge). Fixed per kind, not per minute. */
const SPAN: Record<EventKind, number> = { break: 44, meal: 68 }
/** The cut at a break's end: the gap plus the round cap on either side of it. */
const END_CUT = GAP + 2 * CAP_R
const START_X: number = TRACK.r
const END_X = TRACK.width - TRACK.r
/** Closest a bulge sits after the start bulge: its join, a visible cap, the gap, the bulge. */
const FIRST_STEP = TRACK.join + CAP_R + GAP + TRACK.r

type Checkpoint = {
  event: TimelineEvent
  /** Bulge centre. */
  x: number
  /** Where the break's bar ends; the end gap's cut runs from `cut` for END_CUT. `null` when it runs into the end bulge. */
  cut: number | null
}

/**
 * Lays the day out along the track. Time no longer maps linearly: each
 * checkpoint's break takes SPAN of bar whatever its length, so the time
 * still to come is squeezed into what's left. The past never moves — a new
 * checkpoint only re-scales what comes after it.
 */
function layout(config: TimelineConfig) {
  const { shiftEnd } = config
  const segments: { t0: number; t1: number; x0: number; x1: number }[] = []
  const checkpoints: Checkpoint[] = []
  let cur = { t: config.shiftStart, x: START_X }
  let minX = START_X + FIRST_STEP
  for (const { event, at } of takenEvents(config)) {
    // Taken during another break: it starts once that one ends.
    const start = Math.max(at, cur.t)
    const open = shiftEnd > cur.t ? cur.x + ((start - cur.t) / (shiftEnd - cur.t)) * (END_X - cur.x) : END_X
    const x = Math.min(Math.max(open, minX), END_X - FIRST_STEP)
    segments.push({ t0: cur.t, t1: start, x0: cur.x, x1: x })
    // No room for the end gap and some bar after it: the break runs into the end bulge.
    const fits = END_X - x >= SPAN[event.kind] + END_CUT + JOIN_COVERED
    const fullEnd = fits ? x + SPAN[event.kind] : END_X
    // The break's fill starts already past the bulge's join, so the join is black (and
    // round) from the moment it's taken, never the flat end of a short fill.
    const fillFrom = Math.min(x + JOIN_COVERED, fullEnd)
    // Once it's ended, the break's bar fits the time it actually took: shorter if ended early,
    // longer if it ran over (as far as the room before the end bulge allows), and the shift's
    // bar picks up from there. Until then it keeps its planned length.
    const ended = config.breakEnds?.[event.id]
    const end = ended ?? start + event.duration
    const used = ended === undefined ? 1 : Math.max(0, (ended - start) / event.duration)
    const longest = END_X - END_CUT - JOIN_COVERED
    const barEnd = fits ? Math.min(fillFrom + (fullEnd - fillFrom) * used, Math.max(fullEnd, longest)) : END_X
    segments.push({ t0: start, t1: end, x0: fillFrom, x1: barEnd })
    checkpoints.push({ event, x, cut: fits ? barEnd - CAP_R : null })
    // The bar resumes past the gap; at the break's end the black fills its round cap.
    cur = { t: end, x: fits ? barEnd + GAP + 2 * CAP_R : END_X }
    minX = cur.x + CUT
  }
  segments.push({ t0: cur.t, t1: shiftEnd, x0: cur.x, x1: END_X })

  const xOf = (t: number) => {
    if (t <= config.shiftStart) return START_X
    const seg = segments.find((g) => t < g.t1) ?? segments[segments.length - 1]
    if (t >= seg.t1) return seg.x1
    return seg.x0 + ((t - seg.t0) / (seg.t1 - seg.t0)) * (seg.x1 - seg.x0)
  }
  const nowX = config.now === null ? null : xOf(config.now)

  // Breaks and meals still to come: spread evenly after the elapsed time and the
  // last break's bar, up to the end bulge's left edge (as in V1).
  const anchor = Math.max(START_X + TRACK.r, config.now !== null && config.now > config.shiftStart ? nowX! : 0, cur.x)
  const limit = END_X - TRACK.r
  const upcoming = remainingEvents(config)
  const dots = anchor < limit ? upcoming.map((e, i) => ({ e, x: anchor + ((i + 1) / (upcoming.length + 1)) * (limit - anchor) })) : []

  return { checkpoints, nowX, dots }
}

/** The curved join between a bulge at `cx` and the bar, on the `side` facing the bar. Figma's own curve values. */
function joinPath(cx: number, side: 1 | -1) {
  const x = (d: number) => cx + side * d
  return `M${x(9.923)} 4.6027 C${x(11.488)} 6.4506 ${x(13.579)} 8 ${x(TRACK.join)} 8 L${x(TRACK.join)} 18 C${x(13.579)} 18 ${x(11.488)} 19.5494 ${x(9.923)} 21.3973 Z`
}

/**
 * A bulge's join ends in a flat edge `TRACK.join` past its centre. A black
 * fill shorter than that plus its round cap would end on that flat edge, so
 * the black join is drawn only once the fill is long enough to cover it.
 */
const JOIN_COVERED = TRACK.join + CAP_R

/** The whole track: start bulge + join, the bar, end join + bulge. */
function TrackShape({ startX, endX }: { startX: number; endX: number }) {
  return (
    <>
      <circle cx={startX} cy={CY} r={TRACK.r} />
      <path d={joinPath(startX, 1)} />
      <rect x={startX} y={TRACK.barTop} width={endX - startX} height={TRACK.barHeight} />
      <path d={joinPath(endX, -1)} />
      <circle cx={endX} cy={CY} r={TRACK.r} />
    </>
  )
}

/**
 * A Figma marker glyph in its 14px box, centred on a bulge. `dx/dy` are the
 * glyph's offsets inside that box. `light` flips it for a black bulge.
 */
function Marker({ cx, src, w, h, dx, dy, light, fade, delay = 0 }: {
  cx: number; src: string; w: number; h: number; dx: number; dy: number; light?: boolean
  /** Fade into this tone from the other one — for a bulge that just filled or emptied. */
  fade?: boolean
  /** Seconds to wait before the tone change (the end bulge filling after the black arrives). */
  delay?: number
}) {
  const to = `invert(${light ? 1 : 0})`
  return (
    <motion.img
      alt=""
      src={`/widget/${src}.svg`}
      width={w}
      height={h}
      className="absolute block max-w-none"
      style={{ left: cx - 7 + dx, top: 6 + dy, width: w, height: h }}
      initial={fade ? { filter: `invert(${light ? 0 : 1})` } : { filter: to }}
      animate={{ filter: to, transition: { duration: DURATION.normal, delay } }}
    />
  )
}

export function ShiftTimelineV2({ config, labelSize }: { config: TimelineConfig; labelSize: 13.5 | 16 }) {
  const maskId = useId()
  const phase = phaseOf(config)
  // Read during render, so the very render that moves the dots after a change springs them.
  const justChanged = config.lastChangeAt !== undefined && Date.now() - config.lastChangeAt < MOTION.windowMs
  const justCrossedStart = config.lastStartCrossAt !== undefined && Date.now() - config.lastStartCrossAt < MOTION.windowMs
  const justCrossedEnd = config.lastEndCrossAt !== undefined && Date.now() - config.lastEndCrossAt < MOTION.windowMs
  const complete = !!config.complete
  const justFinished = config.lastCompleteAt !== undefined && Date.now() - config.lastCompleteAt < FINISH.windowMs
  const labelStyle = { fontSize: labelSize, letterSpacing: -labelSize / 100 }

  // No upcoming shift: just the bar (no end bulges) in the same 26px box, and
  // an empty label row of the same height, so the widget layout doesn't move.
  if (phase.kind === "empty") {
    return (
      <div className="flex w-full flex-col gap-[2px]" data-phase="empty">
        <svg width={TRACK.width} height={TRACK.height} viewBox={`0 0 ${TRACK.width} ${TRACK.height}`} className="overflow-visible" aria-hidden>
          <rect x={0} y={TRACK.barTop} width={TRACK.width} height={TRACK.barHeight} rx={CAP_R} fill={TRACK_FILL} />
        </svg>
        <div aria-hidden className="font-bold" style={labelStyle}>
          {" "}
        </div>
      </div>
    )
  }

  const { checkpoints, nowX, dots: planned } = layout(config)
  const startX = START_X
  const endX = END_X
  const started = phase.kind !== "static" && phase.kind !== "before"
  const over = phase.kind === "after"
  // Finished (clocked out) or past the end: the whole track is black.
  const done = over || complete
  // Clocked out before the end: the end bulge fills as part of the finish, after the run.
  const fillLate = justFinished && complete && !over
  // Breaks not taken don't count once the shift's finished.
  const dots = complete ? [] : planned
  // The layout's time scale already runs through every checkpoint, so the black's tip is just now.
  const tip = nowX ?? startX
  const fillTo = done ? endX : tip
  const closing = justFinished ? FINISH.close : INSTANT

  return (
    <div className="flex w-full flex-col gap-[2px]" data-phase={phase.kind}>
      <div className="relative h-[26px] w-[357px]">
        <svg
          width={TRACK.width}
          height={TRACK.height}
          viewBox={`0 0 ${TRACK.width} ${TRACK.height}`}
          className="absolute inset-0 overflow-visible"
          aria-hidden
        >
          <defs>
            {/* White keeps, black cuts. Each checkpoint cuts the gap before it; the white
                circle puts back the bar's round cap. Both animate open and closed. */}
            <mask id={maskId} maskUnits="userSpaceOnUse" x={-4} y={-4} width={TRACK.width + 8} height={TRACK.height + 8}>
              <rect x={-4} y={-4} width={TRACK.width + 8} height={TRACK.height + 8} fill="white" />
              <AnimatePresence initial={false}>
                {checkpoints.map(({ event, x }) => (
                  <motion.g key={event.id} data-gap={event.id}>
                    <motion.rect
                      y={-4}
                      height={TRACK.height + 8}
                      fill="black"
                      initial={{ x, width: 0 }}
                      animate={
                        complete
                          ? { x: gapMiddle(x), width: 0, transition: closing }
                          : { x: x - CUT, width: CUT, transition: MOTION.gap }
                      }
                      exit={{ x, width: 0, transition: MOTION.gap }}
                    />
                    <motion.circle
                      cy={CY}
                      r={CAP_R}
                      fill="white"
                      initial={{ cx: x }}
                      animate={complete ? { cx: gapMiddle(x), transition: closing } : { cx: x - CUT, transition: MOTION.gap }}
                      exit={{ cx: x, transition: MOTION.gap }}
                    />
                  </motion.g>
                ))}
                {/* The gap at each break's end, with a round cap either side. It's born under
                    the bulge and slides out to its place, so the break's bar grows out of it. */}
                {checkpoints.map(({ event, x, cut }) =>
                  cut === null ? null : (
                    <motion.g key={`end-${event.id}`} data-end-gap={event.id}>
                      <motion.rect
                        y={-4}
                        height={TRACK.height + 8}
                        fill="black"
                        initial={{ x, width: 0 }}
                        animate={
                          complete
                            ? { x: cut + END_CUT / 2, width: 0, transition: closing }
                            : { x: cut, width: END_CUT, transition: MOTION.gap }
                        }
                        exit={{ x, width: 0, transition: MOTION.gap }}
                      />
                      {/* Finished: both caps meet in the middle, the break's bar and the next one growing together. */}
                      {[0, END_CUT].map((dx) => (
                        <motion.circle
                          key={dx}
                          cy={CY}
                          r={CAP_R}
                          fill="white"
                          initial={{ cx: x }}
                          animate={complete ? { cx: cut + END_CUT / 2, transition: closing } : { cx: cut + dx, transition: MOTION.gap }}
                          exit={{ cx: x, transition: MOTION.gap }}
                        />
                      ))}
                    </motion.g>
                  ),
                )}
              </AnimatePresence>
            </mask>
          </defs>

          <g fill={TRACK_FILL} mask={`url(#${maskId})`}>
            <TrackShape startX={startX} endX={endX} />
          </g>

          {/* Each checkpoint's grey join into the bar after it — under the black, so the black
              grows over it from the bulge (as at the start). It unfolds from its left edge,
              which sits inside the bulge. */}
          <AnimatePresence initial={false}>
            {checkpoints.map(({ event, x }) => (
              <motion.path
                key={event.id}
                d={joinPath(x, 1)}
                fill={TRACK_FILL}
                style={{ originX: 0, originY: 0.5 }}
                initial={{ scale: 0 }}
                animate={{ scale: 1, transition: MOTION.pop }}
                exit={{ scale: 0, transition: MOTION.unpop }}
              />
            ))}
          </AnimatePresence>

          {/* Elapsed time: the start bulge fills once the shift begins, then a bar-height
              pill runs to now with a fully round leading end. The whole track once over or
              finished — on clocking out, the pill runs the rest of the way. */}
          {nowX !== null && started && (
            <g fill={PROGRESS_FILL} mask={`url(#${maskId})`} data-progress={nowX.toFixed(2)}>
              {/* The start bulge's black is its own animated circle, below. */}
              {fillTo - startX >= JOIN_COVERED && <path d={joinPath(startX, 1)} />}
              <motion.rect
                x={startX}
                y={TRACK.barTop}
                height={TRACK.barHeight}
                rx={Math.min(CAP_R, (tip - startX) / 2)}
                initial={false}
                animate={{ width: fillTo - startX }}
                // A break ending early pulls the black back with its gap; otherwise it tracks the time.
                transition={justFinished ? FINISH.run : justChanged ? MOTION.gap : INSTANT}
              />
              {/* The end join arrives with the black, unfolding from inside the end bulge. */}
              {done && (
                <motion.path
                  d={joinPath(endX, -1)}
                  style={{ originX: 1, originY: 0.5 }}
                  initial={fillLate ? { scale: 0 } : false}
                  animate={{ scale: 1, transition: { ...MOTION.pop, delay: fillLate ? FINISH.fillDelay : 0 } }}
                />
              )}
              {/* Covered from the start (see layout); unfolds with its bulge when just taken. */}
              {checkpoints.map(({ event, x }) => (
                <motion.path
                  key={event.id}
                  d={joinPath(x, 1)}
                  style={{ originX: 0, originY: 0.5 }}
                  initial={justChanged ? { scale: 0 } : false}
                  animate={{ scale: 1, transition: MOTION.pop }}
                />
              ))}
              {/* Finished: each bulge also joins the bar before it — revealed as its gap closes. */}
              {complete && checkpoints.map(({ event, x }) => <path key={`in-${event.id}`} d={joinPath(x, -1)} />)}
            </g>
          )}

          {/* The start bulge fills black as the shift starts, scaling out from its centre,
              and empties again if the time goes back before the start. Driven by the crossing
              stamp rather than by mount, because the widgets rebuild on that crossing. */}
          {started ? (
            <motion.circle
              key="start-fill"
              data-start-fill
              cx={startX}
              cy={CY}
              r={TRACK.r}
              fill={PROGRESS_FILL}
              initial={justCrossedStart ? { scale: 0 } : false}
              animate={{ scale: 1, transition: MOTION.pop }}
            />
          ) : (
            justCrossedStart && (
              <motion.circle
                key="start-empty"
                cx={startX}
                cy={CY}
                r={TRACK.r}
                fill={PROGRESS_FILL}
                initial={{ scale: 1 }}
                animate={{ scale: 0, transition: MOTION.unpop }}
              />
            )
          )}

          {/* The end bulge, likewise, as the shift ends (or the time goes back before it). */}
          {done ? (
            <motion.circle
              key="end-fill"
              data-end-fill
              cx={endX}
              cy={CY}
              r={TRACK.r}
              fill={PROGRESS_FILL}
              initial={justCrossedEnd || fillLate ? { scale: 0 } : false}
              animate={{ scale: 1, transition: { ...MOTION.pop, delay: fillLate ? FINISH.fillDelay : 0 } }}
            />
          ) : (
            (justCrossedEnd || (justFinished && !complete)) && (
              <motion.circle
                key="end-empty"
                cx={endX}
                cy={CY}
                r={TRACK.r}
                fill={PROGRESS_FILL}
                initial={{ scale: 1 }}
                animate={{ scale: 0, transition: MOTION.unpop }}
              />
            )
          )}

          {/* Checkpoint bulges. Scale in and out in place, each circle around its own centre
              (motion's SVG default for a lone shape — a group would scale around its combined
              box and drift). */}
          <AnimatePresence initial={false}>
            {checkpoints.map(({ event, x }) => (
              <motion.g key={event.id} data-checkpoint-bulge={event.kind} exit={{ opacity: 1, transition: MOTION.unpop }}>
                <motion.circle
                  cx={x}
                  cy={CY}
                  r={TRACK.r}
                  fill={PROGRESS_FILL}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1, transition: MOTION.pop }}
                  exit={{ scale: 0, transition: MOTION.unpop }}
                />
              </motion.g>
            ))}
          </AnimatePresence>

          {/* Dots are keyed by their place from the right, so when one is used up it's the
              leftmost that leaves (and the leftmost that returns); the rest glide — only right
              after a change, otherwise they track the time of day instantly. */}
          <AnimatePresence initial={false}>
            {dots.map(({ e, x }, i) => (
              <motion.circle
                key={`dot-${dots.length - 1 - i}`}
                data-event={e.kind}
                cy={CY}
                r={DOT_R}
                fill={INK}
                initial={{ cx: x, opacity: 0 }}
                animate={{ cx: x, opacity: 1, transition: justChanged ? MOTION.glide : INSTANT }}
                exit={{ opacity: 0, transition: MOTION.fade }}
              />
            ))}
          </AnimatePresence>
        </svg>

        {/* Both ends carry Figma's filled Timeclock (Timekeeping Iconography 106:7134): 21.02 art
            inset 6.2% in a 24px frame, scaled into the 14px marker box (12.26, offset 0.87). The
            clock-in / clock-out arrows were too small to read at this size. */}
        <Marker cx={startX} src="timeclock-fill" w={12.2625} h={12.2625} dx={0.87} dy={0.87} light={started} fade={justCrossedStart} />
        <AnimatePresence initial={false}>
          {checkpoints.map(({ event, x }) => (
            // A 26px box on the bulge, scaling with it from its centre.
            <motion.div
              key={event.id}
              data-checkpoint={event.kind}
              className="absolute"
              style={{ left: x - TRACK.r, top: 0, width: TRACK.r * 2, height: TRACK.height }}
              initial={{ scale: 0 }}
              animate={{ scale: 1, transition: MOTION.pop }}
              exit={{ scale: 0, transition: MOTION.unpop }}
            >
              {event.kind === "meal" ? (
                // Figma "donut" (Timekeeping Iconography 106:6971): 22px art in a 24px frame,
                // scaled into the 14px marker box like the coffee glyph (22/24 × 14 = 12.83).
                <Marker cx={TRACK.r} src="donut" w={12.833} h={12.833} dx={0.583} dy={0.583} light />
              ) : (
                <Marker cx={TRACK.r} src="coffee-sm" w={12.8568} h={12.2687} dx={0.58} dy={0.857} light />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        <Marker
          cx={endX}
          src="timeclock-fill"
          w={12.2625}
          h={12.2625}
          dx={0.87}
          dy={0.87}
          light={done}
          fade={justCrossedEnd || fillLate}
          delay={fillLate ? FINISH.fillDelay : 0}
        />
      </div>
      <div className="flex w-full items-center justify-between whitespace-nowrap font-bold" style={labelStyle}>
        <p>{clockTime(config.shiftStart)}</p>
        <p>{clockTime(config.shiftEnd)}</p>
      </div>
    </div>
  )
}

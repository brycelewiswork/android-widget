import type { CSSProperties, ReactNode } from "react"
import { IconLoader2 } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { clockTime } from "@/timeline/model"
import { ShiftTimelineStatic, type MarkerKind, type TimelineSkin } from "@/timeline/ShiftTimelineStatic"
import { HIFI as HIFI_TRACK } from "@/timeline/track"
import type { Action, IconName, ScheduleRow, StateContent } from "../states"
import { ACTION_BY_LABEL, compactAction, useActs, useWidgetBusy, useWidgetState, useWidgetTimeline } from "../Widget"

/*
 * The hi-fi widgets, from Figma (Android---iOS-Widgets, Documentation page:
 * component set "Widget" 103:1800 and the state matrix beside it). Material 3
 * Expressive colours come from the `--h-*` tokens in ../widget.css. Every
 * state renders through these four layouts from the same content as the
 * wireframes (../states.ts, ../live.ts); what changes per size is which slots
 * show and how the buttons are shaped:
 *   2×2 — title, subtitle, two 72px squares or one labelled button
 *   4×1 — title + subtitle beside two 61px squares or one 130px labelled button
 *   4×2 — title, subtitle, timeline, a button row (61px squares, then labelled)
 *   4×3 — the 4×2, plus the next shifts on a 5% sheet
 * No motion: Android widgets are snapshots, so a state change is a redraw.
 */

const asset = (name: string) => `${import.meta.env.BASE_URL}widget/hifi/${name}.svg`

// ── Icons ──────────────────────────────────────────────────────────────────
// Figma's exported icons, drawn as masks so they take the button's colour
// (the SVGs carry one fill each). Sizes are the exports' own, centred in 24.

const ART: Record<IconName, { src: string; w: number; h: number }> = {
  message: { src: "message", w: 22, h: 21 },
  meal: { src: "meal", w: 21.7497, h: 21.7502 },
  coffee: { src: "coffee", w: 24, h: 24 },
  timeclock: { src: "timeclock", w: 24, h: 24 },
  // Ending a break is a time-clock action (Figma has no separate glyph).
  xmark: { src: "timeclock", w: 24, h: 24 },
  calendar: { src: "calendar", w: 20, h: 22 },
  money: { src: "money", w: 22, h: 22 },
  login: { src: "signin", w: 21, h: 19.9991 },
}

function Mask({ src, w, h, style }: { src: string; w: number; h: number; style?: CSSProperties }) {
  const url = `url("${asset(src)}") center / ${w}px ${h}px no-repeat`
  return <span aria-hidden className="block shrink-0 bg-current" style={{ width: w, height: h, mask: url, WebkitMask: url, ...style }} />
}

/** Figma's "TimeclockIn" (clock + arrow): the Clock In square on the 2×2 and 4×1. */
const CLOCK_IN = { src: "clock-in", w: 20.7718, h: 20.7718 }

function Icon({ name, clockIn }: { name: IconName; clockIn?: boolean }) {
  const busy = useWidgetBusy() === name
  const art = clockIn ? CLOCK_IN : ART[name]
  return (
    <span className="flex size-6 shrink-0 items-center justify-center">
      {/* Waiting on the server: a spinner in the icon's place (still — widgets don't animate). */}
      {busy ? <IconLoader2 size={22} stroke={2} role="status" aria-label="Working" /> : <Mask src={art.src} w={art.w} h={art.h} />}
    </span>
  )
}

/** The Homebase mark: 24px frame, 16.11 × 23.2 art, in the primary colour. */
function Logo({ className }: { className: string }) {
  return (
    <span className={cn("absolute flex size-6 items-center justify-center text-[var(--h-primary)]", className)}>
      <Mask src="logo" w={16.1094} h={23.2031} style={{ transform: "translate(0.05px, -0.4px)" }} />
    </span>
  )
}

// ── Buttons ────────────────────────────────────────────────────────────────
// Figma "Widget Button" (102:1630): 61px tall, 16px corners, 8px padding.
// Secondary: secondary-container; primary: primary. Squares are icon-only.

const PRESS =
  "cursor-pointer transition-transform duration-150 ease-out active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--h-primary)]"

const tone = (primary: boolean) =>
  primary ? "bg-[var(--h-primary)] text-[var(--h-on-primary)]" : "bg-[var(--h-container)] text-[var(--h-on-container)]"

/** An icon-only square: 61px, or sharing the row (2×2). */
function Square({ icon, primary, grow }: { icon: IconName; primary?: boolean; grow?: boolean }) {
  const state = useWidgetState()
  const action = compactAction(icon, state)
  const acts = useActs(action, action ?? icon)
  return (
    <div
      {...acts}
      data-acts={acts.role ? "" : undefined}
      className={cn("flex h-[61px] items-center justify-center overflow-clip rounded-[16px] p-2", grow ? "min-w-0 flex-1" : "w-[61px] shrink-0", tone(!!primary), acts.role && PRESS)}
    >
      <Icon name={icon} clockIn={icon === "timeclock" && action === "clockIn"} />
    </div>
  )
}

/** Icon + label, filling what the row leaves (or a fixed width). */
function Wide({ action, primary, width }: { action: Action; primary?: boolean; width?: number }) {
  const acts = useActs(ACTION_BY_LABEL[action.label], action.label)
  return (
    <div
      {...acts}
      data-acts={acts.role ? "" : undefined}
      className={cn("flex h-[61px] items-center justify-center gap-2 overflow-clip rounded-[16px] p-2", width ? "shrink-0" : "min-w-0 flex-1", tone(!!primary), acts.role && PRESS)}
      style={width ? { width } : undefined}
    >
      <Icon name={action.icon} />
      <span className="whitespace-nowrap text-[14px] leading-5 font-semibold tracking-[-0.14px]">{action.label}</span>
    </div>
  )
}

/** A button-shaped bone (Figma "updating": secondary-container, no icon). */
const ButtonBone = ({ width, grow }: { width?: number; grow?: boolean }) => (
  <div className={cn("h-[61px] rounded-[16px] bg-[var(--h-container)]", grow ? "min-w-0 flex-1" : "shrink-0")} style={width ? { width } : undefined} />
)

/** The 4×2 / 4×3 row: secondary squares first (Message, unused breaks), then the labelled actions. */
function WideRow({ c }: { c: StateContent }) {
  if (c.loading) {
    return (
      <div className="flex h-[61px] w-full gap-2">
        <ButtonBone width={61} />
        <ButtonBone grow />
      </div>
    )
  }
  return (
    <div className="flex h-[61px] w-full items-center gap-2">
      {c.secondary && <Square icon={c.secondary.icon} />}
      {c.squares?.map((icon) => <Square key={icon} icon={icon} />)}
      {c.alt && <Wide action={c.alt} />}
      <Wide action={c.primary} primary />
    </div>
  )
}

// ── Text ───────────────────────────────────────────────────────────────────

/** Figma "Title": lead, the number in primary, trail — wrapping as whole pieces. */
function Title({ c, small }: { c: StateContent; small?: boolean }) {
  if (c.loading) {
    return (
      <span className="flex items-center" style={{ height: small ? 24 : 32 }}>
        <span className="block max-w-full rounded-[4px] bg-[var(--h-container)]" style={{ width: small ? 150 : 192, height: small ? 12 : 16 }} />
      </span>
    )
  }
  return (
    <p
      className={cn(
        "flex flex-wrap items-center font-semibold",
        small ? "gap-x-[3px] text-[16px] leading-6 tracking-[-0.16px]" : "gap-x-[5px] text-[24px] leading-8 tracking-[-0.48px]",
      )}
    >
      <span>{c.lead}</span>
      {c.value && <span className="whitespace-nowrap text-[var(--h-primary)]">{c.value}</span>}
      {c.trail && <span className="whitespace-nowrap">{c.trail}</span>}
    </p>
  )
}

function Subtitle({ c, small, truncate }: { c: StateContent; small?: boolean; truncate?: boolean }) {
  if (c.loading) {
    return (
      <span className="flex items-center" style={{ height: small ? 20 : 24 }}>
        <span className="block h-3 max-w-full rounded-full bg-[var(--h-container)]" style={{ width: small ? 110 : 150 }} />
      </span>
    )
  }
  return (
    <p
      className={cn(
        "font-semibold whitespace-nowrap",
        small ? "text-[14px] leading-5 tracking-[-0.14px]" : "text-[16px] leading-6 tracking-[-0.16px]",
        truncate && "overflow-hidden text-ellipsis",
      )}
    >
      {c.sub}
    </p>
  )
}

// ── Timeline ───────────────────────────────────────────────────────────────
// Figma "Timeline" (100:380): the same anatomy as the wireframe's, on the
// Material track — secondary-container base, primary progress, 16px glyphs
// (white on the progress colour, primary on the base).

function TimelineGlyph({ kind, cx, filled }: { kind: MarkerKind; cx: number; filled: boolean }) {
  const r = HIFI_TRACK.g.r
  const art = kind === "meal" ? { src: "tl-meal", w: 14.6664, h: 14.6668, inset: 6.667 } : { src: kind === "break" ? "tl-coffee" : "tl-timeclock", w: 16, h: 16, inset: 6 }
  return (
    <span
      className="absolute"
      style={{ left: cx - r + art.inset, top: art.inset, color: filled ? "var(--h-on-primary)" : "var(--h-primary)" }}
    >
      <Mask src={art.src} w={art.w} h={art.h} />
    </span>
  )
}

const HIFI_SKIN: TimelineSkin = {
  track: "var(--h-container)",
  progress: "var(--h-primary)",
  dot: "var(--h-primary)",
  marker: (kind, cx, filled) => <TimelineGlyph key={`${kind}-${cx}`} kind={kind} cx={cx} filled={filled} />,
}

const TimeLabels = ({ from, to, hidden }: { from: string; to: string; hidden?: boolean }) => (
  <div className={cn("flex w-full items-center justify-between text-[11px] leading-4 font-semibold tracking-[-0.11px] whitespace-nowrap", hidden && "opacity-0")}>
    <p>{from}</p>
    <p>{to}</p>
  </div>
)

function Timeline({ c }: { c: StateContent }) {
  const config = useWidgetTimeline()
  if (c.loading) {
    return (
      <div className="flex w-full flex-col gap-1">
        <div className="h-7 w-full rounded-full bg-[var(--h-container)]" />
        <div className="flex h-4 w-full items-center justify-between">
          <span className="block h-3 w-9 rounded-full bg-[var(--h-container)]" />
          <span className="block h-3 w-9 rounded-full bg-[var(--h-container)]" />
        </div>
      </div>
    )
  }
  // Nothing scheduled: just the bar, its times kept for the height but hidden (Figma "No Shifts").
  if (c.timeline === "empty") {
    return (
      <div className="flex w-full flex-col gap-1">
        <div className="flex h-7 w-full items-center">
          <div className="h-2.5 w-full rounded-full bg-[var(--h-container)]" />
        </div>
        <TimeLabels from="9:00 am" to="5:00 pm" hidden />
      </div>
    )
  }
  return (
    <div className="flex w-full flex-col gap-1">
      <ShiftTimelineStatic config={config} track={HIFI_TRACK} skin={HIFI_SKIN} labels={false} />
      <TimeLabels from={clockTime(config.shiftStart)} to={clockTime(config.shiftEnd)} />
    </div>
  )
}

// ── 4×3 next shifts ────────────────────────────────────────────────────────
// Figma "Next Shifts" (107:8606): 5% sheet, 15% top border and separators,
// 42px rows; the day's span as a 4px bar between its start and end.

const RowBone = ({ w, h, round }: { w: number; h: number; round?: boolean }) => (
  <span
    className={cn("block", round ? "rounded-full" : "rounded-[3px]")}
    style={{ width: w, height: h, background: "linear-gradient(var(--h-bone-dim), var(--h-bone-dim)), var(--h-container)" }}
  />
)

function NextShifts({ rows, loading }: { rows: readonly ScheduleRow[]; loading?: boolean }) {
  return (
    <div className="flex w-full flex-col border-t border-[var(--h-line)] bg-[var(--h-sheet)] px-4 pt-1 pb-2">
      {rows.map((row, i) => (
        <div key={row.day} className="flex h-[42px] w-full flex-col justify-end">
          {i > 0 && <div className="h-px w-full bg-[var(--h-line)]" />}
          <div className="flex min-h-0 w-full flex-1 items-center justify-between">
            <div className="flex min-w-0 flex-1 flex-col justify-center">
              {loading ? (
                <>
                  <span className="flex h-[18px] items-center"><RowBone w={54} h={12} /></span>
                  <span className="flex h-4 items-center"><RowBone w={111} h={8} round /></span>
                </>
              ) : (
                <>
                  <p className="h-[18px] overflow-hidden text-[14px] leading-5 font-semibold text-ellipsis tracking-[-0.14px]">{row.day}</p>
                  <p className="overflow-hidden text-[12px] leading-4 font-medium text-ellipsis tracking-[-0.12px]">{row.place}</p>
                </>
              )}
            </div>
            <div className="flex w-[185px] shrink-0 items-center gap-1.5">
              {loading ? <span className="flex h-5 items-center"><RowBone w={31} h={8} round /></span> : <p className="text-[14px] leading-5 font-semibold tracking-[-0.14px] whitespace-nowrap">{row.from}</p>}
              <div className="relative h-1 min-w-0 flex-1 overflow-clip rounded-full bg-[var(--h-line)]">
                {!loading && (
                  <span
                    className="absolute inset-y-0 rounded-full bg-[var(--h-primary)]"
                    // The wireframe's bar is in px on a 101px track; here it's a share of the bar.
                    style={{ left: `${(row.bar[0] / 101) * 100}%`, width: `${(row.bar[1] / 101) * 100}%` }}
                  />
                )}
              </div>
              {loading ? <span className="flex h-5 items-center"><RowBone w={31} h={8} round /></span> : <p className="text-right text-[14px] leading-5 font-semibold tracking-[-0.14px] whitespace-nowrap">{row.to}</p>}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Layouts, one per size ──────────────────────────────────────────────────

/** Content stacked from the bottom, 12px in, 8px between blocks (Figma "Content"). */
const Stack = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn("flex w-full flex-col justify-end gap-2 p-3", className)}>{children}</div>
)

// Figma 104:8085 — 176 × 224.
export function Hifi2x2({ content: c }: { content: StateContent }) {
  const state = useWidgetState()
  // Before the shift: Message and Clock In side by side. On the clock with both left: meal, break.
  const pair: [IconName, IconName] | null =
    state === "upcoming" ? ["message", c.primary.icon] : c.alt ? [c.alt.icon, c.primary.icon] : null
  return (
    <div className="flex size-full flex-col justify-end">
      <Stack>
        <div className="flex w-full flex-col">
          <Title c={c} />
          <Subtitle c={c} truncate />
        </div>
        <div className="flex h-[61px] w-full gap-2">
          {c.loading ? (
            <ButtonBone grow />
          ) : pair ? (
            <>
              <Square icon={pair[0]} grow />
              <Square icon={pair[1]} primary grow />
            </>
          ) : (
            <Wide action={c.primary} primary />
          )}
        </div>
      </Stack>
      <Logo className="top-[14px] right-[14px]" />
    </div>
  )
}

// Figma 104:8257 — 368 × 104: text beside the buttons, logo top-left.
export function Hifi4x1({ content: c }: { content: StateContent }) {
  const state = useWidgetState()
  const icons = c.compactStyle === "pair" && (c.compactIcons?.length ?? 0) > 1 ? c.compactIcons! : state === "upcoming" ? (["message", c.primary.icon] as const) : null
  return (
    <div className="flex size-full flex-col justify-end">
      <div className="flex w-full items-end gap-2 p-3">
        <div className="flex min-w-0 flex-1 flex-col">
          <Title c={c} small />
          <Subtitle c={c} small truncate />
        </div>
        <div className="flex h-[61px] shrink-0 gap-2">
          {c.loading ? (
            <ButtonBone width={130} />
          ) : icons ? (
            icons.map((icon, i) => <Square key={icon} icon={icon} primary={i === icons.length - 1} />)
          ) : (
            <Wide action={c.primary} primary width={130} />
          )}
        </div>
      </div>
      <Logo className="top-3 left-3" />
    </div>
  )
}

// Figma 103:1799 — 368 × 224.
export function Hifi4x2({ content: c }: { content: StateContent }) {
  return (
    <div className="flex size-full flex-col justify-end">
      <Stack>
        <div className="flex w-full flex-col">
          <Title c={c} />
          <Subtitle c={c} truncate />
        </div>
        {(c.timeline || c.loading) && <Timeline c={c} />}
        <WideRow c={c} />
      </Stack>
      <Logo className="top-[14px] right-[14px]" />
    </div>
  )
}

// Figma 107:8467 — 368 × 344: the 4×2's content over the next shifts.
export function Hifi4x3({ content: c }: { content: StateContent }) {
  const rows = Array.isArray(c.schedule) ? (c.schedule as readonly ScheduleRow[]) : null
  return (
    <div className="flex size-full flex-col justify-end">
      <Stack className="flex-1">
        <div className="flex w-full flex-col">
          <Title c={c} />
          <Subtitle c={c} truncate />
        </div>
        {(c.timeline || c.loading) && <Timeline c={c} />}
        <WideRow c={c} />
      </Stack>
      {rows && <NextShifts rows={rows} loading={c.loading} />}
      <Logo className="top-[14px] right-[14px]" />
    </div>
  )
}

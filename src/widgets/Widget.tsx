import { createContext, useContext, type CSSProperties, type ReactNode } from "react"
import { IconCalendar, IconLogin2 } from "@tabler/icons-react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { AnimatedNumber } from "@/components/ui/animated-number"
import { DURATION, EASE, SPRING_FAST } from "@/lib/motion"
import { cn } from "@/lib/utils"
import type { Fidelity } from "@/store/useWidgetStore"
import { ShiftTimeline } from "@/timeline/ShiftTimeline"
import { ShiftTimelineV2 } from "@/timeline/ShiftTimelineV2"
import { presetConfig, type TimelineConfig } from "@/timeline/model"
import { HIFI, type WidgetLayout } from "./hifi"
import { WIDGET_SIZES, type WidgetSize } from "./sizes"
import { contentFor, type Action, type IconName, type StateContent, type WidgetStateId } from "./states"
import "./widget.css"

/*
 * One component for every widget size and state. Positions, sizes and type
 * values are taken from the Figma frames (Android---iOS-Widgets, nodes 43:474 /
 * 43:443 / 43:384 / 43:284) and rendered 1:1 — 1dp = 1 CSS px. Widgets are
 * fixed-size surfaces, so the top-level blocks sit at their Figma offsets; the
 * insides use flex. Content per state lives in ./states.ts.
 */

// ── Skeleton ───────────────────────────────────────────────────────────────
// While loading, every primitive renders a bone in its own footprint, so the
// skeleton always matches the real layout.

const Loading = createContext(false)
const useLoading = () => useContext(Loading)

/** The shift timeline config the 4×2 / 4×3 draw; set per widget via the `timeline` prop. */
const DEFAULT_TIMELINE = presetConfig("planned")
const Timeline = createContext<TimelineConfig>(DEFAULT_TIMELINE)
/** Which timeline drawing the 4×2 / 4×3 use: the original, or version 2 (src/timeline/ShiftTimelineV2). */
export type TimelineVersionId = 1 | 2
const TimelineVersion = createContext<TimelineVersionId>(2)

function Bone({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <span
      data-fill
      className={cn("block rounded-[6px] bg-[var(--w-fill)] motion-safe:animate-pulse", className)}
      style={style}
    />
  )
}

/** A bone vertically centred in a text line box of `lineHeight`. */
const TextBone = ({ lineHeight, height, width }: { lineHeight: number; height: number; width: string | number }) => (
  <span className="flex items-center" style={{ height: lineHeight }}>
    <Bone style={{ height, width }} />
  </span>
)

// ── Artwork ────────────────────────────────────────────────────────────────

// Under the app's base path, so it also works served from a sub-path (Design Playground).
const asset = (name: string) => `${import.meta.env.BASE_URL}widget/${name}.svg`

/** An SVG placed at its native size and exact Figma offset. */
function Glyph({ name, x, y, w, h }: { name: string; x: number; y: number; w: number; h: number }) {
  return (
    <img
      alt=""
      src={asset(name)}
      width={w}
      height={h}
      className="absolute block max-w-none"
      style={{ left: x, top: y, width: w, height: h }}
    />
  )
}

type Tone = "light" | "dark"
const TONE_COLOR: Record<Tone, string> = { light: "var(--w-on-dark)", dark: "var(--w-content-primary)" }

type IconSpec = {
  box: number
  w: number
  h: number
  x?: number
  y?: number
  /** Exported asset per tone. A tone without one draws the other through a mask. */
  src?: Partial<Record<Tone, string>>
  tabler?: typeof IconLogin2
}

// Box + artwork sizes from the Figma instances. `login` and `calendar` have no
// Figma source — Tabler stand-ins for the extrapolated states.
const ICONS: Record<IconName, IconSpec> = {
  timeclock: { box: 24, w: 21.0218, h: 21.0218, src: { light: "timeclock-light", dark: "timeclock-dark" } },
  coffee: { box: 28, w: 25.7139, h: 24.5376, x: 1.163, y: 1.714, src: { light: "coffee-lg" } },
  message: { box: 24, w: 22, h: 21, src: { dark: "message" } },
  // Figma "donut" (Timekeeping Iconography 106:6971): 22px art in a 24px frame, drawn as a mask so it takes either tone.
  meal: { box: 24, w: 22, h: 22, src: { dark: "donut" } },
  xmark: { box: 24, w: 18.161, h: 18.1069, src: { dark: "xmark" } },
  login: { box: 24, w: 24, h: 24, tabler: IconLogin2 },
  calendar: { box: 24, w: 24, h: 24, tabler: IconCalendar },
}

function Icon({ name, tone }: { name: IconName; tone: Tone }) {
  const spec = ICONS[name]
  const x = spec.x ?? (spec.box - spec.w) / 2
  const y = spec.y ?? (spec.box - spec.h) / 2
  const place: CSSProperties = { left: x, top: y, width: spec.w, height: spec.h }
  let art: ReactNode
  if (spec.tabler) {
    const T = spec.tabler
    art = <T size={spec.w} stroke={1.75} className="absolute" style={{ ...place, color: TONE_COLOR[tone] }} />
  } else if (spec.src?.[tone]) {
    art = <Glyph name={spec.src[tone]} x={x} y={y} w={spec.w} h={spec.h} />
  } else {
    const url = `url("${asset(Object.values(spec.src ?? {})[0] ?? "")}") center / contain no-repeat`
    art = <span className="absolute block" style={{ ...place, background: TONE_COLOR[tone], mask: url, WebkitMask: url }} />
  }
  return (
    <span className="relative block shrink-0" style={{ width: spec.box, height: spec.box }}>
      {art}
    </span>
  )
}

// ── Text ───────────────────────────────────────────────────────────────────

/** A headline slot's text — a rolling number when the live clock drives it. */
function SlotText({ content, slot }: { content: StateContent; slot: "value" | "trail" }) {
  const t = content.ticker
  if (t?.slot !== slot) return content[slot]
  // `normal-nums!` undoes AnimatedNumber's tabular figures so the resting text
  // matches Figma's proportional numerals; `whitespace-pre` keeps the space in "6h 12m".
  // Same feel as the text swaps (useTextSwap): light blur on faint glyphs, a short slide, all digits together.
  return (
    <AnimatedNumber
      value={t.minutes}
      format={t.format}
      className="whitespace-pre normal-nums!"
      keyframes="widget-digit"
      ease="cubic-bezier(0.22, 1, 0.36, 1)"
      duration={DURATION.slower * 1000}
      blur={TEXT_BLUR}
      travel={15}
      stagger={0}
    />
  )
}

/*
 * Text changes (headline + subtitle) as one gesture: the old line fades away
 * while the new one settles in, overlapping. The blur only bridges the
 * crossfade — it stays light, and it's only ever seen on faint text: a leaving
 * line fades faster than it softens, an arriving line sharpens as it brightens.
 * Heavy blur at full opacity reads as the text exploding.
 * A small fixed drift (no scale) gives it direction. Full transform strings,
 * not motion's x/y shorthands, so they can run off the main thread. Reduced
 * motion keeps the crossfade and drops the drift.
 */
const TEXT_BLUR = 4
const TEXT_DRIFT = 4
const TEXT_IN = {
  opacity: { duration: DURATION.slow, ease: EASE.apple },
  filter: { duration: DURATION.slower, ease: EASE.apple },
  transform: { duration: DURATION.slower, ease: EASE.apple },
}
const TEXT_OUT = {
  opacity: { duration: DURATION.fast, ease: EASE.apple },
  // Ease-in on purpose: the blur holds off until the line is already fading.
  filter: { duration: DURATION.normal, ease: "easeIn" },
  transform: { duration: DURATION.normal, ease: EASE.apple },
} as const

function useTextSwap() {
  const reduce = useReducedMotion()
  const at = (y: number) => (reduce ? "none" : `translateY(${y}px)`)
  return {
    initial: { opacity: 0, filter: `blur(${TEXT_BLUR}px)`, transform: at(TEXT_DRIFT) },
    animate: { opacity: 1, filter: "blur(0px)", transform: at(0), transition: TEXT_IN },
    exit: { opacity: 0, filter: `blur(${TEXT_BLUR}px)`, transform: at(-TEXT_DRIFT), transition: TEXT_OUT },
  }
}

/** Muted lead-in + emphasised value (+ optional muted trail), baseline-aligned. */
function Headline({ content, size, wrap }: { content: StateContent; size: 22 | 24; wrap?: boolean }) {
  const swap = useTextSwap()
  const lineHeight = size === 22 ? 28 : 30
  if (useLoading()) {
    return (
      <div className="flex w-full flex-col">
        <TextBone lineHeight={lineHeight} height={size - 4} width={wrap ? "80%" : "62%"} />
        {wrap && <TextBone lineHeight={lineHeight} height={size - 4} width="55%" />}
      </div>
    )
  }
  // The contrast exists to pick out the number. A headline with no digits
  // ("No upcoming shifts") reads as one line in one colour.
  const hasNumber = /\d/.test(`${content.lead}${content.value}${content.trail ?? ""}`)
  const muted = hasNumber ? "text-[var(--w-ink-muted)]" : "text-[var(--w-ink)]"
  // A new sentence (another state, the welcome giving way to the count-up)
  // crossfades through a heavy blur: the old one blurs away while the next one
  // sharpens in its place. The live number inside one sentence just rolls, so
  // it's left out of the key.
  const live = (slot: "value" | "trail") => (content.ticker?.slot === slot ? "#" : content[slot])
  const sentence = [content.lead, live("value"), live("trail")].join("|")
  return (
    // popLayout lifts the leaving sentence out of flow (absolutely, inside this box) so both overlap.
    <div className="relative w-full">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={sentence}
          className={cn("flex w-full items-baseline gap-x-[5px] whitespace-nowrap font-semibold", wrap && "flex-wrap")}
          {...swap}
          style={{ fontSize: size, letterSpacing: -size / 100 }}
        >
          <p className={muted}>{content.lead}</p>
          <p className="text-[var(--w-ink)]"><SlotText content={content} slot="value" /></p>
          {content.trail && <p className={muted}><SlotText content={content} slot="trail" /></p>}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

/** Subtitle line. A change of text (a rotating subtitle) blurs out and the next line rises in. */
function Subline({ children, size, className }: { children: string; size: 13.5 | 15; className?: string }) {
  // Figma's "normal" leading for this face, fixed so an emoji can't grow the line.
  const lineHeight = size === 15 ? 19 : 17
  const swap = useTextSwap()
  if (useLoading()) return <TextBone lineHeight={lineHeight} height={size - 3} width="50%" />
  return (
    <p
      className={cn("relative w-full overflow-x-clip whitespace-nowrap font-semibold text-[var(--w-ink-secondary)]", className)}
      style={{ fontSize: size, letterSpacing: -size / 100, lineHeight: `${lineHeight}px` }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={children}
          className="block overflow-hidden text-ellipsis"
          {...swap}
        >
          {children}
        </motion.span>
      </AnimatePresence>
    </p>
  )
}

// ── Buttons ────────────────────────────────────────────────────────────────

/** A button's slot: where it sits in its row, animated when the slot changes (a second button arriving). */
type Frame = { left: number; width: number }

/** Buttons sliding to a new slot: a quick, settled spring (on-screen movement, no overshoot). */
const BUTTON_MOVE = { type: "spring", ...SPRING_FAST.smooth } as const
const SNAP = { duration: 0 }

/*
 * Taking (or giving back) a break: the timeline moves first — the gap opens,
 * the bulge pops — and the buttons follow a beat later, so the eye goes to the
 * track and then to what to do next. The row reads the timeline's change stamp
 * and hands its buttons a delay through this context.
 */
const BUTTON_BEAT = DURATION.normal + DURATION.fast * 0.75
/** How long after a timeline change the buttons still count it as theirs to follow. */
const BEAT_WINDOW_MS = 900
const ButtonDelay = createContext(0)

/** The same transition(s), `delay` seconds later. Takes one transition or a per-property map. */
function later<T extends object>(t: T, delay: number): T {
  if (!delay) return t
  if ("duration" in t || "type" in t) return { ...t, delay }
  return Object.fromEntries(Object.entries(t).map(([k, v]) => [k, { ...(v as object), delay }])) as T
}

/** An icon swapping for another (Clock In → Take break): the same light blur crossfade as the text. */
function SwapIcon({ name, tone }: { name: IconName; tone: Tone }) {
  const delay = useContext(ButtonDelay)
  const box = ICONS[name].box
  return (
    <span className="relative block shrink-0" style={{ width: box, height: box }}>
      <AnimatePresence initial={false}>
        <motion.span
          key={`${name}-${tone}`}
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0, filter: `blur(${TEXT_BLUR}px)`, transform: "scale(0.6)" }}
          animate={{ opacity: 1, filter: "blur(0px)", transform: "scale(1)", transition: later(TEXT_IN, delay) }}
          exit={{ opacity: 0, filter: `blur(${TEXT_BLUR}px)`, transform: "scale(0.6)", transition: later(TEXT_OUT, delay) }}
        >
          <Icon name={name} tone={tone} />
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

/**
 * 48px action button. `dark` = black primary, otherwise the 15% fill. `iconOnly` drops the label.
 * With a `frame` it sits absolutely in its row and glides to a new slot; `appear` scales it in
 * and out (a button that comes and goes with the state).
 */
function ActionButton({ action, dark, iconOnly, className, frame, appear, glide = true }: {
  action: Action; dark?: boolean; iconOnly?: boolean; className?: string; frame?: Frame; appear?: boolean
  /** Slide to a new slot; `false` switches slots in place. */
  glide?: boolean
}) {
  const loading = useLoading()
  const delay = useContext(ButtonDelay)
  const hidden = { opacity: 0, transform: "scale(0.9)", filter: `blur(${TEXT_BLUR}px)` }
  return (
    <motion.div
      data-fill
      className={cn(
        "flex h-12 shrink-0 items-center justify-center overflow-clip rounded-[16px]",
        frame ? "absolute top-0 px-2" : cn("relative", iconOnly ? "px-7 py-3" : "py-[11px] pr-5 pl-[14px]"),
        loading ? "bg-[var(--w-fill)] motion-safe:animate-pulse" : dark ? "bg-[var(--w-ink)]" : "bg-[var(--w-fill)]",
        className,
      )}
      initial={appear ? { ...hidden, ...frame } : false}
      animate={{ ...frame, opacity: 1, transform: "scale(1)", filter: "blur(0px)" }}
      // A leaving button gets its delay from AnimatePresence's `custom` (it no longer re-renders).
      variants={{ gone: (d: number) => ({ ...hidden, transition: later(TEXT_OUT, d) }) }}
      exit={appear ? "gone" : undefined}
      transition={later(
        { default: BUTTON_MOVE, opacity: TEXT_IN.opacity, filter: TEXT_IN.filter, ...(!glide && { left: SNAP, width: SNAP }) },
        delay,
      )}
    >
      {!loading && (
        <>
          <SwapIcon name={action.icon} tone={dark ? "light" : "dark"} />
          <AnimatePresence initial={false} mode="popLayout">
            {!iconOnly && (
              <motion.p
                key={action.label}
                className={cn(
                  "ml-[6px] whitespace-nowrap text-[14px] font-bold",
                  dark ? "text-[var(--w-on-dark)]" : "text-[var(--w-content-primary)]",
                )}
                initial={{ opacity: 0, filter: `blur(${TEXT_BLUR}px)` }}
                animate={{ opacity: 1, filter: "blur(0px)", transition: later(TEXT_IN, delay) }}
                exit={{ opacity: 0, filter: `blur(${TEXT_BLUR}px)`, transition: later(TEXT_OUT, delay) }}
              >
                {action.label}
              </motion.p>
            )}
          </AnimatePresence>
        </>
      )}
      {/* Keeps an icon-only skeleton at its real 80px width. */}
      {loading && iconOnly && <span className="size-6" />}
    </motion.div>
  )
}

/**
 * A row of one or two buttons in fixed slots. Alone, the primary takes `solo`;
 * when a secondary arrives it glides to `pair[1]` and the secondary scales in
 * at `pair[0]` — one motion, both at once.
 */
function ButtonRow({ c, className, width, solo, pair, iconOnly, glide = true }: {
  c: StateContent
  className: string
  width: number
  solo: Frame & { iconOnly?: boolean }
  pair: [Frame, Frame]
  iconOnly: { secondary?: boolean; primary?: boolean }
  /** Animate the primary between `solo` and `pair[1]`; `false` (4×2 / 4×3) switches in place. */
  glide?: boolean
}) {
  // Read during render, so the render that follows a take (or a give-back) waits its beat.
  const { lastChangeAt } = useContext(Timeline)
  const delay = lastChangeAt !== undefined && Date.now() - lastChangeAt < BEAT_WINDOW_MS ? BUTTON_BEAT : 0
  return (
    <ButtonDelay.Provider value={delay}>
      <div className={cn("absolute h-12", className)} style={{ width }}>
        <AnimatePresence initial={false} custom={delay}>
          {c.secondary && (
            <ActionButton key="secondary" action={c.secondary} iconOnly={iconOnly.secondary} frame={pair[0]} appear glide={glide} />
          )}
        </AnimatePresence>
        <ActionButton
          action={c.primary}
          dark
          iconOnly={c.secondary ? iconOnly.primary : solo.iconOnly}
          frame={c.secondary ? pair[1] : solo}
          glide={glide}
        />
      </div>
    </ButtonDelay.Provider>
  )
}

/**
 * The 4×2 / 4×3 row: a small icon-only secondary square (Message) at the start,
 * then the actions sharing the rest — the `alt` one in the fill, the primary in
 * black. A state change swaps what the buttons say in place; nothing slides.
 * Like ButtonRow, it follows a just-taken break a beat after the timeline.
 */
function WideButtonRow({ c, className, width }: { c: StateContent; className: string; width: number }) {
  const { lastChangeAt } = useContext(Timeline)
  const delay = lastChangeAt !== undefined && Date.now() - lastChangeAt < BEAT_WINDOW_MS ? BUTTON_BEAT : 0
  return (
    <ButtonDelay.Provider value={delay}>
      <div className={cn("absolute flex h-12 gap-2", className)} style={{ width }}>
        {c.secondary && <ActionButton key="secondary" action={c.secondary} iconOnly className="w-12 px-0" />}
        {c.alt && <ActionButton key="alt" action={c.alt} className="min-w-0 flex-1 px-2" />}
        <ActionButton key="primary" action={c.primary} dark className="min-w-0 flex-1 px-2" />
      </div>
    </ButtonDelay.Provider>
  )
}

/** The 4×1's 48px square, icon centred on the Figma offset (50% − 0.46px). `dark` = black primary. */
function CompactButton({ icon, dark }: { icon: IconName; dark?: boolean }) {
  const loading = useLoading()
  return (
    <div
      data-fill
      className={cn(
        "relative flex size-12 shrink-0 items-center justify-center overflow-clip rounded-[16px]",
        dark && !loading ? "bg-[var(--w-ink)]" : "bg-[var(--w-fill)]",
        loading && "motion-safe:animate-pulse",
      )}
    >
      {!loading && (
        <span className="relative -top-[0.46px] -left-[0.46px]">
          <Icon name={icon} tone={dark ? "light" : "dark"} />
        </span>
      )}
    </div>
  )
}

// ── Composites ─────────────────────────────────────────────────────────────

/** The shared shift timeline (src/timeline), or its skeleton while loading. */
function TimelineSlot({ config, labelSize }: { config: TimelineConfig; labelSize: 13.5 | 16 }) {
  const Track = useContext(TimelineVersion) === 2 ? ShiftTimelineV2 : ShiftTimeline
  if (!useLoading()) return <Track config={config} labelSize={labelSize} />
  const labelLine = labelSize === 16 ? 21 : 17
  return (
    <div className="flex w-full flex-col gap-[2px]">
      <Bone className="h-[26px] w-[357px] rounded-full" />
      <div className="flex w-full justify-between">
        <TextBone lineHeight={labelLine} height={labelSize - 3} width={36} />
        <TextBone lineHeight={labelLine} height={labelSize - 3} width={36} />
      </div>
    </div>
  )
}

function Schedule({ schedule }: { schedule: NonNullable<StateContent["schedule"]> }) {
  const loading = useLoading()
  if (schedule === "empty") {
    return (
      <div className="absolute left-4 top-[205px] w-[361px]">
        <p className="text-[13.5px] font-semibold text-[var(--w-ink-meta)]">Nothing scheduled this week</p>
      </div>
    )
  }
  return (
    <div className="absolute left-4 top-[205px] flex w-[361px] flex-col gap-1">
      {schedule.map((row, i) => (
        <div key={row.day} className="contents">
          {i > 0 && <img alt="" src={asset("divider")} width={361} height={1} className="block h-px w-[361px] max-w-none" />}
          <div className="flex w-full items-center justify-between">
            <div className="flex w-16 flex-col">
              {loading ? (
                <>
                  <TextBone lineHeight={17} height={11} width={32} />
                  <TextBone lineHeight={15} height={9} width={56} />
                </>
              ) : (
                <>
                  <p className="text-[13.5px] font-semibold">{row.day}</p>
                  <p className="text-[12px] font-medium text-[var(--w-ink-meta)]">{row.place}</p>
                </>
              )}
            </div>
            {loading ? (
              <Bone className="h-[11px] w-[170px]" />
            ) : (
              <div className="flex items-center gap-2 whitespace-nowrap text-[13.5px] font-semibold text-[var(--w-ink-time)]">
                <p>{row.from}</p>
                <div data-fill className="relative h-1 w-[101px] overflow-clip rounded-full bg-[var(--w-fill)]">
                  <span
                    data-fill
                    className="absolute inset-y-0 rounded-full bg-[var(--w-bar-active)]"
                    style={{ left: row.bar[0], width: row.bar[1] }}
                  />
                </div>
                <p>{row.to}</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

/** Homebase mark, 20.12 from the right edge of a `widgetWidth`-wide widget. */
function Logo({ widgetWidth = 395 }: { widgetWidth?: number }) {
  return <Glyph name="logo" x={widgetWidth - 20.12 - 16.1232} y={16.53} w={16.1232} h={23.2101} />
}

// ── Wireframe layouts, one per size ────────────────────────────────────────

// Figma 43:474: text block under the logo (y 68–141), two 79×48 icon
// buttons along the bottom (secondary at x=12, primary at x=97).
function Wireframe2x2({ content: c }: { content: StateContent }) {
  return (
    <>
      {/* Bottom-anchored where Figma's two-line block ends (y 141, 13 above the
          buttons), so a one-line headline keeps that gap instead of floating. */}
      <div className="absolute bottom-[73px] left-4 flex w-[161px] flex-col">
        <Headline content={c} size={22} wrap />
        <Subline size={13.5}>{c.sub}</Subline>
      </div>
      {/* Two 79px icon slots; alone, the primary spans both, labelled. */}
      <ButtonRow
        c={c}
        className="left-3 top-[154px]"
        width={164}
        solo={{ left: 0, width: 164 }}
        pair={[{ left: 0, width: 79 }, { left: 85, width: 79 }]}
        iconOnly={{ secondary: true, primary: true }}
      />
      <Logo widgetWidth={190} />
    </>
  )
}

function Wireframe4x1({ content: c }: { content: StateContent }) {
  return (
    <div className="absolute left-[15px] top-[10px] flex w-[368px] items-center justify-between gap-3">
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <Headline content={c} size={22} />
        <Subline size={13.5}>{c.sub}</Subline>
      </div>
      {c.compactStyle === "pair" ? (
        <div className="flex shrink-0 gap-2">
          {/* Secondary first, primary last (black) — the same order as the other sizes' button rows. */}
          {c.compactIcons?.map((icon, i, all) => <CompactButton key={icon} icon={icon} dark={i === all.length - 1} />)}
        </div>
      ) : c.compactStyle === "primary" ? (
        <ActionButton action={c.primary} dark />
      ) : (
        <CompactButton icon={c.compact} dark={c.compactStyle === "primary-icon"} />
      )}
    </div>
  )
}

function Wireframe4x2({ content: c }: { content: StateContent }) {
  const timeline = useContext(Timeline)
  return (
    <>
      <div className="absolute left-[16.28px] top-[36.28px] flex w-[357px] flex-col gap-3">
        <div className="flex w-full flex-col">
          <Headline content={c} size={24} />
          <Subline size={15}>{c.sub}</Subline>
        </div>
        {c.timeline && <TimelineSlot config={{ ...timeline, empty: c.timeline === "empty" }} labelSize={16} />}
      </div>
      <WideButtonRow c={c} className="left-4 top-[151px]" width={357} />
      <Logo />
    </>
  )
}

function Wireframe4x3({ content: c }: { content: StateContent }) {
  const timeline = useContext(Timeline)
  return (
    <>
      <div className="absolute left-[16.28px] top-[27.03px] flex h-[109px] w-[357px] flex-col gap-3">
        <div className="flex w-full flex-col">
          <Headline content={c} size={24} />
          <Subline size={15}>{c.sub}</Subline>
        </div>
        {c.timeline && <TimelineSlot config={{ ...timeline, empty: c.timeline === "empty" }} labelSize={13.5} />}
      </div>
      <WideButtonRow c={c} className="left-4 top-[144px]" width={365} />
      {c.schedule && <Schedule schedule={c.schedule} />}
      <Logo />
    </>
  )
}

const WIREFRAME: Record<WidgetSize, WidgetLayout> = {
  "2x2": Wireframe2x2,
  "4x1": Wireframe4x1,
  "4x2": Wireframe4x2,
  "4x3": Wireframe4x3,
}

// ── Public component ───────────────────────────────────────────────────────

export function Widget({
  size,
  state = "upcoming",
  minutes,
  sub,
  copy,
  timeline = DEFAULT_TIMELINE,
  timelineVersion = 2,
  fidelity = "wireframe",
  showBounds = false,
  className,
}: {
  size: WidgetSize
  state?: WidgetStateId
  /** The shift timeline the 4×2 / 4×3 draw. Defaults to the planned 9-to-5. */
  timeline?: TimelineConfig
  /** Which timeline drawing to use. Defaults to version 2 (breaks with their own bar); /timeline still shows version 1. */
  timelineVersion?: TimelineVersionId
  /** Live minutes for timed states (the live widget passes them). Omit to show the default copy. */
  minutes?: number
  /** Replaces the state's subtitle — the rotating line, for states that rotate. */
  sub?: string
  /** Copy overrides on top of the state's own (the live widget's real times). */
  copy?: Partial<StateContent>
  fidelity?: Fidelity
  /** Debug overlay: outline every box. */
  showBounds?: boolean
  className?: string
}) {
  const { width, height } = WIDGET_SIZES[size]
  const Layout = (fidelity === "hifi" && HIFI[size]) || WIREFRAME[size]
  const base = contentFor(state, size, minutes)
  const content = { ...base, ...copy, ...(sub && { sub }) }
  return (
    <div
      className={cn("widget relative shrink-0 overflow-clip rounded-[28px]", className)}
      style={{ width, height }}
      data-size={size}
      data-state={state}
      data-fidelity={fidelity}
      data-bounds={showBounds || undefined}
      aria-busy={content.loading || undefined}
    >
      <Loading.Provider value={!!content.loading}>
        <Timeline.Provider value={timeline}>
          <TimelineVersion.Provider value={timelineVersion}>
            {/* Not remounted on a state switch, so its text can blur from one state's copy to the next. */}
            <Layout content={content} />
          </TimelineVersion.Provider>
        </Timeline.Provider>
      </Loading.Provider>
    </div>
  )
}

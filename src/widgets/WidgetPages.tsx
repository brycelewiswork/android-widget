import { useLayoutEffect, useRef, useState, type ReactNode } from "react"
import { Link } from "react-router-dom"
import { IconArrowRight, IconChevronRight } from "@tabler/icons-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { DeviceFrame } from "@/device/DeviceFrame"
import { StatusBar } from "@/device/StatusBar"
import { useTimelineStore } from "@/store/useTimelineStore"
import { useWidgetStore } from "@/store/useWidgetStore"
import { liveWidget } from "./live"
import { LivePanel } from "./LivePanel"
import { Page } from "./Shell"
import { demoTimeline, FLOWS } from "./flows"
import { WIDGET_STATES, type WidgetStateId } from "./states"
import { useRotatingSubtitle, useSubtitleDriver } from "./subtitles"
import { Widget } from "./Widget"
import { WIDGET_SIZES, WIDGET_SIZE_ORDER, sizeLabel, type WidgetSize } from "./sizes"

// Home-screen placement inside the 410dp-wide screen. Widgets hug the launcher
// grid's side margin — (410 − 395) / 2 — and stack below the 52dp status bar.
const SCREEN_INSET_X = 7.5
const SCREEN_INSET_TOP = 52 + 16
const WIDGET_GAP = 16

const PHONES: WidgetSize[][] = [
  ["2x2", "4x2"],
  ["4x1", "4x3"],
]

/** A phone home screen holding the live widgets — the same day the right rail drives. */
function PhoneHomeScreen({ sizes }: { sizes: WidgetSize[] }) {
  const fidelity = useWidgetStore((s) => s.fidelity)
  return (
    <DeviceFrame
      footer={
        <p className="text-center text-sm text-label-secondary">
          {sizes.map((size, i) => (
            <span key={size}>
              {i > 0 && " · "}
              <Link to={`/${size}`} className="font-medium text-label hover:underline">{sizeLabel(size)}</Link>{" "}
              <span className="font-mono">{WIDGET_SIZES[size].width} × {WIDGET_SIZES[size].height}</span>
            </span>
          ))}
        </p>
      }
    >
      <div aria-hidden className="wallpaper absolute inset-0" data-fidelity={fidelity} />
      <StatusBar />
      <div
        className="absolute inset-x-0 flex flex-col items-start"
        style={{ top: SCREEN_INSET_TOP, paddingInline: SCREEN_INSET_X, gap: WIDGET_GAP }}
      >
        {sizes.map((size) => (
          <LiveSpecimen key={size} size={size} />
        ))}
      </div>
    </DeviceFrame>
  )
}

/** Rotates the live widgets' subtitle (Shift ending soon) — once per page, however many widgets show it. */
function useLiveSubtitleDriver() {
  const { precision } = useWidgetStore()
  const config = useTimelineStore((s) => s.config)
  useSubtitleDriver(liveWidget(config, precision).state)
}

/** Every size at once, on two phones, all live: the right rail moves them through the day together. */
export function AllWidgetsPage() {
  useLiveSubtitleDriver()
  return (
    <Page sizes={WIDGET_SIZE_ORDER} panel={<LivePanel />}>
      <div className="grid gap-[var(--space-m-l)] sm:grid-cols-2">
        {PHONES.map((sizes) => (
          <div key={sizes.join()} className="h-[min(990px,calc(100svh-7rem))] min-h-[480px]">
            <PhoneHomeScreen sizes={sizes} />
          </div>
        ))}
      </div>
    </Page>
  )
}

/** The widget as the worker lives it: driven by the time of day, clocking in and out, and breaks (right rail). */
function LiveSpecimen({ size }: { size: WidgetSize }) {
  const { fidelity, showBounds, precision } = useWidgetStore()
  const config = useTimelineStore((s) => s.config)
  const live = liveWidget(config, precision)
  const sub = useRotatingSubtitle(live.state)
  return (
    <Widget
      size={size}
      state={live.state}
      minutes={live.minutes}
      sub={sub}
      copy={live.copy}
      timeline={live.timeline}
      fidelity={fidelity}
      showBounds={showBounds}
    />
  )
}

/** Measures what a widget actually rendered at, and flags it if it's off spec. */
function SizeCheck({ size, children }: { size: WidgetSize; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [measured, setMeasured] = useState<{ w: number; h: number } | null>(null)
  const spec = WIDGET_SIZES[size]
  useLayoutEffect(() => {
    const el = ref.current?.firstElementChild
    if (!(el instanceof HTMLElement)) return
    // Layout size, not getBoundingClientRect — so a scaled parent can't skew it.
    const ro = new ResizeObserver(() => setMeasured({ w: el.offsetWidth, h: el.offsetHeight }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const ok = measured && measured.w === spec.width && measured.h === spec.height
  return (
    <figure className="flex flex-col gap-2">
      <div ref={ref}>{children}</div>
      <figcaption className="flex items-baseline gap-2 text-sm">
        <span className="font-mono text-label-secondary">
          {spec.width} × {spec.height} dp
        </span>
        {measured && !ok && (
          <span className="font-mono text-red-500">
            rendered {measured.w} × {measured.h}
          </span>
        )}
      </figcaption>
    </figure>
  )
}

/** One state in a flow: its name above the widget, at the state's default copy and on its own day's timeline. */
function FlowStepCard({ size, state }: { size: WidgetSize; state: WidgetStateId }) {
  const { fidelity, showBounds } = useWidgetStore()
  return (
    <figure className="flex flex-col gap-2">
      <figcaption className="text-sm font-medium text-label">{WIDGET_STATES.find((s) => s.id === state)?.label}</figcaption>
      <Widget size={size} state={state} timeline={demoTimeline(state)} fidelity={fidelity} showBounds={showBounds} />
    </figure>
  )
}

/** The arrow between two steps, with what moves the worker along. Sits level with the widgets. */
function FlowArrow({ via }: { via?: string }) {
  return (
    <div aria-hidden className="flex w-20 shrink-0 flex-col items-center gap-1 self-center pt-7 text-center text-xs text-label-tertiary">
      {via && <span className="text-balance">{via}</span>}
      <IconArrowRight size={20} stroke={1.75} className="text-label-secondary" />
    </div>
  )
}

/**
 * The states this size can be in, as the paths a worker takes through them —
 * one tab per flow (a shift day, breaks, running late, no shifts, signed out),
 * steps joined by arrows that say what moves them along — plus all states.
 */
function StateDocs({ size }: { size: WidgetSize }) {
  const [flowId, setFlowId] = useState(FLOWS[0].id)
  return (
    <Tabs value={flowId} onValueChange={(v) => setFlowId(v as string)} className="gap-4">
      <TabsList className="flex-wrap">
        {FLOWS.map((f) => (
          <TabsTrigger key={f.id} value={f.id} className="px-3">
            {f.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {FLOWS.map((flow) => (
        <TabsContent key={flow.id} value={flow.id} className="flex flex-col gap-4">
          <p className="text-sm text-label-secondary">{flow.note}</p>
          <ol
            className={cn("flex flex-wrap items-start gap-y-8", flow.arrows === false && "gap-x-[var(--space-m-l)]")}
            aria-label={flow.label}
          >
            {flow.steps.map((step, i) => (
              <li key={i} className="flex items-start">
                {i > 0 && flow.arrows !== false && <FlowArrow via={step.via} />}
                {i > 0 && flow.arrows !== false && <span className="sr-only">then, after {step.via}: </span>}
                <FlowStepCard size={size} state={step.state} />
              </li>
            ))}
          </ol>
        </TabsContent>
      ))}
    </Tabs>
  )
}

export function WidgetSizePage({ size }: { size: WidgetSize }) {
  useLiveSubtitleDriver()
  return (
    <Page sizes={[size]} panel={<LivePanel />}>
      {/* The live widget, centred left to right in the canvas; the collapsed States header follows right under it. */}
      <section className="mb-[var(--space-l-xl)] flex flex-col items-center gap-3">
        <h1 className="text-sm font-semibold text-label">{sizeLabel(size)} widget</h1>
        <SizeCheck size={size}>
          <LiveSpecimen size={size} />
        </SizeCheck>
      </section>

      <StatesSection size={size} />
    </Page>
  )
}

/** The state documentation under the live widget, collapsed until asked for. */
function StatesSection({ size }: { size: WidgetSize }) {
  const [open, setOpen] = useState(false)
  return (
    <section className="flex flex-col gap-4 border-t border-stroke-faint pt-5">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="state-docs"
        onClick={() => setOpen(!open)}
        className="group flex w-fit cursor-pointer items-start gap-2 text-left"
      >
        <IconChevronRight
          size={16}
          stroke={2}
          className={cn("mt-0.5 shrink-0 text-label-secondary transition-transform duration-200 group-hover:text-label", open && "rotate-90")}
        />
        <span>
          <span className="block text-sm font-semibold text-label">States</span>
          <span className="block text-sm text-label-secondary">
            The paths a worker takes through them, with each state's default copy.
          </span>
        </span>
      </button>
      {open && (
        <div id="state-docs">
          <StateDocs size={size} />
        </div>
      )}
    </section>
  )
}

export const Widget2x2Page = () => <WidgetSizePage size="2x2" />
export const Widget4x1Page = () => <WidgetSizePage size="4x1" />
export const Widget4x2Page = () => <WidgetSizePage size="4x2" />
export const Widget4x3Page = () => <WidgetSizePage size="4x3" />

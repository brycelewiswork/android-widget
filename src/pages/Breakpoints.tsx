import { useLayoutEffect, useMemo, useRef, useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"
import { PageShell, PageHeader, Section } from "@/components/PageLayout"
import { prepare, layout, pretextStyleFromElement } from "@/lib/pretext"

const BREAKPOINTS = [
  { name: "base", abbr: "—", px: 0, rem: "0", desc: "Mobile-first default, all screens" },
  { name: "sm", abbr: "SM", px: 640, rem: "40", desc: "Large phones, small tablets in portrait" },
  { name: "md", abbr: "MD", px: 768, rem: "48", desc: "Tablets in portrait, split-view" },
  { name: "lg", abbr: "LG", px: 1024, rem: "64", desc: "Tablets in landscape, small laptops" },
  { name: "xl", abbr: "XL", px: 1280, rem: "80", desc: "Standard laptops and desktops" },
  { name: "2xl", abbr: "2XL", px: 1536, rem: "96", desc: "Large desktops and wide monitors" },
] as const

const CONTAINERS = [
  { name: "max-w-sm", px: 384, use: "Narrow panels, sidebars" },
  { name: "max-w-md", px: 448, use: "Form widths, modals" },
  { name: "max-w-lg", px: 512, use: "Content cards" },
  { name: "max-w-xl", px: 576, use: "Small content areas" },
  { name: "max-w-2xl", px: 672, use: "Readable prose" },
  { name: "max-w-3xl", px: 768, use: "Article content" },
  { name: "max-w-4xl", px: 896, use: "System pages (Color, Motion, Spacing)" },
  { name: "max-w-5xl", px: 1024, use: "Demos, wider layouts" },
  { name: "max-w-6xl", px: 1152, use: "Dashboard layouts" },
  { name: "max-w-7xl", px: 1280, use: "Full-width app shells" },
] as const

function useViewportWidth() {
  const [width, setWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1024)
  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth)
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])
  return width
}

const REFLOW_SAMPLE =
  "Responsive design isn't just about column counts — it's about how content breathes. The same paragraph wraps to wildly different line counts across breakpoints, which changes vertical rhythm and decides whether you can fit a CTA above the fold. Pretext lets you know the answer before paint."

const REFLOW_WIDTHS = [
  { label: "base (mobile)", width: 320 },
  { label: "sm", width: 640 },
  { label: "md", width: 768 },
  { label: "lg", width: 1024 },
  { label: "xl", width: 1280 },
] as const

function TextReflowSection() {
  const probeRef = useRef<HTMLParagraphElement>(null)
  const [style, setStyle] = useState<ReturnType<typeof pretextStyleFromElement> | null>(null)
  useLayoutEffect(() => {
    setStyle(pretextStyleFromElement(probeRef.current))
  }, [])

  const reflows = useMemo(() => {
    if (!style) return REFLOW_WIDTHS.map((w) => ({ ...w, lineCount: 0, height: 0 }))
    const prepared = prepare(REFLOW_SAMPLE, style.font)
    return REFLOW_WIDTHS.map((w) => {
      const m = layout(prepared, w.width - 32, style.lineHeight) // 32 = side padding budget
      return { ...w, lineCount: m.lineCount, height: m.height }
    })
  }, [style])

  return (
    <Section
      title="Text Reflow"
      description="Same paragraph, five viewport widths. Line counts and heights computed via Pretext — no DOM measurement, no layout reflow. Useful when responsive logic needs to branch on whether content actually overflows."
    >
      <p ref={probeRef} className="text-body text-label-secondary sr-only">
        {REFLOW_SAMPLE}
      </p>
      <div className="text-body text-label-tertiary">
        See the{" "}
        <Link to="/demos" className="underline">
          Demos page
        </Link>{" "}
        for the full Pretext walkthrough, including the <code>&lt;TightText&gt;</code> primitive
        and the <code>&lt;Accordion&gt;</code> component at{" "}
        <Link to="/components/accordion" className="underline">
          /components/accordion
        </Link>
        .
      </div>
      <div className="grid gap-gutter-xs">
        {reflows.map((r) => (
          <div key={r.label} className="flex items-baseline gap-inline-s">
            <div className="w-32 shrink-0">
              <div className="text-body font-medium text-label">{r.label}</div>
              <div className="font-mono text-body text-label-tertiary tabular-nums">
                {r.width}px
              </div>
            </div>
            <div
              className="rounded-md bg-fill-secondary p-inset-xs text-body text-label-secondary"
              style={{ width: r.width - 32 }}
            >
              {REFLOW_SAMPLE}
            </div>
            <div className="shrink-0 font-mono text-body text-label-tertiary tabular-nums">
              {r.lineCount} lines · {r.height}px
            </div>
          </div>
        ))}
      </div>
    </Section>
  )
}

function ActiveBadge() {
  return (
    <span className="ml-inline-2xs inline-block rounded-full bg-green-500 px-1.5 py-0.5 text-[9px] font-bold text-white-100 leading-none">
      ACTIVE
    </span>
  )
}

export function Breakpoints() {
  const vw = useViewportWidth()

  const activeIdx = [...BREAKPOINTS].reverse().findIndex((bp) => vw >= bp.px)
  const activeName = activeIdx >= 0 ? [...BREAKPOINTS].reverse()[activeIdx].name : "base"

  return (
    <PageShell>
      {/* ── Header ── */}
      <PageHeader title="Layout" description="Responsive breakpoints, container widths, and reflow patterns" />

      {/* ── Live Viewport ── */}
      <Section title="Current Viewport" description="Resize your browser to see the active breakpoint change">
          <div className="flex items-baseline gap-inline-s">
            <span className="text-h1 text-label tabular-nums">{vw}px</span>
            <span className="text-h5 text-blue-500 uppercase">{activeName}</span>
          </div>

          {/* Visual bar showing position across breakpoints */}
          <div className="mt-stack-s relative h-8 rounded-lg bg-fill-secondary overflow-hidden">
            {BREAKPOINTS.slice(1).map((bp) => {
              const pct = Math.min((bp.px / 1920) * 100, 100)
              return (
                <div
                  key={bp.name}
                  className="absolute top-0 bottom-0 border-l border-stroke-strong"
                  style={{ left: `${pct}%` }}
                >
                  <span className="absolute -top-0.5 left-1 text-[9px] font-mono text-label-secondary">
                    {bp.abbr}
                  </span>
                </div>
              )
            })}
            <div
              className="absolute top-0 bottom-0 bg-blue-500/20 border-r-2 border-blue-500 transition-all duration-300"
              style={{ width: `${Math.min((vw / 1920) * 100, 100)}%` }}
            />
          </div>
      </Section>

      {/* ── Scale ── */}
      <Section title="Scale" description="Mobile-first: styles apply from the breakpoint width and up" noPadding>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-tertiary text-left text-xs text-label-secondary">
                <th className="px-inset-s py-2.5 font-medium w-20">Prefix</th>
                <th className="px-inset-s py-2.5 font-medium w-24">Min-width</th>
                <th className="px-inset-s py-2.5 font-medium w-20">rem</th>
                <th className="px-inset-s py-2.5 font-medium">Description</th>
              </tr>
            </thead>
            <tbody>
              {BREAKPOINTS.map((bp, i) => (
                <tr
                  key={bp.name}
                  className={cn(
                    "border-t border-stroke-faint transition-colors",
                    activeName === bp.name ? "bg-blue-500/8" : i % 2 === 0 ? "bg-surface-secondary" : "bg-surface"
                  )}
                >
                  <td className="px-inset-s py-2.5">
                    <span className="font-mono text-xs font-semibold text-label">
                      {bp.name === "base" ? "—" : `${bp.name}:`}
                    </span>
                    {activeName === bp.name && <ActiveBadge />}
                  </td>
                  <td className="px-inset-s py-2.5 font-mono text-xs text-label-secondary tabular-nums">
                    {bp.px === 0 ? "0" : `${bp.px}px`}
                  </td>
                  <td className="px-inset-s py-2.5 font-mono text-xs text-label-secondary tabular-nums">
                    {bp.rem}rem
                  </td>
                  <td className="px-inset-s py-2.5 text-xs text-label-secondary">{bp.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
      </Section>

      {/* ── Reflow Demo ── */}
      <Section title="Reflow Demo" description="This grid adapts at each breakpoint — resize the browser to see it reflow">

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-gutter-s">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-surface-tertiary p-inset-s space-y-stack-2xs">
              <div className="flex items-center gap-inline-xs">
                <div className="size-9 rounded-lg bg-fill-secondary shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3.5 rounded bg-label/20" style={{ width: `${60 + (i * 7) % 30}%` }} />
                  <div className="h-2.5 rounded bg-label/10" style={{ width: `${70 + (i * 11) % 25}%` }} />
                </div>
              </div>
              <div className="h-2.5 rounded bg-label/8 w-full" />
              <div className="h-2.5 rounded bg-label/8" style={{ width: "75%" }} />
            </div>
          ))}
        </div>

        <div className="flex items-center gap-inline-xs text-xs text-label-secondary">
          <span className="font-mono font-medium">Currently:</span>
          <span className="sm:hidden font-medium text-blue-500">1 column (base)</span>
          <span className="hidden sm:inline lg:hidden font-medium text-blue-500">2 columns (sm)</span>
          <span className="hidden lg:inline xl:hidden font-medium text-blue-500">3 columns (lg)</span>
          <span className="hidden xl:inline font-medium text-blue-500">4 columns (xl)</span>
        </div>
      </Section>

      {/* ── Container Widths ── */}
      <Section title="Container Widths" description="Tailwind max-width utilities used for page and content containers" className="space-y-stack-2xs">
          {CONTAINERS.map((c) => {
            const pct = (c.px / 1280) * 100
            return (
              <div key={c.name} className="flex items-center gap-inline-s">
                <div className="w-24 shrink-0 text-right">
                  <div className="font-mono text-xs font-semibold text-label">{c.name}</div>
                  <div className="font-mono text-[10px] text-label-secondary">{c.px}px</div>
                </div>
                <div className="flex-1 relative h-5">
                  <div className="absolute inset-0 rounded bg-fill-secondary" />
                  <div
                    className="absolute inset-y-0 left-0 rounded bg-blue-500/15 border-r-2 border-blue-500"
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
                <div className="w-40 shrink-0 text-xs text-label-secondary">{c.use}</div>
              </div>
            )
          })}
      </Section>

      {/* ── Text Reflow ── */}
      <TextReflowSection />

      {/* ── Usage Patterns ── */}
      <Section title="Usage Patterns" description="Common responsive patterns using mobile-first prefixes" className="space-y-stack-s">
          {[
            { pattern: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3", desc: "Card grid that reflows from 1 → 2 → 3 columns" },
            { pattern: "hidden md:block", desc: "Show element only on tablets and up" },
            { pattern: "text-sm md:text-base lg:text-lg", desc: "Scale text up at wider viewports" },
            { pattern: "px-4 sm:px-6 lg:px-8", desc: "Increase page padding as space allows" },
            { pattern: "flex-col sm:flex-row", desc: "Stack on mobile, horizontal on wider screens" },
            { pattern: "max-w-4xl mx-auto px-6", desc: "Centered content container with side padding" },
          ].map((p) => (
            <div key={p.pattern} className="flex items-start gap-inline-s">
              <code className="shrink-0 rounded bg-fill-secondary px-inset-2xs py-inset-3xs font-mono text-[11px] text-label">
                {p.pattern}
              </code>
              <span className="text-xs text-label-secondary pt-0.5">{p.desc}</span>
            </div>
          ))}
      </Section>
    </PageShell>
  )
}

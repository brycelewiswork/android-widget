import { useState } from "react"
import { Link } from "react-router-dom"
import { PageShell, PageHeader, Section } from "@/components/PageLayout"
import { NumberSlider, PageActions, FluidWedge, useViewportWidth, useFluidConfig } from "@/pages/_fluid-controls"
import { calculateClamp, resolveClamp } from "@/lib/fluid"

export function Clamp() {
  // The viewport range is a foundation value — read it, don't redefine it.
  const { cfg } = useFluidConfig()
  const width = useViewportWidth()
  const [minPx, setMinPx] = useState(16)
  const [maxPx, setMaxPx] = useState(48)

  const result = calculateClamp(minPx, maxPx, cfg.viewport)
  const resolved = resolveClamp(result, width)
  const declaration = `font-size: ${result.css};`

  const reset = () => {
    setMinPx(16)
    setMaxPx(48)
  }

  return (
    <PageShell>
      <header className="flex items-start justify-between gap-4">
        <PageHeader
          title="Clamp"
          description="A general fluid-value generator. Interpolate any CSS length across your foundation viewport (root = 16px)."
        />
        <PageActions onReset={reset} copyText={() => result.css} copyLabel="Copy value" />
      </header>

      {/* ── Inputs ── */}
      <Section title="Inputs" description="The value scales from min→max as the viewport goes from the foundation's min to max."
        className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
        <NumberSlider label="Min value" value={minPx} min={0} max={200} step={1} unit="px" onChange={setMinPx} />
        <NumberSlider label="Max value" value={maxPx} min={0} max={400} step={1} unit="px" onChange={setMaxPx} />
        <div className="text-caption text-label-secondary sm:col-span-2">
          Across the foundation viewport{" "}
          <span className="font-mono text-label">{cfg.viewport.min}→{cfg.viewport.max}px</span>
          {" "}— tune the range on{" "}
          <Link to="/foundations" className="text-blue-500 hover:underline">Foundations</Link>.
        </div>
      </Section>

      {/* ── Output ── */}
      <Section title="Output" className="space-y-3" >
        <code className="block overflow-x-auto rounded-lg bg-fill-quinary p-inset-s font-mono text-body text-label">
          {result.css}
        </code>
        <div className="flex flex-wrap gap-x-6 gap-y-1 font-mono text-caption text-label-secondary">
          <span>min <span className="text-label">{result.minRem}rem</span></span>
          <span>preferred <span className="text-label">{result.interceptRem}rem + {result.slopeVw}vw</span></span>
          <span>max <span className="text-label">{result.maxRem}rem</span></span>
        </div>
      </Section>

      {/* ── Live preview ── */}
      <Section title="Preview" description="The value grows from @min to @max across the viewport." className="space-y-5">
        {/* Utopia-style wedge: @min value on the left, @max on the right. */}
        <div>
          <div className="mb-2 flex items-center justify-between font-mono text-caption text-label-secondary">
            <span>@min <span className="text-label">{minPx}px</span></span>
            <span>@max <span className="text-label">{maxPx}px</span></span>
          </div>
          <FluidWedge minPx={minPx} maxPx={maxPx} scale={64 / Math.max(minPx, maxPx, 1)} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-8 rounded-md bg-blue-500/70 transition-none" style={{ width: Math.max(resolved, 2) }} />
            <span className="font-mono text-caption font-semibold tabular-nums text-label">{resolved.toFixed(1)}px</span>
            <span className="font-mono text-[10px] text-label-secondary">
              at <span className="text-label">{width}px</span>
              {" · "}
              {resolved <= Math.min(minPx, maxPx) + 0.01 ? "clamped to min" : resolved >= Math.max(minPx, maxPx) - 0.01 ? "clamped to max" : "fluid"}
            </span>
          </div>
          <p className="font-mono text-label" style={{ fontSize: result.css }}>
            The five boxing wizards jump quickly
          </p>
          <p className="text-caption text-label-secondary">Resolved at your current viewport — resize the window to see it move.</p>
        </div>
      </Section>

      {/* ── Declaration ── */}
      <Section title="As a declaration" description="Works for font-size, padding, margin, gap, width, and more." noPadding>
        <pre className="overflow-x-auto p-inset-s font-mono text-caption text-label">{declaration}</pre>
      </Section>
    </PageShell>
  )
}

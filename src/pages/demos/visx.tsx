import { Arc } from "@visx/shape"
import { Group } from "@visx/group"
import { DemoSection } from "@/components/DemoSection"
import type { DemoEntry } from "./types"

function VisxDemo() {
  const size = 180, thickness = 18, gap = 4
  const rings = [
    { value: 0.82, color: "var(--color-red-500)" },
    { value: 0.65, color: "var(--color-green-500)" },
    { value: 0.45, color: "var(--color-cyan-500)" },
  ]

  return (
    <DemoSection title="visx" lib="@visx/shape + @visx/scale + @visx/group" docsUrl="https://visx.airbnb.tech/docs">
      <p className="text-body text-label-secondary">
        Low-level SVG primitives for custom visuals Recharts can't express — radial arcs, bespoke gauges, data-art.
      </p>
      <div className="flex items-center gap-inline-m">
        <svg width={size} height={size} className="overflow-visible">
          <Group top={size / 2} left={size / 2}>
            {rings.map((ring, i) => {
              const outer = size / 2 - i * (thickness + gap)
              const inner = outer - thickness
              return (
                <g key={i}>
                  <Arc
                    startAngle={0}
                    endAngle={2 * Math.PI}
                    innerRadius={inner}
                    outerRadius={outer}
                    fill="var(--surface-tertiary)"
                  />
                  <Arc
                    startAngle={0}
                    endAngle={ring.value * 2 * Math.PI}
                    innerRadius={inner}
                    outerRadius={outer}
                    fill={ring.color}
                    cornerRadius={thickness / 2}
                  />
                </g>
              )
            })}
          </Group>
        </svg>
        <div className="space-y-stack-2xs text-sm">
          {[
            { label: "Move", pct: 82, color: "text-red-500" },
            { label: "Exercise", pct: 65, color: "text-green-500" },
            { label: "Stand", pct: 45, color: "text-cyan-500" },
          ].map((r) => (
            <div key={r.label} className="flex items-baseline gap-inline-2xs">
              <span className={`font-semibold tabular-nums ${r.color}`}>{r.pct}%</span>
              <span className="text-label-secondary">{r.label}</span>
            </div>
          ))}
        </div>
      </div>
    </DemoSection>
  )
}

const entry: DemoEntry = {
  lib: "visx",
  role: "SVG primitives",
  docsUrl: "https://visx.airbnb.tech/docs",
  Component: VisxDemo,
}
export default entry

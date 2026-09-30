import { DemoSection } from "@/components/DemoSection"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Area, AreaChart, Bar, BarChart, RadialBar, RadialBarChart,
  XAxis, YAxis, CartesianGrid, PolarAngleAxis,
} from "recharts"
import type { DemoEntry } from "./types"

const areaData = [
  { month: "Jan", value: 186 }, { month: "Feb", value: 305 },
  { month: "Mar", value: 237 }, { month: "Apr", value: 173 },
  { month: "May", value: 409 }, { month: "Jun", value: 214 },
]

const barData = [
  { day: "Mon", a: 120, b: 80 }, { day: "Tue", a: 200, b: 130 },
  { day: "Wed", a: 150, b: 100 }, { day: "Thu", a: 280, b: 190 },
  { day: "Fri", a: 220, b: 160 }, { day: "Sat", a: 310, b: 210 },
]

const gaugeData = [{ name: "score", value: 72, fill: "var(--color-green-500)" }]

const sparkData = Array.from({ length: 20 }, (_, i) => ({
  v: 40 + Math.sin(i * 0.6) * 30 + Math.random() * 10,
}))

const areaConfig = { value: { label: "Visitors", color: "var(--color-blue-500)" } } satisfies ChartConfig
const barConfig = {
  a: { label: "Series A", color: "var(--color-cyan-500)" },
  b: { label: "Series B", color: "var(--color-purple-500)" },
} satisfies ChartConfig
const gaugeConfig = { score: { label: "Score", color: "var(--color-green-500)" } } satisfies ChartConfig
const sparkConfig = { v: { label: "Value", color: "var(--color-orange-500)" } } satisfies ChartConfig

function RechartsDemo() {
  return (
    <DemoSection title="Recharts" lib="recharts" version="3.5.1" docsUrl="https://recharts.org/en-US/api">
      <p className="text-body text-label-secondary">
        Declarative charts via shadcn/ui's ChartContainer. SVG output, CSS variable theming, dark mode for free.
      </p>

      <div className="grid grid-cols-2 gap-gutter-m">
        <div className="space-y-stack-2xs">
          <div>
            <h3 className="text-sm font-medium text-label">Area chart</h3>
            <p className="text-xs text-label-secondary">Gradient fill with tooltip</p>
          </div>
          <ChartContainer config={areaConfig} className="aspect-[2/1] w-full">
            <AreaChart data={areaData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} />
              <YAxis tickLine={false} axisLine={false} fontSize={11} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-value)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-value)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area dataKey="value" type="monotone" stroke="var(--color-value)" fill="url(#areaGrad)" strokeWidth={2} />
            </AreaChart>
          </ChartContainer>
        </div>

        <div className="space-y-stack-2xs">
          <div>
            <h3 className="text-sm font-medium text-label">Grouped bars</h3>
            <p className="text-xs text-label-secondary">Two series, auto-legend via config</p>
          </div>
          <ChartContainer config={barConfig} className="aspect-[2/1] w-full">
            <BarChart data={barData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} />
              <YAxis tickLine={false} axisLine={false} fontSize={11} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="a" fill="var(--color-a)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="b" fill="var(--color-b)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </div>

        <div className="space-y-stack-2xs">
          <div>
            <h3 className="text-sm font-medium text-label">Radial gauge</h3>
            <p className="text-xs text-label-secondary">Score out of 100</p>
          </div>
          <div className="flex items-center justify-center">
            <ChartContainer config={gaugeConfig} className="aspect-square w-full max-w-[180px]">
              <RadialBarChart
                data={gaugeData}
                startAngle={180}
                endAngle={180 - (gaugeData[0].value / 100) * 360}
                innerRadius="70%"
                outerRadius="100%"
              >
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar dataKey="value" cornerRadius={10} background={{ fill: "var(--surface-tertiary)" }} />
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-label text-2xl font-semibold">
                  {gaugeData[0].value}
                </text>
              </RadialBarChart>
            </ChartContainer>
          </div>
        </div>

        <div className="space-y-stack-2xs">
          <div>
            <h3 className="text-sm font-medium text-label">Sparkline</h3>
            <p className="text-xs text-label-secondary">Compact inline chart, no axes</p>
          </div>
          <div className="flex items-end gap-inline-xs">
            <span className="text-3xl font-semibold text-label tabular-nums">247</span>
            <ChartContainer config={sparkConfig} className="h-12 flex-1">
              <AreaChart data={sparkData} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-v)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="var(--color-v)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area dataKey="v" type="monotone" stroke="var(--color-v)" fill="url(#sparkGrad)" strokeWidth={1.5} />
              </AreaChart>
            </ChartContainer>
          </div>
        </div>
      </div>
    </DemoSection>
  )
}

const entry: DemoEntry = {
  lib: "Recharts",
  role: "charts",
  version: "3.5.1",
  docsUrl: "https://recharts.org/en-US/api",
  Component: RechartsDemo,
}
export default entry

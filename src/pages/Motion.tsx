import { useState, useEffect, useRef, useMemo } from "react"
import { motion, useMotionValue, useTransform, animate, type SpringOptions } from "motion/react"
import useMeasure from "react-use-measure"
import { IconPlayerPlayFilled } from "@tabler/icons-react"
import { SPRING, SPRING_FAST, EASE, DURATION } from "@/lib/motion"
import { PageShell, PageHeader, Section } from "@/components/PageLayout"

function simulateSpring(opts: SpringOptions): [number, number][] {
  const k = opts.stiffness ?? 100, c = opts.damping ?? 10, m = opts.mass ?? 1
  const dt = 1 / 240
  let x = 0, v = 0, t = 0
  const pts: [number, number][] = [[0, 0]]
  for (let i = 0; i < 2400; i++) {
    v += ((-k * (x - 1) - c * v) / m) * dt
    x += v * dt
    t += dt
    pts.push([t, x])
    if (t > 0.15 && Math.abs(x - 1) < 0.001 && Math.abs(v) < 0.01) break
  }
  return pts
}

function bezierCurve(p1x: number, p1y: number, p2x: number, p2y: number): [number, number][] {
  const pts: [number, number][] = []
  for (let i = 0; i <= 100; i++) {
    const u = i / 100
    const inv = 1 - u
    pts.push([
      3 * inv * inv * u * p1x + 3 * inv * u * u * p2x + u * u * u,
      3 * inv * inv * u * p1y + 3 * inv * u * u * p2y + u * u * u,
    ])
  }
  return pts
}

const NAMED_BEZIERS: Record<string, [number, number, number, number]> = {
  linear: [0, 0, 1, 1],
  easeIn: [0.42, 0, 1, 1],
  easeOut: [0, 0, 0.58, 1],
  easeInOut: [0.42, 0, 0.58, 1],
}

type Preset = {
  name: string
  params: string
  curve: [number, number][]
  dur: number
  transition: Record<string, unknown>
}

function springPreset(group: string, key: string, opts: SpringOptions): Preset {
  const curve = simulateSpring(opts)
  return {
    name: `${group}.${key}`,
    params: `stiffness ${opts.stiffness}  damping ${opts.damping}  mass ${opts.mass}`,
    curve,
    dur: curve[curve.length - 1][0],
    transition: { type: "spring", stiffness: opts.stiffness, damping: opts.damping, mass: opts.mass },
  }
}

function easePreset(key: string, ease: readonly number[] | string): Preset {
  const dur = 0.6
  const b = typeof ease === "string" ? NAMED_BEZIERS[ease] ?? [0, 0, 1, 1] : ease
  return {
    name: `EASE.${key}`,
    params: typeof ease === "string" ? `"${ease}"` : `[${(ease as number[]).join(", ")}]`,
    curve: bezierCurve(b[0], b[1], b[2], b[3]),
    dur,
    transition: { duration: dur, ease: typeof ease === "string" ? ease : [...ease] },
  }
}

type Group = { title: string; desc: string; presets: Preset[] }

const GROUPS: Group[] = [
  {
    title: "Springs",
    desc: "Apple-inspired — slight overshoot, polished feel",
    presets: Object.entries(SPRING).map(([k, v]) => springPreset("SPRING", k, v)),
  },
  {
    title: "Fast Springs",
    desc: "Higher damping, near-critically-damped, minimal overshoot",
    presets: Object.entries(SPRING_FAST).map(([k, v]) => springPreset("SPRING_FAST", k, v)),
  },
  {
    title: "Easing Curves",
    desc: "Cubic bezier and CSS keyword easings",
    presets: Object.entries(EASE).map(([k, v]) => easePreset(k, v)),
  },
]

function CurveGraph({ curve, dot }: { curve: [number, number][]; dot: [number, number] }) {
  const W = 240, H = 140, P = 14
  const pW = W - P * 2, pH = H - P * 2

  const { maxT, minV, rangeV } = useMemo(() => {
    const vs = curve.map((p) => p[1])
    const mi = Math.min(0, ...vs), ma = Math.max(1, ...vs)
    return { maxT: curve[curve.length - 1][0], minV: mi, rangeV: ma - mi }
  }, [curve])

  const sx = (t: number) => P + (t / maxT) * pW
  const sy = (v: number) => P + pH - ((v - minV) / rangeV) * pH

  const d = curve.map((p, i) => `${i ? "L" : "M"}${sx(p[0]).toFixed(1)},${sy(p[1]).toFixed(1)}`).join("")
  const fillD = d + `L${sx(maxT).toFixed(1)},${sy(0).toFixed(1)}L${sx(0).toFixed(1)},${sy(0).toFixed(1)}Z`

  const dx = sx(dot[0] * maxT)
  const dy = sy(dot[1])

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-xl bg-surface-tertiary">
      <line x1={P} y1={sy(1)} x2={W - P} y2={sy(1)} stroke="var(--stroke-faint)" strokeDasharray="3 2" />
      <line x1={P} y1={sy(0)} x2={W - P} y2={sy(0)} stroke="var(--stroke-faint)" strokeDasharray="3 2" />
      <path d={fillD} fill="var(--color-purple-100)" opacity={0.45} />
      <path d={d} fill="none" stroke="var(--color-purple-500)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={dx} cy={dy} r={4.5} fill="var(--color-purple-600)" />
      <circle cx={dx} cy={dy} r={2} fill="white" />
    </svg>
  )
}

function AnimatedPreview({ preset }: { preset: Preset }) {
  const progress = useMotionValue(0)
  const [dot, setDot] = useState<[number, number]>([0, 0])
  const startRef = useRef(0)
  const rafRef = useRef(0)
  const [trackRef, bounds] = useMeasure()
  const maxX = Math.max(0, bounds.width - 28)
  const squareX = useTransform(progress, (v) => v * maxX)

  useEffect(() => {
    startRef.current = performance.now()
    const controls = animate(progress, 1, preset.transition as never)

    const tick = () => {
      const elapsed = (performance.now() - startRef.current) / 1000
      const t = Math.min(elapsed / preset.dur, 1)
      const v = progress.get()
      setDot([t, v])
      if (t < 1 || Math.abs(v - 1) > 0.002) rafRef.current = requestAnimationFrame(tick)
      else setDot([1, 1])
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      controls.stop()
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <div className="space-y-stack-2xs">
      <CurveGraph curve={preset.curve} dot={dot} />
      <div ref={trackRef} className="relative h-8">
        <div className="absolute inset-x-3.5 top-1/2 h-px bg-stroke-faint" />
        <motion.div
          className="absolute top-0 size-7 rounded-lg bg-label"
          style={{ x: squareX }}
        />
      </div>
    </div>
  )
}

function PresetCard({ preset }: { preset: Preset }) {
  const [key, setKey] = useState(0)

  return (
    <div className="space-y-stack-2xs">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-medium text-label">{preset.name}</div>
          <div className="text-[10px] text-label-secondary font-mono">{preset.params}</div>
        </div>
        <button
          onClick={() => setKey((k) => k + 1)}
          className="size-7 rounded-md bg-surface-tertiary flex items-center justify-center text-label-secondary hover:text-label hover:bg-fill-primary transition-colors cursor-pointer"
        >
          <IconPlayerPlayFilled size={10} />
        </button>
      </div>
      <AnimatedPreview key={key} preset={preset} />
    </div>
  )
}

function DurationBar({ name, value }: { name: string; value: number }) {
  const [key, setKey] = useState(0)
  const progress = useMotionValue(0)
  const [ref, bounds] = useMeasure()
  const maxX = Math.max(0, bounds.width - 20)
  const x = useTransform(progress, (v) => v * maxX)

  useEffect(() => {
    progress.set(0)
    const controls = animate(progress, 1, { duration: value, ease: "linear" })
    return () => controls.stop()
  }, [key])

  return (
    <div className="flex items-center gap-inline-xs">
      <div className="w-16 shrink-0">
        <div className="text-xs font-medium text-label">{name}</div>
        <div className="text-[10px] text-label-secondary font-mono">{value}s</div>
      </div>
      <div ref={ref} className="relative h-5 flex-1">
        <div className="absolute inset-x-2.5 top-1/2 h-px bg-stroke-faint" />
        <motion.div className="absolute top-0.5 size-4 rounded-md bg-label" style={{ x }} />
      </div>
      <button
        onClick={() => setKey((k) => k + 1)}
        className="size-6 shrink-0 rounded-md bg-surface-tertiary flex items-center justify-center text-label-secondary hover:text-label cursor-pointer"
      >
        <IconPlayerPlayFilled size={8} />
      </button>
    </div>
  )
}

export function Motion() {
  return (
    <PageShell>
      <PageHeader title="Motion" description="Every preset defined in src/lib/motion.ts" />

      {GROUPS.map((g) => (
        <Section key={g.title} title={g.title} description={g.desc}>
          <div className="grid grid-cols-2 gap-x-inline-m gap-y-stack-l lg:grid-cols-3">
            {g.presets.map((p) => (
              <PresetCard key={p.name} preset={p} />
            ))}
          </div>
        </Section>
      ))}

      <Section title="Durations" description="Timing tokens in seconds — shown with linear easing">
        <div className="space-y-stack-xs">
          {Object.entries(DURATION).map(([name, value]) => (
            <DurationBar key={name} name={name} value={value} />
          ))}
        </div>
      </Section>
    </PageShell>
  )
}

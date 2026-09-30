import { useState } from "react"
import { DemoSection } from "@/components/DemoSection"
import { Squircle, SQUIRCLE_RADIUS, buildShadow, SQUIRCLE_SHADOW } from "@/components/squircle"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import type { DemoEntry } from "./types"

function ShadowPresets() {
  return (
    <div className="flex flex-col gap-stack-2xs">
      <span className="text-xs font-medium text-label-secondary">
        7-tier presets (aligned with Tailwind v4's shadow-2xs → shadow-2xl)
      </span>
      <div className="grid grid-cols-2 gap-gutter-s sm:grid-cols-4">
        {(Object.keys(SQUIRCLE_SHADOW) as Array<keyof typeof SQUIRCLE_SHADOW>).map((key) => (
          <Card key={key} shadow={key}>
            <CardHeader>
              <CardTitle className="font-mono text-sm">{key}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  )
}

function ShadowDirectional() {
  const [elevation, setElevation] = useState(3)
  const [direction, setDirection] = useState(0)
  const [tinted, setTinted] = useState(false)
  const shadow = buildShadow({
    elevation,
    direction,
    color: tinted ? "rgba(59, 130, 246, 0.4)" : undefined,
  })

  return (
    <div className="flex flex-col gap-stack-xs">
      <span className="text-xs font-medium text-label-secondary">
        Directional via <code>buildShadow({"{}"})</code>
      </span>
      <div className="flex items-center gap-inline-m">
        <Card shadow={shadow} className="w-48">
          <CardHeader>
            <CardTitle className="font-mono text-sm">{direction}°</CardTitle>
            <CardDescription className="text-xs">elev {elevation}</CardDescription>
          </CardHeader>
        </Card>
        <div className="flex flex-1 flex-col gap-stack-2xs">
          <label className="flex items-center gap-inline-xs text-sm">
            <span className="w-16 text-label-secondary">direction</span>
            <Slider
              min={0}
              max={360}
              step={5}
              value={[direction]}
              onValueChange={(v) => setDirection(Array.isArray(v) ? v[0] : v)}
              className="flex-1"
            />
            <span className="w-10 text-right font-mono text-xs">{direction}°</span>
          </label>
          <label className="flex items-center gap-inline-xs text-sm">
            <span className="w-16 text-label-secondary">elevation</span>
            <Slider
              min={0.5}
              max={5}
              step={0.5}
              value={[elevation]}
              onValueChange={(v) => setElevation(Array.isArray(v) ? v[0] : v)}
              className="flex-1"
            />
            <span className="w-10 text-right font-mono text-xs">{elevation}</span>
          </label>
          <label className="flex items-center gap-inline-2xs text-sm">
            <input
              type="checkbox"
              checked={tinted}
              onChange={(e) => setTinted(e.target.checked)}
              className="accent-blue-500"
            />
            <span className="text-label-secondary">Blue tint</span>
          </label>
        </div>
      </div>
    </div>
  )
}

function SquircleDemo() {
  const [smoothing, setSmoothing] = useState(0.6)
  return (
    <DemoSection title="Apple-style squircles" lib="corner-smoothing" docsUrl="https://www.npmjs.com/package/corner-smoothing">
      <p className="text-body text-label-secondary">
        Continuous-curve corners via SVG <code>clip-path</code>. Every shadcn component in this
        template renders through <code>&lt;Squircle&gt;</code> or <code>useSquircle</code>.
      </p>
      <div className="grid gap-gutter-s sm:grid-cols-2">
        <div className="flex flex-col gap-stack-2xs">
          <span className="text-xs font-medium text-label-secondary">
            CSS <code>border-radius</code>
          </span>
          <div className="flex h-32 items-center justify-center rounded-xl bg-label/10">
            <span className="text-xs text-label-secondary">rounded-xl</span>
          </div>
        </div>
        <div className="flex flex-col gap-stack-2xs">
          <span className="text-xs font-medium text-label-secondary">
            Squircle <code>clip-path</code>
          </span>
          <Squircle
            as="div"
            cornerRadius={SQUIRCLE_RADIUS.xl}
            cornerSmoothing={smoothing}
            className="flex h-32 items-center justify-center bg-label/10"
          >
            <span className="text-xs text-label-secondary">smoothing {smoothing.toFixed(2)}</span>
          </Squircle>
        </div>
      </div>
      <label className="flex items-center gap-inline-xs text-sm">
        <span className="w-24 text-label-secondary">cornerSmoothing</span>
        <Slider
          min={0}
          max={1}
          step={0.05}
          value={[smoothing]}
          onValueChange={(v) => setSmoothing(Array.isArray(v) ? v[0] : v)}
          className="flex-1"
        />
        <span className="w-10 text-right font-mono text-xs">{smoothing.toFixed(2)}</span>
      </label>
      <div className="flex flex-wrap items-center gap-gutter-xs pt-inset-2xs">
        <Button>Squircled button</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline" size="sm">Small</Button>
        <Badge>Pill badge</Badge>
        <Badge variant="secondary">Secondary</Badge>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Card root is squircled</CardTitle>
          <CardDescription>
            Look closely — the corners taper continuously instead of meeting the straight edge as a
            circular arc.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-12 rounded-md bg-label/5" />
        </CardContent>
      </Card>
      <ShadowPresets />
      <ShadowDirectional />
    </DemoSection>
  )
}

const entry: DemoEntry = {
  lib: "corner-smoothing",
  role: "squircles",
  docsUrl: "https://www.npmjs.com/package/corner-smoothing",
  Component: SquircleDemo,
}
export default entry

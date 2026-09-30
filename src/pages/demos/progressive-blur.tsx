import { useState } from "react"
import { DemoSection } from "@/components/DemoSection"
import { LinearBlur, RadialBlur } from "@/components/ui/progressive-blur"
import { Slider } from "@/components/ui/slider"
import type { DemoEntry } from "./types"

function BlurStage({
  label,
  children,
  tall,
}: {
  label: string
  children: React.ReactNode
  tall?: boolean
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-lg ${tall ? "h-44" : "h-32"}`}
      style={{
        backgroundImage:
          "repeating-linear-gradient(45deg, oklch(0.85 0.18 30) 0 14px, oklch(0.7 0.2 250) 14px 28px, oklch(0.85 0.18 130) 28px 42px)",
      }}
    >
      {children}
      <span className="pointer-events-none absolute bottom-1 left-2 font-mono text-[10px] text-label/60 mix-blend-difference">
        {label}
      </span>
    </div>
  )
}

function ProgressiveBlurDemo() {
  const [strength, setStrength] = useState(48)
  const [falloff, setFalloff] = useState(100)
  return (
    <DemoSection title="Progressive blur" lib="custom" bare docsUrl="https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter">
      <p className="text-body text-label-secondary">
        Hand-rolled in <code>@/components/ui/progressive-blur</code>. Stacks{" "}
        <code>backdrop-filter: blur()</code> layers with mask gradients for a smooth ramp. Pass
        <code> blurLevels</code> as an array for explicit multi-stop control, or{" "}
        <code>strength</code> + <code>steps</code> for a computed geometric ramp.
      </p>

      <div className="grid gap-gutter-s sm:grid-cols-2">
        <BlurStage label='<LinearBlur side="top" />'>
          <LinearBlur side="top" strength={strength} falloffPercentage={falloff} />
        </BlurStage>
        <BlurStage label='<LinearBlur side="bottom" />'>
          <LinearBlur side="bottom" strength={strength} falloffPercentage={falloff} />
        </BlurStage>
        <BlurStage label='<LinearBlur side="left" />'>
          <LinearBlur side="left" strength={strength} falloffPercentage={falloff} />
        </BlurStage>
        <BlurStage label='<LinearBlur side="right" />'>
          <LinearBlur side="right" strength={strength} falloffPercentage={falloff} />
        </BlurStage>
        <BlurStage label='<RadialBlur origin="edge" />'>
          <RadialBlur origin="edge" strength={strength} falloffPercentage={falloff} />
        </BlurStage>
        <BlurStage label='<RadialBlur origin="center" />'>
          <RadialBlur origin="center" strength={strength} falloffPercentage={falloff} />
        </BlurStage>
      </div>

      <div className="grid gap-gutter-xs sm:grid-cols-2">
        <label className="flex items-center gap-inline-xs text-sm">
          <span className="w-20 text-label-secondary">strength</span>
          <Slider
            min={0}
            max={128}
            step={1}
            value={[strength]}
            onValueChange={(v) => setStrength(Array.isArray(v) ? v[0] : v)}
            className="flex-1"
          />
          <span className="w-12 text-right font-mono text-xs">{strength}px</span>
        </label>
        <label className="flex items-center gap-inline-xs text-sm">
          <span className="w-20 text-label-secondary">falloff</span>
          <Slider
            min={10}
            max={100}
            step={1}
            value={[falloff]}
            onValueChange={(v) => setFalloff(Array.isArray(v) ? v[0] : v)}
            className="flex-1"
          />
          <span className="w-12 text-right font-mono text-xs">{falloff}%</span>
        </label>
      </div>

      <div className="flex flex-col gap-stack-2xs">
        <span className="text-xs font-medium text-label-secondary">
          Explicit multi-stop via <code>blurLevels=[1, 2, 4, 32]</code>
        </span>
        <BlurStage label="four explicit layers" tall>
          <LinearBlur side="top" blurLevels={[1, 2, 4, 32]} falloffPercentage={80} />
        </BlurStage>
      </div>
    </DemoSection>
  )
}

const entry: DemoEntry = {
  lib: "progressive-blur",
  role: "blur fx",
  docsUrl: "https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter",
  Component: ProgressiveBlurDemo,
}
export default entry

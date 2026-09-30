import { useState } from "react"
import { useDialKit } from "@/components/dialkit"
import { DemoSection } from "@/components/DemoSection"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TextEffect } from "@/components/ui/text-effect"
import { TextShimmer } from "@/components/ui/text-shimmer"
import { AnimatedNumber } from "@/components/ui/animated-number"
import { InfiniteSlider } from "@/components/ui/infinite-slider"
import { Tilt } from "@/components/ui/tilt"
import { GlowEffect } from "@/components/ui/glow-effect"
import { InView } from "@/components/ui/in-view"
import { SPRING, EASE, DURATION } from "@/lib/motion"
import type { DemoEntry } from "./types"

function MotionPrimitivesDemo() {
  const [num, setNum] = useState(0)
  const [textKey, setTextKey] = useState(0)
  const ticker = useDialKit("AnimatedNumber", {
    duration: [600, 150, 1500] as [number, number, number],
    stagger: [20, 0, 120] as [number, number, number],
    blur: [8, 0, 24] as [number, number, number],
    travel: [60, 10, 120] as [number, number, number],
  })
  return (
    <DemoSection title="Motion primitives" lib="motion-primitives" docsUrl="https://motion-primitives.com">
      <p className="text-body text-label-secondary">
        32 copy-paste animation components from{" "}
        <a href="https://motion-primitives.com" className="underline" target="_blank" rel="noopener">
          motion-primitives.com
        </a>
        . Built on the same <code>motion</code> package already in the stack. Showing a sample below
        — all 32 are installed and importable from <code>@/components/ui/</code>.
      </p>

      <div className="flex flex-col gap-stack-2xs">
        <span className="text-xs font-medium text-label-secondary">TextEffect — blur reveal</span>
        <div className="flex items-center gap-inline-xs">
          <TextEffect key={textKey} per="word" as="p" preset="blur" className="text-lg font-medium">
            Every detail is an opportunity for polish.
          </TextEffect>
          <Button size="sm" variant="outline" onClick={() => setTextKey((k) => k + 1)}>
            Replay
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-stack-2xs">
        <span className="text-xs font-medium text-label-secondary">TextShimmer</span>
        <TextShimmer className="text-lg font-medium" duration={1.5}>
          Shimmering highlight sweep
        </TextShimmer>
      </div>

      <div className="flex flex-col gap-stack-2xs">
        <span className="text-xs font-medium text-label-secondary">
          AnimatedNumber — tune duration / stagger / blur / travel in the dialkit panel
        </span>
        <div className="flex items-center gap-inline-xs">
          <AnimatedNumber
            value={num}
            format={(n) => n.toLocaleString()}
            className="text-4xl font-medium tabular-nums"
            duration={ticker.duration}
            stagger={ticker.stagger}
            blur={ticker.blur}
            travel={ticker.travel}
          />
          <Button size="sm" onClick={() => setNum((n) => n + Math.floor(Math.random() * 500 + 100))}>
            Add
          </Button>
          <Button size="sm" variant="outline" onClick={() => setNum(0)}>
            Reset
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-stack-2xs">
        <span className="text-xs font-medium text-label-secondary">InfiniteSlider</span>
        <InfiniteSlider gap={12} speed={20}>
          {["motion", "gsap", "zustand", "sonner", "colorthief", "squircle", "tailwind", "shadcn", "vite", "react"].map(
            (lib) => (
              <Badge key={lib} variant="secondary">{lib}</Badge>
            ),
          )}
        </InfiniteSlider>
      </div>

      <div className="grid gap-gutter-s sm:grid-cols-2">
        <div className="flex flex-col gap-stack-2xs">
          <span className="text-xs font-medium text-label-secondary">Tilt</span>
          <Tilt rotationFactor={8} springOptions={SPRING.snappy}>
            <div className="flex h-28 items-center justify-center rounded-xl bg-label/5 text-sm text-label-secondary">
              Hover and tilt
            </div>
          </Tilt>
        </div>
        <div className="flex flex-col gap-stack-2xs">
          <span className="text-xs font-medium text-label-secondary">GlowEffect</span>
          <div className="relative flex h-28 items-center justify-center rounded-xl bg-label/5 text-sm text-label-secondary">
            <GlowEffect colors={["#0894FF", "#C959DD", "#FF2E54", "#FF9004"]} mode="colorShift" />
            Animated glow border
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-stack-2xs">
        <span className="text-xs font-medium text-label-secondary">InView — scroll to reveal</span>
        <InView
          variants={{
            hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
            visible: { opacity: 1, y: 0, filter: "blur(0px)" },
          }}
          transition={{ duration: DURATION.slow, ease: EASE.easeOut }}
          viewOptions={{ once: true, margin: "0px 0px -40px 0px" }}
        >
          <div className="flex h-20 items-center justify-center rounded-xl bg-label/5 text-sm text-label-secondary">
            I animated in when you scrolled here
          </div>
        </InView>
      </div>

      <details className="text-sm">
        <summary className="cursor-pointer text-label-secondary hover:text-label">
          All 32 installed components
        </summary>
        <div className="mt-stack-2xs flex flex-wrap gap-gutter-3xs">
          {[
            "accordion", "animated-background", "animated-group", "animated-number",
            "border-trail", "carousel", "cursor", "dialog", "disclosure", "dock",
            "glow-effect", "image-comparison", "in-view", "infinite-slider",
            "magnetic", "morphing-dialog", "morphing-popover", "scroll-progress",
            "sliding-number", "spinning-text", "spotlight", "text-effect",
            "text-loop", "text-morph", "text-roll", "text-scramble",
            "text-shimmer", "text-shimmer-wave", "tilt", "toolbar-dynamic",
            "toolbar-expandable", "transition-panel",
          ].map((name) => (
            <Badge key={name} variant="outline" className="font-mono text-[10px]">
              {name}
            </Badge>
          ))}
        </div>
      </details>
    </DemoSection>
  )
}

const entry: DemoEntry = {
  lib: "motion-primitives",
  role: "32 effects",
  docsUrl: "https://motion-primitives.com",
  Component: MotionPrimitivesDemo,
}
export default entry

import { useEffect, useRef } from "react"
import gsap from "gsap"
import { DemoSection } from "@/components/DemoSection"
import { Button } from "@/components/ui/button"
import { GSAP_EASE } from "@/lib/motion"
import type { DemoEntry } from "./types"

function GsapDemo() {
  const boxes = useRef<Array<HTMLDivElement | null>>([])
  const play = () => {
    gsap.fromTo(
      boxes.current,
      { scale: 0.6, opacity: 0.2 },
      { scale: 1, opacity: 1, duration: 0.6, stagger: 0.05, ease: GSAP_EASE.bounce },
    )
  }
  useEffect(() => { play() }, [])
  return (
    <DemoSection title="GSAP" lib="gsap" docsUrl="https://gsap.com/docs/v3/">
      <p className="text-body text-label-secondary">
        Timeline + stagger for high-fidelity orchestration.
      </p>
      <div className="flex items-end gap-inline-s">
        <div className="flex gap-inline-2xs">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              ref={(el) => { boxes.current[i] = el }}
              className="size-8 rounded-md bg-label/30"
            />
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={play}>Replay</Button>
      </div>
    </DemoSection>
  )
}

const entry: DemoEntry = {
  lib: "GSAP",
  role: "timelines",
  docsUrl: "https://gsap.com/docs/v3/",
  Component: GsapDemo,
}
export default entry

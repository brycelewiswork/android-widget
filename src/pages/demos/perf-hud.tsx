import { DemoSection } from "@/components/DemoSection"
import type { DemoEntry } from "./types"

function PerfHudDemo() {
  return (
    <DemoSection title="Perf HUD" lib="perf-hud">
      <p className="text-body text-label-secondary">
        A dev-only frame-timing meter, mounted in <code>main.tsx</code> (bottom-left).
        Purpose: catch <strong className="text-label">laggy controls</strong> on the
        canvas / shader / heavy-motion sketches this template is built for. Drag a
        control and watch <code>worst</code> — the longest frame in the trailing
        second. A single 60ms frame reads as a visible hitch even when average FPS
        looks fine, so <code>worst</code> is the real jank signal, not FPS.
      </p>
      <ul className="text-body text-label-secondary space-y-stack-3xs pl-inset-s list-disc marker:text-label-tertiary">
        <li><code>fps</code> — smoothed steady-state frame rate</li>
        <li><code>worst</code> — longest frame gap in the last ~1s (the jank detector)</li>
        <li><code>blocks</code> — main-thread long tasks (&gt;50ms) in the last ~1s</li>
        <li>Green &lt;22ms · amber &lt;40ms · red = visible hitch</li>
        <li><kbd>Alt</kbd>+<kbd>P</kbd> — hide/show · click the pill to expand the sparkline</li>
      </ul>
      <p className="text-body text-label-secondary">
        Zero-dep and self-contained (inline styles, throttled to ~4Hz so the meter
        never causes the jank it measures). It's the everyday, in-loop check; for
        CI-grade frame-budget assertions, reach for Playwright (see the reach-for
        table in <code>CLAUDE.md</code>).
      </p>
    </DemoSection>
  )
}

const entry: DemoEntry = {
  lib: "perf-hud",
  role: "frame-timing meter",
  Component: PerfHudDemo,
}
export default entry

import { useState } from "react"
import { IconSun } from "@tabler/icons-react"
import { DemoSection } from "@/components/DemoSection"
import { CanvasStage } from "@/components/canvas/CanvasStage"
import { ToolbarButton } from "@/components/canvas/Toolbar"
import type { DemoEntry } from "./types"

function DemoCard({ bright }: { bright: boolean }) {
  return (
    <div
      className="w-[480px] h-[320px] rounded-3xl grid place-items-center text-white overflow-hidden shadow-2xl"
      style={{
        background: "linear-gradient(135deg, #d946ef, #6366f1)",
        filter: bright ? "none" : "brightness(0.55)",
        transition: "filter 0.25s ease",
      }}
    >
      <div className="text-center px-inset-l select-none">
        <div className="text-3xl font-semibold tracking-tight">Canvas Stage</div>
        <div className="mt-1.5 text-sm text-white/85">⌘ / Ctrl + scroll to zoom · drag to pan</div>
      </div>
    </div>
  )
}

function CanvasToolbarDemo() {
  const [bright, setBright] = useState(true)
  return (
    <DemoSection title="Canvas Toolbar" lib="canvas">
      <p className="text-body text-label-secondary">
        A zoom/pan stage with a bottom-docked toolbar — canvas chrome for a sketch.{" "}
        <strong className="text-label">⌘/Ctrl + scroll</strong> zooms toward the cursor, plain scroll
        pans, and dragging pans too. The toolbar has undo/redo (of view changes), zoom −/+, a 100%
        reset, fit-to-view, and an <code>actions</code> slot — here a brightness toggle.
        <code>&lt;CanvasStage&gt;</code> + <code>&lt;Toolbar&gt;</code> live in{" "}
        <code>src/components/canvas/</code>; drop the toolbar into any sketch on its own.
      </p>
      <div className="h-[380px] w-full rounded-xl overflow-hidden inset-ring-1 inset-ring-stroke-faint">
        <CanvasStage
          className="h-full w-full"
          toolbarActions={
            <ToolbarButton onClick={() => setBright((b) => !b)} label="Toggle brightness">
              <IconSun size={18} stroke={1.75} />
            </ToolbarButton>
          }
        >
          <DemoCard bright={bright} />
        </CanvasStage>
      </div>
    </DemoSection>
  )
}

const entry: DemoEntry = {
  lib: "canvas",
  role: "zoom/pan stage",
  Component: CanvasToolbarDemo,
}
export default entry

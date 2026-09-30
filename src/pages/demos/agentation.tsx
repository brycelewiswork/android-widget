import { DemoSection } from "@/components/DemoSection"
import type { DemoEntry } from "./types"

function AgentationDemo() {
  return (
    <DemoSection title="Agentation" lib="agentation" docsUrl="https://www.agentation.com">
      <p className="text-body text-label-secondary">
        Visual feedback for AI coding agents. Mounted dev-only in{" "}
        <code>main.tsx</code>; the toolbar opens with <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>F</kbd>.
        Click any element to drop a note; the annotation carries the CSS selector,
        Vite source path + line, React component tree, and computed styles. The
        agentation MCP server (registered in <code>.mcp.json</code>) exposes the
        queue to Claude.
      </p>
      <ul className="text-body text-label-secondary space-y-stack-3xs pl-inset-s list-disc marker:text-label-tertiary">
        <li><kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>F</kbd> — toggle the toolbar</li>
        <li><kbd>P</kbd> — pause animations (annotate a specific frame of a spring)</li>
        <li><kbd>L</kbd> — layout mode</li>
        <li><kbd>H</kbd> — hide/show markers</li>
        <li><kbd>C</kbd> — copy formatted markdown (works without MCP)</li>
        <li><kbd>X</kbd> — clear all</li>
      </ul>
      <p className="text-body text-label-secondary">
        <strong className="text-label">The loop:</strong> walk the sketch, drop annotations
        (with optional intent/severity), then tell Claude <em>"start the watch loop"</em> —
        Claude calls <code>agentation_watch_annotations</code> and works each batch as you
        add them, resolving markers in real time and replying inline if anything is
        ambiguous. Use this for structural / judgmental feedback; reach for the dialkit
        panel (bottom-right) for live numeric tuning.
      </p>
    </DemoSection>
  )
}

const entry: DemoEntry = {
  lib: "agentation",
  role: "AI feedback",
  docsUrl: "https://www.agentation.com",
  Component: AgentationDemo,
}
export default entry

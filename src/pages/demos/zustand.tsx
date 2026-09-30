import { DemoSection } from "@/components/DemoSection"
import { Button } from "@/components/ui/button"
import { useCounterStore } from "@/store/useCounterStore"
import type { DemoEntry } from "./types"

function ZustandDemo() {
  const count = useCounterStore((s) => s.count)
  const inc = useCounterStore((s) => s.inc)
  const reset = useCounterStore((s) => s.reset)
  return (
    <DemoSection title="Zustand" lib="zustand" docsUrl="https://zustand.docs.pmnd.rs/">
      <p className="text-body text-label-secondary">
        Tiny global store at <code className="font-mono">src/store/useCounterStore.ts</code>.
      </p>
      <div className="flex items-center gap-inline-xs">
        <span className="font-mono text-3xl tabular-nums">{count}</span>
        <Button onClick={inc}>Increment</Button>
        <Button variant="outline" onClick={reset}>Reset</Button>
      </div>
    </DemoSection>
  )
}

const entry: DemoEntry = {
  lib: "Zustand",
  role: "state",
  docsUrl: "https://zustand.docs.pmnd.rs/",
  Component: ZustandDemo,
}
export default entry

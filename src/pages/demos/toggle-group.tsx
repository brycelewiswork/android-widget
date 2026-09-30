import { useState } from "react"
import { IconAlignLeft, IconAlignCenter, IconAlignRight } from "@tabler/icons-react"
import { DemoSection } from "@/components/DemoSection"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { DemoEntry } from "./types"

function ToggleGroupDemo() {
  const [align, setAlign] = useState("left")
  return (
    <DemoSection title="Toggle Group" lib="@/components/ui/toggle-group" docsUrl="https://ui.shadcn.com/docs/components/toggle-group">
      <p className="text-body text-label-secondary">
        Base UI toggle group restyled onto our semantic tokens with a squircled track — a single-select
        segmented control. The <code>/typography</code> REM · PX · PT unit switch is built on it.
      </p>

      <div className="flex flex-wrap items-center gap-inline-s">
        <ToggleGroup
          value={[align]}
          onValueChange={(v) => { const a = v[0]; if (a) setAlign(a) }}
          className="bg-surface-tertiary p-[3px]"
        >
          <ToggleGroupItem value="left" aria-label="Align left"><IconAlignLeft /></ToggleGroupItem>
          <ToggleGroupItem value="center" aria-label="Align center"><IconAlignCenter /></ToggleGroupItem>
          <ToggleGroupItem value="right" aria-label="Align right"><IconAlignRight /></ToggleGroupItem>
        </ToggleGroup>
        <span className="font-mono text-caption text-label-secondary">align: {align}</span>
      </div>
    </DemoSection>
  )
}

const entry: DemoEntry = {
  lib: "Toggle Group",
  role: "segmented control",
  docsUrl: "https://ui.shadcn.com/docs/components/toggle-group",
  Component: ToggleGroupDemo,
}
export default entry

import { useState } from "react"
import { DemoSection } from "@/components/DemoSection"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import type { DemoEntry } from "./types"

const FRUITS: Record<string, string> = {
  apple: "Apple",
  banana: "Banana",
  cherry: "Cherry",
  grape: "Grape",
  peach: "Peach",
}

function SelectDemo() {
  const [value, setValue] = useState<string | null>("apple")
  return (
    <DemoSection title="Select" lib="@/components/ui/select" docsUrl="https://ui.shadcn.com/docs/components/select">
      <p className="text-body text-label-secondary">
        Base UI select restyled onto our semantic tokens, with a squircled native-<code>&lt;button&gt;</code> trigger
        and a portaled, animated popup. The <code>items</code> map resolves the trigger label.
      </p>

      <div className="flex flex-wrap items-center gap-inline-s">
        <Select items={FRUITS} value={value} onValueChange={setValue}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(FRUITS).map(([v, label]) => (
              <SelectItem key={v} value={v}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="font-mono text-caption text-label-secondary">value: {String(value)}</span>
      </div>
    </DemoSection>
  )
}

const entry: DemoEntry = {
  lib: "Select",
  role: "dropdown select",
  docsUrl: "https://ui.shadcn.com/docs/components/select",
  Component: SelectDemo,
}
export default entry

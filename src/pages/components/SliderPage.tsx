import { useState } from "react"
import { Slider } from "@/components/ui/slider"
import {
  DocPage,
  DocHeader,
  DocSection,
  DocCard,
  DocPreview,
  DocExample,
  DocPropsTable,
  DocTokens,
  DocAccessibility,
  DocGuidelines,
  DocSource,
} from "./_template"

export function SliderPage() {
  const [single, setSingle] = useState([40])
  const [range, setRange] = useState([20, 70])
  const [fine, setFine] = useState([0.5])
  const [stepped, setStepped] = useState([50])

  return (
    <DocPage>
      <DocHeader
        name="Slider"
        description="shadcn/ui Slider built on Base UI — single value, range, stepped, and fine-grained control"
      />

      {/* ── Preview ── */}
      <DocSection title="Preview" description="Default single-value slider at 40%">
        <DocPreview className="flex-col gap-stack-m w-full">
          <div className="w-full max-w-sm">
            <Slider value={single} onValueChange={setSingle} />
          </div>
          <span className="font-mono text-sm text-label-secondary tabular-nums">
            value: {single[0]}
          </span>
        </DocPreview>
      </DocSection>

      {/* ── Anatomy ── */}
      <DocSection title="Anatomy" description="Three layers: track, indicator (active fill), and thumb">
        <DocCard className="p-inset-m space-y-stack-m">
          <div className="space-y-stack-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs text-label-secondary">Track</span>
              <span className="font-mono text-[11px] text-label-secondary">bg-fill-tertiary</span>
            </div>
            <div className="h-1.5 rounded-full bg-fill-tertiary" />
          </div>

          <div className="space-y-stack-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs text-label-secondary">Indicator (active fill)</span>
              <span className="font-mono text-[11px] text-label-secondary">bg-blue-500</span>
            </div>
            <div className="h-1.5 rounded-full bg-fill-tertiary overflow-hidden">
              <div className="h-full w-2/5 bg-blue-500 rounded-full" />
            </div>
          </div>

          <div className="space-y-stack-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs text-label-secondary">Thumb</span>
              <span className="font-mono text-[11px] text-label-secondary">bg-blue-500, shadow-xs, ring-blue-500/30</span>
            </div>
            <div className="flex items-center">
              <div className="h-1.5 w-2/5 rounded-full bg-blue-500" />
              <div className="size-4 -ml-2 rounded-full bg-blue-500 shadow-xs ring-2 ring-blue-500/30" />
              <div className="h-1.5 flex-1 -ml-2 rounded-full bg-fill-tertiary" />
            </div>
          </div>
        </DocCard>
      </DocSection>

      {/* ── Examples ── */}
      <DocSection title="Examples" description="Interactive demos showing different configurations">
        <div className="grid grid-cols-2 gap-gutter-m">
          <DocExample title="Single value" value={`${single[0]}`} code={`<Slider value={[${single[0]}]} />`}>
            <Slider min={0} max={100} value={single} onValueChange={setSingle} />
          </DocExample>

          <DocExample title="Range" value={`${range[0]} – ${range[1]}`} code={`<Slider value={[${range[0]}, ${range[1]}]} />`}>
            <Slider min={0} max={100} value={range} onValueChange={setRange} />
          </DocExample>

          <DocExample title="Fine-grained (0.01 step)" value={fine[0].toFixed(2)} code="<Slider min={0} max={1} step={0.01} />">
            <Slider min={0} max={1} step={0.01} value={fine} onValueChange={setFine} />
          </DocExample>

          <DocExample title="Stepped (10s)" value={`${stepped[0]}`} code="<Slider step={10} />">
            <Slider min={0} max={100} step={10} value={stepped} onValueChange={setStepped} />
          </DocExample>
        </div>
      </DocSection>

      {/* ── API ── */}
      <DocSection title="API" description="Props passed to the Base UI Slider.Root primitive">
        <DocPropsTable
          props={[
            { prop: "value", type: "number[]", default: "—", description: "Controlled value. Single element for slider, two for range." },
            { prop: "defaultValue", type: "number[]", default: "[min, max]", description: "Uncontrolled initial value." },
            { prop: "onValueChange", type: "(value: number[]) => void", default: "—", description: "Called on every value change while dragging." },
            { prop: "onValueChangeCommitted", type: "(value: number[]) => void", default: "—", description: "Called when the user finishes dragging." },
            { prop: "min", type: "number", default: "0", description: "Minimum value." },
            { prop: "max", type: "number", default: "100", description: "Maximum value." },
            { prop: "step", type: "number", default: "1", description: "Step increment." },
            { prop: "disabled", type: "boolean", default: "false", description: "Disables interaction. Thumb and track dim to 50% opacity." },
            { prop: "orientation", type: "'horizontal' | 'vertical'", default: "'horizontal'", description: "Slider direction." },
          ]}
        />
      </DocSection>

      {/* ── Tokens ── */}
      <DocSection title="Tokens" description="Design system tokens referenced by this component">
        <DocTokens
          tokens={[
            { swatch: "var(--fill-tertiary)", role: "Track background", utility: "bg-fill-tertiary" },
            { swatch: "var(--color-blue-500)", role: "Active indicator + thumb", utility: "bg-blue-500" },
            { swatch: "var(--color-blue-500)", role: "Focus/hover ring", utility: "ring-blue-500/30" },
            { swatch: "transparent", role: "Thumb elevation", utility: "shadow-xs" },
          ]}
        />
      </DocSection>

      {/* ── Accessibility ── */}
      <DocSection title="Accessibility" description="Keyboard and assistive technology support">
        <DocAccessibility
          items={[
            { interaction: "Arrow Left / Down", behavior: "Decrease value by one step" },
            { interaction: "Arrow Right / Up", behavior: "Increase value by one step" },
            { interaction: "Home", behavior: "Set to minimum value" },
            { interaction: "End", behavior: "Set to maximum value" },
            { interaction: "Page Down", behavior: "Decrease by a larger step (10× step)" },
            { interaction: "Page Up", behavior: "Increase by a larger step (10× step)" },
            { interaction: "Tab", behavior: "Move focus to the thumb (or between thumbs in range mode)" },
            { interaction: "role", behavior: "slider (set automatically by Base UI)" },
            { interaction: "aria-valuemin/max/now", behavior: "Set automatically from min, max, and current value" },
          ]}
        />
      </DocSection>

      {/* ── Guidelines ── */}
      <DocSection title="Guidelines" description="When and how to use this component">
        <DocGuidelines
          items={[
            { type: "do", text: "Use for continuous numeric values where the user benefits from seeing their position within a range (volume, brightness, price filters)." },
            { type: "do", text: "Provide a visible numeric readout next to the slider so the exact value is always clear." },
            { type: "dont", text: "Don't use for binary choices (on/off) — use a Switch instead." },
            { type: "dont", text: "Don't use when precise input matters more than speed — use a number Input for exact values like currency." },
            { type: "do", text: "Use range mode (two thumbs) for filtering between a min and max (price range, date range)." },
            { type: "dont", text: "Don't set step to very small values (0.001) without good reason — it makes the slider feel unresponsive on small tracks." },
          ]}
        />
      </DocSection>

      {/* ── Source ── */}
      <DocSection title="Source" description="Component file and installation">
        <DocSource
          source={{
            file: "src/components/ui/slider.tsx",
            install: "npx shadcn@latest add slider",
            primitive: "@base-ui/react/slider",
            import: 'import { Slider } from "@/components/ui/slider"',
          }}
        />
      </DocSection>
    </DocPage>
  )
}

import { useState } from "react"
import {
  IconAlignCenter,
  IconAlignLeft,
  IconAlignRight,
  IconBolt,
  IconFile,
  IconItalic,
  IconSearch,
  IconSettings,
} from "@tabler/icons-react"
import { useDialKit, gradientToCss } from "@/components/dialkit"
import { fontStyle } from "@/components/dialkit/components/FontPickerControl"
import { paletteHex } from "@/components/dialkit/components/PaletteControl"
import { PageShell, PageHeader, Section } from "@/components/PageLayout"
import { SQUIRCLE_RADIUS } from "@/components/squircle"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Toggle } from "@/components/ui/toggle"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command"

/**
 * Inputs & Controls — the two families of "let someone change a value", side by
 * side, because the choice between them is the thing people get wrong.
 *
 * Interface inputs ship *inside* the sketch; they are part of the thing being
 * designed. Dialkit controls float *over* it and exist only to tune it — they
 * never ship. The dialkit half doubles as the control catalog: the panel is
 * wired with every control type, so restyling `controlStyles.ts` can be checked
 * against the whole set at once.
 */

const QUALITIES = { low: "Low", med: "Medium", high: "High" }

export function Inputs() {
  return (
    <PageShell className="space-y-0! flex flex-col gap-stack-l">
      <PageHeader
        title="Inputs & Controls"
        description="Two families that look alike and are not. Interface inputs are part of the sketch — they ship. Dialkit controls float over it to tune it — they never do."
      />

      <Section
        title="Choosing between them"
        description="If in doubt: would a user of the finished thing touch it?"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stroke-faint text-left">
                <th className="pb-2 pr-inset-s font-medium text-label">You want</th>
                <th className="pb-2 pr-inset-s font-medium text-label">Reach for</th>
                <th className="pb-2 font-medium text-label">Why</th>
              </tr>
            </thead>
            <tbody className="text-label-secondary">
              {[
                ["A choice the end user makes", "Select · ToggleGroup · Tabs", "It's part of the design. It ships."],
                ["A value you're still deciding on", "Dialkit", "Tune live, then bake the settled number into a token."],
                ["One binary, inline", "Toggle", "A pressed state on a single control reads faster than a 2-item group."],
                ["One of 2–5 visible options", "ToggleGroup", "Segmented; all options stay legible at a glance."],
                ["One of many options", "Select", "Collapses to a trigger; the list is only there when needed."],
                ["Switching between panes of content", "Tabs", "The options label content, not a value."],
                ["Search across many actions", "Command", "Filterable; pairs with a ⌘K dialog."],
                ["A number in a range", "Slider", "Documented in full on /components/slider."],
              ].map(([want, reach, why]) => (
                <tr key={want} className="border-b border-stroke-faint/60 last:border-0">
                  <td className="py-2 pr-inset-s align-top">{want}</td>
                  <td className="py-2 pr-inset-s align-top font-mono text-[11px] text-label">{reach}</td>
                  <td className="py-2 align-top">{why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── Interface inputs ─────────────────────────────────────────────── */}

      <SelectDemo />
      <ToggleDemo />
      <TabsDemo />
      <CommandDemo />
      <SliderDemo />

      {/* ── Tuning controls ──────────────────────────────────────────────── */}

      <DialkitCatalog />
    </PageShell>
  )
}

// ─── Interface inputs ────────────────────────────────────────────────────────

function SelectDemo() {
  const [value, setValue] = useState("med")

  return (
    <Section
      title="Select"
      description="One of many. Base UI under the hood; the trigger is squircled and its border is an inset-ring so the clip-path doesn't eat it."
    >
      <Row>
        <Select items={QUALITIES} value={value} onValueChange={(v) => setValue(v as string)}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(QUALITIES).map(([v, label]) => (
              <SelectItem key={v} value={v}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select items={QUALITIES} defaultValue="low">
          <SelectTrigger size="sm" className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(QUALITIES).map(([v, label]) => (
              <SelectItem key={v} value={v}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Readout>value: {value}</Readout>
      </Row>

      <Note>
        Pass <Code>items</Code> on the root so the trigger can render a label for the current value.
        <Code>size</Code> is <Code>"default"</Code> (h-8) or <Code>"sm"</Code> (h-7).
      </Note>

      <Snippet>{`<Select items={QUALITIES} value={value} onValueChange={setValue}>
  <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
  <SelectContent>
    <SelectItem value="low">Low</SelectItem>
  </SelectContent>
</Select>`}</Snippet>
    </Section>
  )
}

function ToggleDemo() {
  const [align, setAlign] = useState("left")
  const [italic, setItalic] = useState(false)

  return (
    <Section
      title="Toggle & ToggleGroup"
      description="A pressed state, alone or segmented. Both take variant (default / outline) and size (sm / default / lg)."
    >
      <Row>
        <Toggle pressed={italic} onPressedChange={setItalic} aria-label="Italic">
          <IconItalic size={16} stroke={2} />
        </Toggle>
        <Toggle variant="outline" size="sm">Outline · sm</Toggle>

        <ToggleGroup
          value={[align]}
          onValueChange={(v) => { const a = v[0]; if (a) setAlign(a) }}
          className="bg-surface-tertiary p-[3px]"
        >
          <ToggleGroupItem value="left" aria-label="Align left"><IconAlignLeft size={16} stroke={2} /></ToggleGroupItem>
          <ToggleGroupItem value="center" aria-label="Align center"><IconAlignCenter size={16} stroke={2} /></ToggleGroupItem>
          <ToggleGroupItem value="right" aria-label="Align right"><IconAlignRight size={16} stroke={2} /></ToggleGroupItem>
        </ToggleGroup>

        <Readout>align: {align} · italic: {String(italic)}</Readout>
      </Row>

      <Note>
        ToggleGroup's value is an <strong className="text-label">array</strong>, even single-select — read
        <Code>v[0]</Code> and guard it, since deselecting yields an empty array. Icon-only toggles need an
        <Code>aria-label</Code>.
      </Note>

      <Snippet>{`<ToggleGroup
  value={[align]}
  onValueChange={(v) => { const a = v[0]; if (a) setAlign(a) }}
  className="bg-surface-tertiary p-[3px]"
>
  <ToggleGroupItem value="left" aria-label="Align left">…</ToggleGroupItem>
</ToggleGroup>`}</Snippet>
    </Section>
  )
}

function TabsDemo() {
  return (
    <Section
      title="Tabs"
      description="Switches panes of content, not a value. Two looks: the default segmented pill, and line."
    >
      <div className="flex flex-wrap gap-gutter-m">
        <Tabs defaultValue="preview">
          <TabsList>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="code">Code</TabsTrigger>
            <TabsTrigger value="tokens">Tokens</TabsTrigger>
          </TabsList>
          <TabsContent value="preview" className="text-sm text-label-secondary">The rendered thing.</TabsContent>
          <TabsContent value="code" className="text-sm text-label-secondary">Its source.</TabsContent>
          <TabsContent value="tokens" className="text-sm text-label-secondary">The tokens it consumes.</TabsContent>
        </Tabs>

        <Tabs defaultValue="a">
          <TabsList variant="line">
            <TabsTrigger value="a">Line</TabsTrigger>
            <TabsTrigger value="b">Variant</TabsTrigger>
          </TabsList>
          <TabsContent value="a" className="text-sm text-label-secondary">Underline, no track.</TabsContent>
          <TabsContent value="b" className="text-sm text-label-secondary">Better inside a card.</TabsContent>
        </Tabs>
      </div>

      <Note>
        Root takes <Code>orientation</Code> (<Code>"horizontal"</Code> default, or <Code>"vertical"</Code>).
        If the choice changes a <em>value</em> rather than the visible pane, use ToggleGroup instead.
      </Note>

      <Snippet>{`<Tabs defaultValue="preview">
  <TabsList variant="line">
    <TabsTrigger value="preview">Preview</TabsTrigger>
  </TabsList>
  <TabsContent value="preview">…</TabsContent>
</Tabs>`}</Snippet>
    </Section>
  )
}

function CommandDemo() {
  return (
    <Section
      title="Command"
      description="Filterable action list, built on cmdk. Inline here; wrap it in a Dialog for a ⌘K palette."
    >
      <Command className="max-w-sm inset-ring-1 inset-ring-stroke-faint">
        <CommandInput placeholder="Type to filter…" />
        <CommandList>
          <CommandEmpty>Nothing matches.</CommandEmpty>
          <CommandGroup heading="Pages">
            <CommandItem><IconFile size={15} stroke={2} /> Colors <CommandShortcut>⌘1</CommandShortcut></CommandItem>
            <CommandItem><IconSearch size={15} stroke={2} /> Icons <CommandShortcut>⌘2</CommandShortcut></CommandItem>
          </CommandGroup>
          <CommandGroup heading="Actions">
            <CommandItem><IconBolt size={15} stroke={2} /> Regenerate ramp</CommandItem>
            <CommandItem><IconSettings size={15} stroke={2} /> Open settings</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>

      <Note>
        Filtering is built in — <Code>CommandInput</Code> matches against each item's text content.
        Always give <Code>CommandEmpty</Code> real copy; it's the state people hit most while typing.
      </Note>
    </Section>
  )
}

function SliderDemo() {
  const [v, setV] = useState([40])

  return (
    <Section
      title="Slider"
      description="A number in a range. Documented in full on /components/slider — here only for comparison against the dialkit slider below."
    >
      <Row>
        <Slider min={0} max={100} step={1} value={v} onValueChange={setV} className="w-64" />
        <Readout>{v[0]}</Readout>
      </Row>
      <Note>
        <Code>value</Code> and <Code>onValueChange</Code> are arrays — a range slider is the same
        component with two entries.
      </Note>
    </Section>
  )
}

// ─── Tuning controls ─────────────────────────────────────────────────────────

/** Every control type in `DialStore`'s union, and the value shape each one fits. */
const CONTROL_CATALOG: Array<[string, string, string]> = [
  ["slider", "number in a range", "Tuple shorthand [default, min, max], or the object form to add step / help."],
  ["toggle", "boolean", "Bare `true` / `false` is the shorthand."],
  ["select", "one of a finite named set", "Options as { value, label } pairs."],
  ["text", "short string", "Labels, tokens, captions."],
  ["color", "one color", "Opacity lives in the hex (#RRGGBBAA) and shows as a split chip."],
  ["spring", "spring physics", "Stiffness / damping, with a live curve."],
  ["transition", "duration + easing", "Cubic-bezier handles, with a live curve."],
  ["vector", "2D direction or offset", "X/Y pad, normalized to [-1, 1]."],
  ["gradient", "a fill", "Type, angle, draggable stops → gradientToCss(value)."],
  ["rangeInput", "a bounded pair", "Two typed fields, lower and upper."],
  ["colorCollection", "several colors at once", "An editable hex bank."],
  ["palette", "a design-system color", "Family + shade → paletteHex(value). Prefer over `color` for token-bound values."],
  ["fontPicker", "a whole text style", "Family, weight, size, case, color → fontStyle(value)."],
  ["curves", "a tone response", "RGB / R / G / B curve editor → sampleCurve(pts, x)."],
  ["imagePicker", "reference imagery", "Upload-thumbnail grid."],
  ["action", "a command, not a value", "Fires onAction rather than holding state."],
]

function DialkitCatalog() {
  const v = useDialKit(
    "All Controls",
    {
      primitives: {
        _help: "The simple single-line controls",
        opacity: [50, 0, 100] as [number, number, number],
        steps: { type: "slider", default: 4, min: 0, max: 10, step: 2, help: "Stepped 0–10 by 2" },
        enabled: true,
        mono: { type: "toggle", default: false, help: "Object form → carries help" },
        quality: {
          type: "select",
          options: [
            { value: "low", label: "Low" },
            { value: "med", label: "Medium" },
            { value: "high", label: "High" },
          ],
          default: "med",
          help: "A finite named choice",
        },
        caption: { type: "text", default: "Hello", placeholder: "Type a label…", help: "Short name / token" },
        tint: { type: "color", default: "#7C3AEDCC", help: "Opacity lives in the hex (#RRGGBBAA) → split chip" },
      },
      motion: {
        _help: "Spring & easing editors",
        spring: { type: "spring", stiffness: 200, damping: 18 },
        ease: { type: "easing", duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
      },
      direction: { type: "vector", default: { x: 0.3, y: -0.4 }, help: "Authored X/Y, normalized [-1,1]" },
      fill: {
        type: "gradient",
        help: "The 40% middle stop shows the split chip",
        default: {
          gradientType: "linear",
          angle: 90,
          stops: [
            { id: "a", pos: 0, color: "#FF0080", opacity: 100 },
            { id: "b", pos: 50, color: "#7C3AED", opacity: 40 },
            { id: "c", pos: 100, color: "#00E0FF", opacity: 100 },
          ],
        },
      },
      range: { type: "rangeInput", default: { start: 0.5, end: 8 }, help: "Typed lower/upper bound" },
      swatches: { type: "colorCollection", default: ["#FF0080", "#7C3AED", "#00E0FF80", "#00FF88"] },
      token: { type: "palette", default: { family: 3, shade: 5 }, help: "Family (hue) + shade" },
      heading: {
        type: "fontPicker",
        default: { fontId: "dm-sans", fontWeight: 500, fontSize: 22, textCase: "none", color: "#00E0FF", opacity: 70 },
        help: "Whole text style; 70% opacity → split chip",
      },
      grade: {
        type: "curves",
        default: {
          variant: "rgb",
          rgb: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
          r: [{ x: 0, y: 0 }, { x: 0.4, y: 0.62 }, { x: 1, y: 1 }],
          g: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
          b: [{ x: 0, y: 0 }, { x: 0.6, y: 0.38 }, { x: 1, y: 1 }],
        },
        help: "Tone / color-grade curves (RGB tabs)",
      },
      images: { type: "imagePicker", default: [] as string[] },
      apply: { type: "action", label: "Apply", variant: "primary" },
      randomize: { type: "action", label: "Run action ↩" },
    },
    { onAction: (a) => console.log("dialkit action:", a) },
  )

  return (
    <Section
      title="Dialkit — the tuning panel"
      description="Floats top-right, wired here with every control type. Pick the control by the shape of the value, not by the widget you had in mind. Nothing here ships — bake settled values into tokens."
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stroke-faint text-left">
              <th className="pb-2 pr-inset-s font-medium text-label">Type</th>
              <th className="pb-2 pr-inset-s font-medium text-label">For</th>
              <th className="pb-2 font-medium text-label">Notes</th>
            </tr>
          </thead>
          <tbody className="text-label-secondary">
            {CONTROL_CATALOG.map(([type, forWhat, notes]) => (
              <tr key={type} className="border-b border-stroke-faint/60 last:border-0">
                <td className="py-2 pr-inset-s align-top font-mono text-[11px] text-label whitespace-nowrap">{type}</td>
                <td className="py-2 pr-inset-s align-top">{forWhat}</td>
                <td className="py-2 align-top">{notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Note>
        Nest controls in an object to get a titled, collapsible folder with its own reset.
        Shorthands cover the common cases (<Code>[50, 0, 100]</Code> for a slider, bare <Code>true</Code> for
        a toggle); switch to the object form when you want <Code>help</Code> or <Code>step</Code>.
      </Note>

      {/* Live previews — confirm the resolved values, and that a restyle didn't break a control. */}
      <div className="grid grid-cols-2 gap-gutter-s sm:grid-cols-4">
        <Preview label="fill (gradient)">
          <div className="h-24 w-full" style={{ borderRadius: SQUIRCLE_RADIUS.lg, background: gradientToCss(v.fill) }} />
        </Preview>
        <Preview label="tint (color)">
          <div className="h-24 w-full" style={{ borderRadius: SQUIRCLE_RADIUS.lg, background: v.primitives.tint }} />
        </Preview>
        <Preview label="token (palette)">
          <div className="flex h-24 items-center justify-center" style={{ borderRadius: SQUIRCLE_RADIUS.lg, background: paletteHex(v.token) }}>
            <span className="font-mono text-xs text-white/90">{paletteHex(v.token)}</span>
          </div>
        </Preview>
        <Preview label="heading (fontPicker)">
          <div className="flex h-24 items-center justify-center bg-surface-tertiary" style={{ borderRadius: SQUIRCLE_RADIUS.lg }}>
            <span style={fontStyle(v.heading)}>{v.primitives.caption || "Aa"}</span>
          </div>
        </Preview>
      </div>

      <details className="group">
        <summary className="cursor-pointer font-mono text-[11px] text-label-tertiary hover:text-label-secondary">
          Resolved values — should never show a raw config object
        </summary>
        <pre className="mt-stack-2xs overflow-auto rounded-lg bg-surface-tertiary p-inset-s text-caption leading-relaxed text-label-secondary">
          {JSON.stringify(v, null, 2)}
        </pre>
      </details>
    </Section>
  )
}

// ─── Local presentation helpers ──────────────────────────────────────────────

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-gutter-s">{children}</div>
}

function Readout({ children }: { children: React.ReactNode }) {
  return <span className="font-mono text-[11px] text-label-tertiary">{children}</span>
}

function Note({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-label-secondary">{children}</p>
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="mx-0.5 rounded bg-fill-quaternary px-1 py-px font-mono text-[11px] text-label">
      {children}
    </code>
  )
}

function Snippet({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg bg-surface-tertiary p-inset-s font-mono text-[11px] leading-relaxed text-label-secondary">
      {children}
    </pre>
  )
}

function Preview({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 font-mono text-caption text-label-tertiary">{label}</div>
      {children}
    </div>
  )
}

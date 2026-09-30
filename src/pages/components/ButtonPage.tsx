import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  IconPlus,
  IconSettings,
  IconTrash,
  IconDownload,
  IconChevronRight,
  IconLoader2,
} from "@tabler/icons-react"
import {
  DocPage,
  DocHeader,
  DocSection,
  DocPreview,
  DocExample,
  DocPropsTable,
  DocTokens,
  DocAccessibility,
  DocGuidelines,
  DocSource,
} from "./_template"

export function ButtonPage() {
  const [clickCount, setClickCount] = useState(0)
  const [loading, setLoading] = useState(false)

  function handleLoadingClick() {
    setLoading(true)
    setTimeout(() => setLoading(false), 1500)
  }

  return (
    <DocPage>
      <DocHeader
        name="Button"
        description="shadcn/ui Button built on Base UI — supports multiple variants, sizes, icons, and loading states"
      />

      {/* ── Preview ── */}
      <DocSection title="Preview" description="Primary buttons in a row — the most common configuration">
        <DocPreview>
          <div className="flex items-center gap-inline-xs">
            <Button onClick={() => setClickCount((c) => c + 1)}>
              Click me
            </Button>
            <Button>
              <IconPlus data-icon="inline-start" />
              Create new
            </Button>
            <Button>
              Continue
              <IconChevronRight data-icon="inline-end" />
            </Button>
            <Button size="icon" aria-label="Settings">
              <IconSettings />
            </Button>
          </div>
          {clickCount > 0 && (
            <p className="mt-stack-s font-mono text-sm text-label-secondary tabular-nums">
              clicked {clickCount} {clickCount === 1 ? "time" : "times"}
            </p>
          )}
        </DocPreview>
      </DocSection>

      {/* ── Examples ── */}
      <DocSection title="Examples" description="All variants and sizes, interactive">
        {/* -- Variants -- */}
        <h3 className="text-xs font-medium text-label-secondary uppercase tracking-wider">
          Variants
        </h3>
        <div className="grid grid-cols-2 gap-gutter-m">
          <DocExample
            title="Default (primary)"
            value="variant=default"
            code='<Button>Save changes</Button>'
          >
            <div className="flex items-center gap-inline-2xs">
              <Button>Save changes</Button>
            </div>
          </DocExample>

          <DocExample
            title="Secondary"
            value="variant=secondary"
            code='<Button variant="secondary">Cancel</Button>'
          >
            <div className="flex items-center gap-inline-2xs">
              <Button variant="secondary">Cancel</Button>
            </div>
          </DocExample>

          <DocExample
            title="Outline"
            value="variant=outline"
            code='<Button variant="outline">Export</Button>'
          >
            <div className="flex items-center gap-inline-2xs">
              <Button variant="outline">
                <IconDownload data-icon="inline-start" />
                Export
              </Button>
            </div>
          </DocExample>

          <DocExample
            title="Ghost"
            value="variant=ghost"
            code='<Button variant="ghost">More info</Button>'
          >
            <div className="flex items-center gap-inline-2xs">
              <Button variant="ghost">More info</Button>
            </div>
          </DocExample>

          <DocExample
            title="Destructive"
            value="variant=destructive"
            code='<Button variant="destructive">Delete</Button>'
          >
            <div className="flex items-center gap-inline-2xs">
              <Button variant="destructive">
                <IconTrash data-icon="inline-start" />
                Delete
              </Button>
            </div>
          </DocExample>

          <DocExample
            title="Link"
            value="variant=link"
            code='<Button variant="link">Learn more</Button>'
          >
            <div className="flex items-center gap-inline-2xs">
              <Button variant="link">Learn more</Button>
            </div>
          </DocExample>
        </div>

        {/* -- Sizes -- */}
        <h3 className="mt-stack-l text-xs font-medium text-label-secondary uppercase tracking-wider">
          Sizes
        </h3>
        <div className="grid grid-cols-2 gap-gutter-m">
          <DocExample
            title="Extra small"
            value="size=xs"
            code='<Button size="xs">Tiny</Button>'
          >
            <div className="flex items-center gap-inline-2xs">
              <Button size="xs">Tiny</Button>
              <Button size="xs" variant="outline">Tiny outline</Button>
            </div>
          </DocExample>

          <DocExample
            title="Small"
            value="size=sm"
            code='<Button size="sm">Small</Button>'
          >
            <div className="flex items-center gap-inline-2xs">
              <Button size="sm">Small</Button>
              <Button size="sm" variant="outline">Small outline</Button>
            </div>
          </DocExample>

          <DocExample
            title="Default"
            value="size=default"
            code="<Button>Default</Button>"
          >
            <div className="flex items-center gap-inline-2xs">
              <Button>Default</Button>
              <Button variant="outline">Default outline</Button>
            </div>
          </DocExample>

          <DocExample
            title="Large"
            value="size=lg"
            code='<Button size="lg">Large</Button>'
          >
            <div className="flex items-center gap-inline-2xs">
              <Button size="lg">Large</Button>
              <Button size="lg" variant="outline">Large outline</Button>
            </div>
          </DocExample>

          <DocExample
            title="Icon buttons"
            value="size=icon"
            code='<Button size="icon"><IconSettings /></Button>'
          >
            <div className="flex items-center gap-inline-xs">
              <Button size="icon-xs" aria-label="Add"><IconPlus /></Button>
              <Button size="icon-sm" aria-label="Add"><IconPlus /></Button>
              <Button size="icon" aria-label="Settings"><IconSettings /></Button>
              <Button size="icon-lg" aria-label="Settings"><IconSettings /></Button>
            </div>
          </DocExample>

          <DocExample
            title="Icon (ghost)"
            value="size=icon, variant=ghost"
            code='<Button size="icon" variant="ghost">...</Button>'
          >
            <div className="flex items-center gap-inline-xs">
              <Button size="icon-xs" variant="ghost" aria-label="Add"><IconPlus /></Button>
              <Button size="icon-sm" variant="ghost" aria-label="Add"><IconPlus /></Button>
              <Button size="icon" variant="ghost" aria-label="Settings"><IconSettings /></Button>
              <Button size="icon-lg" variant="ghost" aria-label="Settings"><IconSettings /></Button>
            </div>
          </DocExample>
        </div>

        {/* -- States -- */}
        <h3 className="mt-stack-l text-xs font-medium text-label-secondary uppercase tracking-wider">
          States
        </h3>
        <div className="grid grid-cols-2 gap-gutter-m">
          <DocExample
            title="Disabled"
            value="disabled=true"
            code="<Button disabled>Can't touch this</Button>"
          >
            <div className="flex items-center gap-inline-2xs">
              <Button disabled>Disabled</Button>
              <Button variant="outline" disabled>Disabled</Button>
              <Button variant="ghost" disabled>Disabled</Button>
            </div>
          </DocExample>

          <DocExample
            title="Loading"
            value="spinner + disabled"
            code='<Button disabled><IconLoader2 className="animate-spin" /> Saving</Button>'
          >
            <div className="flex items-center gap-inline-2xs">
              <Button disabled={loading} onClick={handleLoadingClick}>
                {loading ? (
                  <>
                    <IconLoader2 className="animate-spin" data-icon="inline-start" />
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </Button>
              <span className="text-xs text-label-secondary">
                {loading ? "loading..." : "click to trigger"}
              </span>
            </div>
          </DocExample>
        </div>
      </DocSection>

      {/* ── API ── */}
      <DocSection title="API" description="Props passed to the Base UI Button primitive">
        <DocPropsTable
          props={[
            {
              prop: "variant",
              type: '"default" | "secondary" | "outline" | "ghost" | "destructive" | "link"',
              default: '"default"',
              description: "Visual style of the button.",
            },
            {
              prop: "size",
              type: '"default" | "xs" | "sm" | "lg" | "icon" | "icon-xs" | "icon-sm" | "icon-lg"',
              default: '"default"',
              description: "Controls height, padding, and font size.",
            },
            {
              prop: "disabled",
              type: "boolean",
              default: "false",
              description: "Prevents interaction. Reduces opacity to 50%.",
            },
            {
              prop: "asChild",
              type: "boolean",
              default: "false",
              description: "Merges props onto the child element instead of rendering a <button>.",
            },
            {
              prop: "shadow",
              type: "boolean | SquircleShadowKey | string",
              default: "undefined",
              description: "Adds a squircle-compatible drop shadow. Pass true for \"md\", a preset key, or a custom filter string.",
            },
            {
              prop: "onClick",
              type: "() => void",
              default: "—",
              description: "Click handler.",
            },
            {
              prop: "children",
              type: "React.ReactNode",
              default: "—",
              description: "Button content — text, icons, or both.",
            },
          ]}
        />
      </DocSection>

      {/* ── Tokens ── */}
      <DocSection title="Tokens" description="Design system tokens referenced by this component">
        <DocTokens
          tokens={[
            { swatch: "var(--primary)", role: "Default variant background", utility: "bg-primary" },
            { swatch: "var(--primary-foreground)", role: "Default variant text", utility: "text-primary-foreground" },
            { swatch: "var(--surface-tertiary)", role: "Secondary / hover background", utility: "bg-surface-tertiary" },
            { swatch: "var(--label)", role: "Secondary / ghost text", utility: "text-label" },
            { swatch: "var(--stroke-faint)", role: "Outline border (light mode)", utility: "inset-ring-stroke-faint" },
            { swatch: "var(--stroke-strong)", role: "Outline border (dark mode)", utility: "inset-ring-stroke-strong" },
            { swatch: "var(--fill-primary)", role: "Focus ring color", utility: "ring-ring/50" },
            { swatch: "var(--destructive)", role: "Destructive variant accent", utility: "bg-destructive/10" },
          ]}
        />
      </DocSection>

      {/* ── Accessibility ── */}
      <DocSection title="Accessibility" description="Keyboard and assistive technology support">
        <DocAccessibility
          items={[
            { interaction: "Enter", behavior: "Activates the button" },
            { interaction: "Space", behavior: "Activates the button" },
            { interaction: "Tab", behavior: "Moves focus to the next focusable element" },
            { interaction: "Shift + Tab", behavior: "Moves focus to the previous focusable element" },
            { interaction: "role", behavior: "button (native <button> element, set automatically)" },
            { interaction: "aria-disabled", behavior: "Set automatically when disabled prop is true" },
            { interaction: "aria-label", behavior: "Required on icon-only buttons for screen reader context" },
          ]}
        />
      </DocSection>

      {/* ── Guidelines ── */}
      <DocSection title="Guidelines" description="When and how to use this component">
        <DocGuidelines
          items={[
            { type: "do", text: "Use the primary (default) variant for the single most important action on the page — the main CTA." },
            { type: "dont", text: "Don't use multiple primary buttons in the same section. Demote secondary actions to outline or ghost." },
            { type: "do", text: "Use ghost buttons for toolbar actions, inline controls, and navigation items where the container provides context." },
            { type: "dont", text: "Don't use ghost buttons for standalone actions — they lack enough affordance outside a toolbar or group." },
            { type: "do", text: "Use the destructive variant for irreversible actions like delete or remove. Pair with a confirmation dialog." },
            { type: "dont", text: "Don't disable buttons without explanation. Show a tooltip or helper text indicating why the action is unavailable." },
            { type: "do", text: "Add aria-label to icon-only buttons so screen readers announce the action." },
            { type: "dont", text: "Don't mix button sizes within the same button group or toolbar. Keep sizes consistent." },
          ]}
        />
      </DocSection>

      {/* ── Source ── */}
      <DocSection title="Source" description="Component file and installation">
        <DocSource
          source={{
            file: "src/components/ui/button.tsx",
            install: "npx shadcn@latest add button",
            primitive: "@base-ui/react/button",
            import: 'import { Button } from "@/components/ui/button"',
          }}
        />
      </DocSection>
    </DocPage>
  )
}

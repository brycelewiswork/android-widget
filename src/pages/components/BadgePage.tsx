import { IconStar, IconCheck, IconBolt } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
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

export function BadgePage() {
  return (
    <DocPage>
      <DocHeader
        name="Badge"
        description="Small labeling component for status indicators, categories, and counts"
      />

      {/* ── Preview ── */}
      <DocSection title="Preview" description="Row of badges in each variant">
        <DocPreview className="gap-inline-xs">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="ghost">Ghost</Badge>
        </DocPreview>
      </DocSection>

      {/* ── Examples ── */}
      <DocSection title="Examples" description="Interactive demos showing different configurations">
        <div className="grid grid-cols-2 gap-gutter-m">
          <DocExample title="Default" value="variant=default" code='<Badge>Default</Badge>'>
            <div className="flex gap-inline-2xs">
              <Badge>Active</Badge>
              <Badge>New</Badge>
            </div>
          </DocExample>

          <DocExample title="Secondary" value="variant=secondary" code='<Badge variant="secondary">Secondary</Badge>'>
            <div className="flex gap-inline-2xs">
              <Badge variant="secondary">Category</Badge>
              <Badge variant="secondary">Tag</Badge>
            </div>
          </DocExample>

          <DocExample title="Outline" value="variant=outline" code='<Badge variant="outline">Outline</Badge>'>
            <div className="flex gap-inline-2xs">
              <Badge variant="outline">Draft</Badge>
              <Badge variant="outline">Pending</Badge>
            </div>
          </DocExample>

          <DocExample title="Ghost" value="variant=ghost" code='<Badge variant="ghost">Ghost</Badge>'>
            <div className="flex gap-inline-2xs">
              <Badge variant="ghost">Subtle</Badge>
              <Badge variant="ghost">Muted</Badge>
            </div>
          </DocExample>

          <DocExample title="With icon (start)" code='<Badge><IconStar data-icon="inline-start" /> Featured</Badge>'>
            <div className="flex gap-inline-2xs">
              <Badge><IconStar data-icon="inline-start" /> Featured</Badge>
              <Badge variant="secondary"><IconCheck data-icon="inline-start" /> Done</Badge>
            </div>
          </DocExample>

          <DocExample title="With icon (end)" code='<Badge>Pro <IconBolt data-icon="inline-end" /></Badge>'>
            <div className="flex gap-inline-2xs">
              <Badge>Pro <IconBolt data-icon="inline-end" /></Badge>
              <Badge variant="outline">Boost <IconBolt data-icon="inline-end" /></Badge>
            </div>
          </DocExample>
        </div>
      </DocSection>

      {/* ── API ── */}
      <DocSection title="API" description="Props passed to the Badge component">
        <DocPropsTable
          props={[
            { prop: "variant", type: '"default" | "secondary" | "outline" | "ghost" | "destructive" | "link"', default: '"default"', description: "Visual style variant." },
            { prop: "children", type: "React.ReactNode", default: "—", description: "Badge content — text, icons, or both." },
            { prop: "className", type: "string", default: "—", description: "Additional CSS classes merged onto the root element." },
            { prop: "render", type: "useRender.RenderProp<'span'>", default: "—", description: "Base UI render prop to swap the underlying element (e.g., render as <a>)." },
          ]}
        />
      </DocSection>

      {/* ── Tokens ── */}
      <DocSection title="Tokens" description="Design system tokens referenced by this component">
        <DocTokens
          tokens={[
            { swatch: "var(--primary)", role: "Default variant background", utility: "bg-primary" },
            { swatch: "var(--primary-foreground)", role: "Default variant text", utility: "text-primary-foreground" },
            { swatch: "var(--surface-tertiary)", role: "Secondary variant background", utility: "bg-surface-tertiary" },
            { swatch: "var(--label)", role: "Secondary / outline text", utility: "text-label" },
            { swatch: "var(--stroke-faint)", role: "Outline variant border", utility: "border-stroke-faint" },
          ]}
        />
      </DocSection>

      {/* ── Accessibility ── */}
      <DocSection title="Accessibility" description="Assistive technology support">
        <DocAccessibility
          items={[
            { interaction: "Non-interactive", behavior: "Badges render as <span> by default and are not focusable or clickable." },
            { interaction: "Link badge", behavior: "When rendered as <a> via the render prop, badges gain hover states and are keyboard-focusable." },
            { interaction: "Focus ring", behavior: "focus-visible shows a ring via border-ring + ring-ring/50 tokens." },
            { interaction: "aria-invalid", behavior: "When set, badge switches to destructive border and ring styling." },
          ]}
        />
      </DocSection>

      {/* ── Guidelines ── */}
      <DocSection title="Guidelines" description="When and how to use this component">
        <DocGuidelines
          items={[
            { type: "do", text: "Use badges for status indicators (Active, Draft, Archived), categories (Design, Engineering), and counts (3 new)." },
            { type: "do", text: "Keep badge text short — one or two words. Use icons to add meaning without extra text." },
            { type: "dont", text: "Don't use badges as buttons. If the user needs to click it to perform an action, use a Button instead." },
            { type: "dont", text: "Don't stack more than 3-4 badges in a row — it creates visual noise. Group or truncate if needed." },
            { type: "do", text: "Use the outline variant for low-emphasis metadata and the default variant for high-priority status." },
            { type: "dont", text: "Don't mix badge variants inconsistently in the same context — pick one variant per semantic group." },
          ]}
        />
      </DocSection>

      {/* ── Source ── */}
      <DocSection title="Source" description="Component file and installation">
        <DocSource
          source={{
            file: "src/components/ui/badge.tsx",
            install: "npx shadcn@latest add badge",
            primitive: "@base-ui/react/use-render + merge-props",
            import: 'import { Badge } from "@/components/ui/badge"',
          }}
        />
      </DocSection>
    </DocPage>
  )
}

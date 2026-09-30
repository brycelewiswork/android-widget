import { IconDotsVertical } from "@tabler/icons-react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardAction,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DocPage,
  DocHeader,
  DocSection,
  DocPreview,
  DocExample,
  DocPropsTable,
  DocTokens,
  DocGuidelines,
  DocSource,
} from "./_template"

export function CardPage() {
  return (
    <DocPage>
      <DocHeader
        name="Card"
        description="Squircled container for grouping related content with optional header, footer, action, and shadow elevation"
      />

      {/* ── Preview ── */}
      <DocSection title="Preview" description="Card with header, content, and footer">
        <DocPreview>
          <Card className="w-full max-w-sm" shadow="md">
            <CardHeader>
              <CardTitle>Project Alpha</CardTitle>
              <CardDescription>A brief description of this project and its current status.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-body text-label-secondary">
                This card demonstrates the default configuration with header, content, and footer sections working together.
              </p>
            </CardContent>
            <CardFooter className="justify-between">
              <span className="text-xs text-label-secondary">Updated 2 hours ago</span>
              <Badge variant="secondary">Active</Badge>
            </CardFooter>
          </Card>
        </DocPreview>
      </DocSection>

      {/* ── Examples ── */}
      <DocSection title="Examples" description="Interactive demos showing different configurations">
        <div className="grid grid-cols-2 gap-gutter-m">
          <DocExample title="Default size" value='size="default"' code='<Card>…</Card>'>
            <Card>
              <CardHeader>
                <CardTitle>Default</CardTitle>
                <CardDescription>Standard padding and gap</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-body text-label-secondary">Body content with default spacing.</p>
              </CardContent>
            </Card>
          </DocExample>

          <DocExample title="Compact" value='size="sm"' code='<Card size="sm">…</Card>'>
            <Card size="sm">
              <CardHeader>
                <CardTitle>Compact</CardTitle>
                <CardDescription>Tighter padding and gap</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-body text-label-secondary">Body content with compact spacing.</p>
              </CardContent>
            </Card>
          </DocExample>

          <DocExample title='Shadow "sm"' value='shadow="sm"' code='<Card shadow="sm">…</Card>'>
            <Card shadow="sm">
              <CardHeader>
                <CardTitle>Small shadow</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-body text-label-secondary">Subtle elevation for flat layouts.</p>
              </CardContent>
            </Card>
          </DocExample>

          <DocExample title='Shadow "xl"' value='shadow="xl"' code='<Card shadow="xl">…</Card>'>
            <Card shadow="xl">
              <CardHeader>
                <CardTitle>Large shadow</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-body text-label-secondary">Strong elevation for modals or popovers.</p>
              </CardContent>
            </Card>
          </DocExample>

          <DocExample title="With CardAction" code={'<Card>\n  <CardHeader>\n    <CardTitle>…</CardTitle>\n    <CardAction>…</CardAction>\n  </CardHeader>\n</Card>'}>
            <Card>
              <CardHeader>
                <CardTitle>With action</CardTitle>
                <CardDescription>Header action slot</CardDescription>
                <CardAction>
                  <Button variant="ghost" size="icon">
                    <IconDotsVertical className="size-4" />
                  </Button>
                </CardAction>
              </CardHeader>
              <CardContent>
                <p className="text-body text-label-secondary">CardAction sits top-right of the header.</p>
              </CardContent>
            </Card>
          </DocExample>

          <DocExample title="With CardFooter" code={'<Card>\n  …\n  <CardFooter>…</CardFooter>\n</Card>'}>
            <Card>
              <CardHeader>
                <CardTitle>With footer</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-body text-label-secondary">Footer has a top border and muted background.</p>
              </CardContent>
              <CardFooter className="justify-end gap-inline-2xs">
                <Button variant="ghost" size="sm">Cancel</Button>
                <Button size="sm">Save</Button>
              </CardFooter>
            </Card>
          </DocExample>
        </div>
      </DocSection>

      {/* ── API ── */}
      <DocSection title="API" description="Props for Card and its sub-components">
        <DocPropsTable
          props={[
            { prop: "size", type: '"default" | "sm"', default: '"default"', description: "Controls padding and gap. Compact mode reduces both." },
            { prop: "shadow", type: 'boolean | "2xs" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | string', default: "—", description: "Squircle shadow elevation. true is shorthand for \"md\". Pass a custom drop-shadow() string for full control." },
            { prop: "className", type: "string", default: "—", description: "Additional CSS classes on the card root." },
            { prop: "CardHeader", type: "sub-component", default: "—", description: "Container for title, description, and action. Auto-switches to grid layout when CardAction is present." },
            { prop: "CardTitle", type: "sub-component", default: "—", description: "Heading text. Uses font-heading, scales down in size=\"sm\" mode." },
            { prop: "CardDescription", type: "sub-component", default: "—", description: "Secondary text below the title. text-label-secondary color." },
            { prop: "CardAction", type: "sub-component", default: "—", description: "Slot in the top-right of the header for buttons or menus." },
            { prop: "CardContent", type: "sub-component", default: "—", description: "Main body area. Horizontal padding matches header." },
            { prop: "CardFooter", type: "sub-component", default: "—", description: "Bottom section with top border and bg-surface-tertiary/50 background." },
          ]}
        />
      </DocSection>

      {/* ── Tokens ── */}
      <DocSection title="Tokens" description="Design system tokens referenced by this component">
        <DocTokens
          tokens={[
            { swatch: "var(--surface-secondary)", role: "Card background", utility: "bg-surface-secondary" },
            { swatch: "var(--label)", role: "Primary text color", utility: "text-label" },
            { swatch: "var(--label-secondary)", role: "Description and secondary text", utility: "text-label-secondary" },
            { swatch: "var(--stroke-faint)", role: "Inset ring border + footer top border", utility: "inset-ring-stroke-faint/10" },
            { swatch: "var(--surface-tertiary)", role: "Footer background", utility: "bg-surface-tertiary/50" },
          ]}
        />
      </DocSection>

      {/* ── Guidelines ── */}
      <DocSection title="Guidelines" description="When and how to use this component">
        <DocGuidelines
          items={[
            { type: "do", text: "Use Card for grouping related content — a profile summary, a settings panel, a data overview." },
            { type: "do", text: "Use the shadow prop to establish elevation hierarchy: no shadow for inline, \"sm\" for grouped, \"xl\" for overlay." },
            { type: "dont", text: "Don't nest cards inside cards — it creates confusing visual hierarchy. Use sections within a single card instead." },
            { type: "dont", text: "Don't use Card when a simple border or spacing would suffice — unnecessary elevation adds visual noise." },
            { type: "do", text: "Use size=\"sm\" for dense layouts like dashboards or sidebars where space is at a premium." },
            { type: "dont", text: "Don't put interactive elements in CardFooter without clear visual affordance — users may miss them." },
          ]}
        />
      </DocSection>

      {/* ── Source ── */}
      <DocSection title="Source" description="Component file and installation">
        <DocSource
          source={{
            file: "src/components/ui/card.tsx",
            install: "npx shadcn@latest add card",
            primitive: "Native React components (no headless primitive)",
            import: 'import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardAction } from "@/components/ui/card"',
          }}
        />
      </DocSection>
    </DocPage>
  )
}

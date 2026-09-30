/**
 * Component Documentation Template
 *
 * Shared layout primitives for all component doc pages. Each page imports
 * these and fills in the data — changing the template structure propagates
 * to every component page at once.
 *
 * ## Standard sections (in order):
 *
 * 1. **Header**        — name, one-line description
 * 2. **Preview**       — the component in its most common configuration, interactive
 * 3. **Anatomy**       — visual breakdown of sub-elements with token annotations
 * 4. **Examples**      — grid of interactive demos covering key variants
 * 5. **API**           — full props table (prop, type, default, description)
 * 6. **Tokens**        — which design system tokens the component references
 * 7. **Accessibility** — keyboard interaction, ARIA attributes, screen reader behavior
 * 8. **Guidelines**    — do/don't usage guidance (when to use, when not to, common mistakes)
 * 9. **Source**        — file path, install command, primitive, import statement
 *
 * Not every section is required for every component. Omit sections that don't
 * apply (e.g., a decorative component may skip Accessibility).
 */

import * as React from "react"
import { PageShell, PageHeader, Section, SectionCard } from "@/components/PageLayout"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Page shell
// ---------------------------------------------------------------------------

export function DocPage({ children }: { children: React.ReactNode }) {
  return <PageShell>{children}</PageShell>
}

export function DocHeader({ name, description }: { name: string; description: string }) {
  return <PageHeader title={name} description={description} />
}

// ---------------------------------------------------------------------------
// Section wrapper — consistent heading + optional description + content
// ---------------------------------------------------------------------------

export function DocSection({
  title,
  description,
  children,
  bare,
}: {
  title: string
  description?: string
  children: React.ReactNode
  /**
   * Skip the outer SectionCard wrapper. Use when children already supply
   * their own surface (e.g. an accordion whose items are squircled cards),
   * so the page doesn't stack card-in-card-in-card.
   */
  bare?: boolean
}) {
  return (
    <Section title={title} description={description} bare={bare}>
      {children}
    </Section>
  )
}

// ---------------------------------------------------------------------------
// Card — squircled container used for examples, anatomy, tokens, etc.
// ---------------------------------------------------------------------------

export function DocCard({
  children,
  className,
  noPadding,
}: {
  children: React.ReactNode
  className?: string
  noPadding?: boolean
}) {
  return (
    <SectionCard className={className} noPadding={noPadding}>
      {children}
    </SectionCard>
  )
}

// ---------------------------------------------------------------------------
// Preview — hero demo, the component at its best
// ---------------------------------------------------------------------------

export function DocPreview({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <DocCard className={cn("p-inset-l flex items-center justify-center", className)}>
      {children}
    </DocCard>
  )
}

// ---------------------------------------------------------------------------
// Example card — smaller, used in the grid of variant demos
// ---------------------------------------------------------------------------

export function DocExample({
  title,
  value,
  code,
  children,
}: {
  title: string
  value?: string
  code?: string
  children: React.ReactNode
}) {
  return (
    <DocCard className="p-inset-s space-y-stack-s">
      <div className="flex items-baseline justify-between">
        <span className="text-body font-semibold text-label">{title}</span>
        {value && <span className="font-mono text-xs text-label-secondary tabular-nums">{value}</span>}
      </div>
      {children}
      {code && (
        <code className="block text-[11px] font-mono text-label-secondary">{code}</code>
      )}
    </DocCard>
  )
}

// ---------------------------------------------------------------------------
// Props table
// ---------------------------------------------------------------------------

export type PropDef = {
  prop: string
  type: string
  default: string
  description: string
}

export function DocPropsTable({ props }: { props: PropDef[] }) {
  return (
    <DocCard className="overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-surface-tertiary text-left text-xs text-label-secondary">
            <th className="px-inset-s py-2.5 font-medium">Prop</th>
            <th className="px-inset-s py-2.5 font-medium">Type</th>
            <th className="px-inset-s py-2.5 font-medium">Default</th>
            <th className="px-inset-s py-2.5 font-medium">Description</th>
          </tr>
        </thead>
        <tbody>
          {props.map((row, i) => (
            <tr
              key={row.prop}
              className={cn(
                "border-t border-stroke-faint",
                i % 2 === 0 ? "bg-surface-secondary" : "bg-surface",
              )}
            >
              <td className="px-inset-s py-2.5 font-mono text-xs font-medium text-label">{row.prop}</td>
              <td className="px-inset-s py-2.5 font-mono text-[11px] text-label-secondary">{row.type}</td>
              <td className="px-inset-s py-2.5 font-mono text-[11px] text-label-secondary">{row.default}</td>
              <td className="px-inset-s py-2.5 text-xs text-label-secondary">{row.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </DocCard>
  )
}

// ---------------------------------------------------------------------------
// Tokens list
// ---------------------------------------------------------------------------

export type TokenDef = {
  swatch: string
  role: string
  utility: string
}

export function DocTokens({ tokens }: { tokens: TokenDef[] }) {
  return (
    <DocCard className="p-inset-s space-y-stack-xs">
      {tokens.map((t) => (
        <div key={t.utility} className="flex items-center gap-inline-s">
          <div
            className="size-6 rounded-md border border-stroke-faint shrink-0"
            style={{ backgroundColor: t.swatch }}
          />
          <span className="text-xs font-medium text-label flex-1">{t.role}</span>
          <span className="font-mono text-[11px] text-label-secondary">{t.utility}</span>
        </div>
      ))}
    </DocCard>
  )
}

// ---------------------------------------------------------------------------
// Accessibility table
// ---------------------------------------------------------------------------

export type A11yDef = {
  interaction: string
  behavior: string
}

export function DocAccessibility({ items }: { items: A11yDef[] }) {
  return (
    <DocCard className="overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-surface-tertiary text-left text-xs text-label-secondary">
            <th className="px-inset-s py-2.5 font-medium w-40">Interaction</th>
            <th className="px-inset-s py-2.5 font-medium">Behavior</th>
          </tr>
        </thead>
        <tbody>
          {items.map((row, i) => (
            <tr
              key={row.interaction}
              className={cn(
                "border-t border-stroke-faint",
                i % 2 === 0 ? "bg-surface-secondary" : "bg-surface",
              )}
            >
              <td className="px-inset-s py-2.5 font-mono text-xs font-medium text-label">{row.interaction}</td>
              <td className="px-inset-s py-2.5 text-xs text-label-secondary">{row.behavior}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </DocCard>
  )
}

// ---------------------------------------------------------------------------
// Guidelines — do/don't pairs
// ---------------------------------------------------------------------------

export type GuidelineDef = {
  type: "do" | "dont"
  text: string
}

export function DocGuidelines({ items }: { items: GuidelineDef[] }) {
  return (
    <div className="grid grid-cols-2 gap-gutter-s">
      {items.map((g, i) => (
        <DocCard key={i} className="p-inset-s space-y-stack-2xs">
          <span
            className={cn(
              "text-xs font-bold uppercase",
              g.type === "do" ? "text-green-500" : "text-red-500",
            )}
          >
            {g.type === "do" ? "Do" : "Don't"}
          </span>
          <p className="text-body text-label-secondary">{g.text}</p>
        </DocCard>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Source info
// ---------------------------------------------------------------------------

export type SourceDef = {
  file: string
  install: string
  primitive: string
  import: string
}

export function DocSource({ source }: { source: SourceDef }) {
  return (
    <DocCard className="p-inset-s space-y-stack-2xs">
      {([
        ["File", source.file],
        ["Install", source.install],
        ["Primitive", source.primitive],
        ["Import", source.import],
      ] as const).map(([label, value]) => (
        <div key={label} className="flex items-baseline gap-inline-xs">
          <span className="text-xs text-label-secondary w-16 shrink-0">{label}</span>
          <code className="text-xs font-mono text-label">{value}</code>
        </div>
      ))}
    </DocCard>
  )
}

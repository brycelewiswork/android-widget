import { cn } from "@/lib/utils"
import { Squircle, SQUIRCLE_RADIUS } from "@/components/squircle"

/**
 * Shared page layout primitives. Every system page uses these
 * to guarantee consistent structure. Change here → changes everywhere.
 */

export function PageShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("mx-auto max-w-4xl px-inset-m py-inset-xl space-y-stack-2xl", className)}>
      {children}
    </div>
  )
}

export function PageHeader({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h1 className="text-h3 text-label">{title}</h1>
      <p className="text-body text-label-secondary mt-stack-3xs">{description}</p>
    </div>
  )
}

export function Section({
  title,
  description,
  children,
  noPadding,
  className,
  bare,
}: {
  title: string
  description?: string
  children: React.ReactNode
  noPadding?: boolean
  className?: string
  bare?: boolean
}) {
  return (
    <section className="space-y-stack-xs">
      <SectionHeader title={title} description={description} />
      {bare ? children : (
        <SectionCard noPadding={noPadding} className={className}>
          {children}
        </SectionCard>
      )}
    </section>
  )
}

export function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div>
      <h2 className="text-h6 text-label">{title}</h2>
      {description && <p className="text-body text-label-secondary mt-0.5">{description}</p>}
    </div>
  )
}

export function SectionCard({
  children,
  className,
  noPadding,
}: {
  children: React.ReactNode
  className?: string
  noPadding?: boolean
}) {
  return (
    <Squircle
      as="div"
      cornerRadius={SQUIRCLE_RADIUS.xl}
      shadow="xs"
      shadowClassName="block w-full"
      className={cn(
        "w-full rounded-xl bg-surface-secondary inset-ring-1 inset-ring-stroke-faint",
        !noPadding && "p-inset-l space-y-stack-m",
        className,
      )}
    >
      {children}
    </Squircle>
  )
}

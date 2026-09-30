import { PageShell, PageHeader, SectionCard } from "@/components/PageLayout"
import { DEMOS } from "./demos/index"

export function Demos() {
  return (
    <PageShell className="space-y-0! flex flex-col gap-stack-l">
      <header className="flex flex-col gap-stack-s">
        <PageHeader
          title="Demos"
          description="Every library bundled into project-base is demonstrated below. If it isn't on this page, it shouldn't be in the template."
        />

        <SectionCard className="space-y-stack-xs">
          <div className="text-xs font-medium text-label-secondary">Stack at a glance</div>
          <div className="grid grid-cols-2 gap-x-inline-m gap-y-stack-3xs text-sm sm:grid-cols-3">
            {DEMOS.map((d) => (
              <div key={d.lib} className="flex items-baseline gap-inline-2xs">
                <span className="font-medium">{d.lib}</span>
                <span className="text-xs text-label-secondary">{d.role}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </header>

      {DEMOS.map((d) => (d.Component ? <d.Component key={d.lib} /> : null))}
    </PageShell>
  )
}

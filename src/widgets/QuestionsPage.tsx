import { useState } from "react"
import { IconChevronRight } from "@tabler/icons-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DECISION_AREAS, GAP_STATUSES, GAPS, type Gap, type GapStatus } from "./gaps"
import { Page } from "./Shell"

/*
 * /questions — open questions and settled decisions about the new widget
 * (src/widgets/gaps.ts), kept in the prototype so they stay visible. Built to
 * scan, not read: a tab per status, one line per item (its title, plus who
 * needs to answer it or what was decided), opening for the full story.
 */

/** One item: a single scannable line that opens for the detail. */
function GapRow({ gap }: { gap: Gap }) {
  const summary = gap.status === "decided" ? gap.decision : gap.needs && `Needs: ${gap.needs}`
  return (
    <li>
      <details className="group rounded-lg bg-surface-secondary inset-ring-1 inset-ring-stroke-faint">
        <summary className="flex cursor-pointer list-none items-baseline gap-2.5 px-3.5 py-2.5 [&::-webkit-details-marker]:hidden">
          <IconChevronRight
            size={14}
            stroke={2}
            className="shrink-0 translate-y-0.5 text-label-tertiary transition-transform duration-200 group-open:rotate-90"
          />
          <span className="min-w-0 flex-1">
            <span className="text-sm font-medium text-label">{gap.title}</span>
            {/* Closed: the gist on one line. Open: the full text below says it. */}
            {summary && <span className="block truncate text-xs text-label-secondary group-open:hidden">{summary}</span>}
          </span>
        </summary>
        <div className="flex flex-col gap-2 pr-3.5 pb-3 pl-[2.375rem]">
          <p className="text-sm text-label-secondary">{gap.detail}</p>
          {gap.decision && (
            <p className="text-sm text-label">
              <span className="font-medium">Decision: </span>
              {gap.decision}
            </p>
          )}
          <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-label-tertiary">
            {gap.needs && <span>Needs: {gap.needs}</span>}
            <span>Seen in: {gap.source}</span>
          </p>
        </div>
      </details>
    </li>
  )
}

function GapList({ gaps }: { gaps: Gap[] }) {
  return (
    <ul className="flex flex-col gap-1.5">
      {gaps.map((g) => (
        <GapRow key={g.id} gap={g} />
      ))}
    </ul>
  )
}

export function QuestionsPage() {
  const [tab, setTab] = useState<GapStatus>("open")
  return (
    <Page sizes={[]}>
      <div className="mx-auto flex max-w-3xl flex-col gap-5">
        <header className="flex flex-col gap-1">
          <h1 className="text-base font-semibold text-label">Questions and decisions</h1>
          <p className="text-sm text-label-secondary">
            What the new widget doesn't cover yet, and what's settled (with why, so it isn't refought). Open a row for the detail. “Today's widget” is the
            Android shift widget in production now, from the{" "}
            <a
              href="https://linear.app/joinhomebase/issue/DESF-875/refinedesign-widget"
              target="_blank"
              rel="noreferrer"
              className="text-label underline decoration-stroke-strong underline-offset-2 hover:decoration-label"
            >
              current-widget audit on DESF-875
            </a>
            .
          </p>
        </header>

        <Tabs value={tab} onValueChange={(v) => setTab(v as GapStatus)} className="gap-4">
          <TabsList>
            {GAP_STATUSES.map((s) => (
              <TabsTrigger key={s.id} value={s.id} className="gap-1.5 px-3">
                {s.label}
                <span className="font-mono text-xs text-label-tertiary">{GAPS.filter((g) => g.status === s.id).length}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          {GAP_STATUSES.map((status) => {
            const gaps = GAPS.filter((g) => g.status === status.id)
            return (
              <TabsContent key={status.id} value={status.id} className="flex flex-col gap-4">
                <p className="text-xs text-label-secondary">{status.note}</p>
                {status.id === "decided" ? (
                  // Decisions, by what they're about.
                  DECISION_AREAS.map((area) => {
                    const inArea = gaps.filter((g) => g.area === area)
                    if (inArea.length === 0) return null
                    return (
                      <section key={area} className="flex flex-col gap-1.5" aria-label={area}>
                        <h2 className="text-xs font-medium text-label-tertiary">{area}</h2>
                        <GapList gaps={inArea} />
                      </section>
                    )
                  })
                ) : (
                  <GapList gaps={gaps} />
                )}
              </TabsContent>
            )
          })}
        </Tabs>
      </div>
    </Page>
  )
}

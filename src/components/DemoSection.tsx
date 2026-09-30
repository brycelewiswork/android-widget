import * as React from "react"
import { IconExternalLink } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import { Squircle, SQUIRCLE_RADIUS } from "@/components/squircle"
import { SectionHeader, SectionCard } from "@/components/PageLayout"

type DemoSectionProps = {
  title: string
  lib: string
  version?: string
  docsUrl?: string
  bare?: boolean
  children: React.ReactNode
}

export function DemoSection({ title, lib, version, docsUrl, bare, children }: DemoSectionProps) {
  return (
    <section className="space-y-stack-m">
      <div className="flex items-center gap-inline-xs">
        <div className="flex min-w-0 flex-wrap items-baseline gap-gutter-xs">
          <SectionHeader title={title} />
          <Badge variant="secondary" className="font-mono">
            {lib}
            {version ? `@${version}` : null}
          </Badge>
        </div>
        {docsUrl ? (
          <Squircle
            as="a"
            cornerRadius={SQUIRCLE_RADIUS.md}
            href={docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto inline-flex h-7 shrink-0 items-center gap-inline-3xs overflow-hidden whitespace-nowrap rounded-md bg-surface px-2.5 text-[0.8rem] font-medium text-label inset-ring-1 inset-ring-stroke-faint transition-colors hover:bg-surface-tertiary dark:inset-ring-stroke-strong dark:bg-stroke-strong/30 dark:hover:bg-stroke-strong/50"
          >
            Docs
            <IconExternalLink className="size-3.5" />
          </Squircle>
        ) : null}
      </div>
      {bare ? (
        <div className="flex flex-col gap-stack-s">{children}</div>
      ) : (
        <SectionCard className="space-y-stack-s">
          {children}
        </SectionCard>
      )}
    </section>
  )
}

import { useState } from "react"
import { DemoSection } from "@/components/DemoSection"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  SkeletonText,
  SkeletonHeading,
  SkeletonAvatar,
  SkeletonImage,
  SkeletonCard,
} from "@/components/ui/skeleton"
import type { DemoEntry } from "./types"

function SkeletonDemo() {
  const [loaded, setLoaded] = useState(false)

  return (
    <DemoSection title="Skeleton loading" lib="@/components/ui/skeleton" docsUrl="https://ui.shadcn.com/docs/components/skeleton">
      <p className="text-body text-label-secondary">
        Composable loading primitives with a gentle pulse animation. Use <code>bg-fill-secondary</code> for
        the skeleton fill — adapts to light and dark mode automatically.
      </p>

      <div className="flex items-center gap-inline-xs mb-stack-2xs">
        <Button size="sm" variant="outline" onClick={() => setLoaded((v) => !v)}>
          {loaded ? "Show skeleton" : "Show loaded"}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-gutter-s">
        <div>
          <div className="text-[10px] text-label-secondary font-mono mb-stack-2xs">
            {loaded ? "Loaded" : "SkeletonCard"}
          </div>
          {loaded ? (
            <Card shadow="sm">
              <CardHeader>
                <CardTitle>Notification settings</CardTitle>
                <CardDescription>Manage alerts and updates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-stack-xs">
                <div className="flex items-center gap-inline-xs">
                  <div className="size-8 rounded-full bg-blue-500 flex items-center justify-center text-white-100 text-xs font-bold">JD</div>
                  <div>
                    <div className="text-sm font-medium text-label">Jane Doe</div>
                    <div className="text-xs text-label-secondary">jane@example.com</div>
                  </div>
                </div>
                <div className="flex items-center gap-inline-xs">
                  <div className="size-8 rounded-full bg-green-500 flex items-center justify-center text-white-100 text-xs font-bold">AS</div>
                  <div>
                    <div className="text-sm font-medium text-label">Alex Smith</div>
                    <div className="text-xs text-label-secondary">alex@example.com</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <SkeletonCard />
          )}
        </div>

        <div className="space-y-stack-s">
          <div>
            <div className="text-[10px] text-label-secondary font-mono mb-stack-2xs">Primitives</div>
            <div className="rounded-xl border border-stroke-faint bg-surface-secondary p-inset-s space-y-stack-s">
              <div className="space-y-stack-3xs">
                <div className="text-[9px] text-label-secondary font-mono">SkeletonHeading</div>
                <SkeletonHeading />
              </div>
              <div className="space-y-stack-3xs">
                <div className="text-[9px] text-label-secondary font-mono">SkeletonText lines=3</div>
                <SkeletonText lines={3} />
              </div>
              <div className="space-y-stack-3xs">
                <div className="text-[9px] text-label-secondary font-mono">SkeletonAvatar sm / md / lg</div>
                <div className="flex items-center gap-inline-xs">
                  <SkeletonAvatar size="sm" />
                  <SkeletonAvatar size="md" />
                  <SkeletonAvatar size="lg" />
                </div>
              </div>
              <div className="space-y-stack-3xs">
                <div className="text-[9px] text-label-secondary font-mono">SkeletonImage</div>
                <SkeletonImage />
              </div>
            </div>
          </div>
        </div>
      </div>
    </DemoSection>
  )
}

const entry: DemoEntry = {
  lib: "Skeleton",
  role: "loading states",
  docsUrl: "https://ui.shadcn.com/docs/components/skeleton",
  Component: SkeletonDemo,
}
export default entry

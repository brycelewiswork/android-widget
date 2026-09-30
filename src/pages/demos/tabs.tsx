import { IconLayoutList, IconCode, IconEye } from "@tabler/icons-react"
import { DemoSection } from "@/components/DemoSection"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import type { DemoEntry } from "./types"

function TabsDemo() {
  return (
    <DemoSection title="Tabs" lib="@/components/ui/tabs" docsUrl="https://ui.shadcn.com/docs/components/tabs">
      <p className="text-body text-label-secondary">
        Base UI tabs restyled onto our semantic tokens (surface / label) with a squircled segmented
        track. Two variants: <code>default</code> (a pill lifts the active tab onto a surface) and{" "}
        <code>line</code> (an underline carries the active state).
      </p>

      <div className="grid gap-gutter-l sm:grid-cols-2">
        {/* default — segmented */}
        <div className="space-y-stack-2xs">
          <div className="font-mono text-[10px] text-label-secondary">variant=&quot;default&quot;</div>
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview"><IconLayoutList /> Overview</TabsTrigger>
              <TabsTrigger value="code"><IconCode /> Code</TabsTrigger>
              <TabsTrigger value="preview"><IconEye /> Preview</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="p-inset-s text-sm text-label-secondary">
              A segmented pill lifts the active tab onto a surface.
            </TabsContent>
            <TabsContent value="code" className="p-inset-s text-sm text-label-secondary">
              The active tab picks up a subtle shadow.
            </TabsContent>
            <TabsContent value="preview" className="p-inset-s text-sm text-label-secondary">
              Content swaps instantly; state lives in the primitive.
            </TabsContent>
          </Tabs>
        </div>

        {/* line — underline */}
        <div className="space-y-stack-2xs">
          <div className="font-mono text-[10px] text-label-secondary">variant=&quot;line&quot;</div>
          <Tabs defaultValue="account">
            <TabsList variant="line">
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="team">Team</TabsTrigger>
              <TabsTrigger value="billing">Billing</TabsTrigger>
            </TabsList>
            <TabsContent value="account" className="pt-inset-s text-sm text-label-secondary">
              An underline indicator sits below the active tab.
            </TabsContent>
            <TabsContent value="team" className="pt-inset-s text-sm text-label-secondary">
              No squircle here — the indicator lives outside the box.
            </TabsContent>
            <TabsContent value="billing" className="pt-inset-s text-sm text-label-secondary">
              Same primitive, transparent track.
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DemoSection>
  )
}

const entry: DemoEntry = {
  lib: "Tabs",
  role: "tabbed navigation",
  docsUrl: "https://ui.shadcn.com/docs/components/tabs",
  Component: TabsDemo,
}
export default entry

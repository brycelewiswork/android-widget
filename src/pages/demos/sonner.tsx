import { toast } from "sonner"
import { DemoSection } from "@/components/DemoSection"
import { Button } from "@/components/ui/button"
import type { DemoEntry } from "./types"

function SonnerDemo() {
  return (
    <DemoSection title="Sonner" lib="sonner" docsUrl="https://sonner.emilkowal.ski/">
      <p className="text-body text-label-secondary">
        Stacked toasts mounted in <code>main.tsx</code>. Toast corners are squircled; elevation
        is restored by applying <code>filter: drop-shadow</code> to the toaster parent so the
        shadow renders from each toast&apos;s clipped silhouette. Same pattern is available on
        Card &amp; Button via the <code>shadow</code> prop.
      </p>
      <div className="flex flex-wrap gap-gutter-2xs">
        <Button size="sm" onClick={() => toast("Hello, sketcher")}>Toast</Button>
        <Button size="sm" variant="outline" onClick={() => toast.success("Saved")}>Success</Button>
        <Button size="sm" variant="outline" onClick={() => toast.error("Something broke")}>
          Error
        </Button>
      </div>
    </DemoSection>
  )
}

const entry: DemoEntry = {
  lib: "Sonner",
  role: "toasts",
  docsUrl: "https://sonner.emilkowal.ski/",
  Component: SonnerDemo,
}
export default entry

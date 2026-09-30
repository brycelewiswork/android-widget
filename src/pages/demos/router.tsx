import { Link } from "react-router-dom"
import { IconArrowRight } from "@tabler/icons-react"
import { DemoSection } from "@/components/DemoSection"
import type { DemoEntry } from "./types"

function RouterDemo() {
  return (
    <DemoSection title="React Router" lib="react-router-dom" docsUrl="https://reactrouter.com/">
      <p className="text-body text-label-secondary">
        Multi-page sketches with <code>BrowserRouter</code> + <code>Routes</code>.
      </p>
      <div className="flex flex-wrap items-center gap-gutter-xs text-sm">
        <Link to="/" className="inline-flex items-center gap-inline-3xs underline">
          Home <IconArrowRight className="size-3" />
        </Link>
        <Link to="/motion" className="inline-flex items-center gap-inline-3xs underline">
          Motion <IconArrowRight className="size-3" />
        </Link>
      </div>
    </DemoSection>
  )
}

const entry: DemoEntry = {
  lib: "React Router",
  role: "routing",
  docsUrl: "https://reactrouter.com/",
  Component: RouterDemo,
}
export default entry

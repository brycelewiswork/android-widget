import { Link } from "react-router-dom"
import { IconArrowRight } from "@tabler/icons-react"
import { DemoSection } from "@/components/DemoSection"
import type { DemoEntry } from "./types"

function ColorEditorDemo() {
  return (
    <DemoSection title="Color editor" lib="culori" docsUrl="https://culorijs.org/">
      <p className="text-body text-label-secondary">
        Every semantic token on <Link to="/colors" className="underline">/colors</Link> is
        click-to-edit with a Figma-style picker (SV square, hue + alpha sliders,
        hex / RGB / CSS / HSL / HSB modes, native EyeDropper in Chromium).
        Conversions go through <code>culori</code>; storage stays OKLCH to
        preserve the system. Overrides persist to localStorage as a sparse
        per-mode diff, so saved palettes survive future token additions.
        Export as JSON or paste-ready CSS, import to restore.
      </p>
      <Link
        to="/colors"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-label hover:text-label/80"
      >
        Open the editor <IconArrowRight size={14} stroke={2} />
      </Link>
    </DemoSection>
  )
}

const entry: DemoEntry = {
  lib: "culori",
  role: "color picker",
  docsUrl: "https://culorijs.org/",
  Component: ColorEditorDemo,
}
export default entry

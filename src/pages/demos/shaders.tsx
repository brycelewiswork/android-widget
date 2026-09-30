import { Link } from "react-router-dom"
import { IconSparkles } from "@tabler/icons-react"
import { DemoSection } from "@/components/DemoSection"
import { Squircle, SQUIRCLE_RADIUS } from "@/components/squircle"
import { PulsingBorder, DotGrid, MeshGradient } from "@paper-design/shaders-react"
import type { DemoEntry } from "./types"

function ShadersDemo() {
  return (
    <DemoSection
      title="Shaders"
      lib="@paper-design/shaders-react · @react-three/fiber + drei + postprocessing"
      version="five-tier toolkit"
      docsUrl="https://shaders.paper.design/"
    >
      <p className="text-sm text-label-secondary">
        A tiered WebGL toolkit shipped in the template. The two tiles below recreate the reference effects; the full catalog with live controls for every shader lives on the{" "}
        <Link to="/components/shaders" className="text-label underline underline-offset-2 hover:text-blue-500">
          Shaders page
        </Link>.
      </p>

      <div className="grid grid-cols-1 gap-gutter-m sm:grid-cols-2">
        <div className="space-y-stack-2xs">
          <div className="text-xs font-medium text-label">Aurora pill</div>
          <div className="text-[11px] text-label-secondary">PulsingBorder + DotGrid backdrop + glass pill</div>
          <Squircle
            as="div"
            cornerRadius={SQUIRCLE_RADIUS.xl}
            className="relative h-[260px] overflow-hidden rounded-xl bg-black inset-ring-1 inset-ring-stroke-faint"
          >
            <DotGrid
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
              colorBack="#06061a"
              colorFill="#1c1c3a"
              size={2}
              gapX={18}
              gapY={18}
              shape="circle"
            />
            <PulsingBorder
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
              colorBack="#06061a00"
              colors={["#ff36c5", "#a52bff", "#ff8be4"]}
              thickness={0.18}
              softness={0.7}
              bloom={0.95}
              spots={5}
              pulse={0.35}
              smoke={0.7}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Squircle
                as="div"
                cornerRadius={999}
                className="flex items-center gap-inline-2xs rounded-full bg-white/10 px-inset-s py-2.5 text-sm font-medium text-white backdrop-blur-md inset-ring-1 inset-ring-white/20"
              >
                <IconSparkles size={16} stroke={2} className="text-white/90" />
                Ask Anything
              </Squircle>
            </div>
          </Squircle>
        </div>

        <div className="space-y-stack-2xs">
          <div className="text-xs font-medium text-label">Dot-grid bloom</div>
          <div className="text-[11px] text-label-secondary">MeshGradient bloom over DotGrid</div>
          <Squircle
            as="div"
            cornerRadius={SQUIRCLE_RADIUS.xl}
            className="relative h-[260px] overflow-hidden rounded-xl bg-black inset-ring-1 inset-ring-stroke-faint"
          >
            <DotGrid
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
              colorBack="#02020a"
              colorFill="#1c1c3a"
              size={2}
              gapX={16}
              gapY={16}
              shape="circle"
            />
            <MeshGradient
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", mixBlendMode: "screen", opacity: 0.85 }}
              colors={["#c8a8ff", "#5b6bff", "#06061a"]}
              distortion={0.6}
              swirl={0.3}
              speed={0.3}
              offsetY={0.35}
              scale={1.2}
            />
          </Squircle>
        </div>
      </div>
    </DemoSection>
  )
}

const entry: DemoEntry = {
  lib: "paper-shaders",
  role: "WebGL catalog",
  version: "five-tier toolkit",
  docsUrl: "https://shaders.paper.design/",
  Component: ShadersDemo,
}
export default entry

import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { DemoSection } from "@/components/DemoSection"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import type { DemoEntry } from "./types"

type CanvasWithPaint = HTMLCanvasElement & {
  onpaint: ((e: { changedElements?: Element[] }) => void) | null
  requestPaint?: () => void
}
type Ctx2DWithElementImage = CanvasRenderingContext2D & {
  drawElementImage: (el: Element, dx: number, dy: number, dw?: number, dh?: number) => DOMMatrix
}

function HtmlInCanvasDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const formRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const [supported, setSupported] = useState<boolean | null>(null)
  const [amplitude, setAmplitude] = useState(0.08)
  const amplitudeRef = useRef(amplitude)
  useEffect(() => { amplitudeRef.current = amplitude }, [amplitude])

  useEffect(() => {
    const canvas = canvasRef.current as CanvasWithPaint | null
    const form = formRef.current
    const stage = stageRef.current
    if (!canvas || !form || !stage) return

    const ctx = canvas.getContext("2d") as Ctx2DWithElementImage | null
    const isSupported = !!ctx && typeof ctx.drawElementImage === "function"
    setSupported(isSupported)
    if (!ctx || !isSupported) return

    // The experimental drawElementImage API can crash Chromium with
    // STATUS_BREAKPOINT when called continuously through onpaint while
    // ancestor layout is in flux. Defensive design: only attach onpaint
    // and run the wave while the user is hovering the stage.

    let raf = 0
    let hovered = false

    const sync = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      const w = Math.round(rect.width * dpr)
      const h = Math.round(rect.height * dpr)
      if (canvas.width !== w) canvas.width = w
      if (canvas.height !== h) canvas.height = h
    }

    const paintOnce = () => {
      sync()
      ctx.reset()
      const t = performance.now() / 1000
      const a = hovered ? amplitudeRef.current : 0
      const rot = Math.sin(t * 1.2) * a
      const scale = 1 + Math.sin(t * 1.8) * (a * 0.4)
      ctx.translate(canvas.width / 2, canvas.height / 2)
      ctx.rotate(rot)
      ctx.scale(scale, scale)
      ctx.translate(-canvas.width / 2, -canvas.height / 2)
      const m = ctx.drawElementImage(form, 24, 24)
      form.style.transform = m.toString()
      form.style.transformOrigin = "0 0"
    }

    const onPaintFrame = () => {
      paintOnce()
      if (hovered) raf = requestAnimationFrame(onPaintFrame)
    }

    const start = () => {
      if (hovered) return
      hovered = true
      canvas.onpaint = paintOnce
      raf = requestAnimationFrame(onPaintFrame)
    }
    const stop = () => {
      hovered = false
      cancelAnimationFrame(raf)
      canvas.onpaint = null
      requestAnimationFrame(() => {
        if (!hovered && canvas.requestPaint) {
          canvas.onpaint = () => {
            paintOnce()
            canvas.onpaint = null
          }
          canvas.requestPaint()
        }
      })
    }

    stage.addEventListener("pointerenter", start)
    stage.addEventListener("pointerleave", stop)

    canvas.onpaint = () => {
      paintOnce()
      canvas.onpaint = null
    }
    canvas.requestPaint?.()

    return () => {
      cancelAnimationFrame(raf)
      canvas.onpaint = null
      stage.removeEventListener("pointerenter", start)
      stage.removeEventListener("pointerleave", stop)
    }
  }, [])

  return (
    <DemoSection title="HTML in Canvas" lib="WICG/html-in-canvas" version="experimental" docsUrl="https://github.com/WICG/html-in-canvas/blob/main/README.md">
      <p className="text-body text-label-secondary">
        Chromium-only proposal that lets a <code>&lt;canvas layoutsubtree&gt;</code> paint real,
        interactive HTML children via <code>ctx.drawElementImage(el)</code>. The pixels go through
        the canvas (transforms, shaders, blends), while the underlying DOM element stays focusable,
        accessible, and form-fillable. <strong>Hover the stage below</strong> to start the wave —
        the form stays interactive while it warps. See{" "}
        <a className="underline" href="https://github.com/WICG/html-in-canvas/blob/main/README.md" target="_blank" rel="noopener">
          the WICG proposal
        </a>
        ,{" "}
        <a className="underline" href="https://www.youtube.com/watch?v=TUtKGTeFWjQ" target="_blank" rel="noopener">
          Chrome's intro video
        </a>
        , and{" "}
        <a className="underline" href="https://github.com/GoogleChrome/modern-web-guidance-src" target="_blank" rel="noopener">
          modern-web-guidance
        </a>
        .
      </p>

      {supported === false ? (
        <div className="rounded-xl border border-stroke-faint bg-surface-secondary p-inset-s text-sm">
          <div className="font-medium text-label">API not available in this browser.</div>
          <div className="mt-stack-3xs text-label-secondary">
            In origin trial as of Chrome 148–150 (May 2026) — for localhost you still need the
            flag. In any Chromium browser (Chrome / Edge / Brave 1.89+ / Canary), open{" "}
            <code className="font-mono">chrome://flags/#canvas-draw-element</code>, set it to{" "}
            <em>Enabled</em>, relaunch, and reload this page. Firefox and Safari have not
            implemented it yet. The static card below is what the demo would render through canvas.
          </div>
        </div>
      ) : null}

      <div
        ref={stageRef}
        className="relative h-80 overflow-hidden rounded-xl border border-stroke-faint bg-surface-secondary"
      >
        <canvas
          // @ts-expect-error layoutsubtree is a proposed HTML attribute
          layoutsubtree=""
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
        >
          <div ref={formRef} className="w-72">
            <Card shadow="md">
              <CardHeader>
                <CardTitle>Live form, warped pixels</CardTitle>
                <CardDescription>
                  Typing still works while the canvas distorts the rendering.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-stack-xs">
                <input
                  type="text"
                  placeholder="Your name"
                  className="w-full rounded-md bg-fill-secondary px-inset-xs py-inset-2xs text-sm text-label outline-none inset-ring-1 inset-ring-stroke-faint focus:inset-ring-stroke-strong"
                />
                <Button size="sm" onClick={() => toast.success("Form is real DOM!")}>
                  Submit
                </Button>
              </CardContent>
            </Card>
          </div>
        </canvas>
      </div>

      <label className="flex items-center gap-inline-xs text-sm">
        <span className="w-20 text-label-secondary">amplitude</span>
        <Slider
          min={0}
          max={0.25}
          step={0.01}
          value={[amplitude]}
          onValueChange={(v) => setAmplitude(Array.isArray(v) ? v[0] : v)}
          className="flex-1"
        />
        <span className="w-12 text-right font-mono text-xs">{amplitude.toFixed(2)}</span>
      </label>
    </DemoSection>
  )
}

const entry: DemoEntry = {
  lib: "HTML in Canvas",
  role: "experimental API",
  version: "experimental",
  docsUrl: "https://github.com/WICG/html-in-canvas/blob/main/README.md",
  Component: HtmlInCanvasDemo,
}
export default entry

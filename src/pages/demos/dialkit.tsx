import { motion, type Transition } from "motion/react"
import { useDialKit, gradientToCss } from "@/components/dialkit"
import { DemoSection } from "@/components/DemoSection"
import { SQUIRCLE_RADIUS } from "@/components/squircle"
import type { DemoEntry } from "./types"

function DialkitDemo() {
  const v = useDialKit("Dialkit demo", {
    // Related controls group into a titled, collapsible section — nest them in an
    // object. The section header carries its own ↺ (reset just this group). See
    // DESIGN.md → "Group by product entity, not by widget".
    box: {
      // A slider/toggle needs the object form (not the tuple/boolean shorthand) to
      // carry `help`; the "?" beside the label shows it. Folders use `_help`.
      _help: "The spinning box on the left",
      size: { type: "slider", default: 64, min: 32, max: 160, step: 4, help: "Box edge length, in px" },
      color: { type: "color", default: "#7c3aed", help: "The box fill color" },
      spinning: { type: "toggle", default: true, help: "Rotate the box forever" },
    },
    rotate: { type: "spring", stiffness: 200, damping: 18 },
    direction: { type: "vector", default: { x: 0, y: 0 } },
    gradient: {
      type: "gradient",
      help: "Drives the swatch fill on the right",
      default: {
        gradientType: "linear",
        angle: 90,
        stops: [
          { id: "a", pos: 0, color: "#FFFFFF", opacity: 100 },
          { id: "b", pos: 46, color: "#7CFF3A", opacity: 100 },
          { id: "c", pos: 100, color: "#111111", opacity: 100 },
        ],
      },
    },
    range: { type: "rangeInput", default: { start: 0.000001, end: 8192 } },
    beads: { type: "colorCollection", default: ["#F812F0", "#1D0DC9", "#DD8808", "#C1FF00"] },
    token: { type: "palette", default: { family: 2, shade: 4 } },
    type: { type: "fontPicker", default: { fontId: "dm-sans", fontWeight: 400, fontSize: 16, textCase: "none", color: "#C1FF00", opacity: 82 } },
    grade: { type: "curves", default: { variant: "rgb", rgb: [{ x: 0, y: 0 }, { x: 1, y: 1 }], r: [{ x: 0, y: 0 }, { x: 0.4, y: 0.62 }, { x: 1, y: 1 }], g: [{ x: 0, y: 0 }, { x: 1, y: 1 }], b: [{ x: 0, y: 0 }, { x: 0.6, y: 0.38 }, { x: 1, y: 1 }] } },
    images: { type: "imagePicker", default: [] as string[] },
  })

  return (
    <DemoSection title="Dialkit" lib="dialkit" docsUrl="https://joshpuckett.me/dialkit">
      <p className="text-body text-label-secondary">
        Floating control panel (bottom-right) wired to the box below.{" "}
        <strong className="text-label">Forked into the template</strong> (<code>@/components/dialkit</code>)
        so we own + extend it — beyond the stock sliders / colors / spring editors / toggles it now
        has a <code>vector</code> X/Y pad (drives the box offset) and a <code>gradient</code> editor
        (drives the swatch). Related controls group into collapsible <strong className="text-label">sections</strong>{" "}
        by nesting them in the config (see <code>Box</code>); each section — and the panel — shows a ↺ that
        resets only what has drifted from its default. Tune here, then bake settled values into{" "}
        <code>src/lib/motion.ts</code>. See <code>DESIGN.md → Designing control panels</code> for the control catalog.
      </p>
      <div className="flex items-center gap-inline-m">
        <motion.div
          style={{
            width: v.box.size,
            height: v.box.size,
            background: v.box.color,
            borderRadius: SQUIRCLE_RADIUS.xl,
            x: v.direction.x * 40,
            y: v.direction.y * 40,
          }}
          animate={{ rotate: v.box.spinning ? 360 : 0 }}
          transition={(v.box.spinning ? { ...v.rotate, repeat: Infinity } : v.rotate) as Transition}
        />
        <div className="font-mono text-xs text-label-secondary">
          <div>size: {v.box.size}px</div>
          <div>color: {v.box.color}</div>
          <div>spinning: {String(v.box.spinning)}</div>
          <div>direction: {v.direction.x}, {v.direction.y}</div>
          <div>range: {v.range.start} … {v.range.end}</div>
          <div>beads: {v.beads.length}</div>
          <div>token: f{v.token.family} s{v.token.shade}</div>
          <div>font: {v.type.fontId} {v.type.fontWeight}</div>
          <div>grade: {v.grade.variant}</div>
          <div>images: {v.images.length}</div>
        </div>
        <div
          style={{
            width: 120,
            height: 72,
            borderRadius: SQUIRCLE_RADIUS.xl,
            background: gradientToCss(v.gradient),
          }}
        />
      </div>
    </DemoSection>
  )
}

const entry: DemoEntry = {
  lib: "dialkit",
  role: "live tweaks",
  docsUrl: "https://joshpuckett.me/dialkit",
  Component: DialkitDemo,
}
export default entry

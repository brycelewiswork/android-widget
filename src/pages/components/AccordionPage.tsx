import { Accordion } from "@/components/ui/accordion"
import {
  DocPage,
  DocHeader,
  DocSection,
  DocPropsTable,
  DocTokens,
  DocAccessibility,
  DocGuidelines,
  DocSource,
} from "./_template"

const FAQ_ITEMS = [
  {
    value: "what",
    title: "What is Pretext?",
    body: "A pure-JavaScript multiline text layout engine. It uses canvas font metrics to compute how text wraps at any width, with zero DOM reflow. The output is plain numbers — heights, line counts, line widths — that you can use for layout decisions before the browser paints.",
  },
  {
    value: "why",
    title: "Why predict height instead of using height: auto?",
    body: "Spring physics can't truly animate to `auto` — motion has to freeze the auto-resolved value at the start of the transition, which means no real overshoot and visible glitches if content reflows mid-animation. Animating to a Pretext-predicted pixel height gives proper spring behavior with overshoot.",
  },
  {
    value: "when",
    title: "When should I reach for it?",
    body: "Whenever measurement timing matters: masonry packing in one paint, chat bubbles that hug content, accordions with true spring overshoot, layouts that branch on whether a paragraph overflows N lines.",
  },
]

const COMPACT_ITEMS = [
  { value: "1", title: "Short answer", body: "Yes." },
  { value: "2", title: "Medium answer", body: "It depends on the context, but generally yes — though you'll want to double-check the edge cases." },
  { value: "3", title: "Longer answer", body: "There's nuance here. The behaviour matches the spec under most conditions, but a few legacy quirks survive in older browsers. In those cases the fallback path activates and you get a slightly different presentation." },
]

export function AccordionPage() {
  return (
    <DocPage>
      <DocHeader
        name="Accordion"
        description="Accordion that springs to a Pretext-predicted pixel height instead of height: auto — for true overshoot and reflow-free expansion."
      />

      {/* ── Preview (flat variant — already inside Section card) ── */}
      <DocSection
        title="Preview"
        description="Click items to expand. Heights are predicted by Pretext before the spring fires. Flat variant shown here since this section is already a card."
      >
        <Accordion items={FAQ_ITEMS} variant="flat" defaultExpanded="what" />
      </DocSection>

      {/* ── Cards variant — show the standalone styling ── */}
      <DocSection
        title="Cards variant"
        description="Default styling — each item is its own squircled card. Use when the accordion sits on a plain page background."
        bare
      >
        <Accordion items={FAQ_ITEMS} defaultExpanded="what" />
      </DocSection>

      {/* ── Why it exists ── */}
      <DocSection
        title="Why it exists"
        description="Motion springs can't actually animate to `auto`. Accordion fixes that with predicted heights."
      >
        <div className="space-y-stack-xs text-body text-label-secondary">
          <p>
            Most accordion components transition <code>height: 0</code> →{" "}
            <code>height: auto</code>. Frameworks like Motion fake this by reading the
            auto-resolved pixel height at the start of the transition and animating to that fixed
            number — but it means:
          </p>
          <ul className="list-disc pl-inset-s space-y-stack-3xs">
            <li>Springs can't truly overshoot — they're animating to a frozen target.</li>
            <li>If the body's content reflows during the animation (image loads, font swap), the
              transition snaps.</li>
            <li>Width changes mid-animation cause visible jumps.</li>
          </ul>
          <p>
            Accordion sidesteps all three: it asks Pretext to compute the body's pixel
            height up front (zero DOM reflow), uses that as the spring target, and re-measures
            whenever the container resizes via <code>ResizeObserver</code>.
          </p>
        </div>
      </DocSection>

      {/* ── Responsive demo ── */}
      <DocSection
        title="Width-responsive"
        description="No bodyWidth prop is set — the component measures its container with ResizeObserver and re-runs Pretext on resize. Drag the browser to see it adapt."
      >
        <div className="grid gap-gutter-m lg:grid-cols-2">
          <div>
            <div className="text-xs font-medium text-label-secondary mb-stack-xs">narrow column</div>
            <Accordion items={COMPACT_ITEMS} variant="flat" defaultExpanded="3" />
          </div>
          <div>
            <div className="text-xs font-medium text-label-secondary mb-stack-xs">wider column</div>
            <Accordion items={COMPACT_ITEMS} variant="flat" defaultExpanded="3" />
          </div>
        </div>
      </DocSection>

      {/* ── API ── */}
      <DocSection title="API" description="Props for the Accordion component">
        <DocPropsTable
          props={[
            { prop: "items", type: "AccordionItem[]", default: "—", description: "Array of { value, title, body }. body must be a plain string so Pretext can measure it." },
            { prop: "variant", type: '"cards" | "flat"', default: '"cards"', description: 'Visual style. "cards" — each item is its own squircled card (use on plain page bg). "flat" — borderless rows with divider lines (use when already inside a card surface).' },
            { prop: "bodyWidth", type: "number", default: "auto (measured)", description: "Pixel width Pretext should measure the body at. Omit to auto-measure the container via ResizeObserver." },
            { prop: "bodyPadding", type: "number", default: "32", description: "Horizontal padding subtracted from the measured container width before passing to Pretext. Matches the px-4 on the body." },
            { prop: "defaultExpanded", type: "React.Key | null", default: "null", description: "Initially expanded item value. Pass null for all-collapsed." },
            { prop: "transition", type: "Transition", default: "SPRING.smooth", description: "Motion transition used for both open and close. Defaults to the design system's smooth spring." },
            { prop: "className", type: "string", default: "—", description: "Extra classes for the outer container." },
          ]}
        />
      </DocSection>

      {/* ── Item shape ── */}
      <DocSection title="Item shape" description="Each entry in the items array">
        <DocPropsTable
          props={[
            { prop: "value", type: "React.Key", default: "—", description: "Stable identity for open/close tracking." },
            { prop: "title", type: "string", default: "—", description: "Trigger label." },
            { prop: "body", type: "string", default: "—", description: "Body text. Must be a plain string — Pretext measures it. For richer bodies, fall back to a regular Motion accordion." },
          ]}
        />
      </DocSection>

      {/* ── Tokens ── */}
      <DocSection title="Tokens" description="Design system tokens referenced by this component">
        <DocTokens
          tokens={[
            { swatch: "var(--surface-secondary)", role: "Item background", utility: "bg-surface-secondary" },
            { swatch: "var(--stroke-faint)", role: "Item outline", utility: "inset-ring-stroke-faint/60" },
            { swatch: "var(--label)", role: "Title text", utility: "text-label" },
            { swatch: "var(--label-secondary)", role: "Body text", utility: "text-label-secondary" },
            { swatch: "var(--label-tertiary)", role: "Chevron", utility: "text-label-tertiary" },
            { swatch: "var(--fill-quaternary)", role: "Trigger hover", utility: "hover:bg-fill-quaternary" },
          ]}
        />
      </DocSection>

      {/* ── Accessibility ── */}
      <DocSection title="Accessibility" description="Keyboard and assistive technology support">
        <DocAccessibility
          items={[
            { interaction: "Click / Enter / Space", behavior: "Toggle the focused item open/closed." },
            { interaction: "Tab", behavior: "Move focus between accordion triggers." },
            { interaction: "aria-expanded", behavior: "Set automatically on each trigger button." },
            { interaction: "Body region", behavior: "Mounted only while expanded — screen readers skip closed bodies." },
            { interaction: "Reduced motion", behavior: "Honor the user's prefers-reduced-motion via Motion's MotionConfig if you wrap the page." },
          ]}
        />
      </DocSection>

      {/* ── Guidelines ── */}
      <DocSection title="Guidelines" description="When and how to use this component">
        <DocGuidelines
          items={[
            { type: "do", text: "Use when you want true spring overshoot on open/close — predicted heights let motion physics work properly." },
            { type: "do", text: "Use for FAQ patterns, settings groups, or any list of disclosures with prose bodies." },
            { type: "dont", text: "Don't use when bodies contain images, dynamic embeds, or arbitrary HTML — Pretext only measures plain text. Use the base motion-primitives Accordion in that case." },
            { type: "do", text: "Let bodyWidth auto-measure unless you have a specific reason to fix it — it makes the component responsive for free." },
            { type: "dont", text: "Don't put hundreds of items in one accordion — every item's body is pre-measured. Virtualize, or split into sections." },
            { type: "do", text: "Pair with a custom transition (e.g. SPRING.bouncy) for playful surfaces; defaults to SPRING.smooth." },
          ]}
        />
      </DocSection>

      {/* ── Source ── */}
      <DocSection title="Source" description="Component file and dependencies">
        <DocSource
          source={{
            file: "src/components/ui/pretext-accordion.tsx",
            install: 'npm install @chenglou/pretext  (already in template)',
            primitive: "motion/react (AnimatePresence) + @chenglou/pretext",
            import: 'import { Accordion } from "@/components/ui/accordion"',
          }}
        />
      </DocSection>
    </DocPage>
  )
}

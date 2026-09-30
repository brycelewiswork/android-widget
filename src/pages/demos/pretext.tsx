import { useLayoutEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { DemoSection } from "@/components/DemoSection"
import { Slider } from "@/components/ui/slider"
import { TightText } from "@/components/ui/tight-text"
import { Accordion } from "@/components/ui/accordion"
import { pretextStyleFromElement, usePretextHeight } from "@/lib/pretext"
import type { DemoEntry } from "./types"

const CHAT_MESSAGES: Array<{ from: "them" | "me"; text: string }> = [
  { from: "them", text: "hey, you around for the review at 3?" },
  { from: "me", text: "yes — give me ten to wrap this PR" },
  { from: "them", text: "no rush. I'll bring the figma file too, we can riff on the spacing tokens together." },
  { from: "me", text: "perfect" },
  { from: "them", text: "btw your typography page is gorgeous, I screenshot the optical-sizing section for the team chat" },
  { from: "me", text: "<3" },
]

const PRETEXT_ACCORDION_ITEMS = [
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

function PretextAccordionDemo() {
  return (
    <div className="flex flex-col gap-stack-xs">
      <div className="flex items-baseline justify-between gap-inline-2xs">
        <span className="text-body font-medium text-label-secondary">Springy accordion</span>
        <span className="text-body text-label-tertiary">
          <Link to="/components/accordion" className="underline">full component docs →</Link>
        </span>
      </div>
      <Accordion items={PRETEXT_ACCORDION_ITEMS} variant="flat" defaultExpanded="what" />
    </div>
  )
}

function PretextChatDemo() {
  return (
    <div className="flex flex-col gap-stack-xs">
      <div className="flex items-baseline justify-between gap-inline-2xs">
        <span className="text-body font-medium text-label-secondary">Tight chat bubbles</span>
        <span className="text-body text-label-tertiary">
          left = vanilla <code>max-width</code> &nbsp;·&nbsp; right = <code>&lt;TightText&gt;</code>
        </span>
      </div>
      <div className="grid gap-gutter-s sm:grid-cols-2">
        {(["vanilla", "tight"] as const).map((mode) => (
          <div key={mode} className="flex flex-col gap-stack-2xs rounded-xl bg-fill-secondary p-inset-xs">
            {CHAT_MESSAGES.map((m, i) => {
              const mine = m.from === "me"
              const inner =
                mode === "tight" ? (
                  <TightText maxWidth={260} minWidth={40}>{m.text}</TightText>
                ) : (
                  <span style={{ maxWidth: 260, display: "inline-block" }}>{m.text}</span>
                )
              return (
                <div key={i} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`rounded-2xl px-inset-xs py-1.5 text-body leading-snug inset-ring-1 ${
                      mine
                        ? "bg-blue-500 text-white-100 inset-ring-transparent"
                        : "bg-surface text-label inset-ring-stroke-faint"
                    }`}
                  >
                    {inner}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
      <p className="text-body text-label-secondary">
        Same line count on both sides — but the right column shrinks each bubble to the narrowest
        width that still fits the text in that count. No two-word last lines, no orphan widows.
      </p>
    </div>
  )
}

function PretextHeightProbeDemo() {
  const [text, setText] = useState(
    "Type here to watch Pretext re-measure on every keystroke without a layout reflow.",
  )
  const [width, setWidth] = useState(280)
  const probeRef = useRef<HTMLTextAreaElement>(null)
  const [style, setStyle] = useState<ReturnType<typeof pretextStyleFromElement> | null>(null)
  useLayoutEffect(() => {
    setStyle(pretextStyleFromElement(probeRef.current))
  }, [])
  const measured = usePretextHeight(
    text,
    style?.font ?? "",
    width,
    style?.lineHeight ?? 0,
    { whiteSpace: "pre-wrap" },
  )

  return (
    <div className="flex flex-col gap-stack-xs">
      <div className="flex items-baseline justify-between gap-inline-2xs">
        <span className="text-body font-medium text-label-secondary">Live height probe</span>
        <span className="text-body font-mono text-label-tertiary">
          {measured ? `${measured.lineCount} lines · ${measured.height}px` : "…"}
        </span>
      </div>
      <div className="flex flex-col gap-stack-xs sm:flex-row sm:items-start">
        <textarea
          ref={probeRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="h-32 flex-1 resize-none rounded-md bg-fill-secondary px-inset-xs py-inset-2xs text-body text-label outline-none inset-ring-1 inset-ring-stroke-faint focus:inset-ring-stroke-strong"
        />
        <div className="flex flex-col gap-stack-2xs">
          <div
            className="rounded-md bg-surface p-inset-xs text-body text-label inset-ring-1 inset-ring-stroke-faint"
            style={{ width, whiteSpace: "pre-wrap" }}
          >
            {text}
          </div>
          <label className="flex items-center gap-inline-2xs text-body">
            <span className="text-label-secondary">width</span>
            <Slider
              min={120}
              max={420}
              step={1}
              value={[width]}
              onValueChange={(v) => setWidth(Array.isArray(v) ? v[0] : v)}
              className="w-40"
            />
            <span className="w-12 text-right font-mono text-label-secondary">{width}px</span>
          </label>
        </div>
      </div>
    </div>
  )
}

function PretextDemo() {
  return (
    <DemoSection title="Pretext" lib="@chenglou/pretext" docsUrl="https://chenglou.me/pretext/">
      <p className="text-body text-label-secondary">
        Cheng Lou's pure-JS multiline text measurement engine. No DOM reflow, no{" "}
        <code>getBoundingClientRect</code>, no measure-then-paint double render. Reach for it when
        you need to know a paragraph's <em>height</em> or <em>tight width</em> before the browser
        paints — masonry, virtualized chat, predicted accordion heights, ragless chat bubbles.
        Surfaced in this template as <code>@/lib/pretext</code> hooks, the{" "}
        <code>&lt;TightText&gt;</code> primitive, and the <code>&lt;Accordion&gt;</code> component (
        <Link to="/components/accordion" className="underline">docs</Link>
        ).
      </p>

      <PretextChatDemo />
      <PretextAccordionDemo />
      <PretextHeightProbeDemo />
    </DemoSection>
  )
}

const entry: DemoEntry = {
  lib: "pretext",
  role: "text measure",
  docsUrl: "https://chenglou.me/pretext/",
  Component: PretextDemo,
}
export default entry

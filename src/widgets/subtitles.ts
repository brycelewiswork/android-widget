import Anthropic from "@anthropic-ai/sdk"
import { useEffect } from "react"
import { create } from "zustand"
import { persist } from "zustand/middleware"
import { anthropic } from "@/lib/anthropic"
import type { WidgetStateId } from "./states"

/*
 * Rotating subtitles: some states cycle through a set of short lines instead
 * of one fixed subtitle. Each set starts as a hand-written list; "Generate"
 * asks Claude for a fresh dozen (through the dev proxy in src/lib/anthropic.ts).
 */

/** The 2×2's subtitle line holds ~20 characters before it truncates. */
export const MAX_SUBTITLE_CHARS = 20
/** How long each line shows before the next one rolls in. */
export const ROTATE_MS = 5000

type RotatingSpec = {
  /** What the moment is, for the prompt. */
  brief: string
  fallback: readonly string[]
}

export const ROTATING: Partial<Record<WidgetStateId, RotatingSpec>> = {
  ending: {
    brief: "Their shift ends in under an hour. Finishing a shift is a small celebration for them.",
    fallback: [
      "Finish line in sight",
      "Home stretch",
      "Almost there",
      "Bringing it home",
      "Nearly off the clock",
      "Look at you go",
      "Last lap",
      "Great work today",
      "Solid day's work",
      "Clocking out soon",
      "Strong finish ahead",
      "Nearly done",
    ],
  },
}

const SYSTEM = `You write microcopy for Homebase, a scheduling and time-clock app for hourly workers. The copy is the subtitle line on an Android home-screen widget, under a headline that already states the facts (for example "Shift ends in 15m").

Write lines that make the moment feel warm and a little playful. Keep each one at most ${MAX_SUBTITLE_CHARS} characters including spaces, because it must fit one line on the smallest widget. Use sentence case, no emoji, no surrounding quotes, no trailing period, and no exclamation marks. Keep any humor dry and small — understatement, not hype (no "legend", no "energy", no cheerleading). Stay kind: no sarcasm, no guilt, nothing about pay, managers, or being tired of work. Keep the association with work positive: celebrate and reward the effort they put in, but never suggest work drains them or is something to get away from — no freedom, escape, release, recovering, collapsing on the couch, or "survived it". Make the lines varied in structure so a rotation through them never feels repetitive.`

const SCHEMA = {
  type: "object",
  properties: { subtitles: { type: "array", items: { type: "string" } } },
  required: ["subtitles"],
  additionalProperties: false,
} as const

/** Asks Claude for a dozen lines; keeps only the ones that fit, deduplicated. */
async function requestSubtitles(brief: string): Promise<string[]> {
  const response = await anthropic.beta.messages.create({
    model: "claude-opus-5-5",
    max_tokens: 4000,
    // If Opus 5.5 declines, the API re-runs the request on Opus 4.8 in the same call.
    // (SDK 0.104 types only this array form, not `fallbacks: "default"`.)
    betas: ["server-side-fallback-2026-06-01"],
    fallbacks: [{ model: "claude-opus-4-8" }],
    output_config: { effort: "low", format: { type: "json_schema", schema: SCHEMA } },
    system: SYSTEM,
    messages: [{ role: "user", content: `${brief}\n\nWrite 12 subtitle lines.` }],
  })
  if (response.stop_reason === "refusal") throw new Error("Claude declined this request.")
  const text = response.content.find((b) => b.type === "text")?.text
  if (!text) throw new Error("No subtitles came back.")
  const { subtitles } = JSON.parse(text) as { subtitles: string[] }
  const fit = [...new Set(subtitles.map((s) => s.trim()).filter((s) => s && s.length <= MAX_SUBTITLE_CHARS))]
  if (fit.length < 4) throw new Error("Too few lines fit the widget. Try again.")
  return fit
}

function describeError(error: unknown) {
  if (error instanceof Anthropic.AuthenticationError) return "No API key. Add ANTHROPIC_API_KEY to .env.local and restart pnpm dev."
  if (error instanceof Anthropic.RateLimitError) return "Rate limited. Try again in a moment."
  if (error instanceof Anthropic.APIError) return `API error ${error.status ?? ""}: ${error.message}`.trim()
  return error instanceof Error ? error.message : "Something went wrong."
}

type SubtitleState = {
  /** Generated lines per state; missing → the hand-written fallback. */
  generated: Partial<Record<WidgetStateId, string[]>>
  pending: boolean
  error: string | null
  /** Which line is showing; advances every ROTATE_MS. */
  index: number
  generate: (state: WidgetStateId) => Promise<void>
  resetToBuiltIn: (state: WidgetStateId) => void
  advance: () => void
}

export const useSubtitleStore = create<SubtitleState>()(
  persist(
    (set) => ({
      generated: {},
      pending: false,
      error: null,
      index: 0,
      generate: async (state) => {
        const spec = ROTATING[state]
        if (!spec) return
        set({ pending: true, error: null })
        try {
          const lines = await requestSubtitles(spec.brief)
          set((s) => ({ generated: { ...s.generated, [state]: lines }, pending: false, index: 0 }))
        } catch (error) {
          set({ pending: false, error: describeError(error) })
        }
      },
      resetToBuiltIn: (state) =>
        set((s) => {
          const { [state]: _, ...rest } = s.generated
          return { generated: rest, index: 0, error: null }
        }),
      advance: () => set((s) => ({ index: s.index + 1 })),
    }),
    { name: "android-widget:subtitles", partialize: (s) => ({ generated: s.generated }) },
  ),
)

/** The lines a state rotates through, or undefined if it has a fixed subtitle. */
export function useSubtitleLines(state: WidgetStateId): readonly string[] | undefined {
  const generated = useSubtitleStore((s) => s.generated[state])
  return ROTATING[state] ? (generated ?? ROTATING[state]!.fallback) : undefined
}

/** The line showing right now for `state`. */
export function useRotatingSubtitle(state: WidgetStateId): string | undefined {
  const lines = useSubtitleLines(state)
  const index = useSubtitleStore((s) => s.index)
  return lines ? lines[index % lines.length] : undefined
}

/** Advances the rotation while a rotating state is on screen. Mount once per page. */
export function useSubtitleDriver(state: WidgetStateId) {
  const rotating = !!ROTATING[state]
  useEffect(() => {
    if (!rotating) return
    const id = window.setInterval(() => useSubtitleStore.getState().advance(), ROTATE_MS)
    return () => window.clearInterval(id)
  }, [rotating])
}

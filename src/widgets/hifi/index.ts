import type { ReactNode } from "react"
import type { Fidelity } from "@/store/useWidgetStore"
import type { WidgetSize } from "../sizes"
import type { StateContent } from "../states"
import { Hifi2x2, Hifi4x1, Hifi4x2, Hifi4x3 } from "./HifiLayouts"

/** A size's layout. Every state renders through it; `content` carries the state's copy + slots. */
export type WidgetLayout = (props: { content: StateContent }) => ReactNode

/*
 * Hi-fi layouts, from Figma (./HifiLayouts). Same `WidgetLayout` signature as
 * the wireframes, so every state comes for free. A size without an entry
 * falls back to its wireframe so every page keeps rendering.
 */
export const HIFI: Partial<Record<WidgetSize, WidgetLayout>> = {
  "2x2": Hifi2x2,
  "4x1": Hifi4x1,
  "4x2": Hifi4x2,
  "4x3": Hifi4x3,
}

/** Whether `size` has its own layout at `fidelity` (vs. the wireframe fallback). */
export const hasLayout = (fidelity: Fidelity, size: WidgetSize) =>
  fidelity === "wireframe" || size in HIFI

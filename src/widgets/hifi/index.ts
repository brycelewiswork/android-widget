import type { ReactNode } from "react"
import type { Fidelity } from "@/store/useWidgetStore"
import type { WidgetSize } from "../sizes"
import type { StateContent } from "../states"

/** A size's layout. Every state renders through it; `content` carries the state's copy + slots. */
export type WidgetLayout = (props: { content: StateContent }) => ReactNode

/*
 * Hi-fi layouts, registered one size at a time. Build each as its own
 * component in this folder (same `WidgetLayout` signature as the wireframes,
 * so all eleven states come for free) and add it here. A size without an entry
 * falls back to its wireframe so every page keeps rendering.
 */
export const HIFI: Partial<Record<WidgetSize, WidgetLayout>> = {}

/** Whether `size` has its own layout at `fidelity` (vs. the wireframe fallback). */
export const hasLayout = (fidelity: Fidelity, size: WidgetSize) =>
  fidelity === "wireframe" || size in HIFI

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { PaletteId } from "@/widgets/hifi/palettes"

/** Which design pass to render: the wireframes, or the hi-fi pass. */
export type Fidelity = "wireframe" | "hifi"

/** How finely the live widget counts time: every minute, or in calm steps (see src/widgets/live.ts). */
export type Precision = "exact" | "calm"

type WidgetViewState = {
  fidelity: Fidelity
  /** Debug overlay: outline every box inside the widget. */
  showBounds: boolean
  precision: Precision
  /** The hi-fi widget's Material 3 colour scheme. */
  palette: PaletteId
  setFidelity: (fidelity: Fidelity) => void
  setShowBounds: (showBounds: boolean) => void
  setPrecision: (precision: Precision) => void
  setPalette: (palette: PaletteId) => void
}

// Hi-fi by default: Figma is the source of truth now.
const DEFAULTS = { fidelity: "hifi", showBounds: false, precision: "calm", palette: "purple" } as const

export const useWidgetStore = create<WidgetViewState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      setFidelity: (fidelity) => set({ fidelity }),
      setShowBounds: (showBounds) => set({ showBounds }),
      setPrecision: (precision) => set({ precision }),
      setPalette: (palette) => set({ palette }),
    }),
    {
      name: "android-widget:view",
      version: 3,
      // Keep whatever fields still exist; new ones take their defaults.
      migrate: (persisted) => ({ ...DEFAULTS, ...(persisted as object) }) as WidgetViewState,
    },
  ),
)

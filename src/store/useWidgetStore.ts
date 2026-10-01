import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { IconName } from "@/widgets/states"

/** Which design pass to render: the wireframes, or the hi-fi pass. */
export type Fidelity = "wireframe" | "hifi"

/** How finely the live widget counts time: every minute, or in calm steps (see src/widgets/live.ts). */
export type Precision = "exact" | "calm"

type WidgetViewState = {
  fidelity: Fidelity
  /** Debug overlay: outline every box inside the widget. */
  showBounds: boolean
  precision: Precision
  /**
   * The live widget's button that's waiting on the server (its icon), after a
   * tap: it shows a spinner until the action lands. Session-only.
   */
  busy: IconName | null
  setBusy: (busy: IconName | null) => void
  setFidelity: (fidelity: Fidelity) => void
  setShowBounds: (showBounds: boolean) => void
  setPrecision: (precision: Precision) => void
}

const DEFAULTS = { fidelity: "wireframe", showBounds: false, precision: "calm" } as const

export const useWidgetStore = create<WidgetViewState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      setFidelity: (fidelity) => set({ fidelity }),
      setShowBounds: (showBounds) => set({ showBounds }),
      setPrecision: (precision) => set({ precision }),
      busy: null,
      setBusy: (busy) => set({ busy }),
    }),
    {
      name: "android-widget:view",
      version: 3,
      // Keep whatever fields still exist; new ones take their defaults.
      migrate: (persisted) => ({ ...DEFAULTS, ...(persisted as object) }) as WidgetViewState,
      partialize: ({ busy: _busy, setBusy: _setBusy, ...rest }) => rest,
    },
  ),
)

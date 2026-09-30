import { create } from "zustand"
import { toast } from "sonner"
import {
  type FluidConfig,
  FLUID_DEFAULTS,
  loadFluid,
  saveFluid,
  applyFluid,
} from "@/lib/fluid"

/**
 * Single shared source of truth for the fluid scale. Every reference page
 * (/foundations, /typography, /spacing, /grid) reads and mutates THIS store, so
 * an edit on one page is reflected live everywhere — the Foundations values, the
 * Type scale, and the Space scale can never drift apart. Each mutation applies
 * the primitives to `:root` immediately (live preview across the running sketch);
 * `save` persists to localStorage; `reset` restores the Comfortable defaults.
 *
 * (Previously each page held its own `useState(loadFluid())`, so unsaved edits
 * didn't propagate and navigating re-applied a stale copy. A store fixes that.)
 */
type FluidStore = {
  cfg: FluidConfig
  setCfg: (cfg: FluidConfig) => void
  patchViewport: (patch: Partial<FluidConfig["viewport"]>) => void
  patchBase: (patch: Partial<FluidConfig["base"]>) => void
  patchRatio: (patch: Partial<FluidConfig["ratio"]>) => void
  patchType: (patch: Partial<FluidConfig["type"]>) => void
  patchSpace: (patch: Partial<FluidConfig["space"]>) => void
  save: () => void
  reset: () => void
}

/** Apply the config to the DOM, then return it for the store update. */
function applied(cfg: FluidConfig): { cfg: FluidConfig } {
  applyFluid(cfg)
  return { cfg }
}

export const useFluidStore = create<FluidStore>((set, get) => ({
  cfg: loadFluid(),
  setCfg: (cfg) => set(applied(cfg)),
  patchViewport: (patch) => set(applied({ ...get().cfg, viewport: { ...get().cfg.viewport, ...patch } })),
  patchBase: (patch) => set(applied({ ...get().cfg, base: { ...get().cfg.base, ...patch } })),
  patchRatio: (patch) => set(applied({ ...get().cfg, ratio: { ...get().cfg.ratio, ...patch } })),
  patchType: (patch) => set(applied({ ...get().cfg, type: { ...get().cfg.type, ...patch } })),
  patchSpace: (patch) => set(applied({ ...get().cfg, space: { ...get().cfg.space, ...patch } })),
  save: () => {
    saveFluid(get().cfg)
    toast.success("Fluid scale saved for this sketch")
  },
  reset: () => {
    const cfg = structuredClone(FLUID_DEFAULTS)
    applyFluid(cfg)
    set({ cfg })
    toast("Reset to Comfortable defaults")
  },
}))

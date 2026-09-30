import type * as React from "react"

export type DemoEntry = {
  /** Library name shown in the stack grid + Demo badge. */
  lib: string
  /** Short role descriptor (one-line, used in the grid). */
  role: string
  /** Optional pinned version shown alongside the lib badge. */
  version?: string
  /** Optional docs link surfaced on the demo card. */
  docsUrl?: string
  /**
   * Live demo. Omit for infrastructure-only entries that should
   * appear in the stack grid but have no interactive demo
   * (e.g. Vite, TypeScript, Tailwind).
   */
  Component?: React.ComponentType
}

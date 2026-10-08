/**
 * The widget sizes this sketch designs for. Width × height are in dp, read
 * from the Figma frames (Android---iOS-Widgets) and rendered 1:1 as CSS px.
 */
export const WIDGET_SIZES = {
  "2x2": { width: 190, height: 214, figmaNode: "43:474" },
  "4x1": { width: 395, height: 70, figmaNode: "43:443" },
  "4x2": { width: 395, height: 214, figmaNode: "43:384" },
  "4x3": { width: 395, height: 329, figmaNode: "43:284" },
} as const

export type WidgetSize = keyof typeof WIDGET_SIZES

/**
 * The hi-fi sizes, from the Figma component set "Widget" (Android---iOS-Widgets
 * 103:1800, Documentation page) — the source of truth now. The wireframes keep
 * the earlier frames above.
 */
export const HIFI_SIZES: Record<WidgetSize, { width: number; height: number; figmaNode: string }> = {
  "2x2": { width: 176, height: 224, figmaNode: "104:8085" },
  "4x1": { width: 368, height: 104, figmaNode: "104:8257" },
  "4x2": { width: 368, height: 224, figmaNode: "103:1799" },
  "4x3": { width: 368, height: 344, figmaNode: "107:8467" },
}

/** A size's dimensions at a fidelity. */
export const sizeAt = (size: WidgetSize, fidelity: "wireframe" | "hifi") => (fidelity === "hifi" ? HIFI_SIZES : WIDGET_SIZES)[size]

export const WIDGET_SIZE_ORDER = Object.keys(WIDGET_SIZES) as WidgetSize[]

/** "4x2" → "4 × 2" for display. */
export const sizeLabel = (size: WidgetSize) => size.replace("x", " × ")

export const FIGMA_FILE_URL = "https://www.figma.com/design/bLtKi0llvyrNFArgvB3BKs/Android---iOS-Widgets"

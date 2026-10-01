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

export const WIDGET_SIZE_ORDER = Object.keys(WIDGET_SIZES) as WidgetSize[]

/** "4x2" → "4 × 2" for display. */
export const sizeLabel = (size: WidgetSize) => size.replace("x", " × ")

export const FIGMA_FILE_URL = "https://www.figma.com/design/bLtKi0llvyrNFArgvB3BKs/Android---iOS-Widgets"

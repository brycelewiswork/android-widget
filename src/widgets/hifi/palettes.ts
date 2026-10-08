import type { CSSProperties } from "react"

/*
 * Material 3 colour schemes for the hi-fi widget, light and dark. Purple is
 * Figma's own (Android---iOS-Widgets, Documentation → Color). The other seven
 * are generated the same way Android generates a scheme from a wallpaper seed
 * (Material Color Utilities, tonal-spot: primary at chroma 36, secondary at 16)
 * and mapped to the same roles Figma uses:
 *   surface      secondary 95  (dark: secondary ~1.3, Figma's #070215)
 *   primary      primary 40    (dark: primary 80)   — the number, primary buttons
 *   onPrimary    primary 100   (dark: primary 20)
 *   container    secondary 90  (dark: secondary 30) — secondary buttons, the track
 *   onContainer  secondary 30  (dark: secondary 90) — text
 */

type Roles = { surface: string; primary: string; onPrimary: string; container: string; onContainer: string }
export type Palette = { id: PaletteId; label: string; light: Roles; dark: Roles }

export const PALETTE_IDS = ["purple", "blue", "teal", "green", "yellow", "orange", "red", "pink"] as const
export type PaletteId = (typeof PALETTE_IDS)[number]

export const PALETTES: Record<PaletteId, Palette> = {
  purple: {
    id: "purple",
    label: "Purple",
    light: { surface: "#f7edff", primary: "#6b548d", onPrimary: "#ffffff", container: "#ebddf7", onContainer: "#4c4357" },
    dark: { surface: "#070215", primary: "#d6bbfb", onPrimary: "#3b255a", container: "#4c4357", onContainer: "#ebddf7" },
  },
  blue: {
    id: "blue",
    label: "Blue",
    light: { surface: "#eaf1ff", primary: "#36618e", onPrimary: "#ffffff", container: "#d7e3f8", onContainer: "#3b4858" },
    dark: { surface: "#00050f", primary: "#a0cafd", onPrimary: "#003258", container: "#3b4858", onContainer: "#d7e3f8" },
  },
  teal: {
    id: "teal",
    label: "Teal",
    light: { surface: "#daf6f5", primary: "#006a6a", onPrimary: "#ffffff", container: "#cce8e7", onContainer: "#324b4b" },
    dark: { surface: "#000606", primary: "#80d5d4", onPrimary: "#003737", container: "#324b4b", onContainer: "#cce8e7" },
  },
  green: {
    id: "green",
    label: "Green",
    light: { surface: "#e7f6d9", primary: "#446732", onPrimary: "#ffffff", container: "#d8e7cb", onContainer: "#3e4a35" },
    dark: { surface: "#010600", primary: "#a9d291", onPrimary: "#173807", container: "#3e4a35", onContainer: "#d8e7cb" },
  },
  yellow: {
    id: "yellow",
    label: "Yellow",
    light: { surface: "#fcf1ca", primary: "#6d5e0f", onPrimary: "#ffffff", container: "#eee2bc", onContainer: "#4d472a" },
    dark: { surface: "#070500", primary: "#dac66f", onPrimary: "#393000", container: "#4d472a", onContainer: "#eee2bc" },
  },
  orange: {
    id: "orange",
    label: "Orange",
    light: { surface: "#ffeee1", primary: "#865319", onPrimary: "#ffffff", container: "#ffdcbe", onContainer: "#59422d" },
    dark: { surface: "#0b0300", primary: "#fdb975", onPrimary: "#4a2800", container: "#59422d", onContainer: "#ffdcbe" },
  },
  red: {
    id: "red",
    label: "Red",
    light: { surface: "#ffedea", primary: "#904a42", onPrimary: "#ffffff", container: "#ffdad5", onContainer: "#5d3f3b" },
    dark: { surface: "#0f0201", primary: "#ffb4aa", onPrimary: "#561e18", container: "#5d3f3b", onContainer: "#ffdad5" },
  },
  pink: {
    id: "pink",
    label: "Pink",
    light: { surface: "#ffecf0", primary: "#8c4a60", onPrimary: "#ffffff", container: "#ffd9e2", onContainer: "#5a3f47" },
    dark: { surface: "#0f0205", primary: "#ffb0c8", onPrimary: "#541d32", container: "#5a3f47", onContainer: "#ffd9e2" },
  },
}

const KEBAB: Record<keyof Roles, string> = { surface: "surface", primary: "primary", onPrimary: "on-primary", container: "container", onContainer: "on-container" }

/** A palette as CSS variables: `--hl-*` for light, `--hd-*` for dark; widget.css picks one set by theme. */
export function paletteVars(id: PaletteId): CSSProperties {
  const p = PALETTES[id]
  const vars: Record<string, string> = {}
  for (const role of Object.keys(KEBAB) as (keyof Roles)[]) {
    vars[`--hl-${KEBAB[role]}`] = p.light[role]
    vars[`--hd-${KEBAB[role]}`] = p.dark[role]
  }
  return vars as CSSProperties
}

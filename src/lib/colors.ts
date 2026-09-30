import { useCallback, useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { ALL_TOKENS, type ThemeMode, type Token, wrapOklch } from "./color-tokens"
import { oklchCss, parseToOklch } from "./color-convert"

const STORAGE_KEY = "color-overrides"
const VERSION = 1

export type ColorOverrides = {
  version: number
  light: Record<string, string> // cssVar -> oklch() css value
  dark: Record<string, string>
}

const EMPTY: ColorOverrides = { version: VERSION, light: {}, dark: {} }

// ─── Internal helpers ────────────────────────────────────────────────────────
// These are implementation details of `useColorOverrides` and `initColorSystem`
// and are intentionally not exported. The hook is the only seam.

function loadColorOverrides(): ColorOverrides {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...EMPTY, light: {}, dark: {} }
    const parsed = JSON.parse(raw) as Partial<ColorOverrides>
    return {
      version: parsed.version ?? VERSION,
      light: parsed.light ?? {},
      dark: parsed.dark ?? {},
    }
  } catch {
    return { ...EMPTY, light: {}, dark: {} }
  }
}

function saveColorOverrides(o: ColorOverrides) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(o))
}

/**
 * Apply only the overrides matching the currently-active theme.
 * Tokens without an override get their `:root` / `.dark` value removed from
 * inline style so the stylesheet wins again.
 */
function applyColorOverrides(o: ColorOverrides, mode: ThemeMode) {
  const root = document.documentElement
  const active = mode === "dark" ? o.dark : o.light
  const inactive = mode === "dark" ? o.light : o.dark

  // Remove any inline overrides from the *other* mode first, so switching
  // themes doesn't leak. (Tokens edited in dark must not affect light.)
  for (const cssVar of Object.keys(inactive)) {
    if (!(cssVar in active)) root.style.removeProperty(cssVar)
  }

  for (const token of ALL_TOKENS) {
    const value = active[token.cssVar]
    if (value) root.style.setProperty(token.cssVar, value)
    else root.style.removeProperty(token.cssVar)
  }
}

function setOverride(o: ColorOverrides, mode: ThemeMode, cssVar: string, value: string): ColorOverrides {
  const slot = mode === "dark" ? "dark" : "light"
  return { ...o, [slot]: { ...o[slot], [cssVar]: value } }
}

function clearOverride(o: ColorOverrides, mode: ThemeMode, cssVar: string): ColorOverrides {
  const slot = mode === "dark" ? "dark" : "light"
  const next = { ...o[slot] }
  delete next[cssVar]
  return { ...o, [slot]: next }
}

function clearAllOverrides(o: ColorOverrides, mode: ThemeMode | "both"): ColorOverrides {
  if (mode === "both") return { ...EMPTY, light: {}, dark: {} }
  const slot = mode === "dark" ? "dark" : "light"
  return { ...o, [slot]: {} }
}

function resolveTokenValue(o: ColorOverrides, token: Token, mode: ThemeMode): string {
  const override = (mode === "dark" ? o.dark : o.light)[token.cssVar]
  if (override) return override
  return wrapOklch(token.base[mode])
}

function isOverriddenInMode(o: ColorOverrides, cssVar: string, mode: ThemeMode): boolean {
  return Boolean((mode === "dark" ? o.dark : o.light)[cssVar])
}

function isOverriddenAnyMode(o: ColorOverrides, cssVar: string): boolean {
  return Boolean(o.light[cssVar] || o.dark[cssVar])
}

function exportAsJson(o: ColorOverrides): string {
  return JSON.stringify(o, null, 2)
}

function exportAsCss(o: ColorOverrides): string {
  const lightLines = Object.entries(o.light).map(([k, v]) => `  ${k}: ${v};`).join("\n")
  const darkLines = Object.entries(o.dark).map(([k, v]) => `  ${k}: ${v};`).join("\n")
  const parts: string[] = []
  if (lightLines) parts.push(`:root {\n${lightLines}\n}`)
  if (darkLines) parts.push(`.dark {\n${darkLines}\n}`)
  return parts.join("\n\n") || "/* no overrides */"
}

export type ImportResult = { applied: number; skipped: number; overrides: ColorOverrides }

function parseImportJson(raw: string): ImportResult | null {
  let parsed: Partial<ColorOverrides>
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }
  const known = new Set(ALL_TOKENS.map((t) => t.cssVar))
  let applied = 0
  let skipped = 0
  const light: Record<string, string> = {}
  const dark: Record<string, string> = {}
  for (const [k, v] of Object.entries(parsed.light ?? {})) {
    if (typeof v !== "string") continue
    if (known.has(k) && parseToOklch(v)) {
      const o = parseToOklch(v)
      light[k] = o ? oklchCss(o) : v
      applied++
    } else skipped++
  }
  for (const [k, v] of Object.entries(parsed.dark ?? {})) {
    if (typeof v !== "string") continue
    if (known.has(k) && parseToOklch(v)) {
      const o = parseToOklch(v)
      dark[k] = o ? oklchCss(o) : v
      applied++
    } else skipped++
  }
  return { applied, skipped, overrides: { version: VERSION, light, dark } }
}

// ─── Bootstrap ───────────────────────────────────────────────────────────────

/**
 * Called once from main.tsx so stored overrides take effect on first paint.
 * Runs before React mounts; the hook below takes over after.
 */
export function initColorSystem() {
  const overrides = loadColorOverrides()
  const mode: ThemeMode = document.documentElement.classList.contains("dark") ? "dark" : "light"
  applyColorOverrides(overrides, mode)
}

// ─── Public hook ─────────────────────────────────────────────────────────────

/**
 * The single seam for reading and mutating the color-override system.
 * Hides load/save/apply/DOM/localStorage from callers. Persists every change.
 *
 * `resolve(token)` returns the active CSS value (override or base).
 * `set` / `clear` / `clearAll` mutate. `isOverridden` reports current-mode state;
 * `isOverriddenAnyMode` reports whether the token is edited in *either* mode.
 * `importJson` returns the parse result and applies it on success.
 */
export function useColorOverrides() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const mode: ThemeMode = mounted && resolvedTheme === "dark" ? "dark" : "light"

  const [overrides, setOverrides] = useState<ColorOverrides>(() => loadColorOverrides())

  useEffect(() => {
    if (!mounted) return
    applyColorOverrides(overrides, mode)
  }, [overrides, mode, mounted])

  const persist = useCallback((next: ColorOverrides) => {
    setOverrides(next)
    saveColorOverrides(next)
  }, [])

  return {
    mode,
    mounted,
    resolve: (token: Token) => resolveTokenValue(overrides, token, mode),
    isOverridden: (cssVar: string) => isOverriddenInMode(overrides, cssVar, mode),
    isOverriddenAnyMode: (cssVar: string) => isOverriddenAnyMode(overrides, cssVar),
    set: (token: Token, value: string) =>
      persist(setOverride(overrides, mode, token.cssVar, value)),
    clear: (token: Token) =>
      persist(clearOverride(overrides, mode, token.cssVar)),
    clearAll: () => persist(clearAllOverrides(overrides, "both")),
    exportJson: () => exportAsJson(overrides),
    exportCss: () => exportAsCss(overrides),
    importJson: (raw: string): ImportResult | null => {
      const result = parseImportJson(raw)
      if (result) persist(result.overrides)
      return result
    },
  }
}

import * as React from "react"
import {
  getColorSync,
  getPaletteSync,
  getSwatchesSync,
  type Color,
  type SwatchMap,
  type SyncExtractionOptions,
} from "colorthief"

// Re-export the upstream API so call-sites can pull everything from one
// place alongside other shadcn-ish imports.
export {
  getColorSync,
  getPaletteSync,
  getSwatchesSync,
  observe,
  getColor,
  getPalette,
  getSwatches,
  type Color,
  type SwatchMap,
} from "colorthief"

// ---------------------------------------------------------------------------
// useImagePalette — React hook that runs colorthief once an image has loaded
// and returns dominant/palette/swatches plus a small loading/error state.
// ---------------------------------------------------------------------------

export interface UseImagePaletteOptions extends SyncExtractionOptions {
  /** Skip extraction. Useful for waiting on a prop. */
  enabled?: boolean
}

export interface ImagePaletteResult {
  dominant: Color | null
  palette: Color[] | null
  swatches: SwatchMap | null
  loading: boolean
  error: Error | null
}

export function useImagePalette(
  ref: React.RefObject<HTMLImageElement | null>,
  options: UseImagePaletteOptions = {},
): ImagePaletteResult {
  const { enabled = true, ...extractOpts } = options
  const [result, setResult] = React.useState<ImagePaletteResult>({
    dominant: null,
    palette: null,
    swatches: null,
    loading: true,
    error: null,
  })

  // Stable key for the dependency array — option changes refresh the palette
  // without re-running every render.
  const optsKey = JSON.stringify(extractOpts)

  React.useEffect(() => {
    if (!enabled) {
      setResult((r) => ({ ...r, loading: false }))
      return
    }
    const img = ref.current
    if (!img) return

    let cancelled = false

    const run = () => {
      if (cancelled) return
      try {
        const dominant = getColorSync(img, extractOpts)
        const palette = getPaletteSync(img, extractOpts)
        const swatches = getSwatchesSync(img, extractOpts)
        if (!cancelled) {
          setResult({ dominant, palette, swatches, loading: false, error: null })
        }
      } catch (err) {
        if (!cancelled) {
          setResult({
            dominant: null,
            palette: null,
            swatches: null,
            loading: false,
            error: err as Error,
          })
        }
      }
    }

    const onLoad = () => {
      // New image just finished loading — flag loading then extract.
      if (!cancelled) setResult((r) => ({ ...r, loading: true }))
      run()
    }
    const onError = () => {
      if (cancelled) return
      setResult({
        dominant: null,
        palette: null,
        swatches: null,
        loading: false,
        error: new Error("Image failed to load"),
      })
    }

    // Always listen so subsequent src changes re-trigger extraction. The
    // browser fires `load` on every successful (re)load.
    img.addEventListener("load", onLoad)
    img.addEventListener("error", onError)

    // If the image is already loaded by the time this effect runs, extract
    // immediately — the load event won't fire again for this src.
    if (img.complete && img.naturalWidth > 0) {
      run()
    }

    return () => {
      cancelled = true
      img.removeEventListener("load", onLoad)
      img.removeEventListener("error", onError)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, enabled, optsKey])

  return result
}

// ---------------------------------------------------------------------------
// harmonies — derive complementary / analogous / triadic / split-complementary
// from a hex string via HSL hue rotation. No deps, ~30 lines of math.
// ---------------------------------------------------------------------------

export interface Harmonies {
  complementary: string
  analogous: [string, string]
  triadic: [string, string]
  splitComplementary: [string, string]
}

export function harmonies(hex: string): Harmonies {
  const { h, s, l } = hexToHsl(hex)
  return {
    complementary: hslToHex({ h: (h + 180) % 360, s, l }),
    analogous: [
      hslToHex({ h: (h + 30) % 360, s, l }),
      hslToHex({ h: (h + 330) % 360, s, l }),
    ],
    triadic: [
      hslToHex({ h: (h + 120) % 360, s, l }),
      hslToHex({ h: (h + 240) % 360, s, l }),
    ],
    splitComplementary: [
      hslToHex({ h: (h + 150) % 360, s, l }),
      hslToHex({ h: (h + 210) % 360, s, l }),
    ],
  }
}

type Hsl = { h: number; s: number; l: number }

function hexToHsl(hex: string): Hsl {
  const m = hex.replace("#", "").match(/.{1,2}/g)
  if (!m || m.length < 3) return { h: 0, s: 0, l: 0 }
  const [r, g, b] = m.slice(0, 3).map((p) => parseInt(p, 16) / 255)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return { h: 0, s: 0, l: l * 100 }
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  switch (max) {
    case r:
      h = (g - b) / d + (g < b ? 6 : 0)
      break
    case g:
      h = (b - r) / d + 2
      break
    case b:
      h = (r - g) / d + 4
      break
  }
  return { h: h * 60, s: s * 100, l: l * 100 }
}

function hslToHex({ h, s, l }: Hsl): string {
  const sN = s / 100
  const lN = l / 100
  const c = (1 - Math.abs(2 * lN - 1)) * sN
  const hp = h / 60
  const x = c * (1 - Math.abs((hp % 2) - 1))
  // hp is always in [0, 6) (h ∈ [0, 360)), so this chain is exhaustive.
  const [r, g, b] =
    hp < 1 ? [c, x, 0]
    : hp < 2 ? [x, c, 0]
    : hp < 3 ? [0, c, x]
    : hp < 4 ? [0, x, c]
    : hp < 5 ? [x, 0, c]
    : [c, 0, x]
  const m = lN - c / 2
  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0")
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

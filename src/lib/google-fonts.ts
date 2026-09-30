import { useEffect, useState } from "react"

/**
 * The full Google Fonts catalogue for the /typography font pickers.
 *
 * The list is fetched once from the Fontsource API (CORS-enabled, ~2k Google
 * families, always current — Google's own metadata endpoint blocks CORS). It's
 * cached at module scope so every picker shares one fetch, and falls back to a
 * curated popular list if the network is unavailable. Popular families are
 * hoisted to the top; the rest follow alphabetically.
 */

const POPULAR = [
  "Inter", "Inter Tight", "Roboto", "Open Sans", "Lato", "Montserrat", "Poppins",
  "Source Sans 3", "Raleway", "Nunito", "Work Sans", "Manrope", "Rubik", "Karla",
  "Mulish", "Figtree", "Plus Jakarta Sans", "Space Grotesk", "Sora", "Outfit",
  "Archivo", "Oswald", "Bebas Neue", "Playfair Display", "Merriweather", "Lora",
  "PT Serif", "Bitter", "Source Serif 4", "EB Garamond", "Libre Baskerville",
  "Cormorant", "Fraunces", "Spectral", "Newsreader", "IBM Plex Sans",
  "IBM Plex Serif", "JetBrains Mono", "Space Mono", "Roboto Mono", "Fira Code",
]

/** DM Sans (bundled default) is always first, then popular families. */
export const GOOGLE_FONTS_FALLBACK = ["DM Sans", ...POPULAR]

let cache: string[] | null = null
let inflight: Promise<string[]> | null = null

async function fetchGoogleFonts(): Promise<string[]> {
  if (cache) return cache
  if (inflight) return inflight
  inflight = fetch("https://api.fontsource.org/v1/fonts")
    .then((r) => r.json())
    .then((list: Array<{ family: string; type: string }>) => {
      const families = list.filter((f) => f.type === "google").map((f) => f.family)
      const set = new Set(families)
      const popularPresent = POPULAR.filter((f) => set.has(f))
      const seen = new Set(["DM Sans", ...popularPresent])
      const rest = families.filter((f) => !seen.has(f)).sort((a, b) => a.localeCompare(b))
      cache = ["DM Sans", ...popularPresent, ...rest]
      return cache
    })
    .catch(() => {
      cache = GOOGLE_FONTS_FALLBACK
      return cache
    })
  return inflight
}

/** Returns the (cached) catalogue, kicking off the one-time fetch on first use. */
export function useGoogleFonts(): { fonts: string[]; loading: boolean } {
  const [fonts, setFonts] = useState<string[]>(cache ?? GOOGLE_FONTS_FALLBACK)
  const [loading, setLoading] = useState(!cache)
  useEffect(() => {
    if (cache) {
      setFonts(cache)
      setLoading(false)
      return
    }
    let alive = true
    fetchGoogleFonts().then((f) => {
      if (alive) {
        setFonts(f)
        setLoading(false)
      }
    })
    return () => {
      alive = false
    }
  }, [])
  return { fonts, loading }
}

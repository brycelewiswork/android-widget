import { useEffect, useRef, useState } from "react"
import { DemoSection } from "@/components/DemoSection"
import { LinearBlur } from "@/components/ui/progressive-blur"
import { useImagePalette, harmonies, type Color } from "@/components/ui/color-thief"
import type { DemoEntry } from "./types"

const ALBUM_SAMPLES = [
  { label: "Charli XCX — BRAT", src: "/images/album-art/12_charli-xcx_brat.jpg" },
  { label: "Lana Del Rey — NFR", src: "/images/album-art/06_lana-del-rey_norman-fucking-rockwell.jpg" },
  { label: "SZA — Ctrl", src: "/images/album-art/08_sza_ctrl.jpg" },
  { label: "Tyler — Call Me If You Get Lost", src: "/images/album-art/21_tyler-the-creator_call-me-if-you-get-lost.jpg" },
  { label: "Rosalía — Motomami", src: "/images/album-art/17_rosalia_motomami.jpg" },
  { label: "Weyes Blood — Titanic Rising", src: "/images/album-art/41_weyes-blood_titanic-rising.jpg" },
] as const

function Swatch({ color, active, onClick }: { color: Color; active: boolean; onClick: () => void }) {
  const hex = color.hex()
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-inline-2xs rounded-md border px-inset-2xs py-inset-3xs text-xs transition-colors ${
        active ? "border-label" : "border-stroke-faint/60 hover:border-label/40"
      }`}
    >
      <span className="size-4 rounded-sm" style={{ backgroundColor: hex }} />
      <span className="font-mono">{hex}</span>
    </button>
  )
}

function HarmonyChip({ label, hex }: { label: string; hex: string }) {
  return (
    <div className="flex items-center gap-inline-2xs rounded-md border border-stroke-faint/60 p-inset-2xs text-xs">
      <span className="size-6 rounded-sm" style={{ backgroundColor: hex }} />
      <div className="flex flex-col">
        <span className="text-[10px] text-label-secondary">{label}</span>
        <span className="font-mono">{hex}</span>
      </div>
    </div>
  )
}

function ColorFromImageDemo() {
  const imgRef = useRef<HTMLImageElement>(null)
  const [src, setSrc] = useState<string>(ALBUM_SAMPLES[0].src)
  const [userPickedHex, setUserPickedHex] = useState<string | null>(null)
  const { dominant, palette, swatches, loading, error } = useImagePalette(imgRef, {
    colorCount: 6,
    colorSpace: "oklch",
  })

  useEffect(() => {
    setUserPickedHex(null)
  }, [src])

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSrc(URL.createObjectURL(file))
  }

  const activeHex = userPickedHex ?? dominant?.hex() ?? "#222222"
  const harmoniesOfActive = harmonies(activeHex)
  const textOn = (hex: string): string => {
    const m = hex.replace("#", "").match(/.{1,2}/g)
    if (!m) return "#fff"
    const [r, g, b] = m.slice(0, 3).map((p) => parseInt(p, 16) / 255)
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
    return lum > 0.55 ? "#000" : "#fff"
  }

  return (
    <DemoSection title="Color from image" lib="colorthief" docsUrl="https://github.com/lokesh/color-thief">
      <p className="text-body text-label-secondary">
        Extract dominant color, palette, and semantic swatches from any image. Pair with
        <code> &lt;LinearBlur tint=&hellip;&gt;</code> for the Apple Music-style blend.
      </p>

      <div className="flex flex-col gap-stack-2xs">
        <div className="text-xs font-medium text-label-secondary">Try a sample</div>
        <div className="grid grid-cols-3 gap-gutter-2xs sm:grid-cols-6">
          {ALBUM_SAMPLES.map((sample) => {
            const active = src === sample.src
            return (
              <button
                key={sample.src}
                type="button"
                onClick={() => setSrc(sample.src)}
                title={sample.label}
                className={`relative aspect-square overflow-hidden rounded-md border transition-all ${
                  active
                    ? "border-label ring-2 ring-label/30"
                    : "border-stroke-faint/60 hover:border-label/40"
                }`}
              >
                <img src={sample.src} alt={sample.label} className="h-full w-full object-cover" />
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid gap-gutter-s sm:grid-cols-2">
        <div className="relative h-56 overflow-hidden rounded-xl bg-label/5">
          <img
            ref={imgRef}
            src={src}
            alt="Source"
            crossOrigin="anonymous"
            className="h-full w-full object-cover"
          />
          {dominant ? (
            <LinearBlur side="bottom" strength={28} falloffPercentage={70} tint={dominant.hex()} />
          ) : null}
        </div>
        <div
          className="relative flex flex-col gap-stack-2xs overflow-hidden rounded-xl p-inset-s transition-colors duration-300"
          style={{ backgroundColor: activeHex, color: textOn(activeHex) }}
        >
          <div className="font-mono text-xs opacity-70">selected color</div>
          <div className="font-mono text-2xl">{activeHex.toUpperCase()}</div>
          <div className="mt-auto flex flex-col gap-stack-3xs text-xs">
            <div>
              dominant: <span className="font-mono">{dominant?.hex() ?? "—"}</span>
            </div>
            <div>
              isDark: <span className="font-mono">{String(dominant?.isDark ?? "—")}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-stack-2xs">
        <div className="text-xs font-medium text-label-secondary">Palette ({palette?.length ?? 0})</div>
        <div className="flex flex-wrap gap-gutter-2xs">
          {(palette ?? []).map((c) => (
            <Swatch key={c.hex()} color={c} active={activeHex === c.hex()} onClick={() => setUserPickedHex(c.hex())} />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-stack-2xs">
        <div className="text-xs font-medium text-label-secondary">Semantic swatches</div>
        <div className="grid grid-cols-3 gap-gutter-2xs sm:grid-cols-6">
          {(["Vibrant", "Muted", "DarkVibrant", "DarkMuted", "LightVibrant", "LightMuted"] as const).map((role) => {
            const sw = swatches?.[role]
            return (
              <button
                key={role}
                type="button"
                onClick={() => sw && setUserPickedHex(sw.color.hex())}
                className="flex flex-col items-center gap-stack-3xs rounded-md border border-stroke-faint/60 p-inset-2xs text-[10px] transition-colors hover:bg-surface-tertiary/40 disabled:opacity-40"
                disabled={!sw}
              >
                <div className="size-10 rounded-md" style={{ backgroundColor: sw?.color.hex() ?? "transparent" }} />
                <span className="font-mono">{role}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col gap-stack-2xs">
        <div className="text-xs font-medium text-label-secondary">
          Harmonies from <span className="font-mono">{activeHex}</span>
        </div>
        <div className="grid gap-gutter-2xs sm:grid-cols-4">
          <HarmonyChip label="complementary" hex={harmoniesOfActive.complementary} />
          <HarmonyChip label="analogous" hex={harmoniesOfActive.analogous[0]} />
          <HarmonyChip label="analogous" hex={harmoniesOfActive.analogous[1]} />
          <HarmonyChip label="triadic" hex={harmoniesOfActive.triadic[0]} />
        </div>
      </div>

      <div className="flex items-center gap-inline-xs text-sm">
        <label className="cursor-pointer underline">
          Drop your own image
          <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
        </label>
        <span className="text-xs text-label-secondary">
          {loading ? "extracting…" : error ? `error: ${error.message}` : "ready"}
        </span>
      </div>
    </DemoSection>
  )
}

const entry: DemoEntry = {
  lib: "colorthief",
  role: "color extraction",
  docsUrl: "https://github.com/lokesh/color-thief",
  Component: ColorFromImageDemo,
}
export default entry

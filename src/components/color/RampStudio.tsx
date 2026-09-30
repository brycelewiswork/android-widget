import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Popover } from "@base-ui/react/popover"
import { IconBrandFigma, IconCopy, IconDownload, IconAlertTriangle, IconPlus } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Squircle, SQUIRCLE_RADIUS } from "@/components/squircle"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { ColorPicker } from "@/components/color/ColorPicker"
import { oklchCss, parseToOklch } from "@/lib/color-convert"
import {
  type AnchorStep,
  type Gamut,
  type Ramp,
  STEPS,
  apcaLc,
  gamutReport,
  neutralRamp,
  rampFromHue,
  rampThroughColor,
  rampToHex,
  rampToTokenBlocks,
  rampsToDtcg,
  rampsToSvg,
  readableOn,
  tintedNeutralRamp,
  vibrantRamp,
} from "@/lib/oklch"

type Mode = "through" | "hue" | "vibrant" | "tinted" | "neutral"

const MODES: Array<{ value: Mode; label: string; hint: string }> = [
  { value: "through", label: "Through a color", hint: "Pin a color you already have to one step and build the family around it — how the Apple families are shaped." },
  { value: "hue", label: "From a hue", hint: "A full family from a hue angle. Chroma is a % of what that hue can actually reach, so different hues come out equally vivid." },
  { value: "vibrant", label: "Vibrant", hint: "Every step pushed to the gamut ceiling for its own lightness. Peaks mid-ramp on its own, because the gamut does." },
  { value: "tinted", label: "Tinted neutral", hint: "A whisper of hue at a flat chroma, so the tint reads the same temperature at every step." },
  { value: "neutral", label: "Neutral", hint: "Pure achromatic on the accent ladder's bounds. Not the same as the Tailwind --color-neutral-* scale." },
]

const ANCHORS: AnchorStep[] = ["auto", ...STEPS]

export function RampStudio() {
  const [mode, setMode] = useState<Mode>("through")
  const [name, setName] = useState("brand")
  const [input, setInput] = useState("#5B5BD6")
  const [anchor, setAnchor] = useState<AnchorStep>(500)
  const [hue, setHue] = useState(265)
  const [percent, setPercent] = useState(90)
  const [tint, setTint] = useState(0.01)
  const [gamut, setGamut] = useState<Gamut | "none">("none")
  const [pickerOpen, setPickerOpen] = useState(false)
  const [adding, setAdding] = useState(false)

  const parsedInput = useMemo(() => parseToOklch(input), [input])

  const ramp: Ramp | null = useMemo(() => {
    switch (mode) {
      case "through":
        return parsedInput ? rampThroughColor(parsedInput, { anchor, gamut }) : null
      case "hue":
        return rampFromHue(hue, { percent, gamut })
      case "vibrant":
        return vibrantRamp(hue, { percent, space: gamut === "none" ? "srgb" : gamut, gamut })
      case "tinted":
        return tintedNeutralRamp(hue, { chroma: tint, gamut })
      case "neutral":
        return neutralRamp({ gamut })
    }
  }, [mode, parsedInput, anchor, hue, percent, tint, gamut])

  const srgb = useMemo(() => (ramp ? gamutReport(ramp, "srgb") : null), [ramp])
  const p3 = useMemo(() => (ramp ? gamutReport(ramp, "p3") : null), [ramp])
  const hex = useMemo(() => (ramp ? rampToHex(ramp) : null), [ramp])

  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "brand"

  const handleCopyCss = () => {
    if (!ramp) return
    const { theme, root, dark } = rampToTokenBlocks(slug, ramp)
    const css = [
      `/* Add to the @theme inline block in index.css */`,
      theme,
      ``,
      `/* Add to :root */`,
      root,
      ``,
      `/* Add to .dark — points at a -dark- variant, so generate one too */`,
      dark,
    ].join("\n")
    navigator.clipboard.writeText(css)
    toast.success(`Copied ${slug} as CSS`, { description: "Three blocks — @theme, :root, and .dark." })
  }

  const handleDownloadSvg = () => {
    if (!ramp) return
    download(`${slug}-ramp.svg`, rampsToSvg([{ name: slug, ramp }]), "image/svg+xml")
    toast.success("Downloaded SVG", { description: "Drag it onto a Figma canvas — no plugin needed." })
  }

  /**
   * Write the family straight into `src/index.css` via the dev-only endpoint
   * in `vite-plugins/color-tokens.ts`. Dev only — there is no server in a
   * build, and this edits the template's own token file.
   */
  const handleAddToProject = async () => {
    if (!ramp || adding) return
    setAdding(true)
    try {
      const { theme, root } = rampToTokenBlocks(slug, ramp)
      const res = await fetch("/api/color-tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: slug, theme, root }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error("Couldn't add the family", { description: data.error })
        return
      }
      toast.success(
        data.replaced ? `Replaced ${slug} in index.css` : `Added ${slug} to index.css`,
        {
          description:
            `${data.added} tokens written — bg-${slug}-500, text-${slug}-700 and the rest are live now. ` +
            `Light values only, so dark mode inherits them until you add a -dark- variant.`,
        },
      )
    } catch {
      toast.error("Couldn't reach the dev server", { description: "This only works while `pnpm dev` is running." })
    } finally {
      setAdding(false)
    }
  }

  const handleDownloadTokens = () => {
    if (!ramp) return
    download(`${slug}-tokens.json`, rampsToDtcg([{ name: slug, ramp }]), "application/json")
    toast.success("Downloaded design tokens", { description: "W3C DTCG JSON — import via Tokens Studio." })
  }

  return (
    <div className="space-y-stack-s">
      {/* ── Mode ── */}
      <div className="flex flex-wrap items-center gap-inline-2xs">
        <ToggleGroup
          value={[mode]}
          onValueChange={(v) => { const m = v[0]; if (m) setMode(m as Mode) }}
          className="bg-surface-tertiary p-[3px]"
        >
          {MODES.map((m) => (
            <ToggleGroupItem key={m.value} value={m.value} className="px-inset-xs text-[0.8rem]">
              {m.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <p className="text-label-secondary text-sm">{MODES.find((m) => m.value === mode)?.hint}</p>

      {/* ── Controls ── */}
      <div className="flex flex-wrap items-end gap-gutter-s rounded-xl bg-surface-tertiary p-inset-s">
        <Field label="Name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            spellCheck={false}
            className="h-7 w-28 rounded-md bg-surface-secondary px-2 font-mono text-[11px] text-label inset-ring-1 inset-ring-stroke-faint focus:outline-none focus:inset-ring-stroke-strong"
          />
        </Field>

        {mode === "through" && (
          <>
            <Field label="Color — any CSS format, stored as OKLCH">
              <div className="flex items-center gap-inline-3xs">
                <Popover.Root open={pickerOpen} onOpenChange={setPickerOpen}>
                  <Popover.Trigger
                    render={(props) => (
                      <button
                        {...props}
                        aria-label="Pick color"
                        className="h-7 w-7 shrink-0 cursor-pointer rounded-md inset-ring-1 inset-ring-stroke-faint"
                        style={{ backgroundColor: parsedInput ? oklchCss(parsedInput) : "transparent" }}
                      />
                    )}
                  />
                  <Popover.Portal>
                    <Popover.Positioner sideOffset={8}>
                      <Popover.Popup
                        render={(props) => (
                          <Squircle
                            as="div"
                            cornerRadius={SQUIRCLE_RADIUS.xl}
                            shadow="lg"
                            {...props}
                            className="rounded-xl bg-surface-secondary inset-ring-1 inset-ring-stroke-faint z-popover"
                          />
                        )}
                      >
                        <ColorPicker
                          value={parsedInput ? oklchCss(parsedInput) : "#000"}
                          onChange={setInput}
                          onClose={() => setPickerOpen(false)}
                          // The studio works in OKLCH end to end, so open on that
                          // readout rather than the picker's usual HSL default.
                          defaultMode="okl"
                        />
                      </Popover.Popup>
                    </Popover.Positioner>
                  </Popover.Portal>
                </Popover.Root>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  spellCheck={false}
                  className={cn(
                    "h-7 w-44 rounded-md bg-surface-secondary px-2 font-mono text-[11px] text-label inset-ring-1 focus:outline-none",
                    parsedInput ? "inset-ring-stroke-faint focus:inset-ring-stroke-strong" : "inset-ring-destructive/50",
                  )}
                />
              </div>
            </Field>
            <Field label="Pin to step">
              <select
                value={String(anchor)}
                onChange={(e) => setAnchor(e.target.value === "auto" ? "auto" : (Number(e.target.value) as AnchorStep))}
                className="h-7 rounded-md bg-surface-secondary px-2 font-mono text-[11px] text-label inset-ring-1 inset-ring-stroke-faint focus:outline-none"
              >
                {ANCHORS.map((a) => (
                  <option key={String(a)} value={String(a)}>{a}</option>
                ))}
              </select>
            </Field>
          </>
        )}

        {(mode === "hue" || mode === "vibrant" || mode === "tinted") && (
          <Field label={`Hue ${hue}°`}>
            <div className="flex w-56 items-center gap-inline-2xs">
              <Slider
                min={0}
                max={360}
                step={1}
                value={[hue]}
                onValueChange={(v) => setHue(v[0] ?? 0)}
                className="flex-1"
              />
            </div>
          </Field>
        )}

        {(mode === "hue" || mode === "vibrant") && (
          <Field label={`Chroma ${percent}% of max`}>
            <Slider
              min={10}
              max={100}
              step={1}
              value={[percent]}
              onValueChange={(v) => setPercent(v[0] ?? 90)}
              className="w-40"
            />
          </Field>
        )}

        {mode === "tinted" && (
          <Field label={`Tint ${tint.toFixed(3)}`}>
            <Slider
              min={0}
              max={0.04}
              step={0.001}
              value={[tint]}
              onValueChange={(v) => setTint(v[0] ?? 0.01)}
              className="w-40"
            />
          </Field>
        )}

        <Field label="Clamp to gamut">
          <select
            value={gamut}
            onChange={(e) => setGamut(e.target.value as Gamut | "none")}
            className="h-7 rounded-md bg-surface-secondary px-2 font-mono text-[11px] text-label inset-ring-1 inset-ring-stroke-faint focus:outline-none"
          >
            <option value="none">none (matches Apple)</option>
            <option value="srgb">sRGB</option>
            <option value="p3">Display P3</option>
          </select>
        </Field>
      </div>

      {/* ── Preview ── */}
      {!ramp || !hex ? (
        <div className="rounded-xl bg-surface-tertiary p-inset-m text-center font-mono text-[11px] text-label-secondary">
          Not a color CSS understands — try a hex, rgb(), hsl(), or oklch() value.
        </div>
      ) : (
        <>
          <div className="flex gap-px">
            {ramp.entries.map(({ step, color }, i) => (
              <div key={step} className="flex-1 min-w-0">
                <div
                  // Rounding is by index, not `first:`/`last:` — each swatch is the
                  // first child of its own wrapper (the labels sit under it), so the
                  // `last:` variant would never match and the right end stayed square.
                  className={cn(
                    "flex h-20 items-start justify-center pt-1.5",
                    i === 0 && "rounded-l-md",
                    i === ramp.entries.length - 1 && "rounded-r-md",
                  )}
                  style={{ backgroundColor: oklchCss(color) }}
                  title={`${slug}-${step} · ${oklchCss(color)}`}
                >
                  <span
                    className="font-mono text-[10px] tabular-nums"
                    style={{ color: readableOn(color) === "black" ? "#000" : "#fff", opacity: 0.7 }}
                  >
                    {step}
                  </span>
                </div>
                <div className="mt-1 text-center font-mono text-[9px] text-label-secondary truncate">
                  {hex[step]}
                </div>
                <div className="text-center font-mono text-[9px] text-label-tertiary truncate">
                  {color.l.toFixed(2)}·{color.c.toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          {/* ── Readout ── */}
          <div className="flex flex-wrap items-center gap-x-inline-s gap-y-1 font-mono text-[10px] text-label-secondary">
            <span>
              anchor {ramp.anchorStep} · oklch({ramp.anchor.l.toFixed(3)} {ramp.anchor.c.toFixed(3)}{" "}
              {(ramp.anchor.h ?? 0).toFixed(2)})
            </span>
            <span className={srgb?.allInside ? "" : "text-label"}>
              {srgb?.allInside
                ? "all steps inside sRGB"
                : `${srgb?.outside.length} outside sRGB (${srgb?.outside.map((o) => o.step).join(", ")})`}
            </span>
            <span>{p3?.allInside ? "all inside P3" : `${p3?.outside.length} outside P3`}</span>
            <span>
              body text on white:{" "}
              {ramp.entries.filter((e) => Math.abs(apcaLc(e.color, "#fff")) >= 60).map((e) => e.step).join(", ") || "none"}
            </span>
          </div>

          {ramp.notes.map((note) => (
            <div
              key={note}
              className="flex items-start gap-inline-2xs rounded-lg bg-fill-quaternary p-inset-2xs text-[11px] text-label-secondary"
            >
              <IconAlertTriangle size={13} stroke={2} className="mt-px shrink-0 text-label-tertiary" />
              <span>{note}</span>
            </div>
          ))}

          {/* ── Export ── */}
          <div className="flex flex-wrap items-center gap-inline-2xs pt-stack-3xs">
            {import.meta.env.DEV && (
              <Button size="sm" onClick={handleAddToProject} disabled={adding}>
                <IconPlus size={14} stroke={2} />
                {adding ? "Adding…" : "Add to project colors"}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleCopyCss}>
              <IconCopy size={14} stroke={2} /> Copy CSS
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadSvg}>
              <IconBrandFigma size={14} stroke={2} /> SVG for Figma
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadTokens}>
              <IconDownload size={14} stroke={2} /> Design tokens (JSON)
            </Button>
            <span className="font-mono text-[10px] text-label-tertiary">
              Figma is sRGB — exports are gamut-mapped hex, the OKLCH is kept as metadata.
            </span>
          </div>
        </>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-mono text-[10px] text-label-secondary">{label}</span>
      {children}
    </label>
  )
}

function download(filename: string, contents: string, mime: string) {
  const blob = new Blob([contents], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

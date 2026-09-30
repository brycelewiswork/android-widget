import { useRef, useState } from "react"
import { toast } from "sonner"
import { Popover } from "@base-ui/react/popover"
import { IconRefresh, IconDownload, IconUpload, IconRotate, IconColorPicker } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { PageShell, PageHeader, Section } from "@/components/PageLayout"
import { Button } from "@/components/ui/button"
import { Squircle, SQUIRCLE_RADIUS } from "@/components/squircle"
import { ColorPicker } from "@/components/color/ColorPicker"
import { RampStudio } from "@/components/color/RampStudio"
import { ALL_SECTIONS, type ThemeMode, type Token } from "@/lib/color-tokens"
import { useColorOverrides } from "@/lib/colors"

const NEUTRAL_STEPS = [
  { step: "50", l: "0.985" },
  { step: "100", l: "0.970" },
  { step: "200", l: "0.932" },
  { step: "300", l: "0.870" },
  { step: "400", l: "0.710" },
  { step: "500", l: "0.555" },
  { step: "600", l: "0.440" },
  { step: "700", l: "0.355" },
  { step: "800", l: "0.270" },
  { step: "900", l: "0.205" },
  { step: "950", l: "0.145" },
] as const

const ACCENT_HUES = [
  "red", "orange", "yellow", "green", "mint", "teal",
  "cyan", "blue", "indigo", "purple", "pink", "brown",
] as const

const ACCENT_STEPS = [50, 100, 150, 200, 300, 400, 500, 600, 700, 800, 850, 900, 950] as const

const OPACITY_STEPS = [1,2,3,4,5,6,7,8,9,10,11,12,15,20,25,30,35,40,45,50,55,60,65,70,75,80,85,90,95,100] as const

export function Colors() {
  const colors = useColorOverrides()

  const handleResetAll = () => {
    colors.clearAll()
    toast.success("Reverted all colors to base")
  }

  const handleExportJson = () => {
    download("color-overrides.json", colors.exportJson(), "application/json")
    toast.success("Exported overrides as JSON")
  }

  const handleExportCss = () => {
    download("color-overrides.css", colors.exportCss(), "text/css")
    toast.success("Exported overrides as CSS")
  }

  const fileRef = useRef<HTMLInputElement>(null)
  const handleImportClick = () => fileRef.current?.click()
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const result = colors.importJson(text)
    e.target.value = ""
    if (!result) {
      toast.error("Couldn't parse that file")
      return
    }
    toast.success(
      `Imported ${result.applied} override${result.applied === 1 ? "" : "s"}` +
      (result.skipped ? ` (${result.skipped} skipped)` : ""),
    )
  }

  return (
    <PageShell className="space-y-0! flex flex-col gap-stack-l">
      {/* ── Header ── */}
      <header className="flex items-start justify-between gap-inline-s">
        <PageHeader
          title="Color"
          description="Click any token to edit. Confirm to apply — overrides persist locally per mode. Reset reverts to base."
        />
        <div className="flex gap-inline-2xs shrink-0">
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleImportFile}
          />
          <Button variant="ghost" size="sm" onClick={handleImportClick}>
            <IconUpload size={14} stroke={2} /> Import
          </Button>
          <Button variant="ghost" size="sm" onClick={handleExportJson}>
            <IconDownload size={14} stroke={2} /> JSON
          </Button>
          <Button variant="ghost" size="sm" onClick={handleExportCss}>
            <IconDownload size={14} stroke={2} /> CSS
          </Button>
          <Button variant="ghost" size="sm" onClick={handleResetAll}>
            <IconRefresh size={14} stroke={2} /> Reset all
          </Button>
        </div>
      </header>

      {/* ── Editable sections ── */}
      {ALL_SECTIONS.map((section) => (
        <Section key={section.id} title={section.title} description={section.description}>
          <div className={cn(
            "grid gap-gutter-s",
            section.tokens.length <= 2 && "grid-cols-2",
            section.tokens.length === 3 && "grid-cols-3",
            section.tokens.length === 4 && "grid-cols-4",
            section.tokens.length === 5 && "grid-cols-5",
            section.tokens.length > 5 && "grid-cols-4",
          )}>
            {section.tokens.map((token) => (
              <SwatchRow
                key={token.cssVar}
                token={token}
                mode={colors.mode}
                value={colors.resolve(token)}
                edited={colors.isOverridden(token.cssVar)}
                editedOtherMode={colors.isOverriddenAnyMode(token.cssVar) && !colors.isOverridden(token.cssVar)}
                onChange={(v) => colors.set(token, v)}
                onReset={() => colors.clear(token)}
              />
            ))}
          </div>
        </Section>
      ))}

      {/* ── Read-only reference: primitives, ramps, in-context demo ── */}
      <Section title="Neutral Scale" description="11-step achromatic ramp — static reference, not editable">
        <div className="flex gap-inline-2xs">
          {NEUTRAL_STEPS.map(({ step, l }) => (
            <div key={step} className="flex-1 text-center">
              <div
                className="aspect-square rounded-lg border border-stroke-faint"
                style={{ backgroundColor: `oklch(${l} 0 0)` }}
              />
              <div className="mt-1.5 font-mono text-[10px] text-label-secondary">{step}</div>
              <div className="font-mono text-[10px] text-label-secondary">{l}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Black & White Opacity" description="Pure black/white at 30 opacity stops — reference only">
        <div>
          <div className="font-mono text-[11px] text-label mb-1.5">Black</div>
          <div className="flex gap-px rounded-lg overflow-hidden border border-stroke-faint">
            {OPACITY_STEPS.map((p) => (
              <div
                key={p}
                className="flex-1 h-10"
                style={{ backgroundColor: `var(--color-black-${p})` }}
                title={`black-${p} (${p}%)`}
              />
            ))}
          </div>
          <div className="flex gap-px mt-stack-3xs">
            {OPACITY_STEPS.map((p) => (
              <div key={p} className="flex-1 text-center font-mono text-[7px] text-label-secondary">{p}</div>
            ))}
          </div>
        </div>
        <div className="mt-stack-s">
          <div className="font-mono text-[11px] text-label mb-1.5">White</div>
          <div className="flex gap-px rounded-lg overflow-hidden border border-stroke-faint">
            {OPACITY_STEPS.map((p) => (
              <div
                key={p}
                className="flex-1 h-10"
                style={{ backgroundColor: `var(--color-white-${p})` }}
                title={`white-${p} (${p}%)`}
              />
            ))}
          </div>
        </div>
      </Section>

      <Section
        title="Ramp Studio"
        description="Generates 13-step families in OKLCH, in the same shape as the Apple ramps below — from a hue, or through a color you already have. Every value is authored and stored as oklch(); hex only ever appears at export, gamut-mapped. Add straight to the project's tokens, copy as CSS, or send to Figma."
      >
        <RampStudio />
      </Section>

      <Section title="Accent Colors" description="Apple system colors — 12 hues × 13 steps, reference only">
        <div className="space-y-stack-m">
          {ACCENT_HUES.map((hue) => (
            <div key={hue}>
              <div className="font-mono text-[11px] text-label mb-1.5 capitalize">{hue}</div>
              <div className="flex gap-px">
                {ACCENT_STEPS.map((step) => (
                  <div
                    key={step}
                    className="flex-1 h-8 first:rounded-l-md last:rounded-r-md"
                    style={{ backgroundColor: `var(--color-${hue}-${step})` }}
                    title={`${hue}-${step}`}
                  />
                ))}
              </div>
              <div className="flex gap-px mt-px">
                {ACCENT_STEPS.map((step) => (
                  <div
                    key={step}
                    className="flex-1 h-8 first:rounded-l-md last:rounded-r-md"
                    style={{ backgroundColor: `var(--color-${hue}-dark-${step})` }}
                    title={`${hue}-dark-${step}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="In Context" description="All tokens working together — edits above reflect here instantly">
        <div className="bg-surface rounded-2xl p-inset-m">
          <div className="bg-surface-secondary rounded-xl border border-stroke-strong overflow-hidden">
            <div className="p-inset-s pb-inset-s">
              <h3 className="text-label font-medium">Notification preferences</h3>
              <p className="text-label-secondary text-sm mt-stack-3xs">
                Choose how and when you'd like to be notified.
              </p>
            </div>
            <div className="border-t border-stroke-faint">
              {([
                { title: "Email notifications", desc: "Important updates and alerts", on: true },
                { title: "Push notifications", desc: "Real-time alerts on your device", on: false },
                { title: "Weekly digest", desc: "Summary of activity every Monday", on: true },
              ] as const).map((item, i, arr) => (
                <div
                  key={item.title}
                  className={cn(
                    "flex items-center justify-between gap-inline-s px-inset-s py-3.5 bg-surface-tertiary",
                    i < arr.length - 1 && "border-b border-stroke-faint",
                  )}
                >
                  <div>
                    <div className="text-label text-sm font-medium">{item.title}</div>
                    <div className="text-label-tertiary text-xs mt-0.5">{item.desc}</div>
                  </div>
                  <div className={cn(
                    "h-6 w-10 shrink-0 rounded-full flex items-center px-0.5",
                    item.on ? "bg-label justify-end" : "bg-neutral-400 justify-start",
                  )}>
                    <div className="h-5 w-5 rounded-full bg-surface shadow-xs" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>
    </PageShell>
  )
}

// ─── Swatch with picker popover ─────────────────────────────────────────────

function SwatchRow({
  token,
  mode,
  value,
  edited,
  editedOtherMode,
  onChange,
  onReset,
}: {
  token: Token
  mode: ThemeMode
  value: string
  edited: boolean
  editedOtherMode: boolean
  onChange: (oklchCss: string) => void
  onReset: () => void
}) {
  const isText = token.utility.startsWith("text-")
  const isBorder = token.utility.startsWith("border-") || token.utility.startsWith("ring-")
  const [open, setOpen] = useState(false)

  return (
    <div>
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger
          render={(props) => (
            <button
              {...props}
              className="relative block w-full cursor-pointer text-left focus:outline-none group"
              aria-label={`Edit ${token.name} (${mode} mode)`}
            />
          )}
        >
          {isText ? (
            <div
              className="h-16 rounded-xl border border-stroke-faint bg-surface flex items-center justify-center transition-shadow group-hover:shadow-md"
            >
              <span className="text-h5" style={{ color: value }}>Aa</span>
            </div>
          ) : isBorder ? (
            <div
              className="h-16 rounded-xl bg-surface-secondary transition-shadow group-hover:shadow-md"
              style={{ border: `2px solid ${value}` }}
            />
          ) : (
            <div
              className="h-16 rounded-xl border border-stroke-faint transition-shadow group-hover:shadow-md"
              style={{ backgroundColor: value }}
            />
          )}
          {/* Discoverability affordance — fades in on hover/focus */}
          <span
            className="absolute top-1.5 right-1.5 flex items-center justify-center h-6 w-6 rounded-md bg-surface-secondary text-label-secondary inset-ring-1 inset-ring-stroke-faint shadow-xs opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity"
            aria-hidden="true"
          >
            <IconColorPicker size={13} stroke={1.75} />
          </span>
        </Popover.Trigger>
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
                value={value}
                onChange={(v) => onChange(v)}
                onClose={() => setOpen(false)}
              />
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>

      <div className="mt-stack-2xs flex items-start justify-between gap-inline-2xs">
        <div className="space-y-0.5 min-w-0">
          <div className="font-mono text-[11px] text-label truncate flex items-center gap-inline-3xs">
            {token.cssVar.slice(2)}
            {edited && (
              <span title="Edited in this mode" className="inline-block h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
            )}
            {editedOtherMode && !edited && (
              <span title={`Edited in ${mode === "dark" ? "light" : "dark"} mode`} className="inline-block h-1.5 w-1.5 rounded-full bg-label-tertiary shrink-0" />
            )}
          </div>
          <div className="font-mono text-[11px] text-label-secondary truncate">{token.utility}</div>
          <div className="font-mono text-[10px] text-label-secondary truncate">{value}</div>
        </div>
        {edited && (
          <button
            onClick={onReset}
            className="shrink-0 h-5 w-5 rounded flex items-center justify-center text-label-secondary hover:text-label hover:bg-fill-quaternary cursor-pointer"
            title="Revert to base"
          >
            <IconRotate size={12} stroke={2} />
          </button>
        )}
      </div>
    </div>
  )
}

// ─── tiny helpers ────────────────────────────────────────────────────────────

function download(filename: string, contents: string, mime: string) {
  const blob = new Blob([contents], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}


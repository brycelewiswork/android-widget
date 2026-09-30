import { useState, type ReactNode } from "react"
import { Link } from "react-router-dom"
import { PageShell, PageHeader, Section } from "@/components/PageLayout"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import {
  useFluidConfig,
  useViewportWidth,
  NumberSlider,
  PageActions,
} from "@/pages/_fluid-controls"
import {
  computeTypeScale,
  computeSpaceScale,
  resolveClamp,
  exportFluidCss,
  TYPE_ROLES,
} from "@/lib/fluid"

/** The semantic role name for a step (falls back to "step N" for extra steps). */
const roleForStep = (step: number) =>
  TYPE_ROLES.find((r) => r.step === step)?.role ?? `step ${step > 0 ? `+${step}` : step}`

// Named modular-scale ratios (shown under the Type scale field, Utopia-style).
const RATIO_NAMES: [number, string][] = [
  [1.067, "Minor Second"],
  [1.075, "Apple"],
  [1.125, "Major Second"],
  [1.2, "Minor Third"],
  [1.25, "Major Third"],
  [1.333, "Perfect Fourth"],
  [1.414, "Augmented Fourth"],
  [1.5, "Perfect Fifth"],
  [1.618, "Golden Ratio"],
]
const CUSTOM = "custom"

// Value→label map so the Select trigger shows "1.200 — Minor Third" (+ Custom…).
const RATIO_ITEMS: Record<string, string> = {
  ...Object.fromEntries(RATIO_NAMES.map(([v, name]) => [String(v), `${v.toFixed(3)} — ${name}`])),
  [CUSTOM]: "Custom…",
}

/** Type-scale ratio picker: a dropdown of named ratios by default, with a
 *  "Custom…" option that reveals a free numeric entry. */
function RatioField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const preset = RATIO_NAMES.find(([v]) => Math.abs(v - value) < 0.001)
  const [custom, setCustom] = useState(!preset)
  const selectValue = custom || !preset ? CUSTOM : String(preset[0])

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-caption font-medium text-label-secondary">{label}</label>
      <Select
        items={RATIO_ITEMS}
        value={selectValue}
        onValueChange={(v: string | null) => {
          if (!v || v === CUSTOM) setCustom(true)
          else {
            setCustom(false)
            onChange(parseFloat(v))
          }
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {RATIO_NAMES.map(([v, name]) => (
            <SelectItem key={v} value={String(v)}>
              <span className="font-mono tabular-nums">{v.toFixed(3)}</span>
              <span className="text-label-secondary">— {name}</span>
            </SelectItem>
          ))}
          <SelectItem value={CUSTOM}>Custom…</SelectItem>
        </SelectContent>
      </Select>
      {custom && (
        <input
          type="number"
          value={value}
          min={1}
          max={2}
          step={0.001}
          onChange={(e) => {
            const n = parseFloat(e.target.value)
            if (!Number.isNaN(n)) onChange(n)
          }}
          aria-label={`${label} custom ratio`}
          className="w-full rounded-md bg-surface px-2 py-1 font-mono text-sm tabular-nums text-label inset-ring-1 inset-ring-stroke-strong focus:outline-none"
        />
      )}
    </div>
  )
}

/** One labelled viewport anchor (min or max): Width, Font size, Type scale. */
function FoundationGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <h3 className="text-eyebrow font-semibold uppercase tracking-wider text-label-secondary">{title}</h3>
        <div className="border-t border-stroke-faint" />
      </div>
      {children}
    </div>
  )
}

export function Foundations() {
  const { cfg, patchViewport, patchBase, patchRatio, save, reset } = useFluidConfig()
  const vw = useViewportWidth()

  const typeSteps = computeTypeScale(cfg)
  const space = computeSpaceScale(cfg)

  return (
    <PageShell>
      <header className="flex items-start justify-between gap-4">
        <PageHeader
          title="Foundations"
          description="The six values the whole fluid system derives from. Set them once here; type, space, grid, and clamp all read them."
        />
        <PageActions onSave={save} onReset={reset} copyText={() => exportFluidCss(cfg)} />
      </header>

      {/* ── The six foundation values, grouped by viewport anchor ── */}
      <Section
        title="Foundation values"
        description="Each viewport anchor carries a width, a font size, and the type-scale ratio. Detail scale is an optional gentler ratio for the sub-body steps only, so the small end can compress (Apple-style) while headings stay coarse — leave it equal to Type scale for one uniform ratio."
        className="grid gap-x-10 gap-y-8 sm:grid-cols-2"
      >
        <FoundationGroup title="Min viewport">
          <NumberSlider label="Width" value={cfg.viewport.min} min={240} max={768} step={10} unit="px"
            onChange={(v) => patchViewport({ min: v })} />
          <NumberSlider label="Font size" value={cfg.base.min} min={10} max={28} step={0.5} unit="px"
            onChange={(v) => patchBase({ min: v })} />
          <RatioField label="Type scale" value={cfg.ratio.min} onChange={(v) => patchRatio({ min: v })} />
          <RatioField label="Detail scale (below body)" value={cfg.ratio.detailMin} onChange={(v) => patchRatio({ detailMin: v })} />
        </FoundationGroup>

        <FoundationGroup title="Max viewport">
          <NumberSlider label="Width" value={cfg.viewport.max} min={768} max={1920} step={10} unit="px"
            onChange={(v) => patchViewport({ max: v })} />
          <NumberSlider label="Font size" value={cfg.base.max} min={10} max={32} step={0.5} unit="px"
            onChange={(v) => patchBase({ max: v })} />
          <RatioField label="Type scale" value={cfg.ratio.max} onChange={(v) => patchRatio({ max: v })} />
          <RatioField label="Detail scale (below body)" value={cfg.ratio.detailMax} onChange={(v) => patchRatio({ detailMax: v })} />
        </FoundationGroup>
      </Section>

      {/* ── What they drive ── */}
      <Section
        title="What they drive"
        description="Both scales, resolved from the same six numbers at your current viewport. Resize the window to watch them flow."
        className="space-y-6"
      >
        <p className="text-caption text-label-secondary">
          Resolving at <span className="font-mono font-semibold text-label">{vw}px</span> — your current viewport.
        </p>

        <div className="grid gap-8 sm:grid-cols-2">
          {/* Type cascade */}
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <h3 className="text-caption font-semibold text-label">Type scale</h3>
              <Link to="/typography" className="text-caption text-blue-500 hover:underline">Type →</Link>
            </div>
            <div className="space-y-1">
              {[...typeSteps].reverse().map((s) => (
                <div key={s.step} className="flex items-baseline gap-3 border-b border-stroke-faint/40 py-1.5">
                  <span className="w-16 shrink-0 font-mono text-[10px] text-label-secondary">{roleForStep(s.step)}</span>
                  <span className="min-w-0 flex-1 truncate text-label" style={{ fontSize: s.css }}>Ag</span>
                  <span className="shrink-0 font-mono text-[10px] text-label-secondary tabular-nums">
                    {resolveClamp(s, vw).toFixed(0)}px
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Space cascade */}
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <h3 className="text-caption font-semibold text-label">Space scale</h3>
              <Link to="/spacing" className="text-caption text-blue-500 hover:underline">Space →</Link>
            </div>
            <div className="space-y-2 py-1.5">
              {space.singles.map((s) => {
                const px = resolveClamp(s, vw)
                return (
                  <div key={s.key} className="flex items-center gap-3">
                    <span className="w-8 shrink-0 text-right font-mono text-[10px] text-label-secondary">{s.key}</span>
                    <div className="h-4 shrink-0 rounded-sm bg-blue-500/70" style={{ width: Math.max(px, 2) }} />
                    <span className="font-mono text-[10px] text-label-secondary tabular-nums">{px.toFixed(0)}px</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <p className="text-caption text-label-secondary">
          Grid gutters draw from the space scale (<Link to="/grid" className="text-blue-500 hover:underline">Grid</Link>);
          the <Link to="/clamp" className="text-blue-500 hover:underline">Clamp</Link> generator seeds from the viewport anchors.
        </p>
      </Section>
    </PageShell>
  )
}

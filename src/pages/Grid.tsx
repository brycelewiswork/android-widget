import { useState } from "react"
import { IconArrowRight } from "@tabler/icons-react"
import { PageShell, PageHeader, Section } from "@/components/PageLayout"
import { NumberSlider, PageActions, useFluidConfig } from "@/pages/_fluid-controls"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { computeGrid, GRID_DEFAULTS, activeSpaceKeys, type SpaceStepKey } from "@/lib/fluid"

function StepSelect({ value, keys, onChange }: {
  value: SpaceStepKey; keys: SpaceStepKey[]; onChange: (v: SpaceStepKey) => void
}) {
  const items = Object.fromEntries(keys.map((k) => [k, k]))
  return (
    <Select items={items} value={value} onValueChange={(v) => v && onChange(v as SpaceStepKey)}>
      <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
      <SelectContent>
        {keys.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}

/** A fluid dimension: a step at the min viewport → a step at the max viewport. */
function StepRange({ label, minKey, maxKey, keys, onMin, onMax, minPx, maxPx }: {
  label: string
  minKey: SpaceStepKey; maxKey: SpaceStepKey; keys: SpaceStepKey[]
  onMin: (v: SpaceStepKey) => void; onMax: (v: SpaceStepKey) => void
  minPx: number; maxPx: number
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <label className="text-caption font-medium text-label-secondary">{label}</label>
        <span className="font-mono text-caption text-label-secondary">{minPx}→{maxPx}px</span>
      </div>
      <div className="flex items-center gap-2">
        <StepSelect value={minKey} keys={keys} onChange={onMin} />
        <IconArrowRight size={15} className="shrink-0 text-label-secondary" />
        <StepSelect value={maxKey} keys={keys} onChange={onMax} />
        <span className="ml-1 font-mono text-[10px] text-label-tertiary">@min → @max</span>
      </div>
    </div>
  )
}

export function Grid() {
  const { cfg } = useFluidConfig()
  // Gutter / margin endpoints pick from the active single space steps.
  const keys = activeSpaceKeys(cfg.space)

  const [columns, setColumns] = useState(GRID_DEFAULTS.columns)
  const [gutterMin, setGutterMin] = useState<SpaceStepKey>(GRID_DEFAULTS.gutterMin)
  const [gutterMax, setGutterMax] = useState<SpaceStepKey>(GRID_DEFAULTS.gutterMax)
  const [marginMin, setMarginMin] = useState<SpaceStepKey>(GRID_DEFAULTS.marginMin)
  const [marginMax, setMarginMax] = useState<SpaceStepKey>(GRID_DEFAULTS.marginMax)
  const [maxWidthPx, setMaxWidthPx] = useState(GRID_DEFAULTS.maxWidthPx)
  const [minColumnPx, setMinColumnPx] = useState(GRID_DEFAULTS.minColumnPx)

  const grid = computeGrid(
    { columns, gutterMin, gutterMax, marginMin, marginMax, maxWidthPx, minColumnPx },
    cfg,
  )

  const reset = () => {
    setColumns(GRID_DEFAULTS.columns)
    setGutterMin(GRID_DEFAULTS.gutterMin)
    setGutterMax(GRID_DEFAULTS.gutterMax)
    setMarginMin(GRID_DEFAULTS.marginMin)
    setMarginMax(GRID_DEFAULTS.marginMax)
    setMaxWidthPx(GRID_DEFAULTS.maxWidthPx)
    setMinColumnPx(GRID_DEFAULTS.minColumnPx)
  }

  return (
    <PageShell>
      <header className="flex items-start justify-between gap-4">
        <PageHeader
          title="Grid"
          description="A fixed-column design grid with fluid gutters and edge margins, centered in a max-width container — one grid, no breakpoints."
        />
        <PageActions onReset={reset} copyText={() => grid.css} />
      </header>

      {/* ── Controls ── */}
      <Section title="Grid parameters" description="The gutter and edge margin each interpolate from a step at the min viewport to a step at the max viewport."
        className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
        <NumberSlider label="Columns" value={columns} min={1} max={16} step={1} onChange={setColumns} />
        <NumberSlider label="Max width" value={maxWidthPx} min={480} max={1920} step={20} unit="px"
          onChange={setMaxWidthPx} />
        <StepRange label="Gutter (column gap)" minKey={gutterMin} maxKey={gutterMax} keys={keys}
          onMin={setGutterMin} onMax={setGutterMax} minPx={grid.gutter.minPx} maxPx={grid.gutter.maxPx} />
        <StepRange label="Margin (page edge)" minKey={marginMin} maxKey={marginMax} keys={keys}
          onMin={setMarginMin} onMax={setMarginMax} minPx={grid.margin.minPx} maxPx={grid.margin.maxPx} />
      </Section>

      {/* ── Design grid preview ── */}
      <Section
        title="Layout grid"
        description={`${columns} columns · gutter ${gutterMin}→${gutterMax} · edge margin ${marginMin}→${marginMax} · max ${maxWidthPx}px, centered.`}
        className="space-y-4"
      >
        {/* The tinted band = the container; its inner padding is the edge margin. */}
        <div className="rounded-lg bg-surface-tertiary" style={{ maxWidth: maxWidthPx, marginInline: "auto" }}>
          <div className="py-inset-s" style={{ paddingInline: grid.margin.value }}>
            <div style={{ display: "grid", gridTemplateColumns: grid.fixedTemplateColumns, gap: grid.gutter.value }}>
              {Array.from({ length: columns }, (_, i) => (
                <div key={i} className="flex h-20 items-center justify-center rounded-md bg-blue-500/15 text-[10px] font-mono text-blue-600">
                  {i + 1}
                </div>
              ))}
            </div>
          </div>
        </div>
        <p className="text-caption text-label-secondary">
          The tinted band is <span className="font-mono text-label">.u-container</span>; the space between it and the
          columns is the fluid edge margin. Resize the window to watch gutters and margins flow.
        </p>
      </Section>

      {/* ── Bonus: wrap-aware auto-fit grid ── */}
      <Section
        title="Wrap-aware grid (bonus)"
        description={`Not part of the Utopia grid, but handy for card layouts: repeat(auto-fit, minmax(min(${minColumnPx}px, 100%), 1fr)) — cells wrap on their own, no column count.`}
        className="space-y-4"
      >
        <NumberSlider label="Min column width" value={minColumnPx} min={80} max={480} step={10} unit="px"
          onChange={setMinColumnPx} />
        <div style={{ display: "grid", gap: grid.gutter.value, gridTemplateColumns: grid.autoFitTemplateColumns, maxWidth: maxWidthPx }}>
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="flex h-16 items-center justify-center rounded-lg bg-fill-tertiary text-caption font-mono text-label-secondary">
              {i + 1}
            </div>
          ))}
        </div>
      </Section>

      {/* ── Generated CSS ── */}
      <Section title="Generated CSS" description="Custom properties + a centered container and the grid. Drop the classes onto your markup." noPadding>
        <pre className="overflow-x-auto p-inset-s font-mono text-caption text-label">{grid.css}</pre>
      </Section>
    </PageShell>
  )
}

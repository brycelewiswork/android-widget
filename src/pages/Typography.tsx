import { useState, useEffect, useMemo } from "react"
import {
  IconTable,
  IconChartLine,
  IconEye,
  IconPlus,
  IconMinus,
  IconArrowBackUp,
  IconSelector,
  IconEyeOff,
} from "@tabler/icons-react"
import { PageShell, PageHeader, Section, SectionCard } from "@/components/PageLayout"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandInput, CommandList, CommandItem, CommandEmpty } from "@/components/ui/command"
import { useGoogleFonts } from "@/lib/google-fonts"
import {
  useFluidConfig,
  useViewportWidth,
  NumberSlider,
  PageActions,
  FoundationRef,
} from "@/pages/_fluid-controls"
import {
  computeTypeScale,
  resolveClamp,
  exportFluidCss,
  loadGoogleFont,
  FLUID_DEFAULTS,
  DEFAULT_FONT,
  TYPE_ROLES,
  type TypeStep,
  type FluidConfig,
} from "@/lib/fluid"
import { cn } from "@/lib/utils"

const MAX_POSITIVE = 9
const MAX_NEGATIVE = 6

const UNITS = ["rem", "px", "pt"] as const
type Unit = (typeof UNITS)[number]

/** Format a px value in the selected unit (rem = ÷16, pt = ×0.75). */
function formatUnit(px: number, unit: Unit): string {
  if (unit === "rem") return `${(px / 16).toFixed(3)}rem`
  if (unit === "pt") return `${(px * 0.75).toFixed(2)}pt`
  return `${px.toFixed(2)}px`
}

function UnitToggle({ value, onChange }: { value: Unit; onChange: (u: Unit) => void }) {
  return (
    <ToggleGroup
      value={[value]}
      onValueChange={(v) => { const u = v[0]; if (u) onChange(u as Unit) }}
      className="bg-surface-tertiary p-[3px]"
    >
      {UNITS.map((u) => (
        <ToggleGroupItem key={u} value={u} className="px-inset-xs font-mono uppercase">
          {u}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

/** One row in the font list, rendered in its own face. The family's CSS is
 *  injected by the parent for every rendered row; the browser only downloads
 *  the actual font file for rows that are painted (visible), via font-display. */
function FontOption({
  family,
  selected,
  onSelect,
}: {
  family: string
  selected: boolean
  onSelect: (family: string) => void
}) {
  return (
    <CommandItem value={family} onSelect={() => onSelect(family)} data-checked={selected || undefined}>
      <span className="truncate" style={{ fontFamily: `"${family}", var(--font-sans)`, fontSize: "15px" }}>
        {family}
      </span>
    </CommandItem>
  )
}

/** Searchable Google-font combobox with each option rendered in its own face,
 *  plus an individual reset back to the bundled DM Sans default. */
function FontCombobox({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  const { fonts } = useGoogleFonts()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const current = value.trim()
  const modified = current !== DEFAULT_FONT

  // Load the selected family so the trigger previews it in its own face.
  useEffect(() => {
    if (modified) loadGoogleFont(current)
  }, [current, modified])

  // Bounded render: filter the ~2k catalogue, cap at 100 rows (only those load).
  const q = query.trim().toLowerCase()
  const filtered = useMemo(
    () => (q ? fonts.filter((f) => f.toLowerCase().includes(q)) : fonts).slice(0, 100),
    [q, fonts]
  )

  // Inject each rendered row's font CSS when the popover is open, so options
  // render in their own face. (The heavy woff2 only downloads for painted rows.)
  useEffect(() => {
    if (open) filtered.forEach(loadGoogleFont)
  }, [open, filtered])

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <label className="text-caption font-medium text-label-secondary">{label}</label>
        <button
          type="button"
          onClick={() => onChange(DEFAULT_FONT)}
          disabled={!modified}
          aria-label={`Reset ${label} to ${DEFAULT_FONT}`}
          title={`Reset to ${DEFAULT_FONT}`}
          className={cn(
            "translate-y-px rounded p-0.5 transition-colors",
            modified ? "text-label-secondary hover:text-label" : "pointer-events-none text-label-tertiary/40"
          )}
        >
          <IconArrowBackUp size={13} stroke={2} />
        </button>
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger className="flex items-center justify-between gap-2 rounded-md bg-surface px-inset-xs py-1 text-caption text-label inset-ring-1 inset-ring-stroke-faint transition-[box-shadow] hover:inset-ring-stroke-strong focus:outline-none focus-visible:inset-ring-stroke-strong">
          <span className="truncate" style={{ fontFamily: `"${current}", var(--font-sans)` }}>
            {value || DEFAULT_FONT}
          </span>
          <IconSelector className="size-4 shrink-0 text-label-secondary" />
        </PopoverTrigger>
        <PopoverContent align="start" className="w-(--anchor-width) min-w-56 p-0">
          <Command shouldFilter={false}>
            <CommandInput value={query} onValueChange={setQuery} placeholder="Search fonts…" />
            <CommandList>
              <CommandEmpty>No font found.</CommandEmpty>
              {filtered.map((f) => (
                <FontOption
                  key={f}
                  family={f}
                  selected={f === current}
                  onSelect={(fam) => {
                    onChange(fam)
                    setOpen(false)
                    setQuery("")
                  }}
                />
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}

const DEFAULT_PREVIEW = "Every good sketch feels alive long before it's real."

export function Typography() {
  const { cfg, patchType, save, reset } = useFluidConfig()
  const [unit, setUnit] = useState<Unit>("rem")
  const [preview, setPreview] = useState(DEFAULT_PREVIEW)
  const steps = computeTypeScale(cfg)
  const t = cfg.type

  const stepControls = {
    addAbove: () => patchType({ positiveSteps: Math.min(MAX_POSITIVE, t.positiveSteps + 1) }),
    removeAbove: () => patchType({ positiveSteps: Math.max(1, t.positiveSteps - 1) }),
    addBelow: () => patchType({ negativeSteps: Math.min(MAX_NEGATIVE, t.negativeSteps + 1) }),
    removeBelow: () => patchType({ negativeSteps: Math.max(0, t.negativeSteps - 1) }),
  }

  return (
    <PageShell>
      <header className="flex items-start justify-between gap-4">
        <PageHeader
          title="Type"
          description="Fluid modular scale (Utopia clamp). Type your own specimen and read the whole scale live; switch units, or drop to the table to add/remove steps and the graph to see the clamp."
        />
        <PageActions onSave={save} onReset={reset} copyText={() => exportFluidCss(cfg)} />
      </header>

      {/* ── Scale explorer ── */}
      <Tabs defaultValue="visualiser">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="visualiser"><IconEye /> Preview</TabsTrigger>
            <TabsTrigger value="table"><IconTable /> Table</TabsTrigger>
            <TabsTrigger value="graph"><IconChartLine /> Graph</TabsTrigger>
          </TabsList>
          <UnitToggle value={unit} onChange={setUnit} />
        </div>
        <SectionCard noPadding className="overflow-hidden">
          <TabsContent value="visualiser">
            <ScaleVisualiser
              steps={steps}
              cfg={cfg}
              unit={unit}
              preview={preview}
              setPreview={setPreview}
              controls={stepControls}
              onRename={(step, name) => {
                const next = { ...t.roleNames }
                if (name.trim()) next[String(step)] = name
                else delete next[String(step)] // cleared → revert to the built-in role
                patchType({ roleNames: next })
              }}
              onToggleDisable={(step) =>
                patchType({
                  disabledSteps: t.disabledSteps.includes(step)
                    ? t.disabledSteps.filter((s) => s !== step)
                    : [...t.disabledSteps, step],
                })
              }
            />
          </TabsContent>
          <TabsContent value="table">
            <ScaleTable steps={steps} cfg={cfg} controls={stepControls} unit={unit} />
          </TabsContent>
          <TabsContent value="graph">
            <ScaleGraph steps={steps} cfg={cfg} unit={unit} />
          </TabsContent>
        </SectionCard>
      </Tabs>

      {/* ── Type refinements (not part of the scale itself) ── */}
      <Section
        title="Type refinements"
        description="Weights, line-heights, and tracking. Drag any control and the live specimen below updates in place. Viewport, font size, and ratio are shared foundation values."
        className="space-y-6"
      >
        <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
          <FontCombobox label="Body font" value={t.fontBody} onChange={(v) => patchType({ fontBody: v })} />
          <FontCombobox label="Heading font" value={t.fontHeading} onChange={(v) => patchType({ fontHeading: v })} />
          <div className="hidden lg:block" />
          <NumberSlider label="Body weight" value={t.weightBody} min={100} max={900} step={100}
            defaultValue={FLUID_DEFAULTS.type.weightBody}
            onChange={(v) => patchType({ weightBody: v })} />
          <NumberSlider label="Heading weight" value={t.weightHeading} min={100} max={900} step={100}
            defaultValue={FLUID_DEFAULTS.type.weightHeading}
            onChange={(v) => patchType({ weightHeading: v })} />
          <div className="hidden lg:block" />
          <NumberSlider label="Body line-height" value={t.lhBody} min={1} max={2} step={0.05}
            defaultValue={FLUID_DEFAULTS.type.lhBody}
            onChange={(v) => patchType({ lhBody: v })} />
          <NumberSlider label="Heading line-height" value={t.lhHeading} min={1} max={1.6} step={0.05}
            defaultValue={FLUID_DEFAULTS.type.lhHeading}
            onChange={(v) => patchType({ lhHeading: v })} />
          <div className="hidden lg:block" />
          <NumberSlider label="Body tracking" value={t.lsBody} min={-0.05} max={0.1} step={0.005} unit="em"
            defaultValue={FLUID_DEFAULTS.type.lsBody}
            onChange={(v) => patchType({ lsBody: v })} />
          <NumberSlider label="Heading tracking" value={t.lsHeading} min={-0.05} max={0.05} step={0.005} unit="em"
            defaultValue={FLUID_DEFAULTS.type.lsHeading}
            onChange={(v) => patchType({ lsHeading: v })} />
          <div className="sm:col-span-2 lg:col-span-3">
            <FoundationRef cfg={cfg} />
          </div>
        </div>
        <TypeSpecimen />
      </Section>
    </PageShell>
  )
}

/** Round-icon ± button (Utopia style). */
function StepButton({ kind, onClick, title }: { kind: "add" | "remove"; onClick: () => void; title: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="flex size-6 items-center justify-center rounded-full text-label-secondary inset-ring-1 inset-ring-stroke-strong transition-colors hover:bg-fill-secondary hover:text-label"
    >
      {kind === "add" ? <IconPlus size={13} stroke={2.5} /> : <IconMinus size={13} stroke={2.5} />}
    </button>
  )
}

type StepControls = {
  addAbove: () => void
  removeAbove: () => void
  addBelow: () => void
  removeBelow: () => void
}

/** Full-width "add a step" cap row for the Preview list (top = larger, bottom = smaller). */
function AddRow({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className="flex w-full items-center gap-inline-s px-inset-l py-inset-xs text-left text-caption text-label-secondary transition-colors hover:bg-surface-tertiary/60 hover:text-label"
    >
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full inset-ring-1 inset-ring-stroke-strong">
        <IconPlus size={13} stroke={2.5} />
      </span>
      {label}
    </button>
  )
}

function ScaleTable({ steps, cfg, controls, unit }: { steps: TypeStep[]; cfg: FluidConfig; controls: StepControls; unit: Unit }) {
  const desc = [...steps].reverse()
  const cell = "px-inset-s py-inset-2xs tabular-nums"
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-stroke-faint text-left text-caption text-label-secondary">
          <th className="w-24 px-inset-s py-inset-2xs font-medium">Scale step</th>
          <th className="px-inset-s py-inset-2xs font-medium" colSpan={2}>Viewport width</th>
        </tr>
      </thead>
      <tbody>
        {/* add-above + the two viewport anchors */}
        <tr className="border-b border-stroke-faint">
          <td className="px-inset-s py-inset-xs">
            <StepButton kind="add" onClick={controls.addAbove} title="Add a step above" />
          </td>
          <td className={cn(cell, "font-semibold text-label")}>{cfg.viewport.min}</td>
          <td className={cn(cell, "font-semibold text-label")}>{cfg.viewport.max}</td>
        </tr>
        {desc.map((s, i) => {
          const isTop = i === 0
          const isBottom = i === desc.length - 1
          const isBase = s.step === 0
          return (
            <tr key={s.step} className={cn("border-b border-stroke-faint/60", isBase && "bg-blue-500/6")}>
              <td className="px-inset-s py-inset-2xs">
                <div className="flex items-center justify-end gap-inline-2xs">
                  {isTop && <StepButton kind="remove" onClick={controls.removeAbove} title="Remove top step" />}
                  {isBottom && !isTop && (
                    <StepButton kind="remove" onClick={controls.removeBelow} title="Remove bottom step" />
                  )}
                  <span className={cn("font-mono font-semibold", isBase ? "text-label" : "text-label-secondary")}>
                    {s.step}
                  </span>
                </div>
              </td>
              <td className={cn(cell, isBase ? "font-semibold text-label" : "text-label")}>{formatUnit(s.minPx, unit)}</td>
              <td className={cn(cell, isBase ? "font-semibold text-label" : "text-label")}>{formatUnit(s.maxPx, unit)}</td>
            </tr>
          )
        })}
        {/* add-below */}
        <tr>
          <td className="px-inset-s py-inset-xs">
            <StepButton kind="add" onClick={controls.addBelow} title="Add a step below" />
          </td>
          <td /><td />
        </tr>
      </tbody>
    </table>
  )
}

function ScaleGraph({ steps, cfg, unit }: { steps: TypeStep[]; cfg: FluidConfig; unit: Unit }) {
  const W = 720
  const H = 420
  const xMin = 190
  const xMax = 610
  const top = 64
  const bottom = 344

  const vals = steps.flatMap((s) => [s.minPx, s.maxPx])
  const vLo = Math.min(...vals)
  const vHi = Math.max(...vals)
  const range = vHi - vLo || 1
  const lo = vLo - range * 0.08
  const hi = vHi + range * 0.08
  const y = (v: number) => bottom - ((v - lo) / (hi - lo)) * (bottom - top)

  return (
    <div className="overflow-x-auto p-inset-s">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 520 }}>
        {/* guides */}
        {[xMin, xMax].map((gx) => (
          <line key={gx} x1={gx} y1={top - 20} x2={gx} y2={bottom + 20}
            className="stroke-stroke-strong" strokeDasharray="4 4" strokeWidth={1} />
        ))}
        {/* viewport labels */}
        <text x={xMin} y={top - 30} textAnchor="middle" className="fill-label font-mono" fontSize={13} fontWeight={600}>
          {cfg.viewport.min}px
        </text>
        <text x={xMax} y={top - 30} textAnchor="middle" className="fill-label font-mono" fontSize={13} fontWeight={600}>
          {cfg.viewport.max}px
        </text>
        {/* ratio labels */}
        <text x={xMin} y={bottom + 44} textAnchor="middle" className="fill-label-secondary font-mono" fontSize={12}>
          ×{cfg.ratio.min}
        </text>
        <text x={xMax} y={bottom + 44} textAnchor="middle" className="fill-label-secondary font-mono" fontSize={12}>
          ×{cfg.ratio.max}
        </text>

        {/* step lines */}
        {steps.map((s) => {
          const isBase = s.step === 0
          return (
            <line key={`l${s.step}`} x1={xMin} y1={y(s.minPx)} x2={xMax} y2={y(s.maxPx)}
              className={isBase ? "stroke-blue-600" : "stroke-blue-500/45"}
              strokeWidth={isBase ? 2.5 : 1.5} strokeLinecap="round" />
          )
        })}

        {/* base-step px annotations */}
        {steps.filter((s) => s.step === 0).map((s) => (
          <g key="base-labels">
            <text x={xMin - 20} y={y(s.minPx) + 4} textAnchor="end" className="fill-label-secondary font-mono" fontSize={11}>
              {formatUnit(s.minPx, unit)}
            </text>
            <text x={xMax + 20} y={y(s.maxPx) + 4} textAnchor="start" className="fill-label-secondary font-mono" fontSize={11}>
              {formatUnit(s.maxPx, unit)}
            </text>
          </g>
        ))}

        {/* dots + step numbers at each anchor */}
        {steps.map((s) => (
          <g key={`d${s.step}`}>
            {[[xMin, s.minPx], [xMax, s.maxPx]].map(([cx, v], j) => (
              <g key={j}>
                <circle cx={cx} cy={y(v)} r={11} className="fill-label" />
                <text x={cx} y={y(v) + 4} textAnchor="middle" className="fill-surface-secondary font-mono" fontSize={11} fontWeight={600}>
                  {s.step}
                </text>
              </g>
            ))}
          </g>
        ))}
      </svg>
      <p className="mt-stack-2xs text-center text-caption text-label-secondary">
        Font size of every step between the min and max viewport.
      </p>
    </div>
  )
}

/**
 * Live prose specimen sitting under the refinement controls. It renders REAL
 * heading/body elements with the semantic role classes, so weight, line-height,
 * and tracking come straight from the `--type-weight/lh/ls-*` custom properties
 * that `applyFluid` writes on every slider drag. No props / re-render needed —
 * the CSS cascade repaints the specimen the instant a var changes.
 */
function TypeSpecimen() {
  return (
    <div>
      <div className="mb-inset-s font-mono text-[10px] uppercase tracking-[0.14em] text-label-tertiary">
        Live preview
      </div>
      {/* Framed like a real page so the scale reads in context, not as a list. */}
      <div className="overflow-hidden rounded-xl bg-surface-secondary inset-ring-1 inset-ring-stroke-faint">
        {/* Faux window chrome. */}
        <div className="flex items-center gap-1.5 border-b border-stroke-faint bg-surface px-inset-s py-inset-2xs">
          <span className="size-2.5 rounded-full bg-fill-secondary" />
          <span className="size-2.5 rounded-full bg-fill-secondary" />
          <span className="size-2.5 rounded-full bg-fill-secondary" />
          <span className="ml-inset-s font-mono text-[11px] text-label-tertiary">project-base.sketch</span>
        </div>

        <article className="mx-auto max-w-[68ch] px-[var(--space-m-l)] py-[var(--space-l-xl)]">
          <p className="text-eyebrow font-semibold uppercase tracking-[0.14em] text-blue-500">Field Notes</p>
          <h1 className="mt-stack-2xs text-display text-balance text-label">Designing a type scale you can feel</h1>
          <p className="mt-stack-s text-caption text-label-secondary">Bryce Lewis · Project-Base · 4 min read</p>

          <p className="mt-stack-l text-body text-label">
            A good scale disappears. You stop noticing the sizes and start reading the ideas — every
            step earning its place, from the quietest caption to the loudest headline.
          </p>

          <h2 className="mt-stack-l text-title text-label">One ratio, many voices</h2>
          <p className="mt-stack-s text-body text-label">
            Headlines expand with confidence while the small end compresses — tight, legible, and
            calm — giving labels and footnotes room to breathe without ever shouting.
          </p>

          <blockquote className="mt-stack-l border-l-2 border-blue-500/40 pl-inset-m text-title text-label-secondary italic">
            “Type is the interface. Everything else is just decoration.”
          </blockquote>

          <p className="mt-stack-l text-body text-label">
            Tune the weight, leading, and tracking until the rhythm feels effortless — then bake it in
            with Copy CSS and forget it's there.
          </p>

          <p className="mt-stack-l text-caption text-label-tertiary">
            Set live on Foundations and Typography · every size a token you can reach for.
          </p>
        </article>
      </div>
    </div>
  )
}

function ScaleVisualiser({
  steps,
  cfg,
  unit,
  preview,
  setPreview,
  controls,
  onRename,
  onToggleDisable,
}: {
  steps: TypeStep[]
  cfg: FluidConfig
  unit: Unit
  preview: string
  setPreview: (v: string) => void
  controls: StepControls
  onRename: (step: number, name: string) => void
  onToggleDisable: (step: number) => void
}) {
  const width = useViewportWidth()
  const desc = [...steps].reverse()
  const t = cfg.type
  // The semantic role tied to a step (the utility you'd type in a component).
  // Steps added beyond the curated role set have none — they're raw primitives.
  const roleInfo = (step: number) => TYPE_ROLES.find((x) => x.step === step)
  return (
    <div className="p-inset-l">
      {/* Type your own specimen — every row re-renders it, typescale.com-style. */}
      <div className="mb-stack-m flex flex-wrap items-center gap-inline-m">
        <input
          value={preview}
          onChange={(e) => setPreview(e.target.value)}
          placeholder="Preview text"
          aria-label="Preview text"
          className="min-w-0 flex-1 rounded-lg bg-surface px-inset-s py-inset-2xs text-body text-label inset-ring-1 inset-ring-stroke-faint focus:outline-none focus-visible:inset-ring-stroke-strong"
        />
        <span className="shrink-0 font-mono text-caption text-label-secondary tabular-nums">at {width}px</span>
      </div>

      {/* Full-bleed rows so the highlighted base band and off-edge samples reach the card edges. */}
      <div className="-mx-inset-l -mb-inset-l">
        {/* Column header: the role utility replaces the old Semantic roles table. */}
        <div className="flex items-center gap-inline-l px-inset-l pb-inset-2xs text-[10px] font-medium uppercase tracking-[0.12em] text-label-tertiary">
          <div className="w-20 shrink-0">Size</div>
          <div className="w-36 shrink-0">Role utility</div>
          <div className="min-w-0 flex-1">Specimen</div>
        </div>

        {/* Grow the scale toward the top (larger) — mirrors the Table's ± controls. */}
        <AddRow onClick={controls.addAbove} label="Add a larger step" />

        {desc.map((s, i) => {
          // Heading steps (positive) wear the heading refinements; body/negative wear body's.
          const heading = s.step > 0
          const base = s.step === 0
          const info = roleInfo(s.step)
          const disabled = cfg.type.disabledSteps.includes(s.step)
          const isTop = i === 0
          const isBottom = i === desc.length - 1
          return (
            <div
              key={s.step}
              className={cn(
                "group/row relative flex items-center gap-inline-l px-inset-l py-inset-s",
                base && "bg-surface-tertiary"
              )}
            >
              {/* Toggle a size off — kept in the scale but greyed + excluded from Copy CSS. */}
              <button
                type="button"
                onClick={() => onToggleDisable(s.step)}
                title={disabled ? "Enable this size" : "Disable this size (excluded from Copy CSS)"}
                aria-label={disabled ? `Enable step ${s.step}` : `Disable step ${s.step}`}
                className={cn(
                  "absolute left-1 top-1/2 -translate-y-1/2 transition-colors",
                  disabled ? "text-label-secondary hover:text-label" : "text-label-tertiary/50 hover:text-label"
                )}
              >
                {disabled ? <IconEyeOff size={15} stroke={2} /> : <IconEye size={15} stroke={2} />}
              </button>
              <div className={cn("w-20 shrink-0 font-mono text-caption tabular-nums", disabled ? "text-label-tertiary line-through" : "text-label")}>
                {formatUnit(resolveClamp(s, width), unit)}
              </div>
              {/* Editable role name → a `.text-<name>` utility (live + Copy CSS). */}
              <div className={cn("flex w-36 shrink-0 items-baseline gap-0.5 font-mono text-caption text-label-secondary", disabled && "opacity-40")}>
                <span className="text-label-tertiary">text-</span>
                <input
                  value={cfg.type.roleNames[s.step] ?? info?.role ?? ""}
                  onChange={(e) => onRename(s.step, e.target.value)}
                  placeholder="name"
                  spellCheck={false}
                  autoComplete="off"
                  aria-label={`Role name for step ${s.step}`}
                  className="min-w-0 flex-1 rounded bg-transparent px-0.5 text-label-secondary outline-none placeholder:text-label-tertiary/50 hover:bg-surface focus:bg-surface focus:text-label focus:inset-ring-1 focus:inset-ring-stroke-faint"
                />
              </div>
              {/* Real clamp → the browser resolves it at the actual viewport; runs off the edge. */}
              <span
                className={cn("min-w-0 flex-1 overflow-hidden whitespace-nowrap text-label", disabled && "opacity-40")}
                style={{
                  fontFamily: heading ? "var(--font-heading)" : "var(--font-body)",
                  fontSize: s.css,
                  fontWeight: heading ? t.weightHeading : t.weightBody,
                  lineHeight: heading ? t.lhHeading : t.lhBody,
                  letterSpacing: `${heading ? t.lsHeading : t.lsBody}em`,
                }}
              >
                {preview || "Preview text"}
              </span>
              {/* Only the outermost steps are removable (the scale is contiguous).
                  Always shown in the row's right padding, dim until hovered. */}
              {(isTop || isBottom) && (
                <div className="absolute right-inset-2xs top-1/2 -translate-y-1/2 opacity-60 transition-opacity group-hover/row:opacity-100 focus-within:opacity-100">
                  <StepButton
                    kind="remove"
                    onClick={isTop ? controls.removeAbove : controls.removeBelow}
                    title={isTop ? "Remove this (largest) step" : "Remove this (smallest) step"}
                  />
                </div>
              )}
            </div>
          )
        })}

        {/* Grow the scale toward the bottom (smaller). */}
        <AddRow onClick={controls.addBelow} label="Add a smaller step" />
      </div>
    </div>
  )
}

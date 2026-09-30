import { useState } from "react"
import { IconPlus, IconMinus, IconX, IconArrowRight } from "@tabler/icons-react"
import { PageShell, PageHeader, Section } from "@/components/PageLayout"
import { Squircle, SQUIRCLE_RADIUS } from "@/components/squircle"
import { Button } from "@/components/ui/button"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  useFluidConfig,
  useViewportWidth,
  PageActions,
  FoundationRef,
  FluidWedge,
} from "@/pages/_fluid-controls"
import {
  computeSpaceScale,
  resolveClamp,
  exportFluidCss,
  activeSpaceKeys,
  SPACE_STEP_ORDER,
  SPACE_ROLE_NAMES,
  SPACE_DOWN_KEYS,
  SPACE_UP_KEYS,
  type SpaceStepKey,
} from "@/lib/fluid"

const ROLE_BLURB: Record<string, string> = {
  inset: "Padding inside a container — p-inset-*",
  stack: "Vertical gaps between stacked elements — space-y-stack-* / gap-y-*",
  inline: "Horizontal gaps in a row — space-x-inline-* / gap-x-*",
  gutter: "Grid / wrapping-flex gaps — gap-gutter-*",
}

/** Round-icon ± button (matches the Type page's scale controls). */
function StepButton({ kind, onClick, disabled, title }: {
  kind: "add" | "remove"; onClick: () => void; disabled?: boolean; title: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="flex size-6 items-center justify-center rounded-full text-label-secondary inset-ring-1 inset-ring-stroke-strong transition-colors hover:bg-fill-secondary hover:text-label disabled:pointer-events-none disabled:opacity-30"
    >
      {kind === "add" ? <IconPlus size={13} stroke={2.5} /> : <IconMinus size={13} stroke={2.5} />}
    </button>
  )
}

/** Utopia-style step badge (a filled circle with the step key). */
function StepBadge({ children }: { children: string }) {
  return (
    <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-label/85 px-1.5 font-mono text-[10px] font-semibold text-surface">
      {children}
    </span>
  )
}

/** One pair row: badges (lo ··· hi), @min/@max labels, and the fluid wedge. */
function PairRow({ tokenKey, minPx, maxPx, scale, onRemove }: {
  tokenKey: string; minPx: number; maxPx: number; scale: number; onRemove?: () => void
}) {
  const [lo, hi] = tokenKey.split("-")
  return (
    <div className="flex items-center gap-4 border-b border-stroke-faint/40 py-3 last:border-0">
      <div className="flex w-24 shrink-0 items-center gap-1.5">
        <StepBadge>{lo}</StepBadge>
        <span className="text-label-tertiary">···</span>
        <StepBadge>{hi}</StepBadge>
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex items-center justify-between font-mono text-[10px] text-label-secondary">
          <span>{minPx}px</span>
          <span>{maxPx}px</span>
        </div>
        <FluidWedge minPx={minPx} maxPx={maxPx} scale={scale} />
      </div>
      {onRemove && (
        <button onClick={onRemove} title="Remove pair" className="shrink-0 text-label-secondary transition-colors hover:text-label">
          <IconX size={14} stroke={2} />
        </button>
      )}
    </div>
  )
}

/** A compact step picker (active keys only) for the custom-pair builder. */
function PairSelect({ value, keys, onChange }: {
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

export function Spacing() {
  const { cfg, patchSpace, save, reset } = useFluidConfig()
  const vw = useViewportWidth()
  const scale = computeSpaceScale(cfg)
  const keys = activeSpaceKeys(cfg.space)

  const setMultiplier = (key: string, v: number) =>
    patchSpace({ multipliers: { ...cfg.space.multipliers, [key]: v } })
  const stepControls = {
    addUp: () => patchSpace({ up: Math.min(cfg.space.up + 1, SPACE_UP_KEYS.length) }),
    removeUp: () => patchSpace({ up: Math.max(cfg.space.up - 1, 0) }),
    addDown: () => patchSpace({ down: Math.min(cfg.space.down + 1, SPACE_DOWN_KEYS.length) }),
    removeDown: () => patchSpace({ down: Math.max(cfg.space.down - 1, 0) }),
  }

  // Custom-pair builder (a pair that jumps more than one step, e.g. s → l).
  const [pairFrom, setPairFrom] = useState<SpaceStepKey>("s")
  const [pairTo, setPairTo] = useState<SpaceStepKey>("l")
  const addCustomPair = () => {
    if (pairFrom === pairTo) return
    const [lo, hi]: [SpaceStepKey, SpaceStepKey] =
      SPACE_STEP_ORDER.indexOf(pairFrom) < SPACE_STEP_ORDER.indexOf(pairTo)
        ? [pairFrom, pairTo]
        : [pairTo, pairFrom]
    if (cfg.space.customPairs.some(([a, b]) => a === lo && b === hi)) return
    patchSpace({ customPairs: [...cfg.space.customPairs, [lo, hi]] })
  }
  const removeCustomPair = (key: string) =>
    patchSpace({ customPairs: cfg.space.customPairs.filter(([a, b]) => `${a}-${b}` !== key) })

  const desc = [...scale.singles].reverse() // largest → smallest
  // Shared scale so every pair wedge is proportional to the biggest one.
  const pairMaxPx = Math.max(1, ...scale.pairs.map((p) => p.maxPx), ...scale.customPairs.map((p) => p.maxPx))
  const wedgeScale = 60 / pairMaxPx

  return (
    <PageShell>
      <header className="flex items-start justify-between gap-4">
        <PageHeader
          title="Space"
          description="Fluid t-shirt scale (Utopia clamp), aliased to role-based semantic tokens. Each step is an editable multiple of the base."
        />
        <PageActions onSave={save} onReset={reset} copyText={() => exportFluidCss(cfg)} />
      </header>

      <FoundationRef cfg={cfg} />

      {/* ── Primitive scale (editable) ── */}
      <Section
        title="Primitive steps"
        description="Every step is an editable ×multiple of the base (s = 1×). Add or remove steps with ± — the roles and tokens follow."
        className="space-y-4"
      >
        <p className="text-caption text-label-secondary">
          Resolving at <span className="font-mono font-semibold text-label">{vw}px</span> — your current viewport.
        </p>

        {/* add a larger step */}
        <div className="flex items-center gap-3">
          <div className="flex w-8 shrink-0 justify-end">
            <StepButton kind="add" onClick={stepControls.addUp} disabled={cfg.space.up >= SPACE_UP_KEYS.length}
              title="Add a larger step" />
          </div>
          <span className="text-caption text-label-secondary">larger</span>
        </div>

        <div className="space-y-2">
          {desc.map((s, i) => {
            const isBase = s.key === "s"
            const isLargest = i === 0 && !isBase
            const isSmallest = i === desc.length - 1 && !isBase
            const px = resolveClamp(s, vw)
            return (
              <div key={s.key} className={cn("flex items-center gap-3", isBase && "rounded-md bg-blue-500/6")}>
                <div className="flex w-8 shrink-0 justify-end">
                  {isLargest && <StepButton kind="remove" onClick={stepControls.removeUp} title="Remove largest step" />}
                  {isSmallest && <StepButton kind="remove" onClick={stepControls.removeDown} title="Remove smallest step" />}
                </div>
                <div className={cn("w-10 shrink-0 text-right font-mono text-caption font-semibold", isBase ? "text-label" : "text-label")}>
                  {s.key}
                </div>
                <div className="w-16 shrink-0">
                  {isBase ? (
                    <span className="block text-right font-mono text-[11px] text-label-secondary">×1 base</span>
                  ) : (
                    <div className="flex items-center justify-end gap-0.5">
                      <span className="font-mono text-[11px] text-label-secondary">×</span>
                      <input
                        type="number"
                        value={s.mult}
                        min={0.05}
                        max={20}
                        step={0.05}
                        onChange={(e) => {
                          const n = parseFloat(e.target.value)
                          if (!Number.isNaN(n)) setMultiplier(s.key, n)
                        }}
                        aria-label={`${s.key} multiplier`}
                        className="w-12 rounded-md bg-surface px-1 py-0.5 text-right font-mono text-[11px] tabular-nums text-label inset-ring-1 inset-ring-stroke-faint focus:outline-none focus-visible:inset-ring-stroke-strong"
                      />
                    </div>
                  )}
                </div>
                <div className="h-5 shrink-0 rounded-sm bg-blue-500/70" style={{ width: Math.max(px, 2) }} />
                <div className="min-w-0 flex-1">
                  <span className="font-mono text-[10px] text-label">{px.toFixed(1)}px</span>
                  <span className="ml-2 font-mono text-[10px] text-label-secondary">{s.minPx}→{s.maxPx}px</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* add a smaller step */}
        <div className="flex items-center gap-3">
          <div className="flex w-8 shrink-0 justify-end">
            <StepButton kind="add" onClick={stepControls.addDown} disabled={cfg.space.down >= SPACE_DOWN_KEYS.length}
              title="Add a smaller step" />
          </div>
          <span className="text-caption text-label-secondary">smaller</span>
        </div>
      </Section>

      {/* ── One-up pairs ── */}
      <Section
        title="One-up pairs"
        description="Fluid from the lower step's min to the upper step's max — space that grows a whole step as the viewport widens."
      >
        {scale.pairs.map((p) => (
          <PairRow key={p.key} tokenKey={p.key} minPx={p.minPx} maxPx={p.maxPx} scale={wedgeScale} />
        ))}
      </Section>

      {/* ── Custom pairs ── */}
      <Section
        title="Custom pairs"
        description="A pair that jumps more than one step — space that grows a whole span as the viewport widens. Reach for these on section gaps, hero/page padding, and grid gutters. Use via var(--space-lo-hi)."
        className="space-y-4"
      >
        <div className="flex flex-wrap items-center gap-3">
          <PairSelect value={pairFrom} keys={keys} onChange={setPairFrom} />
          <IconArrowRight size={16} className="shrink-0 text-label-secondary" />
          <PairSelect value={pairTo} keys={keys} onChange={setPairTo} />
          <Button variant="outline" size="sm" onClick={addCustomPair}>
            <IconPlus size={14} stroke={2} /> Add pair
          </Button>
        </div>

        {scale.customPairs.length === 0 ? (
          <p className="text-caption text-label-secondary">
            No custom pairs yet. Pair two steps (e.g. <span className="font-mono text-label">s → l</span>) for space that climbs faster on wide screens.
          </p>
        ) : (
          <div>
            {scale.customPairs.map((p) => (
              <PairRow key={p.key} tokenKey={p.key} minPx={p.minPx} maxPx={p.maxPx} scale={wedgeScale}
                onRemove={() => removeCustomPair(p.key)} />
            ))}
          </div>
        )}
      </Section>

      {/* ── Semantic roles ── */}
      <Section
        title="Semantic roles"
        description="Which primitive sizes each role exposes. Pick the role by intent; the utility's property picks the axis."
        className="space-y-6"
      >
        {SPACE_ROLE_NAMES.map((role) => (
          <div key={role} className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-caption font-semibold text-label">{role}</span>
              <span className="text-caption text-label-secondary">{ROLE_BLURB[role]}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {keys.map((size) => (
                <span key={size} className="rounded-md bg-fill-quinary px-2 py-1 font-mono text-[10px] text-label-secondary">
                  {role}-{size}
                </span>
              ))}
            </div>
          </div>
        ))}
      </Section>

      {/* ── Live layout (real role utilities → genuinely fluid) ── */}
      <Section
        title="Live layout"
        description="Built from the role utilities — resize the window to watch padding and gaps flow."
        bare
      >
        <Squircle as="div" cornerRadius={SQUIRCLE_RADIUS["2xl"]} shadow="md"
          className="rounded-2xl bg-surface p-inset-l">
          <div className="flex flex-col gap-stack-m">
            <Squircle as="div" cornerRadius={SQUIRCLE_RADIUS.xl} shadow="xs"
              className="rounded-xl bg-surface-secondary p-inset-m">
              <div className="flex flex-col gap-stack-2xs">
                <div className="h-5 w-40 rounded-md bg-label/25" />
                <div className="h-3.5 w-56 rounded bg-label/15" />
              </div>
              <div className="mt-stack-m flex flex-col gap-stack-xs">
                {[0, 1].map((r) => (
                  <div key={r} className="flex items-center gap-inline-s">
                    <div className="size-9 shrink-0 rounded-lg bg-surface-tertiary border border-stroke-faint" />
                    <div className="flex flex-1 flex-col gap-stack-2xs">
                      <div className="h-3.5 w-28 rounded bg-label/20" />
                      <div className="h-3 w-40 rounded bg-label/10" />
                    </div>
                  </div>
                ))}
              </div>
            </Squircle>
            <div className="grid gap-gutter-m sm:grid-cols-2">
              {[0, 1].map((c) => (
                <Squircle key={c} as="div" cornerRadius={SQUIRCLE_RADIUS.xl} shadow="xs"
                  className="rounded-xl bg-surface-secondary p-inset-s">
                  <div className="h-4.5 w-28 rounded-md bg-label/25" />
                  <div className="mt-stack-2xs h-3 w-36 rounded bg-label/15" />
                </Squircle>
              ))}
            </div>
          </div>
        </Squircle>
      </Section>
    </PageShell>
  )
}

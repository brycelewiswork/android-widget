/**
 * Shared controls for the fluid reference pages (/typography, /spacing, /grid,
 * /clamp). Utopia-style sliders + numeric entries, a Save/Reset/Copy action row,
 * and a `useFluidConfig` hook that live-applies + persists the one FluidConfig a
 * sketch owns. Colocated with the pages; underscore-prefixed so it doesn't read
 * as a route.
 */
import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { IconDeviceFloppy, IconRefresh, IconCopy, IconCheck, IconArrowBackUp } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Slider as SliderInput } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { type FluidConfig } from "@/lib/fluid"
import { useFluidStore } from "@/store/useFluidStore"

/** Tracks the live browser viewport width (updates on resize). Shared so every
 *  system-scale preview (Type visualiser, Foundations cascade, Space steps)
 *  resolves at the SAME real viewport — their numbers can't disagree. */
export function useViewportWidth() {
  const [width, setWidth] = useState(() => (typeof window === "undefined" ? 0 : window.innerWidth))
  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth)
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])
  return width
}

/** Reads the ONE shared fluid config (Zustand). Every reference page uses this,
 *  so foundation values, the type scale, and the space scale stay in lockstep —
 *  edit on any page and the others reflect it live. */
export function useFluidConfig() {
  return useFluidStore()
}

/** Read-only summary of the six foundation values, with a link to tune them.
 *  Used on the type/space pages so those scales don't re-own foundation inputs. */
export function FoundationRef({ cfg }: { cfg: FluidConfig }) {
  return (
    <div className="text-caption text-label-secondary">
      Derived from the foundation — viewport{" "}
      <span className="font-mono text-label">{cfg.viewport.min}→{cfg.viewport.max}px</span>, base{" "}
      <span className="font-mono text-label">{cfg.base.min}→{cfg.base.max}px</span>, ratio{" "}
      <span className="font-mono text-label">{cfg.ratio.min}→{cfg.ratio.max}</span>. Tune these on{" "}
      <Link to="/foundations" className="text-blue-500 hover:underline">Foundations</Link>.
    </div>
  )
}

export function NumberSlider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  className,
  defaultValue,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit?: string
  onChange: (v: number) => void
  className?: string
  /** When provided, a per-field revert button appears whenever `value` drifts
   *  from this default — resets just this control (not the whole config). */
  defaultValue?: number
}) {
  const decimals = step < 0.01 ? 3 : step < 1 ? 2 : 0
  const clamp = (v: number) => Math.min(max, Math.max(min, v))
  const modified =
    defaultValue !== undefined && Math.abs(value - defaultValue) > (step ? step / 2 : 1e-9)
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-baseline justify-between">
        <label className="text-[0.8125rem] font-medium text-label-secondary">{label}</label>
        <div className="flex items-baseline gap-1">
          {defaultValue !== undefined && (
            <button
              type="button"
              onClick={() => onChange(defaultValue)}
              disabled={!modified}
              aria-label={`Reset ${label} to default`}
              title={`Reset to ${Number.isInteger(defaultValue) ? defaultValue : defaultValue.toFixed(decimals)}${unit ?? ""}`}
              className={cn(
                "translate-y-px rounded p-0.5 transition-colors",
                modified
                  ? "text-label-secondary hover:text-label"
                  : "pointer-events-none text-label-tertiary/40"
              )}
            >
              <IconArrowBackUp size={13} stroke={2} />
            </button>
          )}
          <input
            type="number"
            value={Number.isInteger(value) ? value : Number(value.toFixed(decimals))}
            min={min}
            max={max}
            step={step}
            onChange={(e) => {
              const n = parseFloat(e.target.value)
              if (!Number.isNaN(n)) onChange(clamp(n))
            }}
            className="w-16 rounded-md bg-surface px-1.5 py-0.5 text-right font-mono text-[0.8125rem] tabular-nums text-label inset-ring-1 inset-ring-stroke-faint focus:outline-none focus-visible:inset-ring-stroke-strong [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          {unit && <span className="font-mono text-[0.8125rem] text-label-secondary">{unit}</span>}
        </div>
      </div>
      <SliderInput
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={(v) => onChange(Array.isArray(v) ? v[0] : v)}
      />
    </div>
  )
}

export function CopyButton({ getText, label = "Copy CSS" }: { getText: () => string; label?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(getText())
          setCopied(true)
          toast.success("CSS copied to clipboard")
          setTimeout(() => setCopied(false), 1500)
        } catch {
          toast.error("Couldn't access the clipboard")
        }
      }}
    >
      {copied ? <IconCheck size={14} stroke={2} /> : <IconCopy size={14} stroke={2} />} {label}
    </Button>
  )
}

/** Save / Reset / Copy CSS action row for the top-right of a page header. */
export function PageActions({
  onSave,
  onReset,
  copyText,
  copyLabel,
}: {
  onSave?: () => void
  onReset?: () => void
  copyText?: () => string
  copyLabel?: string
}) {
  return (
    <div className="flex shrink-0 gap-2">
      {copyText && <CopyButton getText={copyText} label={copyLabel} />}
      {onSave && (
        <Button variant="ghost" size="sm" onClick={onSave}>
          <IconDeviceFloppy size={14} stroke={2} /> Save
        </Button>
      )}
      {onReset && (
        <Button variant="ghost" size="sm" onClick={onReset}>
          <IconRefresh size={14} stroke={2} /> Reset
        </Button>
      )}
    </div>
  )
}

/**
 * Utopia-style fluid visualization: a trapezoid that grows from the @min value
 * (left cap) to the @max value (right cap), with a tapering fluid band between.
 * `scale` is the px→display-px factor — pass the SAME scale across a set so the
 * wedges stay proportional to each other.
 */
export function FluidWedge({ minPx, maxPx, scale }: {
  minPx: number; maxPx: number; scale: number
}) {
  const minH = Math.max(2, minPx * scale)
  const maxH = Math.max(2, maxPx * scale)
  const H = Math.max(minH, maxH)
  const cy = H / 2
  return (
    <div className="relative w-full" style={{ height: H }}>
      <svg viewBox={`0 0 100 ${H}`} preserveAspectRatio="none" className="absolute inset-0 size-full">
        <polygon
          points={`0,${cy - minH / 2} 100,${cy - maxH / 2} 100,${cy + maxH / 2} 0,${cy + minH / 2}`}
          className="fill-blue-500/15"
        />
      </svg>
      {/* Square end caps — side = the scaled value. */}
      <div className="absolute left-0 rounded-[2px] bg-blue-500/70" style={{ top: cy - minH / 2, height: minH, width: minH }} />
      <div className="absolute right-0 rounded-[2px] bg-blue-500/70" style={{ top: cy - maxH / 2, height: maxH, width: maxH }} />
    </div>
  )
}

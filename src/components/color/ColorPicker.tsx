import { useEffect, useMemo, useRef, useState } from "react"
import { IconCheck, IconChevronDown, IconColorPicker, IconX } from "@tabler/icons-react"
import { Select } from "@base-ui/react/select"
import { Squircle, SQUIRCLE_RADIUS } from "@/components/squircle"
import { converter, formatHex, type Hsl, type Hsv, type Rgb } from "culori"
import {
  hsvToHex,
  hsvToOklch,
  oklchCss,
  oklchToHsv,
  parseToOklch,
  type PickerMode,
} from "@/lib/color-convert"

const toRgb = converter("rgb")
const toHsl = converter("hsl")
const toHsv = converter("hsv")

type Props = {
  /** Any CSS color string. Picker seeds from this once on mount. */
  value: string
  /** Live — fires on every edit with an `oklch(...)` CSS string. */
  onChange: (oklchCssValue: string) => void
  /** Close the picker (X button / Enter / Escape). */
  onClose?: () => void
  /** Which readout the mode dropdown starts on. Defaults to `hsl`. */
  defaultMode?: PickerMode
}

const MODES: PickerMode[] = ["hex", "rgb", "css", "hsl", "hsb", "okl"]

/** Checkerboard shown behind translucent colors (alpha track). */
const CHECKER = "repeating-conic-gradient(#c8c8c8 0% 25%, #ffffff 0% 50%)"

/** Above the ColorField popover portal (which sits at ~max int) so the mode menu wins. */
const MENU_Z = 2147483647

export function ColorPicker({ value, onChange, onClose, defaultMode = "hsl" }: Props) {
  // Internal HSV state — kept independent of the value prop so editing is stable.
  const [h, setH] = useState(0)
  const [s, setS] = useState(0)
  const [v, setV] = useState(0)
  const [a, setA] = useState(1)
  const [mode, setMode] = useState<PickerMode>(defaultMode)

  // Seed once on mount. The picker owns its state while open and applies live, so
  // re-seeding from the (self-updating) value prop mid-edit would cause jitter.
  const seeded = useRef(false)
  useEffect(() => {
    if (seeded.current) return
    seeded.current = true
    const parsed = parseToOklch(value)
    if (!parsed) return
    const hsv = oklchToHsv(parsed)
    setH(hsv.h || 0)
    setS(hsv.s)
    setV(hsv.v)
    setA(hsv.a)
  }, [value])

  // Emit live from explicit values (state setters are async, so pass the new ones).
  const emit = (nh: number, ns: number, nv: number, na: number) => {
    onChange(oklchCss(hsvToOklch(nh, ns, nv, na)))
  }

  const typingRef = useRef(false)

  // ─── 2D canvas (saturation × value OR saturation × lightness) ────────────
  const canvasMode: "hsv" | "hsl" = mode === "hsl" ? "hsl" : "hsv"

  const thumb = useMemo(() => {
    if (canvasMode === "hsv") return { x: s, y: 1 - v }
    const hsl = toHsl({ mode: "hsv", h, s, v }) as Hsl | undefined
    return { x: hsl?.s ?? 0, y: 1 - (hsl?.l ?? 0) }
  }, [canvasMode, h, s, v])

  const svRef = useRef<HTMLDivElement>(null)
  const draggingSV = useRef(false)
  const handleSVPointer = (e: React.PointerEvent) => {
    const el = svRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = clamp01((e.clientX - rect.left) / rect.width)
    const y = 1 - clamp01((e.clientY - rect.top) / rect.height)
    if (canvasMode === "hsv") {
      setS(x); setV(y); emit(h, x, y, a)
      return
    }
    const next = toHsv({ mode: "hsl", h, s: x, l: y }) as Hsv | undefined
    if (!next) return
    const ns = next.s ?? 0
    const nv = next.v ?? 0
    setS(ns); setV(nv); emit(h, ns, nv, a)
  }
  const onSVDown = (e: React.PointerEvent) => {
    draggingSV.current = true
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    handleSVPointer(e)
  }
  const onSVMove = (e: React.PointerEvent) => { if (draggingSV.current) handleSVPointer(e) }
  const onSVUp = (e: React.PointerEvent) => {
    draggingSV.current = false
    ;(e.target as Element).releasePointerCapture?.(e.pointerId)
  }

  // ─── Eyedropper ───────────────────────────────────────────────────────────
  const hasEyedropper = typeof window !== "undefined" && "EyeDropper" in window
  const pickWithDropper = async () => {
    if (!hasEyedropper) return
    try {
      // @ts-expect-error EyeDropper not in lib.dom yet
      const dropper = new window.EyeDropper()
      const result = await dropper.open()
      const parsed = parseToOklch(result.sRGBHex)
      if (!parsed) return
      const hsv = oklchToHsv(parsed)
      setH(hsv.h || 0); setS(hsv.s); setV(hsv.v); setA(hsv.a)
      emit(hsv.h || 0, hsv.s, hsv.v, hsv.a)
    } catch {
      // user dismissed
    }
  }

  // ─── Text input ───────────────────────────────────────────────────────────
  const commitText = (raw: string) => {
    const parsed = parseToOklch(raw)
    if (!parsed) return false
    const hsv = oklchToHsv(parsed)
    setH(hsv.h || 0); setS(hsv.s); setV(hsv.v); setA(hsv.a)
    emit(hsv.h || 0, hsv.s, hsv.v, hsv.a)
    return true
  }

  const setAlpha = (na: number) => { setA(na); emit(h, s, v, na) }

  // ─── Backgrounds ──────────────────────────────────────────────────────────
  const pureHueHex = useMemo(() => hsvToHex(h, 1, 1, 1), [h])
  const currentHex = useMemo(() => hsvToHex(h, s, v, 1), [h, s, v])

  return (
    <div
      className="flex flex-col gap-2.5 w-[256px] p-inset-xs pt-1.5 select-none"
      onKeyDown={(e) => { if (e.key === "Escape") onClose?.() }}
    >
      {/* Icon bar — close only */}
      <div className="flex items-center justify-end h-6">
        <button
          onClick={() => onClose?.()}
          className="h-6 w-6 flex items-center justify-center rounded-md text-label-secondary hover:text-label hover:bg-fill-quaternary cursor-pointer"
          aria-label="Close"
        >
          <IconX size={15} stroke={2} />
        </button>
      </div>

      {/* 2D canvas — HSV (S×V) by default, HSL (S×L) when picker is in HSL mode */}
      <div
        ref={svRef}
        className="relative h-[180px] w-full rounded-lg overflow-hidden cursor-crosshair touch-none border border-black/20"
        style={canvasMode === "hsv"
          ? { backgroundColor: pureHueHex }
          : { background: `linear-gradient(to right, hsl(${h} 0% 50%), hsl(${h} 100% 50%))` }}
        onPointerDown={onSVDown}
        onPointerMove={onSVMove}
        onPointerUp={onSVUp}
        onPointerCancel={onSVUp}
      >
        {canvasMode === "hsv" ? (
          <>
            <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to right, #fff, rgba(255,255,255,0))" }} />
            <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0), #000)" }} />
          </>
        ) : (
          <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to bottom, #fff, rgba(255,255,255,0) 50%, rgba(0,0,0,0) 50%, #000)" }} />
        )}
        <div
          className="absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
          style={{
            left: `${thumb.x * 100}%`,
            top: `${thumb.y * 100}%`,
            backgroundColor: currentHex,
            boxShadow: "0 0 0 2px white, 0 0 0 3px rgba(0,0,0,0.35)",
          }}
        />
      </div>

      {/* Eyedropper · hue + alpha sliders */}
      <div className="flex items-center gap-2.5">
        {hasEyedropper && (
          <button
            onClick={pickWithDropper}
            className="shrink-0 h-8 w-8 rounded-lg flex items-center justify-center text-label-secondary hover:text-label hover:bg-fill-quaternary cursor-pointer inset-ring-1 inset-ring-stroke-faint"
            aria-label="Pick color from screen"
          >
            <IconColorPicker size={16} stroke={1.75} />
          </button>
        )}
        <div className="flex-1 flex flex-col gap-2.5">
          <RangeSlider
            value={h}
            min={0}
            max={360}
            onChange={(nh) => { setH(nh); emit(nh, s, v, a) }}
            trackStyle={{
              background: "linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)",
            }}
            thumbStyle={{ backgroundColor: hsvToHex(h, 1, 1, 1) }}
          />
          <RangeSlider
            value={a * 100}
            min={0}
            max={100}
            onChange={(na) => setAlpha(na / 100)}
            trackClassName="bg-clip-padding"
            trackStyle={{
              backgroundColor: "transparent",
              backgroundImage: `linear-gradient(to right, transparent, ${currentHex}), ${CHECKER}`,
              backgroundSize: "100% 100%, 9px 9px",
            }}
            thumbStyle={{ backgroundColor: currentHex }}
          />
        </div>
      </div>

      {/* Mode dropdown + unified value pill (components + alpha, one outline) */}
      <div className="flex items-center gap-1.5">
        <Select.Root value={mode} onValueChange={(m) => setMode(m as PickerMode)} modal={false}>
          <Select.Trigger className="h-8 shrink-0 inline-flex items-center gap-inline-3xs rounded-lg bg-fill-tertiary text-xs font-medium pl-2.5 pr-1.5 cursor-pointer inset-ring-1 inset-ring-stroke-faint focus:outline-none text-label">
            <Select.Value>{(m) => String(m).toUpperCase()}</Select.Value>
            <Select.Icon>
              <IconChevronDown size={12} stroke={2} className="text-label-secondary" />
            </Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner sideOffset={4} style={{ zIndex: MENU_Z }}>
              <Select.Popup
                render={(props) => (
                  <Squircle
                    as="div"
                    cornerRadius={SQUIRCLE_RADIUS.md}
                    shadow="md"
                    {...props}
                    className="rounded-md bg-surface-secondary inset-ring-1 inset-ring-stroke-faint py-inset-3xs min-w-[72px]"
                  />
                )}
              >
                {MODES.map((m) => (
                  <Select.Item
                    key={m}
                    value={m}
                    className="flex items-center justify-between gap-inline-2xs px-2.5 py-inset-3xs text-xs text-label cursor-pointer outline-none data-highlighted:bg-fill-quaternary"
                  >
                    <Select.ItemText>{m.toUpperCase()}</Select.ItemText>
                    <Select.ItemIndicator>
                      <IconCheck size={12} stroke={2} className="text-label-secondary" />
                    </Select.ItemIndicator>
                  </Select.Item>
                ))}
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
        <div className="flex flex-1 items-center h-8 rounded-lg bg-fill-quaternary inset-ring-1 inset-ring-stroke-faint overflow-hidden divide-x divide-stroke-faint/60 focus-within:inset-ring-stroke-strong transition-shadow">
          <ComponentInputs
            mode={mode}
            h={h} s={s} v={v} a={a}
            onComponents={(nh, ns, nv) => { setH(nh); setS(ns); setV(nv); emit(nh, ns, nv, a) }}
            onTextChange={(raw) => commitText(raw)}
            onClose={() => onClose?.()}
            typingRef={typingRef}
          />
          <AlphaInput value={a} onChange={setAlpha} />
        </div>
      </div>
    </div>
  )
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function RangeSlider({
  value, min, max, onChange, trackStyle, trackClassName, thumbStyle,
}: {
  value: number
  min: number
  max: number
  onChange: (n: number) => void
  trackStyle?: React.CSSProperties
  trackClassName?: string
  thumbStyle?: React.CSSProperties
}) {
  const ref = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const move = (clientX: number) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const t = clamp01((clientX - rect.left) / rect.width)
    onChange(min + t * (max - min))
  }
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div
      ref={ref}
      className={`relative h-3 rounded-full cursor-pointer touch-none inset-ring-1 inset-ring-black/10 ${trackClassName ?? ""}`}
      style={trackStyle}
      onPointerDown={(e) => {
        dragging.current = true
        ;(e.target as Element).setPointerCapture?.(e.pointerId)
        move(e.clientX)
      }}
      onPointerMove={(e) => { if (dragging.current) move(e.clientX) }}
      onPointerUp={(e) => {
        dragging.current = false
        ;(e.target as Element).releasePointerCapture?.(e.pointerId)
      }}
      onPointerCancel={() => { dragging.current = false }}
    >
      <div
        className="absolute top-1/2 -translate-y-1/2 rounded-full pointer-events-none"
        style={{
          // Sized to the track height (12px) with the white ring as an *inner*
          // border (border-box) so the whole thumb stays inside the track — no
          // outer ring spilling past the edges. Inset travel keeps the ends in too.
          width: 12,
          height: 12,
          boxSizing: "border-box",
          left: `calc((100% - 12px) * ${pct / 100})`,
          ...thumbStyle,
          border: "3.5px solid #ffffff",
          boxShadow: "0 1px 2.5px rgba(0,0,0,0.45)",
        }}
      />
    </div>
  )
}

function clamp01(n: number) { return Math.max(0, Math.min(1, n)) }
function clampRange(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

// ─── Component inputs (per-mode boxes) ─────────────────────────────────────

type ComponentInputsProps = {
  mode: PickerMode
  h: number
  s: number
  v: number
  a: number
  onComponents: (h: number, s: number, v: number) => void
  onTextChange: (raw: string) => boolean
  onClose: () => void
  typingRef: React.MutableRefObject<boolean>
}

function ComponentInputs({ mode, h, s, v, a, onComponents, onTextChange, onClose, typingRef }: ComponentInputsProps) {
  // Single text box — hex / css
  if (mode === "hex" || mode === "css") {
    const o = hsvToOklch(h, s, v, a)
    const initial = mode === "hex"
      ? (formatHex({ mode: "oklch", l: o.l, c: o.c, h: o.h, alpha: o.alpha }) ?? "#000000")
      : oklchCss(o)
    return (
      <NumericText
        initial={initial}
        flex
        commit={(raw) => onTextChange(raw)}
        onClose={onClose}
        typingRef={typingRef}
      />
    )
  }

  const hsvObj: Hsv = { mode: "hsv", h, s, v, alpha: a }

  if (mode === "rgb") {
    const rgb = toRgb(hsvObj) as Rgb | undefined
    const r = Math.round((rgb?.r ?? 0) * 255)
    const g = Math.round((rgb?.g ?? 0) * 255)
    const b = Math.round((rgb?.b ?? 0) * 255)
    const apply = (nr: number, ng: number, nb: number) => {
      const next = toHsv({ mode: "rgb", r: clampRange(nr, 0, 255) / 255, g: clampRange(ng, 0, 255) / 255, b: clampRange(nb, 0, 255) / 255 }) as Hsv | undefined
      if (!next) return
      onComponents(next.h ?? h, next.s ?? 0, next.v ?? 0)
    }
    return <NumberTriple a={{ value: r, min: 0, max: 255 }} b={{ value: g, min: 0, max: 255 }} c={{ value: b, min: 0, max: 255 }} onChange={apply} onClose={onClose} />
  }

  if (mode === "hsl") {
    const hsl = toHsl(hsvObj) as Hsl | undefined
    const H = Math.round(hsl?.h ?? h ?? 0)
    const S = Math.round((hsl?.s ?? 0) * 100)
    const L = Math.round((hsl?.l ?? 0) * 100)
    const apply = (nh: number, ns: number, nl: number) => {
      const next = toHsv({ mode: "hsl", h: ((nh % 360) + 360) % 360, s: clampRange(ns, 0, 100) / 100, l: clampRange(nl, 0, 100) / 100 }) as Hsv | undefined
      if (!next) return
      onComponents(next.h ?? nh, next.s ?? 0, next.v ?? 0)
    }
    return <NumberTriple a={{ value: H, min: 0, max: 360 }} b={{ value: S, min: 0, max: 100 }} c={{ value: L, min: 0, max: 100 }} onChange={apply} onClose={onClose} />
  }

  if (mode === "okl") {
    // OKLCH: L as 0–100 (%), C as chroma×100 (integer, ~0–40 in-gamut), H 0–360.
    const o = hsvToOklch(h, s, v, a)
    const L = Math.round(o.l * 100)
    const C = Math.round((o.c ?? 0) * 100)
    const H = Math.round(o.h ?? 0)
    const apply = (nl: number, nc: number, nh: number) => {
      const hsv = oklchToHsv({ mode: "oklch", l: clampRange(nl, 0, 100) / 100, c: Math.max(0, nc) / 100, h: ((nh % 360) + 360) % 360, alpha: a })
      onComponents(hsv.h, hsv.s, hsv.v)
    }
    return <NumberTriple a={{ value: L, min: 0, max: 100 }} b={{ value: C, min: 0, max: 100 }} c={{ value: H, min: 0, max: 360 }} onChange={apply} onClose={onClose} />
  }

  // hsb — HSV directly
  const H = Math.round(h)
  const S = Math.round(s * 100)
  const V = Math.round(v * 100)
  return (
    <NumberTriple
      a={{ value: H, min: 0, max: 360 }}
      b={{ value: S, min: 0, max: 100 }}
      c={{ value: V, min: 0, max: 100 }}
      onChange={(nh, ns, nv) => onComponents(((nh % 360) + 360) % 360, clampRange(ns, 0, 100) / 100, clampRange(nv, 0, 100) / 100)}
      onClose={onClose}
    />
  )
}

type NumberSpec = { value: number; min: number; max: number; suffix?: string }

function NumberTriple({
  a, b, c, onChange, onClose,
}: {
  a: NumberSpec; b: NumberSpec; c: NumberSpec
  onChange: (a: number, b: number, c: number) => void
  onClose: () => void
}) {
  return (
    <div className="flex flex-1 min-w-0 divide-x divide-stroke-faint/60 h-full">
      <NumberBox spec={a} onChange={(n) => onChange(n, b.value, c.value)} onClose={onClose} />
      <NumberBox spec={b} onChange={(n) => onChange(a.value, n, c.value)} onClose={onClose} />
      <NumberBox spec={c} onChange={(n) => onChange(a.value, b.value, n)} onClose={onClose} />
    </div>
  )
}

function NumberBox({
  spec, onChange, onClose,
}: {
  spec: NumberSpec
  onChange: (n: number) => void
  onClose: () => void
}) {
  const [text, setText] = useState(String(spec.value))
  const focused = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)
  // Drag-to-scrub: press and drag left/right to change the value (Figma-style).
  const scrub = useRef<{ x: number; val: number; moved: boolean } | null>(null)
  useEffect(() => {
    if (!focused.current) setText(String(spec.value))
  }, [spec.value])
  const commit = (raw: string) => {
    const n = parseFloat(raw)
    if (!Number.isNaN(n)) onChange(n)
  }

  const onPointerDown = (e: React.PointerEvent<HTMLInputElement>) => {
    // While focused (typing) leave the caret/selection alone. Otherwise suppress
    // the immediate focus so a drag scrubs and a plain click focuses on release.
    if (e.button !== 0 || focused.current) return
    e.preventDefault()
    scrub.current = { x: e.clientX, val: spec.value, moved: false }
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* pointer may be inactive */ }
  }
  const onPointerMove = (e: React.PointerEvent<HTMLInputElement>) => {
    const st = scrub.current
    if (!st) return
    const dx = e.clientX - st.x
    if (!st.moved && Math.abs(dx) < 3) return
    st.moved = true
    const mult = e.shiftKey ? 10 : 1
    const next = clampRange(st.val + Math.round(dx / 4) * mult, spec.min, spec.max)
    onChange(next)
    setText(String(next))
  }
  const onPointerUp = (e: React.PointerEvent<HTMLInputElement>) => {
    const st = scrub.current
    scrub.current = null
    try { e.currentTarget.releasePointerCapture(e.pointerId) } catch { /* no-op */ }
    if (st && !st.moved) { inputRef.current?.focus(); inputRef.current?.select() }
  }

  return (
    <div className="relative flex-1 min-w-0 h-full focus-within:bg-fill-tertiary transition-colors">
      <input
        ref={inputRef}
        value={text}
        inputMode="numeric"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onFocus={(e) => { focused.current = true; e.currentTarget.select() }}
        onChange={(e) => setText(e.target.value)}
        onBlur={(e) => { focused.current = false; commit(e.target.value); setText(String(spec.value)) }}
        onKeyDown={(e) => {
          if (e.key === "Enter") { commit((e.target as HTMLInputElement).value); onClose() }
          else if (e.key === "Escape") { onClose() }
          else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            e.preventDefault()
            const delta = e.key === "ArrowUp" ? 1 : -1
            const step = e.shiftKey ? 10 : 1
            const next = clampRange(spec.value + delta * step, spec.min, spec.max)
            onChange(next)
            setText(String(next))
          }
        }}
        className={`w-full h-full bg-transparent text-xs px-1.5 focus:outline-none tabular-nums text-center touch-none cursor-ew-resize focus:cursor-text selection:bg-label/20 ${spec.suffix ? "pr-3.5" : ""}`}
        spellCheck={false}
      />
      {spec.suffix && (
        <span className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-label-secondary">{spec.suffix}</span>
      )}
    </div>
  )
}

function NumericText({
  initial, flex, commit, onClose, typingRef,
}: {
  initial: string
  flex?: boolean
  commit: (raw: string) => boolean
  onClose: () => void
  typingRef: React.MutableRefObject<boolean>
}) {
  const [text, setText] = useState(initial)
  const focused = useRef(false)
  useEffect(() => {
    if (!focused.current) setText(initial)
  }, [initial])
  return (
    <input
      value={text}
      onFocus={(e) => { focused.current = true; typingRef.current = true; const el = e.currentTarget; setTimeout(() => { if (document.activeElement === el) el.select() }, 0) }}
      onChange={(e) => setText(e.target.value)}
      onBlur={(e) => { focused.current = false; typingRef.current = false; commit(e.target.value); setText(initial) }}
      onKeyDown={(e) => {
        if (e.key === "Enter") { commit((e.target as HTMLInputElement).value); onClose() }
        else if (e.key === "Escape") { onClose() }
      }}
      className={`h-full bg-transparent text-xs px-inset-2xs tabular-nums focus:outline-none focus-within:bg-fill-tertiary selection:bg-label/20 ${flex ? "flex-1 min-w-0" : ""}`}
      spellCheck={false}
    />
  )
}

function AlphaInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="shrink-0 w-[48px] h-full">
      <NumberBox
        spec={{ value: Math.round(value * 100), min: 0, max: 100, suffix: "%" }}
        onChange={(n) => onChange(clampRange(n, 0, 100) / 100)}
        onClose={() => {}}
      />
    </div>
  )
}

import { useEffect, useMemo, useRef, useState } from "react"

/**
 * Fills its container with a regular grid of tiny characters. The given
 * `text` is rasterized and centered; cells inside the rendered silhouette
 * are drawn with `--label`, all others with `--label-tertiary`. Pointer
 * movement pushes nearby particles aside with soft falloff; a critically
 * damped spring snaps them back.
 *
 * ── Performance strategy ─────────────────────────────────────────────
 * Naïve approach (full per-frame redraw) collapses at ~10k+ particles.
 * Instead:
 *   1. Render every letter ONCE to an offscreen "static" canvas.
 *   2. Each frame, only the particles within the cursor's repulsion
 *      radius (or still springing back) are "dirty".
 *   3. Per frame we clear the visible canvas, blit the static layer
 *      (one GPU op), then per-dirty-particle clear-and-redraw at the
 *      displaced position. Dirty count is bounded by πr² / step², so it
 *      stays in the low thousands regardless of total grid size.
 *   4. When the swarm has fully settled and the cursor is gone, the
 *      rAF loop suspends itself. Zero CPU while idle.
 *   5. Theme switches invalidate the static layer and re-render it.
 *
 * Particle state is stored in tight typed arrays (SoA) for cache
 * locality during the inner physics loop.
 *
 * Accessibility: real text is rendered as a visually-hidden sibling.
 */
type Props = {
  text: string
  rasterFont?: string
  particleSize?: number
  /** Grid spacing (px). Lower = denser swarm. */
  sampleStep?: number
  /** Repulsion radius (px). */
  radius?: number
  /** Max displacement (px) at the cursor center. */
  push?: number
  className?: string
}

export function LetterCloud({
  text,
  rasterFont = "800 140px 'DM Sans Variable', system-ui, sans-serif",
  particleSize = 8,
  sampleStep = 7,
  radius = 180,
  push = 22,
  className,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: -9999, y: -9999, active: false })

  const charPool = useMemo(() => {
    const flat = text.replace(/\s+/g, "").toLowerCase()
    return flat.length ? flat : "·"
  }, [text])

  const [size, setSize] = useState({ w: 0, h: 0 })
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const measure = () => {
      const r = el.getBoundingClientRect()
      setSize({ w: Math.round(r.width), h: Math.round(r.height) })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const particles = useMemo(() => {
    if (!size.w || !size.h) return null

    const off = document.createElement("canvas")
    const ctx = off.getContext("2d")
    if (!ctx) return null
    off.width = size.w
    off.height = size.h
    ctx.font = rasterFont
    ctx.textBaseline = "middle"
    ctx.textAlign = "center"
    ctx.fillStyle = "#000"
    ctx.fillText(text, size.w / 2, size.h / 2)
    const data = ctx.getImageData(0, 0, size.w, size.h).data

    const half = sampleStep / 2
    const cols = Math.floor((size.w - half) / sampleStep) + 1
    const rows = Math.floor((size.h - half) / sampleStep) + 1
    const n = cols * rows

    const ox = new Float32Array(n)
    const oy = new Float32Array(n)
    const dx = new Float32Array(n)
    const dy = new Float32Array(n)
    const vx = new Float32Array(n)
    const vy = new Float32Array(n)
    const filled = new Uint8Array(n)
    const ch: string[] = new Array(n)

    let i = 0
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = half + c * sampleStep
        const y = half + r * sampleStep
        ox[i] = x
        oy[i] = y
        const alpha = data[(Math.floor(y) * size.w + Math.floor(x)) * 4 + 3]
        filled[i] = alpha > 128 ? 1 : 0
        ch[i] = charPool[i % charPool.length]
        i++
      }
    }
    return { ox, oy, dx, dy, vx, vy, filled, ch, n, cols, rows, step: sampleStep }
  }, [size, text, rasterFont, sampleStep, charPool])

  const colorsRef = useRef<{ fill: string; faint: string }>({ fill: "#fff", faint: "rgba(255,255,255,.25)" })
  const themeTickRef = useRef(0) // bumped on theme change to invalidate static layer

  useEffect(() => {
    const readColors = () => {
      const style = getComputedStyle(document.documentElement)
      colorsRef.current = {
        fill: style.getPropertyValue("--label").trim() || "#fff",
        faint: style.getPropertyValue("--label-tertiary").trim() || "rgba(255,255,255,.25)",
      }
      themeTickRef.current++
    }
    readColors()
    const mo = new MutationObserver(readColors)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style"] })
    return () => mo.disconnect()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !particles) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const bw = Math.floor(size.w * dpr)
    const bh = Math.floor(size.h * dpr)
    canvas.width = bw
    canvas.height = bh
    canvas.style.width = `${size.w}px`
    canvas.style.height = `${size.h}px`
    const ctx = canvas.getContext("2d", { alpha: true })
    if (!ctx) return
    ctx.scale(dpr, dpr)
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    const fontFaint = `400 ${particleSize}px 'DM Mono', ui-monospace, 'SF Mono', Menlo, monospace`
    const fontFill = `700 ${particleSize}px 'DM Mono', ui-monospace, 'SF Mono', Menlo, monospace`
    ctx.font = fontFaint

    // ── Static background layer (one render per theme / size / data change) ──
    const staticBg = document.createElement("canvas")
    staticBg.width = bw
    staticBg.height = bh
    const sctx = staticBg.getContext("2d")
    if (!sctx) return
    sctx.scale(dpr, dpr)
    sctx.textAlign = "center"
    sctx.textBaseline = "middle"
    sctx.font = fontFaint

    let lastBakedTheme = -1
    const bakeStaticBg = () => {
      const { ox, oy, filled, ch, n } = particles
      const c = colorsRef.current
      sctx.clearRect(0, 0, size.w, size.h)
      sctx.font = fontFaint
      sctx.fillStyle = c.faint
      for (let i = 0; i < n; i++) {
        if (filled[i]) continue
        sctx.fillText(ch[i], ox[i], oy[i])
      }
      sctx.font = fontFill
      sctx.fillStyle = c.fill
      for (let i = 0; i < n; i++) {
        if (!filled[i]) continue
        sctx.fillText(ch[i], ox[i], oy[i])
      }
      lastBakedTheme = themeTickRef.current
    }
    bakeStaticBg()

    const { ox, oy, dx, dy, vx, vy, filled, ch, cols, rows, step } = particles
    const STIFFNESS = 0.14
    const DAMPING = 0.82
    const r2 = radius * radius
    const PAD = Math.ceil(particleSize / 2) + 3
    const dirty = new Set<number>()
    const toRemove: number[] = []
    let raf = 0

    const tick = () => {
      if (lastBakedTheme !== themeTickRef.current) bakeStaticBg()

      const { x: mx, y: my, active } = mouseRef.current

      // 1. Mark every cell inside the cursor's radius as dirty.
      if (active) {
        const minCol = Math.max(0, Math.floor((mx - radius) / step))
        const maxCol = Math.min(cols - 1, Math.ceil((mx + radius) / step))
        const minRow = Math.max(0, Math.floor((my - radius) / step))
        const maxRow = Math.min(rows - 1, Math.ceil((my + radius) / step))
        for (let r = minRow; r <= maxRow; r++) {
          const base = r * cols
          for (let c = minCol; c <= maxCol; c++) {
            const i = base + c
            const ddx = ox[i] - mx
            const ddy = oy[i] - my
            if (ddx * ddx + ddy * ddy < r2) dirty.add(i)
          }
        }
      }

      // 2. Physics pass — only over the dirty set.
      toRemove.length = 0
      for (const i of dirty) {
        let tx = 0
        let ty = 0
        if (active) {
          const ax0 = ox[i] + dx[i] - mx
          const ay0 = oy[i] + dy[i] - my
          const d2 = ax0 * ax0 + ay0 * ay0
          if (d2 < r2 && d2 > 0.01) {
            const d = Math.sqrt(d2)
            const falloff = 1 - d / radius
            const mag = falloff * falloff * push
            tx = (ax0 / d) * mag
            ty = (ay0 / d) * mag
          }
        }
        const ax = (tx - dx[i]) * STIFFNESS
        const ay = (ty - dy[i]) * STIFFNESS
        vx[i] = (vx[i] + ax) * DAMPING
        vy[i] = (vy[i] + ay) * DAMPING
        dx[i] += vx[i]
        dy[i] += vy[i]
        // Cull when fully settled with no driving force.
        if (
          tx === 0 && ty === 0 &&
          Math.abs(dx[i]) < 0.05 && Math.abs(dy[i]) < 0.05 &&
          Math.abs(vx[i]) < 0.05 && Math.abs(vy[i]) < 0.05
        ) {
          dx[i] = 0; dy[i] = 0; vx[i] = 0; vy[i] = 0
          toRemove.push(i)
        }
      }
      for (let j = 0; j < toRemove.length; j++) dirty.delete(toRemove[j])

      // 3. Render: blit static bg, then patch only dirty cells.
      ctx.save()
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, bw, bh)
      ctx.drawImage(staticBg, 0, 0)
      ctx.restore()

      // Punch out static letters at every dirty origin (so the displaced
      // version doesn't ghost-overlap the original).
      for (const i of dirty) {
        ctx.clearRect(ox[i] - PAD, oy[i] - PAD, PAD * 2, PAD * 2)
      }
      // Redraw dirty letters at displaced positions. Two passes minimize
      // fillStyle changes (faint then fill).
      ctx.font = fontFaint
      ctx.fillStyle = colorsRef.current.faint
      for (const i of dirty) {
        if (filled[i]) continue
        ctx.fillText(ch[i], ox[i] + dx[i], oy[i] + dy[i])
      }
      ctx.font = fontFill
      ctx.fillStyle = colorsRef.current.fill
      for (const i of dirty) {
        if (!filled[i]) continue
        ctx.fillText(ch[i], ox[i] + dx[i], oy[i] + dy[i])
      }

      // Suspend the loop when everything is at rest and the cursor is gone.
      if (dirty.size === 0 && !active) {
        raf = 0
        return
      }
      raf = requestAnimationFrame(tick)
    }

    const restart = () => { if (!raf) raf = requestAnimationFrame(tick) }
    canvas.addEventListener("pointermove", restart, { passive: true })
    canvas.addEventListener("pointerleave", restart, { passive: true })
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      raf = 0
      canvas.removeEventListener("pointermove", restart)
      canvas.removeEventListener("pointerleave", restart)
    }
  }, [particles, size, particleSize, radius, push])

  return (
    <div
      ref={wrapRef}
      className={className}
      style={{ overflow: "hidden" }}
      onPointerMove={(e) => {
        const rect = wrapRef.current?.getBoundingClientRect()
        if (!rect) return
        mouseRef.current.x = e.clientX - rect.left
        mouseRef.current.y = e.clientY - rect.top
        mouseRef.current.active = true
      }}
      onPointerLeave={() => { mouseRef.current.active = false }}
    >
      <canvas ref={canvasRef} style={{ display: "block", width: size.w, height: size.h }} />
      <span className="sr-only">{text}</span>
    </div>
  )
}

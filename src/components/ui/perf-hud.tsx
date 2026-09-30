import { useEffect, useState } from "react"

/**
 * PerfHud — a dev-only frame-timing meter.
 *
 * Purpose: catch laggy controls. These sketches lean on canvas / shader / heavy
 * motion work, and the failure mode is a control that *feels* janky when you drag
 * it — a slider that drops frames, a shader that stutters under a parameter sweep.
 * A number on screen turns that vibe into a signal: drag the control, watch the
 * "worst" frame in the trailing second spike red.
 *
 * What it shows:
 * - FPS      — smoothed frames-per-second (EMA), the steady-state feel.
 * - worst    — the single longest frame gap in the last ~1s (ms). This is the jank
 *              detector: one 60ms frame during a drag reads as a visible hitch even
 *              if average FPS looks fine.
 * - blocks   — count of main-thread long tasks (>50ms) in the last ~1s, via
 *              PerformanceObserver. Long tasks are what freeze input handling.
 *
 * Color: green (smooth) → amber (dropping frames) → red (visible hitching), keyed
 * off the worst frame in the window.
 *
 * Design notes:
 * - Zero deps, inline styles — never relies on Tailwind/tokens being present, and
 *   can't be broken by an app's CSS. Mount it like agentation / dialkit.
 * - The meter must not *cause* jank: the rAF loop only measures; the visible React
 *   state updates are throttled to ~4Hz. The measurement window is unthrottled.
 * - Dev-only. Mount gated by `import.meta.env.DEV` in main.tsx.
 *
 * Keyboard: Alt+P toggles the HUD on/off. Click the pill to expand the detail panel.
 */

const JANK_AMBER_MS = 22 // dropped a frame or two at 60fps → starting to feel it
const JANK_RED_MS = 40 // ~2+ dropped frames → a visible hitch
const DISPLAY_INTERVAL_MS = 250 // throttle visible updates so the HUD is cheap
const WINDOW_MS = 1000 // trailing window for "worst" + "blocks"

type Sample = { t: number; dt: number }

function colorFor(worstMs: number): string {
  if (worstMs >= JANK_RED_MS) return "#ff453a"
  if (worstMs >= JANK_AMBER_MS) return "#ff9f0a"
  return "#30d158"
}

export function PerfHud() {
  const [visible, setVisible] = useState(true)
  const [expanded, setExpanded] = useState(false)
  const [display, setDisplay] = useState({ fps: 0, worst: 0, blocks: 0 })
  // Rolling frame-time history for the sparkline (kept small).
  const [spark, setSpark] = useState<number[]>([])

  // Alt+P toggles the HUD entirely.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === "p" || e.key === "P")) {
        e.preventDefault()
        setVisible((v) => !v)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  useEffect(() => {
    if (!visible) return

    let raf = 0
    let last = performance.now()
    let fpsEma = 60
    let lastDisplay = last
    const samples: Sample[] = []
    const longTasks: number[] = [] // timestamps of recent long tasks

    // Long-task observer — main-thread blocks >50ms. Not supported everywhere;
    // guarded so unsupported browsers just show blocks: 0.
    let observer: PerformanceObserver | undefined
    try {
      observer = new PerformanceObserver((list) => {
        const now = performance.now()
        for (let i = 0; i < list.getEntries().length; i++) longTasks.push(now)
      })
      observer.observe({ entryTypes: ["longtask"] })
    } catch {
      observer = undefined
    }

    const tick = (now: number) => {
      const dt = now - last
      last = now
      samples.push({ t: now, dt })

      // Instantaneous FPS from this frame, smoothed. Clamp dt to avoid a
      // background-tab pause reading as 0fps forever.
      const inst = 1000 / Math.min(Math.max(dt, 1), 1000)
      fpsEma = fpsEma * 0.9 + inst * 0.1

      // Drop samples outside the trailing window.
      const cutoff = now - WINDOW_MS
      while (samples.length && samples[0].t < cutoff) samples.shift()
      while (longTasks.length && longTasks[0] < cutoff) longTasks.shift()

      if (now - lastDisplay >= DISPLAY_INTERVAL_MS) {
        lastDisplay = now
        let worst = 0
        for (let i = 0; i < samples.length; i++) {
          if (samples[i].dt > worst) worst = samples[i].dt
        }
        setDisplay({
          fps: Math.round(fpsEma),
          worst: Math.round(worst),
          blocks: longTasks.length,
        })
        if (expanded) {
          // Downsample the window to ~40 bars for the sparkline.
          const step = Math.max(1, Math.floor(samples.length / 40))
          const bars: number[] = []
          for (let i = 0; i < samples.length; i += step) bars.push(samples[i].dt)
          setSpark(bars)
        }
      }

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      observer?.disconnect()
    }
  }, [visible, expanded])

  if (!visible) return null

  const accent = colorFor(display.worst)
  const mono =
    "ui-monospace, 'DM Mono', SFMono-Regular, Menlo, Consolas, monospace"

  return (
    <div
      style={{
        position: "fixed",
        left: 12,
        bottom: 12,
        zIndex: 2147483000,
        fontFamily: mono,
        fontSize: 11,
        lineHeight: 1.3,
        color: "#f5f5f7",
        userSelect: "none",
      }}
    >
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        title="Perf HUD — Alt+P to hide. Click to expand. worst = longest frame in last 1s."
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "5px 9px",
          background: "rgba(20,20,22,0.82)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 8,
          cursor: "pointer",
          font: "inherit",
          color: "inherit",
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: 999,
            background: accent,
            boxShadow: `0 0 6px ${accent}`,
          }}
        />
        <span style={{ color: "#a1a1a6" }}>fps</span>
        <span style={{ minWidth: 22, textAlign: "right" }}>{display.fps}</span>
        <span style={{ color: "#a1a1a6" }}>worst</span>
        <span style={{ minWidth: 30, textAlign: "right", color: accent }}>
          {display.worst}ms
        </span>
      </button>

      {expanded && (
        <div
          style={{
            marginTop: 6,
            padding: "9px 11px",
            width: 210,
            background: "rgba(20,20,22,0.82)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 8,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 1,
              height: 32,
              marginBottom: 8,
            }}
          >
            {spark.map((dt, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: `${Math.min(100, (dt / 50) * 100)}%`,
                  minHeight: 1,
                  background: colorFor(dt),
                  opacity: 0.85,
                  borderRadius: 1,
                }}
              />
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#a1a1a6" }}>main-thread blocks</span>
            <span style={{ color: display.blocks ? "#ff9f0a" : "#a1a1a6" }}>
              {display.blocks}
            </span>
          </div>
          <p style={{ margin: "8px 0 0", color: "#8e8e93", fontSize: 10 }}>
            Drag a control and watch <b style={{ color: "#f5f5f7" }}>worst</b>.
            Green &lt;{JANK_AMBER_MS} · amber &lt;{JANK_RED_MS} · red = visible
            hitch. Alt+P hides.
          </p>
        </div>
      )}
    </div>
  )
}

export default PerfHud

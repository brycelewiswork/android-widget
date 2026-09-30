import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { Toolbar } from "./Toolbar"
import { cn } from "@/lib/utils"

/**
 * CanvasStage — a zoom/pan viewport for a sketch, with a bottom-docked Toolbar.
 *
 * - **⌘/Ctrl + scroll** zooms toward the cursor; plain scroll pans.
 * - **Drag** pans; the toolbar has zoom −/+, a 100% reset, and fit-to-view.
 * - Zoom/pan changes are recorded so the toolbar's **undo/redo** work.
 *
 * Drop your sketch in as children; it renders at natural size and is centred on
 * mount. Pass `toolbarActions` for app-specific buttons (brightness, export, …).
 */

type View = { zoom: number; x: number; y: number }

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))
const same = (a: View, b: View) => a.zoom === b.zoom && a.x === b.x && a.y === b.y

interface CanvasStageProps {
  children: ReactNode
  minZoom?: number
  maxZoom?: number
  showToolbar?: boolean
  toolbarActions?: ReactNode
  className?: string
}

export function CanvasStage({
  children,
  minZoom = 0.2,
  maxZoom = 8,
  showToolbar = true,
  toolbarActions,
  className,
}: CanvasStageProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [view, setView] = useState<View>({ zoom: 1, x: 0, y: 0 })
  const viewRef = useRef(view)
  viewRef.current = view

  // Undo/redo history of view snapshots.
  const history = useRef<{ stack: View[]; index: number }>({ stack: [{ zoom: 1, x: 0, y: 0 }], index: 0 })
  const [, forceHist] = useState(0)
  const bumpHist = () => forceHist((n) => n + 1)
  const commitTimer = useRef<number | null>(null)

  const commit = useCallback((v: View) => {
    const h = history.current
    if (h.stack[h.index] && same(h.stack[h.index], v)) return
    h.stack = h.stack.slice(0, h.index + 1)
    h.stack.push(v)
    if (h.stack.length > 120) h.stack.shift()
    h.index = h.stack.length - 1
    bumpHist()
  }, [])

  const scheduleCommit = useCallback(
    (v: View) => {
      if (commitTimer.current) window.clearTimeout(commitTimer.current)
      commitTimer.current = window.setTimeout(() => commit(v), 350)
    },
    [commit],
  )

  const centre = useCallback((seedHistory = false) => {
    const vp = viewportRef.current
    const ct = contentRef.current
    if (!vp || !ct) return
    const next: View = {
      zoom: 1,
      x: (vp.clientWidth - ct.offsetWidth) / 2,
      y: (vp.clientHeight - ct.offsetHeight) / 2,
    }
    setView(next)
    if (seedHistory) {
      history.current = { stack: [next], index: 0 }
      bumpHist()
    } else {
      commit(next)
    }
  }, [commit])

  // Centre content on mount and seed the history baseline.
  useLayoutEffect(() => {
    centre(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Cursor-anchored zoom / pan. Native non-passive listener so ⌘/Ctrl+wheel can
  // preventDefault (otherwise the browser page-zooms).
  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      if (e.ctrlKey || e.metaKey) {
        const cx = e.clientX - rect.left
        const cy = e.clientY - rect.top
        const factor = Math.exp(-e.deltaY * 0.0015)
        setView((v) => {
          const zoom = clamp(v.zoom * factor, minZoom, maxZoom)
          const k = zoom / v.zoom
          const nv = { zoom, x: cx - (cx - v.x) * k, y: cy - (cy - v.y) * k }
          scheduleCommit(nv)
          return nv
        })
      } else {
        setView((v) => {
          const nv = { ...v, x: v.x - e.deltaX, y: v.y - e.deltaY }
          scheduleCommit(nv)
          return nv
        })
      }
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  }, [minZoom, maxZoom, scheduleCommit])

  // Drag to pan.
  const drag = useRef<{ px: number; py: number; vx: number; vy: number } | null>(null)
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.button !== 1) return
    drag.current = { px: e.clientX, py: e.clientY, vx: viewRef.current.x, vy: viewRef.current.y }
    ;(e.currentTarget as Element).setPointerCapture?.(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d) return
    setView((v) => ({ ...v, x: d.vx + (e.clientX - d.px), y: d.vy + (e.clientY - d.py) }))
  }
  const onPointerUp = (e: React.PointerEvent) => {
    if (!drag.current) return
    drag.current = null
    ;(e.currentTarget as Element).releasePointerCapture?.(e.pointerId)
    commit(viewRef.current)
  }

  // Zoom about the viewport centre (toolbar buttons).
  const zoomBy = (factor: number) => {
    const vp = viewportRef.current
    const cx = (vp?.clientWidth ?? 0) / 2
    const cy = (vp?.clientHeight ?? 0) / 2
    setView((v) => {
      const zoom = clamp(v.zoom * factor, minZoom, maxZoom)
      const k = zoom / v.zoom
      return { zoom, x: cx - (cx - v.x) * k, y: cy - (cy - v.y) * k }
    })
    requestAnimationFrame(() => commit(viewRef.current))
  }
  const resetZoom = () => zoomBy(1 / viewRef.current.zoom)

  const undo = () => {
    const h = history.current
    if (h.index <= 0) return
    h.index -= 1
    setView(h.stack[h.index])
    bumpHist()
  }
  const redo = () => {
    const h = history.current
    if (h.index >= h.stack.length - 1) return
    h.index += 1
    setView(h.stack[h.index])
    bumpHist()
  }

  const h = history.current

  return (
    <div
      ref={viewportRef}
      className={cn(
        "relative overflow-hidden touch-none select-none cursor-grab active:cursor-grabbing bg-surface-secondary",
        className,
      )}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div
        ref={contentRef}
        className="absolute top-0 left-0 will-change-transform"
        style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})`, transformOrigin: "0 0" }}
      >
        {children}
      </div>

      {showToolbar && (
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Toolbar
            zoom={view.zoom}
            onZoomIn={() => zoomBy(1.25)}
            onZoomOut={() => zoomBy(1 / 1.25)}
            onZoomReset={resetZoom}
            onFit={() => centre()}
            onUndo={undo}
            onRedo={redo}
            canUndo={h.index > 0}
            canRedo={h.index < h.stack.length - 1}
            actions={toolbarActions}
          />
        </div>
      )}
    </div>
  )
}

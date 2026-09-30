import { type ReactNode } from "react"
import {
  IconArrowBackUp,
  IconArrowForwardUp,
  IconZoomIn,
  IconZoomOut,
  IconFocusCentered,
} from "@tabler/icons-react"
import { Squircle, SQUIRCLE_RADIUS } from "@/components/squircle"
import { cn } from "@/lib/utils"

/**
 * Toolbar — a floating canvas-chrome pill (undo/redo · zoom · fit), meant to dock
 * at the bottom of a sketch. Presentational: drive it with callbacks. `CanvasStage`
 * wires one to its zoom/pan automatically, or use it standalone with your own state.
 * Add app-specific buttons via `actions` (use <ToolbarButton>).
 */

export function ToolbarButton({
  onClick,
  disabled,
  label,
  children,
}: {
  onClick?: () => void
  disabled?: boolean
  label: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="h-8 w-8 grid place-items-center rounded-lg text-label-secondary hover:text-label hover:bg-fill-quaternary disabled:opacity-40 disabled:pointer-events-none cursor-pointer transition-colors"
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div className="mx-inline-3xs h-5 w-px bg-stroke-faint" />
}

interface ToolbarProps {
  zoom: number
  onZoomIn: () => void
  onZoomOut: () => void
  /** Reset zoom to 100% (the % label is the button). */
  onZoomReset: () => void
  /** Fit / recentre the content. */
  onFit?: () => void
  onUndo?: () => void
  onRedo?: () => void
  canUndo?: boolean
  canRedo?: boolean
  /** Extra app-specific buttons (e.g. a brightness/theme toggle). */
  actions?: ReactNode
  className?: string
}

export function Toolbar({
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onFit,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  actions,
  className,
}: ToolbarProps) {
  const hasHistory = Boolean(onUndo || onRedo)
  return (
    <Squircle
      as="div"
      cornerRadius={SQUIRCLE_RADIUS["2xl"]}
      shadow="lg"
      className={cn(
        "flex items-center gap-0.5 h-11 px-1.5 rounded-2xl bg-surface inset-ring-1 inset-ring-stroke-faint",
        className,
      )}
    >
      {hasHistory && (
        <>
          <ToolbarButton onClick={onUndo} disabled={!canUndo} label="Undo">
            <IconArrowBackUp size={18} stroke={1.75} />
          </ToolbarButton>
          <ToolbarButton onClick={onRedo} disabled={!canRedo} label="Redo">
            <IconArrowForwardUp size={18} stroke={1.75} />
          </ToolbarButton>
          <Divider />
        </>
      )}

      <ToolbarButton onClick={onZoomOut} label="Zoom out">
        <IconZoomOut size={18} stroke={1.75} />
      </ToolbarButton>
      <button
        type="button"
        onClick={onZoomReset}
        title="Reset to 100%"
        className="h-8 min-w-[54px] px-1.5 rounded-lg text-xs font-medium text-label hover:bg-fill-quaternary tabular-nums cursor-pointer transition-colors"
      >
        {Math.round(zoom * 100)}%
      </button>
      <ToolbarButton onClick={onZoomIn} label="Zoom in">
        <IconZoomIn size={18} stroke={1.75} />
      </ToolbarButton>

      {onFit && (
        <>
          <Divider />
          <ToolbarButton onClick={onFit} label="Fit to view">
            <IconFocusCentered size={18} stroke={1.75} />
          </ToolbarButton>
        </>
      )}

      {actions && (
        <>
          <Divider />
          <div className="flex items-center gap-0.5">{actions}</div>
        </>
      )}
    </Squircle>
  )
}

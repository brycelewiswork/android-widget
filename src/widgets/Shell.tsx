import type { ReactNode } from "react"
import { Link, useLocation } from "react-router-dom"
import { useTheme } from "next-themes"
import { IconMoon, IconSun } from "@tabler/icons-react"
import { useTimelineDriver } from "@/store/useTimelineStore"
import { useWidgetStore, type Fidelity } from "@/store/useWidgetStore"
import { hasLayout } from "./hifi"
import { PALETTE_IDS, PALETTES } from "./hifi/palettes"
import { WIDGET_SIZE_ORDER, sizeLabel, type WidgetSize } from "./sizes"

/*
 * Page chrome: a top bar with the size tabs + view controls, a gridded canvas
 * the widgets sit on, and a page's controls pinned right.
 */

const FIDELITIES: { value: Fidelity; label: string }[] = [
  { value: "wireframe", label: "Wireframe" },
  { value: "hifi", label: "Hi-fi" },
]

const TABS = [
  { to: "/", label: "All sizes" },
  ...WIDGET_SIZE_ORDER.map((size) => ({ to: `/${size}`, label: sizeLabel(size) })),
  { to: "/timeline", label: "Timeline" },
  { to: "/timeline-2", label: "Timeline 2" },
  { to: "/questions", label: "Decisions" },
]

const segment = (active: boolean) =>
  `whitespace-nowrap rounded-lg px-3 py-1.5 text-sm transition-colors ${
    active ? "bg-surface-secondary font-medium text-label shadow-xs" : "text-label-secondary hover:text-label"
  }`

// ── Top bar ────────────────────────────────────────────────────────────────

/** Light / dark for the whole page — the hi-fi widgets follow it (their dark scheme). */
function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const dark = resolvedTheme === "dark"
  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
      className="flex size-9 cursor-pointer items-center justify-center rounded-xl bg-fill-quaternary text-label-secondary transition-colors hover:text-label focus-visible:outline-2 focus-visible:outline-label"
    >
      {dark ? <IconSun size={18} stroke={1.75} /> : <IconMoon size={18} stroke={1.75} />}
    </button>
  )
}

/** The hi-fi widget's Material 3 scheme: one swatch per palette, in its primary colour. */
function PalettePicker() {
  const { palette, setPalette } = useWidgetStore()
  const { resolvedTheme } = useTheme()
  const mode = resolvedTheme === "dark" ? "dark" : "light"
  return (
    <div role="radiogroup" aria-label="Material 3 palette" className="flex items-center gap-1 rounded-xl bg-fill-quaternary p-1.5">
      {PALETTE_IDS.map((id) => {
        const p = PALETTES[id]
        const active = palette === id
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={p.label}
            title={p.label}
            onClick={() => setPalette(id)}
            className={`flex size-6 cursor-pointer items-center justify-center rounded-full transition-shadow focus-visible:outline-2 focus-visible:outline-label ${active ? "ring-2 ring-label" : ""}`}
            style={{ background: p[mode].container }}
          >
            <span className="block size-3.5 rounded-full" style={{ background: p[mode].primary }} />
          </button>
        )
      })}
    </div>
  )
}

function TopBar() {
  const { pathname } = useLocation()
  const { fidelity, setFidelity, showBounds, setShowBounds } = useWidgetStore()
  return (
    <header className="sticky top-0 z-10 border-b border-stroke-faint bg-surface-secondary/85 backdrop-blur-lg">
      <div className="flex flex-wrap items-center justify-center gap-3 px-4 py-3 md:px-6">
        <nav className="flex gap-1 overflow-x-auto rounded-xl bg-fill-quaternary p-1" aria-label="Widget sizes">
          {TABS.map((t) => {
            const active = pathname === t.to
            return (
              <Link key={t.to} to={t.to} aria-current={active ? "page" : undefined} className={segment(active)}>
                {t.label}
              </Link>
            )
          })}
        </nav>
        <div className="flex items-center gap-4">
          <div role="radiogroup" aria-label="Fidelity" className="flex gap-1 rounded-xl bg-fill-quaternary p-1">
            {FIDELITIES.map((f) => (
              <button
                key={f.value}
                type="button"
                role="radio"
                aria-checked={fidelity === f.value}
                onClick={() => setFidelity(f.value)}
                className={`cursor-pointer ${segment(fidelity === f.value)}`}
              >
                {f.label}
              </button>
            ))}
          </div>
          {fidelity === "hifi" && <PalettePicker />}
          <ThemeToggle />
          <label className="flex cursor-pointer items-center gap-2 text-sm text-label-secondary select-none">
            <input
              type="checkbox"
              checked={showBounds}
              onChange={(e) => setShowBounds(e.target.checked)}
              className="size-4 accent-current"
            />
            Show bounds
          </label>
        </div>
      </div>
    </header>
  )
}

/** Shown when Hi-fi is selected but some sizes still fall back to wireframe. */
function FallbackNote({ sizes }: { sizes: WidgetSize[] }) {
  const fidelity = useWidgetStore((s) => s.fidelity)
  const missing = sizes.filter((size) => !hasLayout(fidelity, size))
  if (missing.length === 0) return null
  return (
    <p className="mx-auto mb-6 w-fit rounded-lg bg-surface-secondary px-3 py-2 text-sm text-label-secondary shadow-xs">
      No hi-fi version yet for {missing.map(sizeLabel).join(", ")}. Showing the wireframe instead.
    </p>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export function Page({ sizes, children, panel }: {
  sizes: WidgetSize[]
  children: ReactNode
  /** The pinned right rail of controls, if the page has one. */
  panel?: ReactNode
}) {
  useTimelineDriver()
  return (
    <div className="min-h-svh">
      <div className={`flex min-h-svh flex-col ${panel ? "lg:pr-72" : ""}`}>
        <TopBar />
        <main className="widget-canvas flex-1 px-4 py-[var(--space-m-l)] md:px-[var(--space-m-l)]">
          <div className="mx-auto w-full max-w-6xl">
            <FallbackNote sizes={sizes} />
            {children}
          </div>
        </main>
        {panel}
      </div>
    </div>
  )
}

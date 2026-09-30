import { Suspense, useEffect, useRef, useState } from "react"
import { Link, Route, Routes, useLocation } from "react-router-dom"
import { motion, AnimatePresence } from "motion/react"
import { useTheme } from "next-themes"
import { SPRING_FAST } from "@/lib/motion"
import { Squircle, SQUIRCLE_RADIUS } from "@/components/squircle"
import {
  ROUTES,
  TOP_LEVEL_ROUTES,
  COMPONENT_ROUTES,
  COMPONENTS_BASE_PATH,
  SHOW_SKETCH_NAV,
  isSystemRoute,
  type RouteIcon,
} from "@/routes"
import {
  IconComponents,
  IconChevronRight,
  IconSun,
  IconMoon,
  IconDeviceLaptop,
} from "@tabler/icons-react"

function NavLink({
  to,
  label,
  icon: Icon,
  indent,
  onNavigate,
}: {
  to: string
  label: string
  icon: RouteIcon
  indent?: boolean
  onNavigate?: () => void
}) {
  const location = useLocation()
  const active = location.pathname === to
  return (
    <Link
      to={to}
      onClick={() => { window.scrollTo(0, 0); onNavigate?.() }}
      className={`flex items-center gap-2.5 text-sm rounded-xl transition-colors ${
        indent ? "pl-9 pr-4 py-2" : "px-4 py-2.5"
      } ${
        active
          ? "text-label font-medium bg-fill-primary"
          : "text-label-secondary hover:text-label hover:bg-fill-quaternary"
      }`}
    >
      <Icon size={indent ? 14 : 16} stroke={1.75} />
      {label}
    </Link>
  )
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  // One-time mount flag (next-themes pattern) to avoid a theme flash before the
  // resolved theme is known. Intentional single set-on-mount, not a sync loop.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null

  const modes = [
    { val: "light" as const, Icon: IconSun },
    { val: "dark" as const, Icon: IconMoon },
    { val: "system" as const, Icon: IconDeviceLaptop },
  ]

  return (
    <div className="flex items-center gap-0.5 mx-2 mt-1 rounded-lg bg-fill-quaternary p-0.5">
      {modes.map(({ val, Icon }) => (
        <button
          key={val}
          onClick={() => {
            document.documentElement.style.transition = "opacity 0.15s ease"
            document.documentElement.style.opacity = "0"
            setTimeout(() => {
              setTheme(val)
              requestAnimationFrame(() => {
                document.documentElement.style.opacity = "1"
                setTimeout(() => {
                  document.documentElement.style.transition = ""
                  document.documentElement.style.opacity = ""
                }, 150)
              })
            }, 150)
          }}
          aria-label={val}
          className={`flex-1 flex items-center justify-center rounded-md py-1.5 transition-colors cursor-pointer ${
            theme === val
              ? "bg-surface-secondary text-label shadow-xs"
              : "text-label-secondary hover:text-label"
          }`}
        >
          <Icon size={13} stroke={2} />
        </button>
      ))}
    </div>
  )
}

function SideNav() {
  const location = useLocation()
  const componentsActive = location.pathname.startsWith(COMPONENTS_BASE_PATH)
  const [open, setOpen] = useState(false)
  const [componentsOpen, setComponentsOpen] = useState(componentsActive)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("pointerdown", onDown)
    return () => document.removeEventListener("pointerdown", onDown)
  }, [open])

  return (
    <div
      ref={ref}
      className="fixed right-4 top-1/2 -translate-y-1/2 z-nav"
      onPointerEnter={(e) => {
        if (e.pointerType !== "mouse") return
        setOpen(true)
        if (componentsActive) setComponentsOpen(true)
      }}
      onPointerLeave={(e) => {
        if (e.pointerType !== "mouse") return
        setOpen(false)
        setComponentsOpen(componentsActive)
      }}
      onClick={(e) => {
        if (open) return
        e.stopPropagation()
        setOpen(true)
        if (componentsActive) setComponentsOpen(true)
      }}
    >
      <motion.div
        layout
        transition={{ type: "spring", ...SPRING_FAST.snappy }}
        className="cursor-pointer overflow-hidden backdrop-blur-lg"
        animate={{
          backgroundColor: open ? "var(--surface-secondary)" : "oklch(0.710 0 0 / 40%)",
          borderRadius: open ? 18 : 999,
          width: open ? "auto" : 32,
          height: open ? "auto" : 32,
          boxShadow: open
            ? "0 8px 16px oklch(0 0 0 / 8%), 0 4px 8px oklch(0 0 0 / 4%), 0 0 0 1px var(--stroke-faint)"
            : "0 0 0 0 transparent, 0 0 0 0 transparent, 0 0 0 0 transparent",
        }}
      >
        <AnimatePresence>
          {open && (
            <Squircle
              as={motion.nav}
              cornerRadius={SQUIRCLE_RADIUS["2xl"]}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, delay: 0.05 }}
              // Capped to the viewport so the menu can never grow past it —
              // it's centred, so an uncapped menu clips off *both* ends and the
              // items there become unreachable.
              className="flex flex-col py-2 px-2 min-w-[160px] rounded-2xl max-h-[calc(100svh-2rem)]"
            >
              {/* The links scroll; the theme toggle below stays pinned.
                  `min-h-0` is what allows this flex child to shrink past its
                  content height — without it the column just overflows again. */}
              <div className="min-h-0 overflow-y-auto overscroll-contain">
              {TOP_LEVEL_ROUTES.map((r) => (
                <NavLink
                  key={r.path}
                  to={r.path}
                  label={r.label}
                  icon={r.icon}
                  onNavigate={() => setOpen(false)}
                />
              ))}

              {/* Components dropdown */}
              <button
                onClick={() => setComponentsOpen((v) => !v)}
                className={`flex items-center gap-2.5 px-4 py-2.5 text-sm rounded-xl transition-colors w-full text-left cursor-pointer ${
                  componentsActive && !componentsOpen
                    ? "text-label font-medium bg-fill-primary"
                    : "text-label-secondary hover:text-label hover:bg-fill-quaternary"
                }`}
              >
                <IconComponents size={16} stroke={1.75} />
                <span className="flex-1">Components</span>
                <motion.span
                  animate={{ rotate: componentsOpen ? 90 : 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <IconChevronRight size={12} stroke={2} />
                </motion.span>
              </button>

              <AnimatePresence>
                {componentsOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ type: "spring", ...SPRING_FAST.snappy }}
                    className="overflow-hidden"
                  >
                    {COMPONENT_ROUTES.map((r) => (
                      <NavLink
                        key={r.path}
                        to={r.path}
                        label={r.label}
                        icon={r.icon}
                        indent
                        onNavigate={() => setOpen(false)}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
              </div>

              <div className="mt-4" />
              <ThemeToggle />
            </Squircle>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

// Shown while a code-split route chunk is fetched. Quiet on purpose — local
// chunks resolve in a frame; over LAN it's a brief spinner instead of a flash.
function RouteFallback() {
  return (
    <div className="flex min-h-svh items-center justify-center text-label-secondary">
      <div className="size-5 animate-spin rounded-full border-2 border-current/15 border-t-current/60" />
    </div>
  )
}

export default function App() {
  const { pathname } = useLocation()
  // The built-in nav is template chrome, not part of a sketch. It always shows on
  // the design-system reference routes so they stay browsable, but on the sketch
  // surface (Home / sketch-owned routes) it's hidden unless this sketch opts in.
  const navVisible = SHOW_SKETCH_NAV || isSystemRoute(pathname)
  return (
    <div className="min-h-svh bg-surface text-label">
      {navVisible && <SideNav />}

      <main className="relative z-base">
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            {ROUTES.map((r) => (
              <Route key={r.path} path={r.path} element={<r.Component />} />
            ))}
            <Route
              path="*"
              element={
                <div className="mx-auto max-w-4xl px-6 py-16 text-center">
                  <h1 className="text-h3 text-label">404</h1>
                  <p className="text-label-secondary mt-2">Page not found</p>
                </div>
              }
            />
          </Routes>
        </Suspense>
      </main>
    </div>
  )
}

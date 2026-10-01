import {
  IconHome,
  IconBounceRight,
  IconTypography,
  IconPalette,
  IconSpacingVertical,
  IconLayoutGrid,
  IconIcons,
  IconAdjustmentsHorizontal,
  IconClick,
  IconSparkles,
  IconColorSwatch,
  IconTag,
  IconLayoutCards,
  IconBoxMultiple,
  IconDroplet,
  IconAdjustments,
  IconGridDots,
  IconRulerMeasure,
  IconStack2,
  IconClockHour4,
} from "@tabler/icons-react"
import { lazy } from "react"
import { AllWidgetsPage, Widget2x2Page, Widget4x1Page, Widget4x2Page, Widget4x3Page } from "@/widgets/WidgetPages"
import { TimelinePage, TimelineV2Page } from "@/timeline/TimelinePage"

// Home stays eager so the landing route paints instantly. Every other page is
// code-split into its own chunk and only fetched when its route is visited —
// this keeps the heaviest deps (three.js in Shaders, recharts/visx in Demos and
// Motion, the motion-primitives + liquid-glass gallery) out of the initial bundle.
const lazyPage = <T extends Record<string, React.ComponentType>>(
  loader: () => Promise<T>,
  name: keyof T,
) => lazy(() => loader().then((m) => ({ default: m[name] })))

const Demos = lazyPage(() => import("@/pages/Demos"), "Demos")
const Inputs = lazyPage(() => import("@/pages/Inputs"), "Inputs")
const Colors = lazyPage(() => import("@/pages/Colors"), "Colors")
const Typography = lazyPage(() => import("@/pages/Typography"), "Typography")
const Motion = lazyPage(() => import("@/pages/Motion"), "Motion")
const Spacing = lazyPage(() => import("@/pages/Spacing"), "Spacing")
const Breakpoints = lazyPage(() => import("@/pages/Breakpoints"), "Breakpoints")
const Foundations = lazyPage(() => import("@/pages/Foundations"), "Foundations")
const Grid = lazyPage(() => import("@/pages/Grid"), "Grid")
const Clamp = lazyPage(() => import("@/pages/Clamp"), "Clamp")
const Icons = lazyPage(() => import("@/pages/Icons"), "Icons")
const SliderPage = lazyPage(() => import("@/pages/components/SliderPage"), "SliderPage")
const ButtonPage = lazyPage(() => import("@/pages/components/ButtonPage"), "ButtonPage")
const BadgePage = lazyPage(() => import("@/pages/components/BadgePage"), "BadgePage")
const CardPage = lazyPage(() => import("@/pages/components/CardPage"), "CardPage")
const AccordionPage = lazyPage(() => import("@/pages/components/AccordionPage"), "AccordionPage")
const ShadersPage = lazyPage(() => import("@/pages/components/ShadersPage"), "ShadersPage")
const LiquidGlassPage = lazyPage(() => import("@/pages/components/LiquidGlassPage"), "LiquidGlassPage")

export type RouteIcon = React.ComponentType<{ size?: number; stroke?: number }>

export type RouteEntry = {
  path: string
  label: string
  icon: RouteIcon
  /** Omit for top-level nav; "components" places it under the Components dropdown. */
  group?: "components"
  /**
   * `true` marks this as a design-system *reference* page shipped by the
   * template (Colors, Demos, Icons, the component gallery, …). The built-in nav
   * always shows on these so they stay browsable. Routes your *sketch* owns are
   * left unmarked — they're the "sketch surface", where the nav is hidden by
   * default (see {@link SHOW_SKETCH_NAV}). Home is unmarked because a spawned
   * sketch builds its prototype there.
   */
  system?: boolean
  Component: React.ComponentType | React.LazyExoticComponent<React.ComponentType>
}

export const ROUTES: RouteEntry[] = [
  { path: "/",            label: "Widgets", icon: IconHome,            Component: AllWidgetsPage },
  { path: "/2x2",         label: "2 × 2",   icon: IconLayoutCards,     Component: Widget2x2Page },
  { path: "/4x1",         label: "4 × 1",   icon: IconLayoutCards,     Component: Widget4x1Page },
  { path: "/4x2",         label: "4 × 2",   icon: IconLayoutCards,     Component: Widget4x2Page },
  { path: "/4x3",         label: "4 × 3",   icon: IconLayoutCards,     Component: Widget4x3Page },
  { path: "/timeline",    label: "Timeline", icon: IconClockHour4,     Component: TimelinePage },
  { path: "/timeline-2",  label: "Timeline 2", icon: IconClockHour4,   Component: TimelineV2Page },
  { path: "/demos",       label: "Demos",   icon: IconSparkles,        system: true, Component: Demos },
  { path: "/colors",      label: "Color",   icon: IconPalette,         system: true, Component: Colors },
  { path: "/foundations", label: "Fluid",   icon: IconStack2,          system: true, Component: Foundations },
  { path: "/typography",  label: "Type",    icon: IconTypography,      system: true, Component: Typography },
  { path: "/motion",      label: "Motion",  icon: IconBounceRight,     system: true, Component: Motion },
  { path: "/spacing",     label: "Space",   icon: IconSpacingVertical, system: true, Component: Spacing },
  { path: "/breakpoints", label: "Layout",  icon: IconLayoutGrid,      system: true, Component: Breakpoints },
  { path: "/grid",        label: "Grid",    icon: IconGridDots,        system: true, Component: Grid },
  { path: "/clamp",       label: "Clamp",   icon: IconRulerMeasure,    system: true, Component: Clamp },
  { path: "/inputs",      label: "Inputs",  icon: IconAdjustments,     system: true, Component: Inputs },
  { path: "/icons",       label: "Icons",   icon: IconIcons,           system: true, Component: Icons },

  { path: "/components/badge",     label: "Badge",     icon: IconTag,                     group: "components", system: true, Component: BadgePage },
  { path: "/components/button",    label: "Button",    icon: IconClick,                   group: "components", system: true, Component: ButtonPage },
  { path: "/components/accordion", label: "Accordion", icon: IconBoxMultiple,             group: "components", system: true, Component: AccordionPage },
  { path: "/components/card",      label: "Card",      icon: IconLayoutCards,             group: "components", system: true, Component: CardPage },
  { path: "/components/slider",    label: "Slider",    icon: IconAdjustmentsHorizontal,   group: "components", system: true, Component: SliderPage },
  { path: "/components/shaders",   label: "Shaders",   icon: IconColorSwatch,             group: "components", system: true, Component: ShadersPage },
  { path: "/components/liquid-glass", label: "Liquid Glass", icon: IconDroplet,           group: "components", system: true, Component: LiquidGlassPage },
]

export const TOP_LEVEL_ROUTES = ROUTES.filter((r) => !r.group)
export const COMPONENT_ROUTES = ROUTES.filter((r) => r.group === "components")
export const COMPONENTS_BASE_PATH = "/components"

/**
 * Show the built-in navigation (the grey dot on the right edge) on the *sketch
 * surface* — Home and any route your sketch owns.
 *
 * The template ships this `true` so project-base's own landing page keeps the
 * nav for browsing the design system. `new-project.ps1` flips it to `false` in
 * every spawned sketch, so a fresh sketch launches clean — no nav dot floating
 * over your prototype. Flip it back to `true` if *this* sketch wants the nav
 * (e.g. a multi-view sketch that navigates between its own pages).
 *
 * Either way the nav still appears on the design-system reference routes
 * ({@link isSystemRoute}) so `/colors`, `/demos`, etc. stay browsable — and
 * dialkit stays hidden until a sketch registers a panel via `useDialKit`, so
 * both chrome surfaces are opt-in for a new sketch.
 */
export const SHOW_SKETCH_NAV = false

const SYSTEM_PATHS = new Set(ROUTES.filter((r) => r.system).map((r) => r.path))

/** A design-system reference route the template ships (see `RouteEntry.system`). */
export function isSystemRoute(pathname: string): boolean {
  return SYSTEM_PATHS.has(pathname) || pathname.startsWith(COMPONENTS_BASE_PATH)
}

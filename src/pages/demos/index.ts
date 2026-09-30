import type { DemoEntry } from "./types"

import squircle from "./squircle"
import progressiveBlur from "./progressive-blur"
import colorThief from "./color-thief"
import motionPrimitives from "./motion-primitives"
import motion from "./motion"
import gsap from "./gsap"
import router from "./router"
import zustand from "./zustand"
import sonner from "./sonner"
import select from "./select"
import combobox from "./combobox"
import toggleGroup from "./toggle-group"
import tabs from "./tabs"
import recharts from "./recharts"
import visx from "./visx"
import skeleton from "./skeleton"
import pretext from "./pretext"
import htmlInCanvas from "./html-in-canvas"
import shaders from "./shaders"
import colorEditor from "./color-editor"
import dialkit from "./dialkit"
import agentation from "./agentation"
import perfHud from "./perf-hud"
import canvasToolbar from "./canvas-toolbar"

/**
 * Single source of truth for the Demos page. Adding a library to the template
 * means adding one entry here — the stack-at-a-glance grid and the demo list
 * both render from this array. Infrastructure-only entries (no Component) show
 * up in the grid as inventory but render no live demo.
 *
 * Order = render order on the Demos page.
 */
export const DEMOS: DemoEntry[] = [
  squircle,
  progressiveBlur,
  colorThief,
  motionPrimitives,
  motion,
  gsap,
  router,
  zustand,
  sonner,
  select,
  combobox,
  toggleGroup,
  tabs,
  recharts,
  visx,
  skeleton,
  pretext,
  htmlInCanvas,
  shaders,
  colorEditor,
  dialkit,
  agentation,
  perfHud,
  canvasToolbar,

  // Infrastructure — appears in the stack grid; no live demo by design.
  { lib: "Vite 8", role: "bundler" },
  { lib: "React 19", role: "ui" },
  { lib: "TypeScript", role: "types" },
  { lib: "Tailwind v4", role: "css" },
  { lib: "shadcn/ui", role: "components" },
  { lib: "Base UI", role: "headless primitives" },
  { lib: "next-themes", role: "light/dark" },
  { lib: "react-use-measure", role: "size hook" },
  { lib: "three", role: "3D / WebGL" },
  { lib: "react-three-fiber", role: "R3F renderer" },
  { lib: "drei", role: "R3F helpers" },
  { lib: "react-three-postprocessing", role: "post FX" },
  { lib: "use-shader-fx", role: "FX hooks" },
]

export type { DemoEntry }

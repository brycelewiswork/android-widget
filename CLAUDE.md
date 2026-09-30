# Project context

This project was spawned from [project-base](../Project-Base/), a personal
scaffold for high-fidelity React sketches.

For **design intent** — personality, references, anti-patterns, the *why*
behind the choices below — see [DESIGN.md](DESIGN.md). For stack, conventions,
and the *how*, read on.

## Dev server: always phone-accessible

These sketches are mobile UI prototypes — they're meant to be loaded on a phone
over local Wi-Fi. `vite.config.ts` is pre-configured with `server: { host: true,
port: process.env.PORT ?? 5173 }` so `pnpm dev` exposes a `Network:` URL out
of the box. The port is env-overridable (`PORT=5174 pnpm dev` or set in
`.env.local`) so anyone cloning the project can pick their own without editing
the config.

When starting the dev server, always:

1. Surface the **`Network:` URL** Vite prints (e.g. `http://<PC-IPv4>:5173/`). If
   missing, derive from `ipconfig`. Never tell him to use `localhost` / `127.0.0.1`
   for the phone.
2. Remind him once that the phone must be on the **same Wi-Fi** as the PC.
3. If the phone can't connect, suspect **Windows Firewall** blocking inbound Node —
   needs "Allow on Private networks". Don't suggest disabling the firewall as a fix
   (only as a brief diagnostic).
4. Mention "Add to Home Screen" in mobile Safari/Chrome for a chromeless launch,
   and that HMR works over LAN.

**Port collisions:** if running multiple sketches at once, give this clone a unique
port via `PORT=5174 pnpm dev` (or a `.env.local` with `PORT=5174`) so saved phone
bookmarks stay stable instead of Vite silently incrementing. Don't hardcode a new
default in `vite.config.ts` — keep it env-driven so the project stays portable.

## Preview screenshot — the folder's visual label

This project is one of many sketches spawned from project-base, all living as sibling
folders. To tell them apart at a glance, **keep one hero screenshot at the project root
named `_preview.png`** — Bryce browses the sketches folder and that image is how he
remembers what each sketch is ("oh, *that's* what 'AI nav bar' meant").

- **When:** capture or refresh it whenever you finish a meaningful chunk of work and the
  sketch looks presentable. Re-shoot when the signature look changes materially. Never
  capture a half-built or loading state.
- **What:** the *signature* view — whatever makes this sketch recognizable. Single screen?
  Shoot it. Multi-view? Pick the most representative one.
- **Where + name:** the project root, exactly `_preview.png`. The leading underscore sorts
  it to the top of the folder (so it's the first thing you see), and Windows builds the
  folder's own thumbnail from it. One file, overwritten each time — don't accumulate copies.
- **How:** run `pnpm dev`, navigate to the signature view, and screenshot the running app.
  These are phone-first prototypes, so a phone-width frame (≈390×844) usually reads best;
  go wider only if the sketch is genuinely desktop-oriented.

Treat it as part of "done" — finished work leaves an up-to-date `_preview.png` behind.

## Stack

- Vite 8 + React 19 + TypeScript (strict) — using `@vitejs/plugin-react` (Oxc transform + Fast Refresh, Rolldown-native; no Babel)
- Tailwind CSS **v4** via `@tailwindcss/vite` (no PostCSS / no `tailwind.config.js` — config lives in `src/index.css` under `@theme`)
- shadcn/ui (base / nova preset, neutral palette) — components live in `src/components/ui/`. shadcn v4+ uses **Base UI** (`@base-ui/react`) as its headless primitive layer (replacing Radix from earlier versions). Button and Badge already use Base UI; future `pnpm dlx shadcn add` components will too. Base UI is a dependency of shadcn, not something we manage directly.
- motion (formerly framer-motion) — import from `motion/react` for React APIs, `motion/dom` for the Motion One-style vanilla API
- GSAP for timeline/stagger animations
- React Router v7
- Zustand for state — stores in `src/store/`
- Sonner for toasts (mounted in `src/main.tsx`)
- **DM Sans** (`@fontsource-variable/dm-sans`) — default `--font-sans`, variable font with weights 100–900. Live-tunable fluid type scale on `/typography` (see the fluid system below). Body and heading fonts are independently swappable there to **any Google font** — a searchable combobox over the full Google Fonts catalogue (~2k families via the Fontsource API, each rendered in its own face), loaded on demand via the Google Fonts CSS API into `--font-body` / `--font-heading`; DM Sans stays the default fallback. Baked via **Copy CSS** (emits a self-contained `@import`).
- **Fluid type + space** (`src/lib/fluid.ts`, foundational) — Utopia-style `clamp()` sizing in a **two-tier token system**. **Primitives** are the raw programmatic scale (`--type-step--2…5`, `--space-3xs…3xl` + one-up pairs) baked into `:root` in `index.css` — plain custom properties, no utilities. **Semantics** are role-based aliases in the `@theme inline` block that Tailwind turns into utilities: `inset` = padding (`p-inset-m`), `stack` = vertical gap (`space-y-stack-m`, `gap-y-stack-m`), `inline` = horizontal gap (`space-x-inline-s`), `gutter` = 2D grid/flex gap (`gap-gutter-l`); every role covers `3xs…3xl`. **Prefer the role utilities in components** — `p-inset-*`, `gap-stack-*`, `text-body`/`text-heading`/`text-display` — not raw numeric `p-4`/`gap-2` (which still work for one-off fixed values). Type utilities (`.text-display/heading/title/body/caption/eyebrow` + legacy `.text-h1…h6/.text-sm/.text-xs`) are hand-written in `@layer utilities` and alias the step primitives; they emit font-size only. The scale is **tunable per sketch**. The foundation values (viewport min/max, font-size min/max, type-scale ratio min/max, plus an optional **detail ratio** min/max — a gentler ratio applied only to the sub-body/negative type steps so the small end can compress Apple-style while headings stay coarse; defaults to the main ratio) live on **`/foundations`** — the fluid system's root, shared by type + space (the ratios are type-only; spacing uses per-step multipliers). Per-page refinements live on `/typography` (type steps/weights/line-height/tracking) and `/spacing` (space steps, editable per-step multipliers, custom pairs); `/grid` and `/clamp` are layout tools. Sliders + numeric entries write the primitives live, **Save** persists to that sketch's localStorage, **Copy CSS** exports a baked block for `index.css`. Default is "Comfortable" (16→18px base, heading ratio 1.2→1.25, **detail ratio 1.075** for the sub-body steps, viewport 360→1240) with **6 sub-body steps** (an Apple-style compressed small end for varied label sizes) + 5 heading steps. Individual sizes can be **disabled** on `/typography` (kept in the scale but greyed and excluded from Copy CSS). Don't hardcode `clamp()` or px scales in components — reach for a token.
- **Fluid space pairs — reach for these on structural spacing.** One-up pairs (`--space-s-m`, auto-generated between adjacent steps) and custom pairs (`--space-s-l`, defined on `/spacing`) interpolate from the *lower* step at the min viewport to the *upper* step at the max viewport, so the value climbs a whole span as the screen widens — proportionally **tight on mobile, generous on desktop** (a plain step can't do this; it holds its proportion). **Use a pair for the big structural whitespace** that should breathe more on wide screens: gaps between page sections, hero / section vertical padding, page inline padding, grid gutters. **Keep single-step role tokens** (`p-inset-*`, `gap-stack-*`) for component-internal spacing (button/card padding, icon gaps) that should feel consistent at every width. Pairs aren't role utilities — apply via an arbitrary value: `py-[var(--space-s-m)]`, `gap-[var(--space-m-l)]`.
- **DM Mono** (`@fontsource/dm-mono`) — default `--font-mono`, used via Tailwind `font-mono` for code chips, value displays, tabular numbers, and any monospaced UI element. Centralized in the `@theme` block in `index.css`; never hardcode `ui-monospace`/`monospace` stacks in components.
- **Tabler Icons** (`@tabler/icons-react`) — 5,400+ icons in outline + filled, consistent 2px/24px grid. Import directly from the package. When `pnpm dlx shadcn add` brings in a new component with `lucide-react` imports, swap to the Tabler equivalent in the same commit. Custom icons go in `src/components/icons/` as individual files.
- **corner-smoothing** for Apple-style squircles — applied to every shadcn component (see Conventions)
- **Progressive blur** (custom, in [src/components/ui/progressive-blur.tsx](src/components/ui/progressive-blur.tsx)) — `<LinearBlur side="top|bottom|left|right">` for edge fades and `<RadialBlur origin="edge|center">` for radial vignettes/focal blurs. Configure via `strength` + `steps` for a geometric ramp, or pass `blurLevels=[...]` for explicit multi-stop control. Zero deps; pure CSS `backdrop-filter` + mask gradients.
- **Motion tokens** in [src/lib/motion.ts](src/lib/motion.ts) — unified spring/easing/duration presets. `SPRING.*` (gentle, smooth, snappy, bouncy, magnetic), `SPRING_FAST.*` (same names, higher damping, professional feel), `EASE.*` (Apple curve, Material standard/emphasized, CSS keywords), `GSAP_EASE.*`, `DURATION.*`. Import and use these instead of inline `{ stiffness, damping }` literals.
- **motion-primitives** (ibelick) — 32 copy-paste animation components built on `motion`, installed into `src/components/ui/`. Includes TextEffect, AnimatedNumber, InfiniteSlider, Tilt, Spotlight, GlowEffect, ScrollProgress, InView, Carousel, Dock, MorphingDialog, and more. Install additional ones on demand: `pnpm dlx shadcn@latest add "https://motion-primitives.com/c/<name>.json"`. Skip their `progressive-blur` (we have our own).
- **colorthief** v3.x for color extraction from images — `getColorSync(img)` for dominant color, `getPaletteSync(img, { colorCount, colorSpace: 'oklch' })` for a palette, `getSwatchesSync(img)` for semantic swatches (Vibrant/Muted/DarkVibrant/DarkMuted/LightVibrant/LightMuted). In React, use the `useImagePalette(ref, options)` hook from [src/components/ui/color-thief.tsx](src/components/ui/color-thief.tsx). Color harmony (complementary, analogous, triadic, split-complementary) is exposed via the inline `harmonies(hex)` utility in the same file — no extra dep. Pairs naturally with `<LinearBlur tint={dominant.hex()}>` for the Apple Music-style image-into-color blend.
- **Recharts** v3 via shadcn's `ChartContainer` — declarative charts (area, bar, radial, sparkline). SVG output styled with CSS variable tokens. Install new chart types: `pnpm dlx shadcn@latest add chart`.
- **visx** (`@visx/shape`, `@visx/scale`, `@visx/group`) — low-level SVG primitives for custom visuals Recharts can't express (radial arcs, bespoke gauges). Use as an escape hatch, not the default.
- **dialkit** (Josh Puckett) — floating control panel for live-tuning UI values. `useDialKit("Panel name", { foo: [default, min, max], bar: { type: "spring", ... }, color: { type: "color" } })` auto-generates sliders, toggles, color pickers, spring/easing editors with keyboard shortcuts. `<DialRoot />` is mounted in `main.tsx` outside the squircled app shell. **Forked into the template** at [src/components/dialkit](src/components/dialkit) (MIT — we own + extend it; import from `@/components/dialkit`, not the npm package). Beyond the stock primitives (slider, toggle, select, color, text, spring/easing) it ships eight richer control types, each with a `{ type: "…" }` config: **vector** (authored X/Y pad, normalized [-1,1]), **gradient** (type/angle/draggable stops → `gradientToCss(value)`), **rangeInput** (two-field bound), **colorCollection** (editable hex bank), **palette** (family+shade token → `paletteHex(value)`), **fontPicker** (family/weight/size/case/color → `fontStyle(value)`), **curves** (RGB/R/G/B tone-curve editor → `sampleCurve(pts, x)`), and **imagePicker** (upload-thumbnail grid). See [DESIGN.md](DESIGN.md) → **The control catalog** for when to reach for which. Adding another = store seam + a `case` in `dialkit/components/Panel.tsx` + a component drawing from `dialkit/components/controlStyles.ts` (shared `--dial-*` tokens); every control routes color editing through the shared `ColorField`. **Responsive:** the panel floats in a corner on tablet/desktop (≥640px, clamped so it never overflows); below 640px it becomes a full-width bottom sheet with a backdrop (collapsed = a FAB bubble, drag disabled) — handled in `DialRoot` + a `@media` block in `theme.css`. Use as the per-sketch tweak overlay — the canonical tuning surfaces still live on `/typography`, `/motion`, `/spacing`, `/breakpoints`, `/grid`, `/clamp`. Tune live → bake settled values into `src/lib/motion.ts` tokens (motion) or via **Copy CSS** into `index.css` (fluid type/space). JSON export available. For *how to structure* a panel — grouping by entity, choosing the control by the value's shape, labels, hide-don't-disable, live-during-drag — see [DESIGN.md](DESIGN.md) → **Designing control panels**.
- **agentation** — in-app visual feedback for AI agents. `<Agentation />` is mounted dev-only in `main.tsx` (gated by `import.meta.env.DEV`); toggle the toolbar with `Ctrl+Shift+F`. The user clicks any element to drop a structured annotation (CSS selector, Vite source path + line, React tree, computed styles, optional `intent`/`severity`). Modes: Elements, Text, Multi-select/Area, Animation (press `P` to freeze a frame mid-spring), Layout. The agentation MCP server is registered in `.mcp.json`; Claude has 9 tools — `agentation_list_sessions`, `agentation_get_session`, `agentation_get_pending`, `agentation_get_all_pending`, `agentation_acknowledge`, `agentation_resolve`, `agentation_dismiss`, `agentation_reply`, `agentation_watch_annotations`.
  - **Workflow split:** dialkit = numeric tuning the user does themselves. Agentation = structural / judgmental feedback handed to Claude.
  - **The watch loop:** when the user says *"start the watch loop"* (or similar), call `agentation_watch_annotations` repeatedly; for each annotation acknowledge → make the fix → `agentation_resolve` with a one-line summary. Use `agentation_reply` for clarifying questions instead of switching to chat. Markers clear on the user's screen as you resolve.
  - **Desktop only** — no mobile/phone support; the phone-LAN dev loop and the agentation loop are separate channels. No iframes / shadow DOM. Annotations default to 7-day localStorage; MCP-synced ones persist indefinitely.
- **Perf HUD** (custom, dev-only, in [src/components/ui/perf-hud.tsx](src/components/ui/perf-hud.tsx)) — frame-timing meter mounted bottom-left in `main.tsx` (gated by `import.meta.env.DEV`). Shows smoothed **fps**, the **worst** frame in the trailing second (the jank detector — one 60ms frame reads as a visible hitch even when average fps looks fine), and main-thread **blocks** (>50ms long tasks). Drag a heavy control / sweep a shader param and watch `worst` spike red. Zero-dep, throttled to ~4Hz so it never causes the jank it measures. `Alt+P` hides it; click the pill for a sparkline. Live section on `/demos`. This is the everyday, in-loop responsiveness check; for CI-grade frame budgets reach for Playwright (see the reach-for table).
- **next-themes** — light/dark mode provider (wraps the app in `main.tsx`). FOUC prevention script in `index.html`.
- **react-use-measure** — `useMeasure()` hook for reading element dimensions. Used by Motion page demos.
- **Pretext** (`@chenglou/pretext`) — Cheng Lou's pure-JS multiline text measurement & layout engine. Computes paragraph heights, line counts, and tight widths from canvas font metrics with **zero DOM reflow**. Live walkthrough on `/demos` (Pretext section), full `<Accordion>` component docs at `/components/accordion`. Hooks, primitive, and component shipped:
  - **Hooks** ([src/lib/pretext.ts](src/lib/pretext.ts)):
    - `usePretextHeight(text, font, maxWidth, lineHeight)` → `{ height, lineCount }`
    - `useTightWidth(text, font, maxWidth, minWidth, lineHeight)` → binary-searches the narrowest width holding the same line count
    - `pretextStyleFromElement(el)` → samples `{ font, lineHeight, letterSpacing, fontSize }` from a DOM node's computed styles so you can drive Pretext from Tailwind tokens (e.g. `text-body leading-snug`) instead of hardcoding pixels
  - **Primitive** ([src/components/ui/tight-text.tsx](src/components/ui/tight-text.tsx)): `<TightText>` — drop-in `<span>` that shrinks to the narrowest box still fitting its text in the same line count. Solves the chat-bubble problem.
  - **Component** ([src/components/ui/accordion.tsx](src/components/ui/accordion.tsx)): `<Accordion items={…} bodyWidth={N} />` — accordion whose open/close springs to a *predicted* pixel height (motion can't truly spring-animate to `auto`).

  **When to reach for Pretext:**
  - Masonry / virtualized lists with text-driven heights — pack in one paint
  - Chat-style bubbles that should hug content (use `<TightText>`)
  - Accordions / disclosures animated with real spring overshoot (use `<Accordion>` or feed `usePretextHeight` to your own motion)
  - Responsive layouts that branch on whether text overflows N lines at a given breakpoint
  - Pre-paint title fitting (truncate at a measured N lines without thrash)

  **When NOT to reach for it:**
  - Single-line text — no measurement needed
  - Anything CSS already solves cheaply (`line-clamp`, `text-wrap: balance`/`pretty`, container queries)
  - Mixed content with images, icons, or arbitrary HTML children — Pretext's rich-inline API handles fragments but isn't a full HTML layout engine
  - Static body copy you can measure once at build time

  **Gotchas:**
  - Pretext wants a real CSS font shorthand (e.g. `'500 16px "DM Sans Variable"'`). `system-ui` is unsafe on macOS per upstream — always pass an explicit family. Use `pretextStyleFromElement(ref.current)` after mount instead of hardcoding.
  - Never inline `lineHeight: 20` etc. into Pretext calls — sample it from a hidden probe element that wears the same Tailwind classes as the real rendered text. That keeps measurement and render in lockstep when the design system changes.

## Claude API (AI-powered sketches)

`@anthropic-ai/sdk` is wired up so sketches can call Claude. The key lives in
**`.env.local`** (gitignored, propagated into every spawned sketch) and is read
**server-side only** — it never enters the client bundle (no `VITE_` prefix).

**Architecture.** `vite.config.ts` runs a same-origin dev proxy at
`/api/anthropic` that forwards to `api.anthropic.com` with the key attached.
Sketch code uses the SDK pointed at that proxy via
[src/lib/anthropic.ts](src/lib/anthropic.ts), so the browser holds only a
placeholder key. This also dodges Anthropic's browser-CORS block and works over
LAN (the phone calls the PC's proxy). It's a **dev-only** path — there's no proxy
in `vite build`/`preview`, which is fine for these local prototypes.

**Use it in a sketch:**

```tsx
import { anthropic, CLAUDE_MODEL, streamText } from "@/lib/anthropic"

// one-shot
const res = await anthropic.messages.create({
  model: CLAUDE_MODEL,            // claude-opus-4-8
  max_tokens: 1024,
  messages: [{ role: "user", content: "..." }],
})

// streaming into UI
for await (const chunk of streamText("Write a haiku about squircles")) {
  setText((t) => t + chunk)
}
```

`anthropic` is the full SDK — use it directly for tool use, images, multi-turn,
or adaptive thinking (`thinking: { type: "adaptive" }`) on complex tasks. Default
to **streaming** for long outputs. Model default is `claude-opus-4-8`.

**Verify the key:** `pnpm test:anthropic` (one tiny live call, prints ✅/❌).
`.env.example` documents the variable. Never prefix the key with `VITE_`.

## Not in the bundle — reach for these first

These libraries are **deliberately not installed** by default to keep the
template lean, but they are the preferred choice when a sketch needs the
capability. **Before suggesting a `pnpm add` of anything not on this list
or in the Stack section above, consult the table below first.** If the need
fits a row, install the listed library; don't reach for a sibling.

Add a row when you find yourself recommending a library that isn't installed:
the goal is for this table to grow into a complete map of *"what to use when
the bundle doesn't already cover it."*

| Need | Reach for | Skip / why |
|---|---|---|
| Liquid-glass effect (zero-dep, full control) | Hand-rolled CSS + SVG `feDisplacementMap` per [kube.io/blog/liquid-glass-css-svg](https://kube.io/blog/liquid-glass-css-svg/) | When you want to tune the refraction, dispersion, and edge feel by hand. No runtime; pure SVG filter + `backdrop-filter`. |
| Liquid-glass effect (drop-in) | [`liquidglass`](https://github.com/ybouane/liquidglass) | When you want the Apple-style glass without writing the SVG yourself. Reach for the kube.io approach instead if you need to customize the look. |
| Node / flow / graph UI (React) | [`@xyflow/react`](https://reactflow.dev/) (React Flow) | The canonical choice for node editors, flowcharts, pipeline UIs, n8n-style canvases. Don't hand-roll panning/zooming/edge routing. |
| Resizable split panels (canvas + control panel, inspector/sidebar layouts) | [`react-resizable-panels`](https://github.com/bvaughn/react-resizable-panels) | The canvas-tool genre (shader/effect apps) wants a draggable split between the viewport and the controls. Don't hand-roll drag handles / min-max clamping. |
| Drag-to-reorder / sortable lists (layers, gradient stops, keyframes) | [`@dnd-kit/core`](https://dndkit.com/) + `@dnd-kit/sortable` | Accessible, pointer + keyboard DnD. Don't hand-roll pointer math or reorder logic for layer/stop lists. |
| Command menu / ⌘K palette | [`cmdk`](https://cmdk.paco.me/) | For command palettes and quick-switchers. shadcn's `command` is built on it. |
| Automated frame-budget / responsiveness assertions (headless, CI) | [`@playwright/test`](https://playwright.dev/) | Only when you need *automated* perf budgets or e2e — assert `worst`-frame stays under N ms across a control sweep, in CI. For everyday tuning the dev-only Perf HUD already covers it live; don't add Playwright to a throwaway sketch. |

When installing one of these into a spawned sketch, add a `<DemoSection>` for
it on `/demos` in the same change — same convention as the bundled libraries.

## System pages

Reference pages documenting the design system. Visit during `pnpm dev`:

- `/colors` — every color token (surfaces, labels, strokes, fills, accents, neutrals, black/white opacity, charts, sidebar), plus the **Ramp Studio** — generates a 13-step family in the same shape as the Apple accent ramps, from a hue or through a color you already have (also tonal neutral / tinted-neutral / vibrant modes). Exports CSS token blocks, an SVG swatch sheet you drag straight into Figma, and W3C DTCG JSON for Tokens Studio. Engine in [src/lib/oklch.ts](src/lib/oklch.ts); the derivation behind the two profile curves is in [../../Project-Base/docs/oklch-ramps.md](../../Project-Base/docs/oklch-ramps.md)
- `/foundations` — **the fluid system's root.** Owns the shared values (viewport min/max, font-size min/max, type-scale ratio min/max, and an optional detail-ratio min/max for the sub-body steps) that type + space derive from; illustrates the cascade. Set the scale here; the other four pages read it. Save + Copy CSS
- `/typography` — fluid **type** scale (Utopia clamp): a typescale.com-style live **Preview** (type your own specimen, switch REM/PX/PT units, add/remove steps inline) plus Table/Graph views; type-only refinements (body/heading **font** — any Google family, DM Sans default — weights, line-height, tracking, each with an individual reset); primitive-step + semantic-role tables. Foundation values are read-only here (tune on /foundations)
- `/motion` — spring and easing curve visualizations with play/replay, duration tokens
- `/spacing` — fluid **space** scale: each step is an editable ×multiple of the base with ± to add/remove steps (Utopia-style, vocabulary `5xs`…`5xl`); one-up pairs, role tokens (inset/stack/inline/gutter), live layout. Base size comes from the foundation (tune on /foundations)
- `/breakpoints` — responsive breakpoint scale, live viewport indicator, reflow demo, container widths
- `/grid` — fluid, wrap-aware grid (auto-fit + fixed N-col) with gutters bound to the space scale; generated CSS
- `/clamp` — general fluid-value generator (any min→max between two viewports) with a live scrubber preview
- `/inputs` — **Inputs & Controls.** The two families side by side: the interface inputs that *ship* inside a sketch (Select, Toggle, ToggleGroup, Tabs, Command, Slider) with live examples and snippets, and the dialkit tuning controls that *don't*. Opens with a "which do I reach for" table, and carries the full dialkit control catalog — the panel is wired with every control type, so a `controlStyles.ts` restyle can be checked against the whole set at once
- `/icons` — searchable Tabler icon browser
- `/demos` — inventory of every installed library with working demos

## Template chrome is opt-in for a sketch

A fresh sketch should launch **clean** — its prototype at `/`, nothing floating
over it. The two built-in overlays are gated so they only appear when a sketch
actually wants them:

- **The nav** (the grey dot on the right edge, in [App.tsx](src/App.tsx)) is
  controlled by `SHOW_SKETCH_NAV` in [routes.tsx](src/routes.tsx). The template
  ships it `true` (project-base's own landing keeps the nav for browsing the
  design system); `new-project.ps1` / `new-project.sh` flip it to `false` in
  every spawn, so a new sketch's `/` has no nav dot. The design-system reference
  routes (`system: true` in `ROUTES` — `/colors`, `/demos`, the component
  gallery, …) **always** show the nav via `isSystemRoute()`, so they stay
  browsable regardless. **To give this sketch the nav** (e.g. a multi-view
  sketch that navigates between its own pages), set `SHOW_SKETCH_NAV = true`; a
  route your sketch owns is unmarked (no `system` flag), so it counts as the
  sketch surface.
- **Dialkit** ([DialRoot](src/components/dialkit/components/DialRoot.tsx), mounted
  in `main.tsx`) renders `null` until a sketch registers a panel via
  `useDialKit(...)`. It's already opt-in — nothing to toggle. Call `useDialKit`
  and the panel appears; don't, and there's no overlay.

## Verifying changes — classify before you edit

Before editing, size the change by **blast radius** (not line count) and run only the
checks that tier calls for. Over-verifying a copy tweak wastes time; under-verifying a
shader loop ships jank. When unsure, go one tier **up**. Don't `pnpm build` for tiny edits.

The checks available in this template: `pnpm typecheck`, `pnpm lint`, `pnpm build`,
`pnpm check:vendored`, the **Perf HUD** (bottom-left overlay), and browser verification via
**Claude Preview** (local dev server) or **Claude in Chrome** — never assume from the code alone
that a visual/interaction change looks right.

| Tier | Use when | Run |
|------|----------|-----|
| **0 — copy / docs** | Comments, copy, labels, a CLAUDE.md/README edit. No types, state, or layout touched. | `pnpm typecheck` only if you touched typed code. No browser. |
| **1 — one component's presentation** | Spacing, hover/focus/disabled, a single page's visual tweak. State shape unchanged. | `pnpm typecheck` + a focused browser look at that view (Preview/Chrome). |
| **2 — schema / state / new component or route / library add** | New shadcn component, new page, store change, new default, added dependency. | `pnpm typecheck && pnpm lint` + browser-check the affected view. If you added a library, add its `/demos` section in the same change. |
| **3 — renderer / canvas / shader / animation loop / heavy motion** | Anything perf-sensitive: R3F scene, shader params, GSAP timeline, drag/zoom, a control that drives heavy work. | Tier 2 checks **+ watch the Perf HUD while exercising the control** — drag the sliders, sweep the params, confirm `worst` stays out of red. |
| **4 — foundational / template / "done"** | Editing a [foundational file](#foundational-files--modify-only-on-explicit-request), dependency/lockfile change, broad refactor, or finishing a sketch. | `pnpm check:vendored && pnpm typecheck && pnpm lint && pnpm build`, a browser pass of the signature view, and refresh `_preview.png`. |

## Foundational files — modify only on explicit request

The template ships a **design-system runtime** that every sketch is built *on top of*. Treat
these as library code: don't casually rewrite, "clean up", or regenerate them. Change one only
when the change is genuinely *about the system itself* and the user asked for it — or flag it and
ask first. Silently editing a token file drifts every future sketch away from the shared system.

Protected surface (run `pnpm check:vendored` to print the full list; it also guards against
accidental deletion/rename):

- **Tokens & core:** `src/index.css` (`@theme`), `src/lib/motion.ts`, `src/lib/utils.ts`, `src/components/squircle.tsx`
- **Color, type & space systems:** `src/lib/colors.ts`, `src/lib/color-tokens.ts`, `src/lib/color-convert.ts`, `src/lib/fluid.ts` (fluid type + space engine), `src/store/useFluidStore.ts` (shared fluid config store — one source of truth for all four fluid pages), `src/pages/_fluid-controls.tsx` (shared calculator controls)
- **Measurement / text:** `src/lib/pretext.ts`, `src/components/ui/tight-text.tsx`, `src/components/ui/accordion.tsx`
- **Infra components:** `src/components/ui/progressive-blur.tsx`, `src/components/ui/color-thief.tsx`, `src/components/ui/perf-hud.tsx`, `src/components/shaders/**`
- **Vendored dialkit** (forked, owned): `src/components/dialkit/**` — extend it (new control types, restyle) deliberately; don't casually rewrite the upstream store/panel internals
- **Claude proxy:** `src/lib/anthropic.ts`
- **Reference system pages:** `Colors`, `Foundations`, `Typography`, `Motion`, `Spacing`, `Breakpoints`, `Grid`, `Clamp`
- **Build / scaffolding:** `vite.config.ts`, `scripts/**`

**Not covered by this rule:** restyling a *newly added* `src/components/ui/<name>.tsx` right after
`pnpm dlx shadcn add` is expected — that's the token/squircle/icon/motion pass in the Conventions
section, not a rewrite of foundational code. The guard is about the *existing* system files above.

## Building from a reference (video / Pinterest / screenshots / Figma)

When the thing to reproduce is a **motion or interaction reference** — a video, GIF, screen
recording, Pinterest board, or a sequence of screenshots — don't implement from a single frame or
a vibe. Motion lives *between* frames. Before coding, write a short study (a few bullets in your
plan, not a document):

1. **Storyboard** the key frames — what's on screen at the start, peak, and end of the moment.
2. **Frame-to-frame** — what moves, what stays anchored, what enters/exits, and the timing/easing feel (snap? overshoot? drift?).
3. **Map** each observed behavior to an implementation choice (which `SPRING.*`/`EASE.*` token, which element animates, what triggers it).

Then build it, and verify against the reference in the browser (Tier 1–3 above). For a **Figma
URL**, read the actual file via the Figma MCP (nodes, variables, components) — don't eyeball a
screenshot. Keep the study lightweight, but do it before writing motion/interaction from a reference.

## Choosing a renderer

These sketches are canvas/shader-heavy, so pick the render tech from the *output*, not from
convenience. The choice is **provisional until the Perf HUD stays green** under the heaviest real
inputs (see Performance below) — if it janks, change the strategy, don't lower quality.

| Layer | Reach for | Ours |
|---|---|---|
| Text, editable labels, accessible/structured low-count markup | **DOM** | plain React |
| Crisp vectors, lines, icons, foreground geometry, drag handles, hit targets | **SVG** | React SVG / visx |
| Medium raster compositing, text-to-canvas, simple procedural, export passes | **Canvas 2D** | `<canvas>` |
| Dense pixels, shaders, image processing, high-res procedural, big particle fields, heavy animated backgrounds | **WebGL / WebGPU** | three · r3f · drei · postprocessing · paper-shaders · use-shader-fx |

- **Mix layers by semantics** — a dense shader *background*, an SVG/DOM *foreground* + *editing handles*, and an *export composite* can each use different tech. A dense raster background does **not** justify rasterizing low-count text or vector foreground.
- **Heavy per-pixel work** (shader-like, noise/texture, filter, halftone, mesh, image processing) → evaluate **WebGL/WebGPU before** settling on CPU Canvas 2D. Don't keep Canvas 2D "by default" and then make it look fast by downsampling or testing a tiny input.
- Don't force WebGL just because a sketch is visually rich, and don't keep Canvas 2D just because the primitive is text/vector — decide from the Perf HUD's worst frame at the heaviest real values.
- **Editing handles** (drag a gradient stop, a focus point) are textless DOM/SVG overlays bound to state and **excluded from any export** (see DESIGN.md → canvas is output only).
- Text/vector output stays native — never render text into an offscreen canvas and upscale it.

## Performance — keeping the canvas smooth

Two kinds of control, two concerns:
- **Workload controls** change render cost — output size, resolution scale, sample count, density, particle count, blur radius, shader complexity, iterations, quality, timeline playback, keyframe scrub. **Watch these on the Perf HUD.**
- **Ordinary controls** must never freeze input, break slider drag, or cause canvas zoom/offset jumps.

**Renderer patterns** (r3f / shader / Canvas 2D):
- Initialize contexts, programs, shaders, pipelines, textures, and big buffers **once** — not per render.
- On a control change, **update uniforms / stable buffers** — don't rebuild the scene, re-decode media, or re-lay-out glyphs.
- **Cache** decoded media and expensive derived inputs; don't re-decode every change.
- **Coalesce** high-frequency preview work to `requestAnimationFrame`; split lightweight live feedback from heavier refinement — but the canvas must still update *during* a slider drag, never only on release.
- **Cancel** stale async renders and scheduled frames (on cleanup). During pan/zoom/drag, suspend/coalesce non-essential animation, then resume without changing playback state or jumping the viewport.

**The rule that matters most — don't fake fast by lowering quality.** Never pass by silently
downsampling, dropping render scale, blurring, or testing a toy input. Fix the path first (uniforms,
caches, rAF-coalesce, cancel-stale, move work off the React render, reuse GPU resources) — or, if the
ceiling is genuinely real, expose the trade-off as a *visible* control. Test with **realistic heavy
inputs** (1080p+ media, long text, max density), not toy values. Run the perf pass when you first
have it working or when something feels janky (verification **Tier 3**).

## Conventions

- Path alias `@/` → `src/` (configured in both `tsconfig.app.json` and `vite.config.ts`)
- Pages: `src/pages/<PageName>.tsx`, registered in `src/routes.tsx`
- Add shadcn components with: `pnpm dlx shadcn@latest add <name>` — pnpm auto-installs peers, so the visx peer conflict that needed `--legacy-peer-deps` on npm resolves on its own
- Don't add a `tailwind.config.js` — Tailwind v4 uses CSS-first config in `src/index.css`

### After adding a new shadcn component

Every `pnpm dlx shadcn add` drops a file into `src/components/ui/` that needs restyling before use:

1. **Colors** — replace any old shadcn token classes (`bg-background`, `text-foreground`, `border-border`, `text-muted-foreground`, etc.) with our semantic tokens (`bg-surface`, `text-label`, `border-stroke-faint`, `text-label-secondary`). The full mapping is in the Color page at `/colors`.
2. **Squircle** — wrap the root element (see Squircles section below).
3. **Icons** — swap `lucide-react` imports to `@tabler/icons-react` equivalents.
4. **Motion** — replace any hardcoded `duration`, `ease`, or spring values with imports from `@/lib/motion` (`DURATION.*`, `EASE.*`, `SPRING.*`).
5. **Demo** — add a `<DemoSection>` block in `Demos.tsx` in the same commit.

### Borders and outlines

Three border widths are defined as `--border-width-*` tokens in `@theme`:

| Token | Value | When to use |
|-------|-------|-------------|
| `border` | 1px | Default — separators, card outlines, section dividers. This is the only width used across existing components. |
| `border-2` | 2px | Emphasis — active/selected states, stronger visual separation. |
| `border-4` | 4px | Decorative — accent stripes, heavy visual anchors. |

**Inside squircled elements**, use `inset-ring-1` instead of `border` — outset `border` and `ring-*` are clipped away by `clip-path`, but inset box-shadows survive. Card already does this.

**Important:** `inset-ring-*` alone is **not enough** on a squircled element. The inset ring is a `box-shadow` that traces the element's actual CSS `border-radius` — if you only rely on the squircle clip-path and don't add a `rounded-*` class, the underlying radius is 0 and the inset ring draws a sharp-cornered rectangle that gets carved by the clip, leaving visible rectangular artifacts at each corner. **Always pair `inset-ring-*` with a matching `rounded-*` class** (e.g. `rounded-md` for `SQUIRCLE_RADIUS.md`, `rounded-xl` for `SQUIRCLE_RADIUS.xl`). Card, Button, and Badge in this template all do this — model new outlined squircled surfaces on them.

**Color** always comes from the stroke tokens: `border-stroke-faint` (default) or `border-stroke-strong` (inputs, emphasis). Never use raw color values on borders.

### Demos page is the inventory

Every library installed in this template **must** be demonstrated in [src/pages/Demos.tsx](src/pages/Demos.tsx) with a `<DemoSection title="…" lib="…" version="…">` block, added in the **same change** as the `pnpm add`. If it can't be visibly demoed, it doesn't belong here. Visit `/demos` after `pnpm dev`.

### Squircles are global

Every shadcn component must render its root through `<Squircle as={…}>` or `useSquircle(ref, …)` from [@/components/squircle](src/components/squircle.tsx). When you run `pnpm dlx shadcn@latest add <name>`:

1. Edit the new file before committing — wrap the root element in `<Squircle as="<tag>" cornerRadius={SQUIRCLE_RADIUS.<token>}>` matching its Tailwind `rounded-<token>` class. (Or use `useSquircle` for `useRender`-based components like Badge.)
2. Keep the Tailwind `rounded-*` class as a visual fallback for tools / dev-tools.
3. Default `cornerSmoothing = 0.6` (Apple iOS feel) is baked into our `<Squircle>` wrapper — don't pass it unless you want a different look.
4. Add a new `<DemoSection>` to `Demos.tsx` if the component is genuinely new (not a primitive of an existing one).

`SQUIRCLE_RADIUS` mirrors the `--radius-*` Tailwind tokens: `{ sm: 6, md: 8, lg: 10, xl: 14, '2xl': 18, '3xl': 22, '4xl': 26 }`. For pill shapes (Badge), pass `cornerRadius: 999`.

#### Shadows with squircles (the parent-filter pattern)

`clip-path: path()` and `filter: drop-shadow()` **can't visibly coexist on the same element** in Chrome — the drop-shadow doesn't render outside the clipped silhouette. The fix is to split them across two elements:

- **Outer element:** carries `filter: drop-shadow(...)`. No clip-path.
- **Inner element:** carries `clip-path: path(...)`. No filter.

The outer filter then renders a drop-shadow from the inner element's clipped alpha mask, so the shadow follows the squircle outline exactly.

**Presets** — 7 tiers aligned with Tailwind v4's shadow scale (`2xs → xs → sm → md → lg → xl → 2xl`):

```tsx
<Card shadow="md" />          // preset
<Card shadow="xl" />          // larger
<Card shadow={true} />        // shorthand for "md"
```

**Custom directional shadows** via `buildShadow()`:

```tsx
import { buildShadow } from "@/components/squircle"

// Light from upper-left — shadow falls toward bottom-right:
<Card shadow={buildShadow({ elevation: 3, direction: 315 })} />

// Blue-tinted shadow:
<Card shadow={buildShadow({ elevation: 2, color: "rgba(59, 130, 246, 0.4)" })} />
```

`buildShadow({ elevation, direction, color, layers })` returns a stacked `drop-shadow()` CSS filter string with 3–5 layers of progressively larger offsets and decreasing opacities. `elevation` (0.5–5) controls depth; `direction` (degrees, default 0 = straight down) shifts X/Y offsets; `color` tints the shadow.

**Other ways to apply:**

- `<SquircleShadow shadow="md">…</SquircleShadow>` — standalone wrapper for cases where you can't pass `shadow` directly (third-party render-prop components, foreign children).
- **Sonner is the documented exception** to the global squircle convention. The parent-filter pattern can't give each toast its own shadow (filter on the `<ol>` merges all stacked toasts into a single union silhouette on hover/expand; per-toast filter is clipped by per-toast clip-path; sonner's portal won't accept an injected wrapper without breaking measurements/gestures). At toast radii (~8–10px) the visual delta between superellipse and rounded rect is imperceptible, so [sonner.tsx](src/components/ui/sonner.tsx) keeps sonner's native `border-radius` + `box-shadow` stack lift. Don't reintroduce the squircle observer on toasts.

**When adding a new shadcn component via `pnpm dlx shadcn@latest add`:** decide if it needs elevation. If yes, surface a `shadow` prop that forwards to `<Squircle shadow={...}>` (or wrap externally with `<SquircleShadow>`). The squircle stays in either case.

#### Other notes

- Outset Tailwind `ring-*` is implemented as `box-shadow: 0 0 0 1px` and will be clipped away by the squircle. Use `inset-ring-*` instead — inset shadows render inside the box and survive the clip. Card already does this.
- Focus rings (`focus-visible:ring-*`) are clipped the same way. Acceptable since the ring follows the squircle outline tightly; if a component needs an unclipped focus ring, wrap it in `<SquircleShadow>` (or any non-clipped outer) and let the ring sit on the wrapper.
- Avoid animating `border-radius` directly on a squircled element; it fights the clip-path.
- `backdrop-filter` (used by `<LinearBlur>`/`<RadialBlur>`) does not see through a parent that has `filter:` or `clip-path:` set — the parent isolates the backdrop. If a progressive blur is nested inside a squircled Card, the blur will see only the Card's contents, not what's underneath the page. Place the blur OUTSIDE squircled elements (or apply the squircle to a wrapper) when you want the full backdrop.

## Experimental web APIs

Newer browser APIs that likely postdate your training data. Read the
doc before generating code that uses them — don't guess the surface.

- **HTML in Canvas** ⚠️ — see [../../Project-Base/docs/html-in-canvas.md](../../Project-Base/docs/html-in-canvas.md). **Never put `drawElementImage` in a continuous `onpaint` → `requestAnimationFrame` → `requestPaint` loop on a page with significant layout activity** — Chromium's origin-trial implementation crashes the renderer (`STATUS_BREAKPOINT`) when the API is called every frame mid-reflow. Use hover-to-animate (`pointerenter` attaches `onpaint`, `pointerleave` detaches), one-shot draws on user events, or visible-and-idle gating instead. The `/demos` HtmlInCanvasDemo demonstrates the hover-to-animate pattern. See
  (and the live demo on `/demos`). Lets a `<canvas layoutsubtree>` render
  real, interactive HTML descendants via `ctx.drawElementImage(el, ...)`,
  with hooks for WebGL (`texElementImage2D`), WebGPU
  (`copyElementImageToTexture`), and OffscreenCanvas
  (`captureElementImage`). The DOM element stays focusable, accessible,
  and form-fillable — the canvas pixels are just the visual layer. Reach
  for this when the sketch needs *"a real working UI control treated as
  a graphic object"* (wavy form fields, shader-lit buttons, live HUD on
  a 3D mesh). Always feature-detect — Chromium flag only as of 2026-05.

## Commands

```
pnpm dev              # start vite dev server
pnpm build            # tsc -b && vite build
pnpm typecheck        # tsc -b --noEmit — TypeScript 7 native, the source of truth
pnpm lint             # oxlint
pnpm check:vendored   # verify the foundational-file inventory (Tier 4 gate)
pnpm preview          # serve the production build
```

**TypeScript 7 (the native Go compiler) is the one and only TypeScript.** It's `typescript@7`
(stable), so plain `tsc` — used by `typecheck` and `build` — is the native compiler and the source of
truth for whether the code type-checks. It's a pure type-checker here (Vite still does all
transpiling); the config is TS 7-clean (`bundler` resolution, `esnext`, `strict`, `noEmit`, project
refs). No TS 6 remains — the editor language service runs on TS 7 too.

**Linting is [oxlint](https://oxc.rs)** (VoidZero/Oxc — the same toolchain family as Vite's Rolldown +
Oxc transform), configured in [.oxlintrc.json](.oxlintrc.json). It has its own Rust TypeScript parser,
so it doesn't depend on the `typescript` package at all — which is *why* the project can run pure TS 7
(ESLint's `typescript-eslint` can't consume TS 7 yet; oxlint sidesteps that entirely and is ~50× faster).
Notes:
- Rule names use oxlint's plugin prefixes: `typescript/*`, `react/*` (e.g. `react/exhaustive-deps`,
  `react/rules-of-hooks`, `react/only-export-components`). The config mirrors the old ESLint intent —
  correctness rules at `error`, the animation-pattern false-positives demoted to `warn`.
- **`eslint-disable` comments still work.** oxlint honors `// eslint-disable-next-line <rule>`
  directives and maps the old plugin names (`@typescript-eslint/no-explicit-any` →
  `typescript/no-explicit-any`, `react-hooks/exhaustive-deps` → `react/exhaustive-deps`), so existing
  inline suppressions are kept as-is. New suppressions may use either the `eslint-disable-*` or
  `oxlint-disable-*` form.
- A few react-hooks@7-only rules (`set-state-in-effect`, `static-components`, `refs`) have no oxlint
  equivalent yet; they simply don't run. They were `warn`-only here anyway.
- **Type-aware linting is available but not on** — `oxlint --type-aware` (via `tsgolint`, which runs on
  typescript-go / TS 7) adds rules like `no-floating-promises`. Enable it deliberately if a sketch wants
  deeper semantic checks; the default `pnpm lint` stays syntax-only + fast.

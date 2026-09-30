# Modern Project Template

A suite of tools and primitives to make launching into high fidelity work easier.

## Quick start

```bash
pnpm install   # only needed the first time (a spawned sketch is already installed)
pnpm dev
```

Open the `Local:` URL it prints — usually `http://localhost:5173`. The grey dot on the right edge is the navigation — hover to expand. (Vite also prints a `Network:` URL; these sketches are phone-first, so that's the one to open on a device on the same Wi-Fi.)

## What's inside

This template ships a complete design system with interactive documentation pages. Every token, component, and pattern is visualized and adjustable.

### System pages

| Page | URL | What it covers |
|------|-----|----------------|
| **Color** | `/colors` | Surfaces, labels, strokes, fills, accents (12 hues × 13 steps), black/white opacity scales, neutral scale — plus the **Ramp Studio** (below) |
| **Fluid** | `/foundations` | The fluid system's root: viewport min/max, font-size min/max, type-scale ratios, and the detail ratio for the compressed small end. Type and space both derive from here |
| **Type** | `/typography` | Full type studio — live specimen preview, table/graph views, any Google font for body and heading, per-step weights, line-height, tracking. Save persists; Copy CSS emits a self-contained block |
| **Motion** | `/motion` | Spring presets, easing curves, duration tokens — each with an animated curve graph and replay |
| **Space** | `/spacing` | Fluid Utopia-style space scale with editable per-step multipliers, one-up and custom pairs, role tokens (inset/stack/inline/gutter), live layout |
| **Layout** | `/breakpoints` | Responsive breakpoints, live viewport indicator, reflow demo, container widths |
| **Grid** | `/grid` | Fluid, wrap-aware grid (auto-fit + fixed N-col) with gutters bound to the space scale; generated CSS |
| **Clamp** | `/clamp` | General fluid-value generator — any min→max between two viewports, with a live scrubber |
| **Inputs** | `/inputs` | Inputs & Controls — the shipping interface inputs (Select, Toggle, ToggleGroup, Tabs, Command, Slider) with live examples, alongside the dialkit tuning-control catalog. Leads with *which* to reach for |
| **Icons** | `/icons` | Searchable Tabler icon browser |
| **Demos** | `/demos` | Every installed library demonstrated — if it's not on this page, it doesn't belong in the template |

### The Ramp Studio (`/colors`)

Generates 13-step color families in **OKLCH**, in the same shape as the imported Apple system ramps — so a new family sits next to them as a peer rather than an approximation.

The Apple families turn out to be fully systematic: each one is reproducible from the lightness, chroma, and hue of its 500 step plus two profile curves shared by all of them. `src/lib/oklch.ts` carries those curves, so the studio can:

- build a family **from a hue**, with chroma as a percentage of what that hue can actually reach (so different hues come out equally vivid);
- build one **through a color you already have**, pinning it to any step and solving the profiles backwards so your color survives exactly;
- generate the tonal **neutral**, **tinted neutral**, and **vibrant** (gamut-hugging) variants.

Export routes:

- **Add to project colors** — writes the family straight into `src/index.css` (dev only; re-adding a name replaces rather than duplicates)
- **Copy CSS** — the `@theme inline` / `:root` / `.dark` blocks
- **SVG for Figma** — drag onto a canvas, arrives as named layers; no plugin
- **Design tokens (JSON)** — W3C DTCG, for Tokens Studio and variable importers

Figma is sRGB and these ramps aren't (they're authored for Display P3), so both Figma exports carry gamut-mapped hex with the exact OKLCH preserved as metadata. The derivation is in [`../docs/oklch-ramps.md`](../docs/oklch-ramps.md).

### Component pages

Navigate via the Components dropdown in the side nav. Each component page documents:
- **Preview** — the component in action
- **Anatomy** — visual breakdown of sub-elements with token annotations
- **Examples** — interactive demos of every variant
- **API** — full props table
- **Tokens** — which design system tokens it uses
- **Accessibility** — keyboard and screen reader support
- **Guidelines** — when to use / when not to
- **Source** — file path, install command, import statement

Currently documented: Button, Badge, Card, Slider, Accordion, Shaders, Liquid Glass. Add more by creating a page in `src/pages/components/` using the shared template at `src/pages/components/_template.tsx`, then registering it in `src/routes.tsx`.

## How to build something new

This template lives inside `Project-Base/_template/`. Don't edit it directly — spawn a new project from it.

From the `Project-Base/` directory:

```bash
./new-project.sh my-project-name      # macOS / Linux
.\new-project.ps1 my-project-name     # Windows
```

This copies `_template/` into a sibling folder (`../my-project-name/`), renames the package, runs `pnpm install`, and initializes git. The new project is fully independent — edit freely without affecting the template.

**Flags:**
- `--path <dir>` (`-Path` on Windows) — override the target parent directory
- `--no-git` (`-NoGit` on Windows) — skip git init

Once your project is spawned:

1. **Run `pnpm dev`**
2. **Start building in `src/pages/Home.tsx`** — this is your canvas. A spawned sketch launches clean: the nav dot is off by default (`SHOW_SKETCH_NAV` in `src/routes.tsx`), though the system pages always keep it.
3. **Use the design system** — don't invent new values:
   - Colors: `bg-surface`, `text-label`, `border-stroke-faint`, `bg-blue-500`, etc. See `/colors`
   - Typography: `text-display`, `text-heading`, `text-title`, `text-body`, `text-caption`, `text-eyebrow`. Tune on `/foundations` + `/typography` and Save.
   - Spacing: reach for the **role** utilities — `p-inset-m`, `gap-stack-s`, `space-x-inline-xs`, `gap-gutter-l` — not raw `p-4`/`gap-2`. For big structural whitespace use a fluid pair: `py-[var(--space-s-m)]`. See `/spacing`.
   - Motion: `import { SPRING, EASE, DURATION } from "@/lib/motion"`. See `/motion` for presets.
   - Shadows: `shadow="sm"` on `<Card>` or `<Squircle>`. See Demos for examples.
4. **Add pages** in `src/pages/` and register routes in `src/routes.tsx`
5. **Add shadcn components** with `pnpm dlx shadcn@latest add <name>`, then restyle (see CLAUDE.md for the checklist)
6. **Tune live with dialkit** — `useDialKit("Panel", { … })` floats a control panel over your sketch; bake settled values back into tokens

## Design system architecture

```
src/
├── index.css              ← All tokens: colors, spacing, type, shadows, z-index, borders, breakpoints
├── routes.tsx             ← Route table + the nav opt-in flag
├── lib/
│   ├── motion.ts          ← Spring, easing, duration presets
│   ├── fluid.ts           ← Fluid type + space engine (Utopia-style clamp generation)
│   ├── oklch.ts           ← 13-step OKLCH ramp engine, gamut, contrast (APCA + WCAG), exports
│   ├── colors.ts          ← Token override store (persist / apply / import / export)
│   ├── color-tokens.ts    ← Semantic token registry — the source of truth for /colors
│   ├── color-convert.ts   ← culori wrapper: parse to oklch, format in any picker mode
│   ├── pretext.ts         ← Zero-reflow text measurement hooks
│   ├── google-fonts.ts    ← On-demand Google Fonts loading for /typography
│   └── anthropic.ts       ← Claude API client, pointed at the dev proxy
├── components/
│   ├── PageLayout.tsx     ← Shared page structure: PageShell, PageHeader, Section, SectionCard
│   ├── squircle.tsx       ← Apple-style smooth corners + shadow system
│   ├── color/             ← ColorPicker, RampStudio
│   ├── dialkit/           ← Vendored, extended floating control panel
│   ├── shaders/           ← WebGL shader components + controls
│   └── ui/                ← shadcn + motion-primitives components
├── store/                 ← Zustand stores (useFluidStore — shared fluid config)
└── pages/
    ├── Home.tsx           ← Your canvas
    ├── Colors.tsx · Foundations.tsx · Typography.tsx · Motion.tsx
    ├── Spacing.tsx · Breakpoints.tsx · Grid.tsx · Clamp.tsx
    ├── Inputs.tsx · Icons.tsx · Demos.tsx
    ├── _fluid-controls.tsx ← Shared calculator controls for the fluid pages
    ├── components/         ← Component documentation pages
    └── demos/              ← Individual library demos, pulled into /demos

vite-plugins/
└── color-tokens.ts        ← Dev-only endpoint behind the Ramp Studio's "Add to project"
```

## Key conventions

- **Surfaces layer**: `surface` (page) → `surface-secondary` (cards) → `surface-tertiary` (nested elements). Never skip levels.
- **Borders inside squircles**: Use `inset-ring-1 inset-ring-stroke-faint`, not `border` — CSS borders get clipped by squircle's `clip-path`. Always pair it with a matching `rounded-*` class, or the ring traces a sharp-cornered rectangle.
- **Type and space are live**: `/foundations` owns the shared fluid values; `/typography` and `/spacing` refine them. Save writes to localStorage; Copy CSS bakes a block for `index.css`.
- **Color is OKLCH throughout**: every token is authored as `oklch()`. Hex appears only at export, gamut-mapped.
- **Dark mode**: Toggle via the nav menu. Theme-aware tokens (surfaces, labels, strokes, fills, accent colors) switch automatically. Use `dark:` prefix only for static-value tokens like the neutral scale.
- **One source of truth**: Every shared pattern lives in a component (`PageLayout.tsx`, `DemoSection.tsx`, `_template.tsx`). Change the component, every page updates.
- **Foundational files are library code**: the token, fluid, color, and measurement modules are protected — `pnpm check:vendored` prints the list. Don't rewrite them casually; see CLAUDE.md.

## Commands

```bash
pnpm dev              # Vite dev server (host: true — prints a Network URL for phones)
pnpm build            # TypeScript check + production build
pnpm typecheck        # tsc -b --noEmit — the source of truth for type errors
pnpm lint             # oxlint
pnpm check:vendored   # Verify the foundational-file inventory
pnpm preview          # Serve production build locally
pnpm test:anthropic   # One live call to check ANTHROPIC_API_KEY (see root README)
```

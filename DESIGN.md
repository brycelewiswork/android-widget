# Design intent

This is the **taste document** for project-base sketches. It captures the
*why* and the *feel* — the personality CLAUDE.md's choices are pointed at.
For the *what* (stack, tokens, conventions) read [CLAUDE.md](CLAUDE.md). For
the live, browsable token catalog, run `npm run dev` and visit `/colors`,
`/typography`, `/motion`, `/spacing`, and `/breakpoints`.

Treat this file as **inheritable taste**: every sketch spawned from the
template starts here. Override per-sketch only when the experiment demands it.

## What this design feels like

Apple-system. Optical-grade typography on DM Sans with subtle weight contrast.
Continuous-curve corners — squircles, never plain circles. Subtle springs over
bouncy ones; the motion is always purposeful, never decorative. Generous
whitespace; never crowded. No element earns its place by being pretty — only
by being *useful or clarifying*. Restraint reads as quality.

The default emotional register is **calm and confident**, not flashy. A sketch
should feel like something Apple, Linear, or Arc could ship — not like a
landing-page template.

## References

Anchor screens that define the target feel. Each is on this list for a
specific reason — when the inspiration drifts, the screen comes off the list.

- **iOS Control Center / Settings** — surface hierarchy, label tiers, group
  rhythm, the role of system blur.
- **macOS Sonoma+ Settings** — sidebar density, section dividers, mono
  for values.
- **Apple Music (macOS / iOS)** — image-to-color blends, glass over media,
  the way color extracted from artwork tints chrome without overwhelming it.
- **Linear** — keyboard-first ergonomics, prose density, restraint with
  motion, the way state changes feel *settled* rather than animated.
- **Arc / The Browser Company** — playful but disciplined; permission to
  break form sparingly when the moment earns it.
- **Stripe Docs** — code blocks, mono usage, prose typography, the way
  technical content can still feel editorial.
- **Vercel dashboard** — dark surfaces, dense data, restraint with shadows.
- **Raycast** — command palettes, dense lists, mono for keyboard hints.

## Composition principles

Rules that live above the token layer.

- **Vertical rhythm beats horizontal density.** Stack first. Only break into
  columns when content genuinely benefits — never to fill width.
- **Page width caps at `max-w-4xl`** for prose-heavy pages; visualizations
  can extend wider but always with intentional bleed, not because they grew
  there by accident.
- **Cards earn their use.** A `<Section bare>` is the default; a `<SectionCard>`
  is for content that benefits from grouping or elevation. Don't wrap every
  block in a card.
- **One source of attention per screen.** If two things compete for the eye,
  one is wrong. Demote with `text-label-secondary`, smaller weight, or remove.
- **Motion belongs at state boundaries.** Reveals, transitions, confirmations.
  Not on page entry, not on idle, not as decoration.
- **The header is the page.** A confident `PageHeader` (title + one-line
  description) does more than a hero image ever will.
- **Mono is structural.** Numbers, code, tokens, values, dimensions — they
  get the mono face. Mono on prose is a smell.

## Typography rationale

- **DM Sans Variable (100–900)** is the body face because it reads like a
  system UI font without being one — neutral, sturdy, optical-sized. It does
  not impose a personality, which is exactly what a sketch baseline needs.
- **DM Mono** is the mono face for visual continuity (same designer, same
  proportions) — mono blocks don't fight the body.
- **Display vs. body weights:** `font-medium` (500) is the *default* for
  labels and headings; `font-semibold` (600) for hierarchy emphasis;
  `font-bold` (700+) is rare and reserved for display moments.
- **Mono is mandatory for:** numbers in tables, code snippets, CSS values
  (`var(--surface)`), tokens, dimensions (`24px`, `1.5rem`), keyboard hints.
- **The scale is fluid.** Type and space use Utopia-style `clamp()` — sizes
  interpolate between a small-screen and large-screen setting rather than
  snapping at breakpoints, so hierarchy and rhythm stay proportional at any
  width. Reach for the semantic role tokens (`text-body`/`text-heading`,
  `p-inset-*`, `gap-stack-*`) over raw numeric spacing; they alias a single
  tunable primitive scale, so retuning one place reflows the whole sketch.
- The live scale lives at `/typography` (type) and `/spacing` (space), with
  `/grid` and `/clamp` for layout. Tune per-sketch there; bake with Copy CSS.
  Don't restate the numbers here.

## Color rationale

- **Semantic over named.** Components use `bg-surface`, `text-label`,
  `border-stroke-faint` — never `bg-gray-100`. The point is that the same
  component reads correctly in light *and* dark mode without conditional
  logic. Named colors (`red-500`, `blue-500`) are for accents and visualization
  only.
- **Three tiers of label** map intent, not just opacity: `label` = primary
  text (must be readable on first glance), `label-secondary` = supporting
  detail (skimmable), `label-tertiary` = decorative / inert (timestamps,
  metadata). If you reach for a fourth tier, the layout is wrong.
- **Three surfaces** give layered depth without shadows: `surface` (page),
  `surface-secondary` (cards), `surface-tertiary` (nested rows). Don't invent
  a fourth surface — find the existing tier that fits.
- **OKLCH for storage** because perceptual lightness lets `400` actually
  *feel* like `400` across hues, and lets the color editor produce
  predictable ramps.
- The live catalog lives at `/colors`. Edits made there persist locally and
  export as JSON / CSS.

## Motion rationale

Two spring families exist for a reason.

- **`SPRING_FAST`** is the professional default. Near-critically damped,
  minimal overshoot. Use it for state changes in real UI: panels opening,
  toggles flipping, popovers settling. The motion is *felt* but not *seen*.
- **`SPRING`** is the playful family. More overshoot, more character.
  Reserved for sketches whose subject *is* motion — when the bounce is
  the point.
- **When motion is wrong:** on initial page load (just paint), on idle
  decoration (no infinite loops without a reason), on every hover (subtle
  color shifts are enough).
- **Duration tokens** in `DURATION.*` are seconds, not arbitrary numbers.
  Reach for `instant` (0.1s) when in doubt; `slow` (0.5s) needs justification.
- The live curves and presets live at `/motion`.

## Designing control panels

These sketches are control-heavy — a dialkit panel (or a hand-built one) sitting
next to a canvas, a shader, a live preview. A panel is a design surface with its
own taste, and it's where AI-built tools usually feel generic. Rules below are
framed around [dialkit](CLAUDE.md) (`useDialKit`) but apply to any control UI.

**Structure by what's edited, not by control type.**

- **Group by product entity, not by widget.** A group is `Background`, `Glow`,
  `Motion`, `Tone` — the *thing* being tuned — never `Sliders`, `Colors`,
  `Settings`, `Options`. If you can't name the group after a thing, the grouping
  is wrong. 2–7 controls per group; when it grows past that or mixes meanings,
  split into more specific groups (`Flow Motion` / `Flow Geometry`).
- **Grouping is free and expected — nest, don't flatten.** A nested object becomes
  a titled, collapsible section; multi-line controls (gradient, curves, vector, …)
  are each their own collapsible unit. A flat wall of controls is a smell — if two
  controls tune the same thing, they share a section.
- **Reset is automatic and deviation-aware — never hand-build it.** Each section, each
  multi-line control, and the panel toolbar surface a ↺ **only while something has
  drifted from its config default**; clicking it restores just that scope. Sliders
  reset on double-click (no icon). It's derived from the defaults you already pass —
  don't add reset buttons for it. Reserve an `action` button for *semantic* resets
  (re-randomize a seed, clear a layer), which are a different thing.
- **Pick the control by the value's *shape*, not its look.** One entity that owns
  a color *and* its opacity is one control, not a color picker plus a stray
  opacity slider. A gradient is one gradient control, not two stops. Typography is
  one compound font control (weight/size/spacing/case/color), not five scattered
  inputs. Bounds are a range control. If the value is a compound, the control is
  compound — splitting it across neighbors is the most common tool-UI smell.

**Labels.**

- **1–3 words, no explanations.** No units, formulas, or parentheticals in the
  label — those live in the value display or a tooltip, never the label.
- **Name the setting, not the action.** A toggle is `Glow`, `Loop`, `CRT` — never
  `Enable Glow`. Don't echo the group title in the label (`Motion` → `Speed`, not
  `Motion` → `Motion speed`).
- **Must read correctly *with* the group context.** `Animation` / `Speed` is fine;
  a bare `Settings` / `Speed` is not — fix the group name or the label.
- **Help text only when it adds meaning.** A tooltip that recaps the label
  ("adjusts opacity") is noise — see the tooltip anti-pattern below.

**Show only what's usable — hide, don't disable.** When a mode is off, its
dependent controls *disappear*; they don't grey out. A panel should never show a
row you can't currently use. Greyed-out controls are visual debt that reads as
"broken," not "unavailable."

**Sliders carry the most weight, so they have the most rules.**

- **Live during drag is non-negotiable.** Dragging updates the output *while*
  dragging, not on release. A slider that only commits on mouse-up is a broken
  mapping — fix the render path (update uniforms, cache derived inputs, coalesce
  to rAF) rather than deferring. This is exactly what the **Perf HUD** exists to
  catch: drag it, watch `worst`.
- **Snapping ≠ discrete.** A `step` is numeric snapping. Only *show* tick markers
  for small semantic integer domains (counts, levels, bands, sides) — never for
  large continuous ranges (speed, fps, size, intensity), where markers are noise.
- **Units are for real measurements only** — `%`, `px`, `°`, `s`, `ms`, `fps`.
  Never `x` for a multiplier; scale/intensity/strength/opacity show a plain number.
  Never repeat the entity the group already names (`Letters` + `letters`).
- Value readouts get the **mono** face (they're numbers — see Mono is structural).

**Density and layout.**

- **Sliders stack full-width.** Never squeeze a slider into a half-width column.
- **Colors: two per row, max.** If any color in the group carries opacity, stack
  them instead. An odd trailing color keeps its half-width footprint — don't
  stretch it to fill the row.
- **Segmented control only for a few short mode choices** (≤4 options, each a word
  or two). More options, or longer labels, → a select. A clipped segmented cell
  is worse than a dropdown.
- A toggle may share one equal-width row with a single related parameter (the
  toggle keeps its label; the parameter goes label-less).

**Color, specifically.** Decide labels from the *role*, applied to the whole
group. A bank of colors that just adds variety to one shared palette
(`Accent Shades`) goes **unlabeled**; colors that edit distinct roles
(`Fill`, `Stroke`, `Background`) stay **labeled**. Never mix labeled and
unlabeled inside one bank, and never title a group just `Color`.

**Specialized controls, by meaning — the sharp ones.**

- **A 2-axis pad is for user-*authored* parameters only** — light direction,
  focus, anchor, offset. Never wire a pad to animation, physics, pointer, or
  timeline state just because the value happens to have `x`/`y`. Authored ≠
  observed.
- **Curve interpolation is monotone cubic (PCHIP)** — smooth through the points but
  never overshooting between them, the way Photoshop/Lightroom curves behave. Good
  default for tone / response / mask / threshold curves alike. If you ever genuinely
  need overshoot (a creative spline that bulges past a point), that's a bespoke
  renderer, not the `curves` control.
- **Short text vs long text are different controls:** a single-line input for
  labels/names/tokens (commit while typing for content, on blur for settings);
  a multiline editor for anything that can get long or structured (prompts, CSS,
  shader source).

**The canvas is for output, not chrome.** No buttons, CTAs, helper copy, or
"drop a file here" prompts painted onto the canvas — those belong in the panel.
Direct-manipulation handles (drag a gradient stop, a focus point) are the one
exception: keep them textless, tokenized, bound to state, and out of any export.

### The control catalog — reach for which

Our dialkit is forked into the template ([src/components/dialkit](CLAUDE.md)) and
extended with richer control types. Pick by the *value's shape*; the config is what
you pass to `useDialKit("Panel", { … })`.

| Control | `useDialKit` config | Reach for it when | Not for |
|---|---|---|---|
| **Slider** | `[def, min, max, step?]` or a bare number | one scalar the user sweeps | a value *pair* (use two, or a future range control) |
| **Toggle** | `true` / `false` | a boolean mode; name it for the setting (`Glow`, not `Enable Glow`) | one-of-many (use a select) |
| **Select** | `{ type: "select", options }` | a finite named choice — renders as a labeled *row* (SelectControl); the same menu also opens from the boxed *field* form (SelectField) used for sub-selects inside compound controls | a live color/number — those have their own controls |
| **Color** | `{ type: "color" }` or a hex string | one solid color | a gradient (use gradient); color + opacity as one entity (coming: `colorOpacity`) |
| **Text** | `{ type: "text" }` or a string | a short label / name / token | long or multiline content |
| **Spring / Easing** | `{ type: "spring" }` / `{ type: "easing" }` | tuning motion feel; bake settled values into `motion.ts` | — |
| **Vector** | `{ type: "vector", default: { x, y } }` | an **authored** 2-axis param — light direction, focus, anchor, offset (value is normalized [-1,1]) | animation / physics / pointer state that merely happens to have x/y |
| **Gradient** | `{ type: "gradient", default: { gradientType, angle, stops } }` | any adjustable gradient; consume it with `gradientToCss(value)` | faking a gradient out of two separate color controls |
| **Range input** | `{ type: "rangeInput", default: { start, end } }` | a precisely-typed lower/upper bound or from/to pair | a value you *sweep* (use a slider, or a future range slider) |
| **Color collection** | `{ type: "colorCollection", default: ["#…"] }` | an editable bank of colors the user grows/shrinks (palette, accents, beads) | a fixed set of distinct roles (Fill/Stroke — use separate colors) |
| **Palette** | `{ type: "palette", default: { family, shade } }` | a constrained design-token color (family + shade); resolve with `paletteHex(value)` | free hex entry (use color) |
| **Font picker** | `{ type: "fontPicker", default: { fontId, fontWeight, … } }` | a whole text style (family/weight/size/case/color); resolve with `fontStyle(value)` | splitting typography across neighbouring controls |
| **Curves** | `{ type: "curves", default: { variant, rgb, r, g, b } }` | tone / response / color-grade remapping (`variant: 'rgb'` adds R/G/B tabs); sample with `sampleCurve(pts, x)` | something a single slider expresses more simply |
| **Image picker** | `{ type: "imagePicker", default: [] }` | uploading a set of source images (thumbnail grid) | putting the uploader on the canvas — it lives in the panel |
| **Folder** | a nested object `{ … }` (`_collapsed: true` to start closed) | grouping controls by product entity — a collapsible section with its own deviation-aware ↺ | — |
| **Button** | `{ type: "action" }` (handle via `onAction`) | a *semantic* section command (re-randomize a seed, clear a layer) | restore-to-default — that's the automatic per-control / section / panel ↺, not something you wire |

**When the control you need doesn't exist yet** — a two-thumb range slider, a
segmented control in config, a layers tree — that absence is the signal to build the
next one, not to fake it with primitives. The pattern is fixed and repeatable: add the
store seam (type guard → `parseConfig`/`flattenValues`/`ResolvedValues`/normalize), a
`case` in `dialkit/components/Panel.tsx`'s render switch, and a component that draws
from `controlStyles.ts` + the `--dial-*` tokens. All the controls above are worked
examples to copy; `scaffold`-style store seams keep them uniform.

## Anti-patterns

Explicit list of looks to avoid, with the half-line reason.

- **Material Design shadows** — too heavy, too uniform, wrong elevation
  language. Use the squircle drop-shadow presets (`shadow="sm"…"2xl"`)
  or `buildShadow({...})`.
- **Bootstrap-y 1px gray borders without intent** — if a separator can be
  removed and the layout still reads, remove it. Borders are noise unless
  they're carrying weight.
- **Gradient-on-everything** — gradients should appear once per screen at
  most, as a visual anchor (album-art blend, hero accent). Never on buttons,
  cards, or backgrounds by default.
- **Decorative emoji** — emoji are content, not decoration. If they're
  not meaningful, they're noise.
- **Generic centered hero sections** — the "huge title centered over a
  faded gradient" pattern is the universal AI-design smell. Avoid.
- **Neumorphism / heavy drop-shadow stacks** — the squircle elevation system
  already does soft, layered shadows correctly; piling more on top reads as
  amateur.
- **Skeuomorphic textures** (felt, paper, leather) — wrong era, wrong
  medium.
- **Animating into existence on scroll** for content that should just *be*
  there — InView is for reveals that earn the attention, not for "make the
  page feel alive."
- **Tooltips as primary affordances** — if a thing needs a tooltip to be
  usable, label it.

## When in doubt

Strip a layer. If it still reads, leave it stripped. The default is restraint.

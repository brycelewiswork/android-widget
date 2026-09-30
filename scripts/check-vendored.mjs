#!/usr/bin/env node
/**
 * check-vendored — a lightweight guard for the template's foundational files.
 *
 * The template ships a "design-system runtime": tokens, the squircle system, the
 * color/type systems, the perf HUD, the Pretext measurement layer, the Claude
 * proxy, the reference system pages, and this script itself. A sketch is built
 * *on top of* that runtime; it should almost never rewrite it. Casually
 * regenerating one of these files (e.g. an agent "cleaning up" motion.ts) silently
 * drifts every future sketch away from the shared system.
 *
 * This check is intentionally small. The real guard is the convention in
 * CLAUDE.md ("Foundational files — modify only on explicit request") that steers
 * the agent before it edits. This script does two cheap, real things:
 *   1. Prints the protected inventory, so the boundary is discoverable.
 *   2. Fails if any protected path has gone missing (a rename/delete/typo guard).
 *
 * It deliberately does NOT hash contents or diff against git — these files are
 * allowed to change on purpose (a real token tweak, a new system page). Blocking
 * every edit would fight the workflow. Discoverability + a deletion tripwire is
 * the 80/20.
 *
 * Run: `pnpm check:vendored`
 */
import { existsSync, readdirSync, statSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")

// Protected surface. Entries ending in "/**" require a non-empty directory;
// everything else is an exact file. Keep this list in sync with the
// "Foundational files" section of CLAUDE.md.
const VENDORED = [
  // Design-system core
  "src/components/squircle.tsx",
  "src/lib/motion.ts",
  "src/lib/utils.ts",
  "src/index.css", // @theme tokens live here
  // Color + type/space systems
  "src/lib/colors.ts",
  "src/lib/color-tokens.ts",
  "src/lib/color-convert.ts",
  "src/lib/fluid.ts", // fluid type + space engine (Utopia clamp scale)
  "src/store/useFluidStore.ts", // shared source of truth for the fluid config
  // Measurement + text
  "src/lib/pretext.ts",
  "src/components/ui/tight-text.tsx",
  "src/components/ui/accordion.tsx",
  // Infra components
  "src/components/ui/progressive-blur.tsx",
  "src/components/ui/color-thief.tsx",
  "src/components/ui/perf-hud.tsx",
  "src/components/shaders/**",
  // Vendored dialkit (forked from joshpuckett/dialkit, MIT — owned + extended)
  "src/components/dialkit/**",
  // Claude proxy
  "src/lib/anthropic.ts",
  // Reference system pages
  "src/pages/Colors.tsx",
  "src/pages/Typography.tsx",
  "src/pages/Motion.tsx",
  "src/pages/Spacing.tsx",
  "src/pages/Breakpoints.tsx",
  "src/pages/Foundations.tsx",
  "src/pages/Grid.tsx",
  "src/pages/Clamp.tsx",
  "src/pages/_fluid-controls.tsx",
  // Build + scaffolding
  "vite.config.ts",
  "scripts/**",
]

const missing = []
for (const entry of VENDORED) {
  const isDir = entry.endsWith("/**")
  const rel = isDir ? entry.slice(0, -3) : entry
  const abs = resolve(root, rel)
  if (!existsSync(abs)) {
    missing.push(entry)
    continue
  }
  if (isDir) {
    const s = statSync(abs)
    if (!s.isDirectory() || readdirSync(abs).length === 0) missing.push(entry)
  }
}

const ok = missing.length === 0
const mark = ok ? "✅" : "❌"
console.log(`${mark} vendored inventory: ${VENDORED.length} protected paths`)

if (!ok) {
  console.error("\nMissing / empty protected paths:")
  for (const m of missing) console.error(`  - ${m}`)
  console.error(
    "\nA foundational file was renamed, moved, or deleted. If that was intentional,\n" +
      "update the VENDORED list in scripts/check-vendored.mjs and the CLAUDE.md\n" +
      "\"Foundational files\" section to match. Otherwise, restore it.",
  )
  process.exit(1)
}

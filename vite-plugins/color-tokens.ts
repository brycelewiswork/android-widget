import { readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import type { Plugin } from "vite"

/**
 * Dev-only endpoint backing the Ramp Studio's "Add to project" button.
 *
 * Splices a generated color family into `src/index.css` — the `@theme inline`
 * declarations that mint the Tailwind utilities, and the literal values in
 * `:root`. Re-adding a name that already exists replaces that family rather
 * than duplicating it, so the button is safe to press repeatedly while tuning.
 *
 * `index.css` is a foundational file, so this only ever adds or replaces
 * `--color-<name>-*` lines. Every incoming line is validated against a strict
 * shape first; anything else is rejected outright rather than written.
 */

const TARGET = "src/index.css"
const NAME_RE = /^[a-z][a-z0-9-]{0,31}$/

/** `--color-foo-500: oklch(0.5 0.1 200);` or `: var(--color-foo-500);` */
const LINE_RE =
  /^\s*--color-[a-z0-9-]+:\s*(?:oklch\([\d.\s%/]+\)|var\(--color-[a-z0-9-]+\));\s*$/

type Payload = { name?: unknown; theme?: unknown; root?: unknown }

/**
 * Body span of a block, found by brace matching.
 *
 * The header is matched anchored to the start of a line: `index.css` mentions
 * both `:root` and `@theme inline` inside comments *above* the real blocks, and
 * a plain substring search lands on the comment.
 */
function findBlock(css: string, header: RegExp): { open: number; close: number } | null {
  const m = header.exec(css)
  if (!m) return null
  const open = css.indexOf("{", m.index)
  if (open === -1) return null

  let depth = 0
  for (let i = open; i < css.length; i++) {
    if (css[i] === "{") depth++
    else if (css[i] === "}") {
      depth--
      if (depth === 0) return { open, close: i }
    }
  }
  return null
}

const THEME_BLOCK = /^@theme\s+inline\s*\{/m
const ROOT_BLOCK = /^:root\s*\{/m

/** Drop every existing declaration for this family, so re-adding replaces. */
function stripFamily(css: string, name: string): { css: string; removed: number } {
  const re = new RegExp(`^[ \\t]*--color-${name}(?:-dark)?-\\d+:[^\\n]*\\n`, "gm")
  const removed = css.match(re)?.length ?? 0
  return { css: css.replace(re, ""), removed }
}

function insertInto(css: string, header: RegExp, label: string, lines: string): string {
  const block = findBlock(css, header)
  if (!block) throw new Error(`Couldn't find the ${label} block in ${TARGET}`)

  const before = css.slice(0, block.close)
  const after = css.slice(block.close)
  // Preserve the exact whitespace run that preceded the closing brace, so the
  // brace keeps its own indentation and the file's formatting is untouched.
  const gap = /\s*$/.exec(before)?.[0] ?? "\n"
  const body = before.slice(0, before.length - gap.length)
  return `${body}\n${lines}${gap}${after}`
}

function readBody(req: import("node:http").IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let raw = ""
    let done = false
    const fail = (e: Error) => {
      if (done) return
      done = true
      reject(e)
    }
    req.on("data", (c) => {
      if (done) return
      raw += c
      if (raw.length > 100_000) {
        fail(new Error("Payload too large"))
        req.destroy()
      }
    })
    req.on("end", () => {
      if (done) return
      done = true
      resolve(raw)
    })
    req.on("error", fail)
  })
}

export function colorTokensPlugin(): Plugin {
  return {
    name: "ramp-studio-color-tokens",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/api/color-tokens", async (req, res) => {
        const send = (code: number, body: Record<string, unknown>) => {
          res.statusCode = code
          res.setHeader("Content-Type", "application/json")
          res.end(JSON.stringify(body))
        }

        if (req.method !== "POST") return send(405, { error: "POST only" })

        try {
          const { name, theme, root } = JSON.parse(await readBody(req)) as Payload

          if (typeof name !== "string" || !NAME_RE.test(name)) {
            return send(400, { error: "Name must be lowercase letters, digits and dashes." })
          }
          if (typeof theme !== "string" || typeof root !== "string") {
            return send(400, { error: "Expected `theme` and `root` CSS blocks." })
          }

          const all = [...theme.split("\n"), ...root.split("\n")].filter((l) => l.trim())
          const bad = all.find((l) => !LINE_RE.test(l))
          if (bad) return send(400, { error: `Refusing to write an unexpected line: ${bad.trim()}` })

          const wrongName = all.find((l) => !l.includes(`--color-${name}-`))
          if (wrongName) return send(400, { error: `Line does not belong to "${name}": ${wrongName.trim()}` })

          const file = path.resolve(server.config.root, TARGET)
          const original = await readFile(file, "utf8")

          const { css: cleaned, removed } = stripFamily(original, name)
          let next = insertInto(cleaned, THEME_BLOCK, "@theme inline", theme)
          next = insertInto(next, ROOT_BLOCK, ":root", root)

          await writeFile(file, next, "utf8")

          return send(200, {
            ok: true,
            name,
            added: all.length,
            replaced: removed > 0,
            file: TARGET,
          })
        } catch (err) {
          return send(500, { error: err instanceof Error ? err.message : String(err) })
        }
      })
    },
  }
}

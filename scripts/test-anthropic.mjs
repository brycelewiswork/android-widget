// Verify the Anthropic API key works:  pnpm test:anthropic
//
// Reads the key from .env.local directly (preferring it over any ambient
// ANTHROPIC_API_KEY in the shell), makes one tiny real API call, and reports.
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import path from "node:path"
import Anthropic from "@anthropic-ai/sdk"

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

let apiKey = process.env.ANTHROPIC_API_KEY || ""
try {
  const text = readFileSync(path.join(projectRoot, ".env.local"), "utf8")
  const m = text.match(/^\s*ANTHROPIC_API_KEY\s*=\s*(.+?)\s*$/m)
  if (m) apiKey = m[1].replace(/^["']|["']$/g, "") // .env.local wins; strip optional quotes
} catch {
  // No .env.local — fall back to the env var (may be empty, handled below).
}

if (!apiKey) {
  console.error("❌ No ANTHROPIC_API_KEY found. Add it to .env.local (see .env.example).")
  process.exit(1)
}

const client = new Anthropic({ apiKey })

try {
  const res = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 64,
    messages: [{ role: "user", content: "Reply with exactly one word: pong" }],
  })
  const out = res.content.find((b) => b.type === "text")?.text?.trim() ?? ""
  console.log("✅ Anthropic API key works.")
  console.log(`   model:  ${res.model}`)
  console.log(`   reply:  ${out}`)
  console.log(`   tokens: ${res.usage.input_tokens} in / ${res.usage.output_tokens} out`)
} catch (err) {
  console.error("❌ Anthropic API call failed.")
  if (err instanceof Anthropic.AuthenticationError) {
    console.error("   Authentication error — the key is invalid, revoked, or mistyped.")
  } else {
    console.error(`   ${err?.message ?? err}`)
  }
  process.exit(1)
}

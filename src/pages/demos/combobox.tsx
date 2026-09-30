import { useState } from "react"
import { IconSelector, IconCheck } from "@tabler/icons-react"
import { DemoSection } from "@/components/DemoSection"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandInput, CommandList, CommandItem, CommandEmpty } from "@/components/ui/command"
import type { DemoEntry } from "./types"

const FRAMEWORKS = [
  "Next.js", "SvelteKit", "Nuxt", "Remix", "Astro", "Vite", "Gatsby",
  "SolidStart", "Qwik City", "Angular", "Ember", "Redwood",
]

function ComboboxDemo() {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState("")
  return (
    <DemoSection
      title="Combobox"
      lib="cmdk + Popover + Command"
      docsUrl="https://ui.shadcn.com/docs/components/combobox"
    >
      <p className="text-body text-label-secondary">
        A searchable select — Base UI <code>Popover</code> over a shadcn/cmdk{" "}
        <code>Command</code>, restyled onto our tokens. The <code>/typography</code> body &amp;
        heading font pickers are built on this pattern (with ~2,000 Google families).
      </p>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger className="flex w-64 items-center justify-between gap-2 rounded-md bg-surface px-inset-s py-inset-2xs text-body text-label inset-ring-1 inset-ring-stroke-faint transition-[box-shadow] hover:inset-ring-stroke-strong focus:outline-none focus-visible:inset-ring-stroke-strong">
          <span className={value ? "text-label" : "text-label-tertiary"}>
            {value || "Select a framework…"}
          </span>
          <IconSelector className="size-4 shrink-0 text-label-secondary" />
        </PopoverTrigger>
        <PopoverContent align="start" className="w-64 p-0">
          <Command>
            <CommandInput placeholder="Search frameworks…" />
            <CommandList>
              <CommandEmpty>No framework found.</CommandEmpty>
              {FRAMEWORKS.map((f) => (
                <CommandItem
                  key={f}
                  value={f}
                  data-checked={f === value || undefined}
                  onSelect={() => {
                    setValue(f === value ? "" : f)
                    setOpen(false)
                  }}
                >
                  {f}
                  {f === value && <IconCheck className="ml-auto size-4" />}
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </DemoSection>
  )
}

const entry: DemoEntry = {
  lib: "Combobox",
  role: "searchable select",
  docsUrl: "https://ui.shadcn.com/docs/components/combobox",
  Component: ComboboxDemo,
}
export default entry

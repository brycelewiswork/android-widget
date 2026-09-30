import { Slider } from "@/components/ui/slider"

export type SliderControl = {
  type: "slider"
  key: string
  label: string
  min: number
  max: number
  step?: number
}

export type ColorControl = {
  type: "color"
  key: string
  label: string
}

export type SelectControl = {
  type: "select"
  key: string
  label: string
  options: { label: string; value: number | string }[]
}

export type SwitchControl = {
  type: "switch"
  key: string
  label: string
}

export type Control = SliderControl | ColorControl | SelectControl | SwitchControl

type ShaderControlsProps<T extends Record<string, unknown>> = {
  schema: Control[]
  values: T
  onChange: (next: T) => void
}

export function ShaderControls<T extends Record<string, unknown>>({
  schema,
  values,
  onChange,
}: ShaderControlsProps<T>) {
  const set = (key: string, v: unknown) => onChange({ ...values, [key]: v } as T)

  return (
    <div className="flex flex-col gap-3">
      {schema.map((c) => {
        if (c.type === "slider") {
          const v = (values[c.key] as number) ?? c.min
          return (
            <div key={c.key} className="grid grid-cols-[6.5rem_1fr_3rem] items-center gap-3">
              <span className="text-[11px] font-mono text-label-secondary">{c.label}</span>
              <Slider
                min={c.min}
                max={c.max}
                step={c.step ?? (c.max - c.min) / 100}
                value={[v]}
                onValueChange={(value) => {
                  const next = Array.isArray(value) ? value[0] : (value as number)
                  set(c.key, next)
                }}
              />
              <span className="text-[11px] font-mono tabular-nums text-label-secondary text-right">
                {typeof v === "number" ? Number(v).toFixed(2) : ""}
              </span>
            </div>
          )
        }
        if (c.type === "color") {
          const v = (values[c.key] as string) ?? "#ffffff"
          return (
            <div key={c.key} className="grid grid-cols-[6.5rem_1fr_3rem] items-center gap-3">
              <span className="text-[11px] font-mono text-label-secondary">{c.label}</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={normalizeForInput(v)}
                  onChange={(e) => set(c.key, e.target.value)}
                  className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent p-0"
                  style={{ appearance: "none" }}
                />
                <span className="text-[11px] font-mono tabular-nums text-label-secondary">
                  {v}
                </span>
              </div>
              <span />
            </div>
          )
        }
        if (c.type === "select") {
          const v = values[c.key] as number | string
          return (
            <div key={c.key} className="grid grid-cols-[6.5rem_1fr] items-center gap-3">
              <span className="text-[11px] font-mono text-label-secondary">{c.label}</span>
              <select
                value={String(v)}
                onChange={(e) => {
                  const opt = c.options.find((o) => String(o.value) === e.target.value)
                  set(c.key, opt?.value ?? e.target.value)
                }}
                className="h-7 rounded-md bg-surface inset-ring-1 inset-ring-stroke-faint px-2 text-[11px] font-mono text-label"
              >
                {c.options.map((o) => (
                  <option key={String(o.value)} value={String(o.value)}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          )
        }
        // switch
        const v = Boolean(values[c.key])
        return (
          <label key={c.key} className="grid grid-cols-[6.5rem_1fr] items-center gap-3 cursor-pointer">
            <span className="text-[11px] font-mono text-label-secondary">{c.label}</span>
            <input
              type="checkbox"
              checked={v}
              onChange={(e) => set(c.key, e.target.checked)}
              className="h-4 w-4 cursor-pointer accent-blue-500"
            />
          </label>
        )
      })}
    </div>
  )
}

function normalizeForInput(v: string): string {
  // <input type="color"> only accepts #rrggbb; pass through if matches, else default.
  return /^#[0-9a-fA-F]{6}$/.test(v) ? v : "#888888"
}

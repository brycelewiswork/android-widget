import { useEffect, useRef, useState, type ReactNode } from "react"
import { Squircle, SQUIRCLE_RADIUS } from "@/components/squircle"
import { ShaderControls, type Control } from "./ShaderControls"
import { cn } from "@/lib/utils"

type ShaderTileProps<T extends Record<string, unknown>> = {
  title: string
  caption?: string
  schema?: Control[]
  values?: T
  onChange?: (next: T) => void
  height?: number
  className?: string
  /** Pass-through to renderProps so the tile can pause off-screen. */
  render: (state: { paused: boolean }) => ReactNode
}

export function ShaderTile<T extends Record<string, unknown>>({
  title,
  caption,
  schema,
  values,
  onChange,
  height = 220,
  className,
  render,
}: ShaderTileProps<T>) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === "undefined") return
    const io = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: "200px" },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={ref} className={cn("flex flex-col gap-3", className)}>
      <Squircle
        as="div"
        cornerRadius={SQUIRCLE_RADIUS.xl}
        className="relative overflow-hidden rounded-xl bg-black inset-ring-1 inset-ring-stroke-faint"
        style={{ height }}
      >
        {visible ? render({ paused: false }) : null}
      </Squircle>

      <div className="flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-medium text-label">{title}</div>
          {caption ? (
            <div className="text-[11px] text-label-secondary truncate">{caption}</div>
          ) : null}
        </div>
      </div>

      {schema && values && onChange ? (
        <ShaderControls schema={schema} values={values} onChange={onChange} />
      ) : null}
    </div>
  )
}

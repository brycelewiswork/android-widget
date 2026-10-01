import { Slider as SliderPrimitive } from "@base-ui/react/slider"

import { cn } from "@/lib/utils"

// Base UI's `onValueChange` yields `number | readonly number[]`; the rest of
// the template models slider state as a plain `number[]`. Expose that cleaner
// signature (matching the documented API) and normalize internally.
type SliderProps = Omit<SliderPrimitive.Root.Props, "onValueChange"> & {
  onValueChange?: (value: number[]) => void
  /** Per-thumb accessible name (e.g. "Shift start" / "Shift end" on a range). */
  getAriaLabel?: (index: number) => string
  /** Per-thumb spoken value (e.g. a clock time instead of raw minutes). */
  getAriaValueText?: (formattedValue: string, value: number, index: number) => string
  /** `"lg"`: a 28px thumb (≈44px to grab, with its hit margin) on a thicker track — for a control people drag a lot. */
  size?: "default" | "lg"
}

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  onValueChange,
  getAriaLabel,
  getAriaValueText,
  size = "default",
  ...props
}: SliderProps) {
  const lg = size === "lg"
  const _values = Array.isArray(value)
    ? value
    : Array.isArray(defaultValue)
      ? defaultValue
      : [min, max]

  return (
    <SliderPrimitive.Root
      className={cn("data-horizontal:w-full data-vertical:h-full", className)}
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      thumbAlignment="edge"
      onValueChange={
        onValueChange
          ? (next) => onValueChange(Array.isArray(next) ? [...next] : [next])
          : undefined
      }
      {...props}
    >
      <SliderPrimitive.Control className="relative flex w-full touch-none items-center py-2 select-none data-disabled:opacity-50 data-vertical:h-full data-vertical:min-h-40 data-vertical:w-auto data-vertical:flex-col data-vertical:py-0 data-vertical:px-2">
        <SliderPrimitive.Track
          data-slot="slider-track"
          className={cn(
            "relative grow overflow-hidden rounded-full bg-fill-tertiary select-none data-horizontal:w-full data-vertical:h-full",
            lg ? "data-horizontal:h-2 data-vertical:w-2" : "data-horizontal:h-1.5 data-vertical:w-1.5",
          )}
        >
          <SliderPrimitive.Indicator
            data-slot="slider-range"
            className="bg-blue-500 select-none data-horizontal:h-full data-vertical:w-full"
          />
        </SliderPrimitive.Track>
        {Array.from({ length: _values.length }, (_, index) => (
          <SliderPrimitive.Thumb
            data-slot="slider-thumb"
            key={index}
            getAriaLabel={getAriaLabel}
            getAriaValueText={getAriaValueText}
            className={cn(
              "relative block shrink-0 cursor-grab rounded-full bg-blue-500 shadow-xs ring-blue-500/30 transition-[color,box-shadow] select-none after:absolute after:-inset-2 hover:ring-3 focus-visible:ring-3 focus-visible:outline-hidden active:cursor-grabbing active:ring-3 disabled:pointer-events-none disabled:opacity-50",
              // A white edge keeps the big thumb distinct from the blue fill it sits on.
              lg ? "size-7 border-[3px] border-white shadow-md" : "size-4",
            )}
          />
        ))}
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  )
}

export { Slider }

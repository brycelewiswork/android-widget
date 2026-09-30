import { Canvas, type CanvasProps } from "@react-three/fiber"
import { Suspense } from "react"
import { cn } from "@/lib/utils"

type R3FCanvasProps = Omit<CanvasProps, "dpr" | "frameloop"> & {
  paused?: boolean
  className?: string
}

export function R3FCanvas({ paused, className, children, ...rest }: R3FCanvasProps) {
  return (
    <Canvas
      dpr={[1, 2]}
      frameloop={paused ? "never" : "always"}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      className={cn("block h-full w-full", className)}
      {...rest}
    >
      <Suspense fallback={null}>{children}</Suspense>
    </Canvas>
  )
}

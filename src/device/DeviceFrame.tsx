import { useLayoutEffect, useRef, useState, type ReactNode } from "react"
import pixel10Pro from "@/assets/device/pixel-10-pro.png"
import "./device.css"

// Ported from ../android-nav (src/sketch/DeviceFrame.tsx).
// Geometry from Figma "Bezels / Android Standard" (node 59434:27776): a
// 410×914 screen with the Pixel 10 Pro bezel image placed at (-18, -19),
// sized 450.839×949. The image's screen cutout is transparent.
const SCREEN = { width: 410, height: 914 } as const
const BEZEL = { x: -18, y: -19, width: 450.839, height: 949 } as const
// Approximate outer corner radius of the bezel image (screen radius + bezel).
const OUTER_RADIUS = 72
/** Screen corner radius — Figma "Content Area" (Android-Nav 258:1345). */
const SCREEN_RADIUS = 53

/**
 * Pixel 10 Pro frame at 1:1 dp, scaled down to fit its container. Children
 * render inside a 410×914 clipped screen (carrying the phone theme), so everything in a variant is laid
 * out in real Android dp.
 */
export function DeviceFrame({
  children,
  dark = false,
  footer,
}: {
  children: ReactNode
  dark?: boolean
  /** Rendered directly under the frame; its height is reserved before scaling. */
  footer?: ReactNode
}) {
  const hostRef = useRef<HTMLDivElement>(null)
  const footerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useLayoutEffect(() => {
    const host = hostRef.current
    if (!host) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      const footerHeight = footerRef.current?.offsetHeight ?? 0
      setScale(Math.min(1, width / BEZEL.width, (height - footerHeight) / BEZEL.height))
    })
    ro.observe(host)
    return () => ro.disconnect()
  }, [])

  return (
    <div ref={hostRef} className="flex size-full min-h-0 flex-col items-center justify-center">
      <div className="shrink-0" style={{ width: BEZEL.width * scale, height: BEZEL.height * scale }}>
        <div
          className="relative origin-top-left"
          style={{ width: BEZEL.width, height: BEZEL.height, transform: `scale(${scale})` }}
        >
          {/* Apple-style soft shadow: a separate layer shaped like the phone's
              outer silhouette (drop-shadow on the PNG would also shade the
              screen through the bezel's inner edge). Hidden under the phone. */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              borderRadius: OUTER_RADIUS,
              boxShadow: "0 44px 90px -24px rgb(0 0 0 / 0.16), 0 12px 28px -12px rgb(0 0 0 / 0.08)",
            }}
          />
          <div
            className={`phone absolute overflow-hidden ${dark ? "phone-dark" : ""}`}
            style={{
              left: -BEZEL.x,
              top: -BEZEL.y,
              width: SCREEN.width,
              height: SCREEN.height,
              borderRadius: SCREEN_RADIUS,
            }}
          >
            {children}
          </div>
          <img
            src={pixel10Pro}
            alt=""
            draggable={false}
            className="pointer-events-none absolute inset-0 size-full max-w-none select-none"
          />
        </div>
      </div>
      {footer && (
        <div ref={footerRef} className="pt-[12px]">
          {footer}
        </div>
      )}
    </div>
  )
}

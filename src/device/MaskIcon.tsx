/**
 * An exported SVG drawn through a CSS mask, so it takes `currentColor` (for
 * active states and the phone's dark mode) without editing the asset.
 */
export function MaskIcon({ src, width = 20, height = width, className = "" }: { src: string; width?: number; height?: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={`block shrink-0 bg-current ${className}`}
      style={{
        width,
        height,
        mask: `url("${src}") center / contain no-repeat`,
        WebkitMask: `url("${src}") center / contain no-repeat`,
      }}
    />
  )
}

import * as React from "react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { IconCircleCheck, IconInfoCircle, IconAlertTriangle, IconAlertOctagon, IconLoader2 } from '@tabler/icons-react'

// Sonner is the documented exception to the global squircle convention.
// `filter: drop-shadow()` on the toaster parent merges all stacked toasts into
// a single union silhouette (visible on hover/expand); per-toast filter gets
// clipped by per-toast clip-path; sonner's portal won't accept a wrapper around
// each toast without breaking measurements/gestures. At toast radii (~8–10px)
// the visual delta between a superellipse and a rounded rect is imperceptible,
// so we keep sonner's native border-radius + box-shadow stack lift instead.
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
          <IconCircleCheck className="size-4" />
        ),
        info: (
          <IconInfoCircle className="size-4" />
        ),
        warning: (
          <IconAlertTriangle className="size-4" />
        ),
        error: (
          <IconAlertOctagon className="size-4" />
        ),
        loading: (
          <IconLoader2 className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--surface-secondary)",
          "--normal-text": "var(--label)",
          "--normal-border": "var(--stroke-faint)",
          "--border-radius": "18px",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }

import * as React from "react"
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { useSquircle } from "@/components/squircle"

const badgeVariants = cva(
  // Outset `border`/`ring-*` are clipped away by the squircle clip-path,
  // leaving rectangular-edge artifacts at the corners. Use `inset-ring-*`
  // (inset box-shadow) instead — it renders inside the box and survives
  // the clip. Mirrors the same convention enforced on Button and Card.
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl inset-ring-1 inset-ring-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:inset-ring-ring focus-visible:ring-3 focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:inset-ring-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        secondary:
          "bg-surface-tertiary text-label [a]:hover:bg-surface-tertiary/80",
        destructive:
          "bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20",
        outline:
          "inset-ring-stroke-faint text-label [a]:hover:bg-surface-tertiary [a]:hover:text-label-secondary",
        ghost:
          "hover:bg-surface-tertiary hover:text-label-secondary dark:hover:bg-surface-tertiary/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  const ref = React.useRef<HTMLSpanElement>(null)
  useSquircle(ref, { cornerRadius: 999 })

  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
        ref,
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }

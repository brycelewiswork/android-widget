import { cn } from "@/lib/utils"

const pulse = "animate-pulse"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("rounded-md bg-fill-secondary", pulse, className)}
      {...props}
    />
  )
}

function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-3.5 rounded"
          style={{ width: i === lines - 1 ? "60%" : "100%" }}
        />
      ))}
    </div>
  )
}

function SkeletonHeading({ className }: { className?: string }) {
  return <Skeleton className={cn("h-5 w-40 rounded-md", className)} />
}

function SkeletonAvatar({ size = "md", className }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const s = size === "sm" ? "size-8" : size === "lg" ? "size-14" : "size-10"
  return <Skeleton className={cn(s, "rounded-full", className)} />
}

function SkeletonImage({ className }: { className?: string }) {
  return <Skeleton className={cn("aspect-video w-full rounded-xl", className)} />
}

function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border border-stroke-faint bg-surface-secondary p-4 space-y-3", className)}>
      <SkeletonHeading />
      <Skeleton className="h-3 w-56 rounded" />
      <div className="pt-1 space-y-4">
        <div className="flex items-center gap-3">
          <SkeletonAvatar size="sm" />
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-3 w-24 rounded" />
            <Skeleton className="h-2.5 w-36 rounded" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <SkeletonAvatar size="sm" />
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-3 w-28 rounded" />
            <Skeleton className="h-2.5 w-32 rounded" />
          </div>
        </div>
      </div>
    </div>
  )
}

export { Skeleton, SkeletonText, SkeletonHeading, SkeletonAvatar, SkeletonImage, SkeletonCard }

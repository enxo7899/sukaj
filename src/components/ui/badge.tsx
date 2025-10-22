import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary/15 text-primary shadow-inner shadow-primary/20 hover:bg-primary/25",
        secondary:
          "border-transparent bg-secondary/40 text-secondary-foreground hover:bg-secondary/55",
        destructive:
          "border-transparent bg-destructive/20 text-destructive-foreground hover:bg-destructive/30",
        outline: "border-border/20 text-foreground/90",
        success: "border-transparent bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25",
        warning: "border-transparent bg-amber-500/15 text-amber-300 hover:bg-amber-500/25",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }

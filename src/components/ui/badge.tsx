
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "sales-badge",
  {
    variants: {
      variant: {
        default: "sales-badge-info",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "sales-badge-danger",
        outline: "border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground",
        success: "sales-badge-success",
        warning: "sales-badge-warning",
        pending: "sales-badge-pending",
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

import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold gap-1",
  {
    variants: {
      variant: {
        default:
          "bg-primary-soft text-primary-strong",
        success:
          "bg-success/15 text-success",
        warning:
          "bg-warning/15 text-warning",
        danger: "bg-danger/15 text-danger",
        neutral:
          "bg-muted text-text-secondary",
        outline:
          "border border-border text-text-secondary bg-surface",
        module:
          "bg-primary-soft text-primary-strong",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "tt-badge",
  {
    variants: {
      variant: {
        default: "tt-badge--default",
        secondary: "tt-badge--secondary",
        outline: "tt-badge--outline",
        muted: "tt-badge--muted",
        success: "tt-badge--success",
        warning: "tt-badge--warning",
        destructive: "tt-badge--destructive"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

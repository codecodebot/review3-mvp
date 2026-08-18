import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "tt-button",
  {
    variants: {
      variant: {
        default: "tt-button--primary",
        secondary: "tt-button--secondary",
        outline: "tt-button--outline",
        ghost: "tt-button--ghost",
        destructive: "tt-button--destructive"
      },
      size: {
        default: "",
        sm: "tt-button--sm",
        lg: "tt-button--lg"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
);

Button.displayName = "Button";

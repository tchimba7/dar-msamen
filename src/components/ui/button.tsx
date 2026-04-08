import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-xl border text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(165,79,29,0.28)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[linear-gradient(135deg,#b65a22_0%,#8f3e14_100%)] text-white shadow-[0_14px_28px_rgba(143,62,20,0.22)] hover:-translate-y-0.5 hover:shadow-[0_18px_34px_rgba(143,62,20,0.28)]",
        secondary:
          "border-[rgba(160,98,37,0.18)] bg-white/88 text-amber-950 shadow-[0_10px_22px_rgba(94,45,16,0.06)] hover:-translate-y-0.5 hover:bg-white",
        ghost:
          "border-transparent bg-transparent text-amber-950 hover:bg-[rgba(160,98,37,0.08)]",
      },
      size: {
        default: "h-11 px-4 py-2.5",
        sm: "h-9 px-3.5",
        lg: "h-12 px-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

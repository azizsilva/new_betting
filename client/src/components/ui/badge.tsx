import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
  {
    variants: {
      variant: {
        default: "bg-[var(--color-surface-2)] text-[var(--color-muted)]",
        brand: "bg-[var(--color-brand)]/15 text-[var(--color-brand)]",
        live: "bg-[var(--color-danger)]/15 text-[var(--color-danger)]",
        gold: "bg-[var(--color-gold)]/15 text-[var(--color-gold)]",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

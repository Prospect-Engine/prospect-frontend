import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none transition-all duration-200 overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#0071e3] text-white [a&]:hover:bg-[#0077ed]",
        secondary:
          "border-transparent bg-black/[0.06] dark:bg-white/[0.1] text-foreground/80 [a&]:hover:bg-black/[0.1] dark:[a&]:hover:bg-white/[0.15]",
        destructive:
          "border-transparent bg-[#ff3b30]/10 text-[#ff3b30] [a&]:hover:bg-[#ff3b30]/20",
        outline:
          "border-black/[0.08] dark:border-white/[0.12] text-foreground/70 [a&]:hover:bg-black/[0.02] dark:[a&]:hover:bg-white/[0.04]",
        success:
          "border-transparent bg-[#34c759]/10 text-[#34c759] [a&]:hover:bg-[#34c759]/20",
        warning:
          "border-transparent bg-[#ff9500]/10 text-[#ff9500] [a&]:hover:bg-[#ff9500]/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };

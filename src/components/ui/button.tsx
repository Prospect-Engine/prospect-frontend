import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]/30 focus-visible:ring-offset-2 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-[#0071e3] text-white hover:bg-[#0077ed] shadow-sm hover:shadow-md hover:shadow-[#0071e3]/20 dark:bg-[#0a84ff] dark:hover:bg-[#409cff]",
        destructive:
          "bg-[#ff3b30] text-white hover:bg-[#ff453a] shadow-sm hover:shadow-md hover:shadow-[#ff3b30]/20 dark:bg-[#ff453a] dark:hover:bg-[#ff6961]",
        outline:
          "border border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-[#1c1c1e] hover:bg-black/[0.02] dark:hover:bg-white/[0.04] text-foreground",
        secondary:
          "bg-black/[0.05] dark:bg-white/[0.1] text-foreground hover:bg-black/[0.08] dark:hover:bg-white/[0.15]",
        ghost:
          "hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-foreground",
        link: "text-[#0071e3] dark:text-[#0a84ff] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5 py-2.5 has-[>svg]:px-4",
        sm: "h-8 rounded-lg gap-1.5 px-3 text-xs has-[>svg]:px-2.5",
        lg: "h-12 rounded-xl px-8 text-base has-[>svg]:px-6",
        icon: "size-10 rounded-xl",
        "icon-sm": "size-8 rounded-lg",
        "icon-lg": "size-12 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };

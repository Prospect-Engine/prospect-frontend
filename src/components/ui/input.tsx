import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-xl border bg-white dark:bg-[#1c1c1e]",
        "border-black/[0.08] dark:border-white/[0.12]",
        "px-4 py-2 text-sm text-foreground",
        "placeholder:text-muted-foreground/60",
        "transition-all duration-200 outline-none",
        "focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20",
        "dark:focus:border-[#0a84ff] dark:focus:ring-[#0a84ff]/20",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "file:text-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "selection:bg-[#0071e3]/20 selection:text-foreground",
        "aria-invalid:border-[#ff3b30] aria-invalid:ring-[#ff3b30]/20",
        className
      )}
      {...props}
    />
  );
}

export { Input };

/**
 * BADGE COMPONENT
 * ===============
 * Unified badge component for all Geniefy products.
 */

import * as React from "react";
import { cn, badgeVariants, type BadgeVariants } from "@/theme";

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    BadgeVariants {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };

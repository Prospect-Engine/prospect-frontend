/**
 * GENIEFY UNIFIED THEME SYSTEM
 * ============================
 * Central export for all theme-related utilities, tokens, and variants.
 *
 * Usage in any module:
 * ```ts
 * import { cn, tokens, buttonVariants } from "@/theme";
 * ```
 */

// Design Tokens
export * from "./tokens";
export { tokens } from "./tokens";

// Component Variants (CVA)
export * from "./variants";
export { variants } from "./variants";

// Utility Functions
export * from "./utils";

// Re-export commonly used items at top level for convenience
export { cn, formatCurrency, formatDate, formatRelativeTime, getInitials } from "./utils";
export { buttonVariants, badgeVariants, cardVariants, inputVariants } from "./variants";
export { colors, typography, spacing, shadows, productThemes } from "./tokens";

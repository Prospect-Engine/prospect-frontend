/**
 * GENIEFY COMPONENT VARIANTS
 * ==========================
 * Unified CVA (Class Variance Authority) variants for all components.
 * Ensures consistent styling across GenSales, GenChat, GenFin, GenHR, GenDo.
 */

import { cva, type VariantProps } from "class-variance-authority";

// ============================================
// BUTTON VARIANTS
// ============================================

export const buttonVariants = cva(
  // Base styles
  [
    "inline-flex items-center justify-center gap-2",
    "font-medium whitespace-nowrap",
    "rounded-lg transition-all duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "active:scale-[0.98]",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
        destructive:
          "bg-destructive text-white shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        success: "bg-success text-success-foreground shadow-sm hover:bg-success/90",
        warning: "bg-warning text-warning-foreground shadow-sm hover:bg-warning/90",
        // Product-specific variants
        gensales: "bg-[#E57373] text-white shadow-sm hover:bg-[#EF5350]",
        genchat: "bg-[oklch(0.65_0.20_145)] text-white shadow-sm hover:bg-[oklch(0.60_0.20_145)]",
        genfin: "bg-[oklch(0.75_0.18_65)] text-black shadow-sm hover:bg-[oklch(0.70_0.18_65)]",
        genhr: "bg-[oklch(0.55_0.25_310)] text-white shadow-sm hover:bg-[oklch(0.50_0.25_310)]",
        gendo: "bg-[oklch(0.60_0.22_200)] text-white shadow-sm hover:bg-[oklch(0.55_0.22_200)]",
      },
      size: {
        xs: "h-7 px-2 text-xs rounded-md",
        sm: "h-8 px-3 text-sm",
        default: "h-10 px-4 text-sm",
        lg: "h-11 px-6 text-base",
        xl: "h-12 px-8 text-base",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-xs": "h-7 w-7",
        "icon-lg": "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;

// ============================================
// BADGE VARIANTS
// ============================================

export const badgeVariants = cva(
  [
    "inline-flex items-center gap-1",
    "font-medium",
    "rounded-full border",
    "transition-colors duration-200",
  ],
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-white",
        success: "border-transparent bg-success text-success-foreground",
        warning: "border-transparent bg-warning text-warning-foreground",
        outline: "border-border text-foreground",
        ghost: "border-transparent bg-muted text-muted-foreground",
        // Product badges
        gensales: "border-transparent bg-[#E57373]/10 text-[#E57373]",
        genchat: "border-transparent bg-[oklch(0.65_0.20_145)]/10 text-[oklch(0.65_0.20_145)]",
        genfin: "border-transparent bg-[oklch(0.75_0.18_65)]/10 text-[oklch(0.65_0.18_65)]",
        genhr: "border-transparent bg-[oklch(0.55_0.25_310)]/10 text-[oklch(0.55_0.25_310)]",
        gendo: "border-transparent bg-[oklch(0.60_0.22_200)]/10 text-[oklch(0.60_0.22_200)]",
      },
      size: {
        xs: "px-1.5 py-0.5 text-[10px]",
        sm: "px-2 py-0.5 text-xs",
        default: "px-2.5 py-1 text-xs",
        lg: "px-3 py-1.5 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export type BadgeVariants = VariantProps<typeof badgeVariants>;

// ============================================
// CARD VARIANTS
// ============================================

export const cardVariants = cva(
  ["rounded-xl border transition-all duration-200"],
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground border-border shadow-sm",
        elevated: "bg-card text-card-foreground border-border shadow-md hover:shadow-lg",
        glass: "glass border-[var(--glass-border)]",
        ghost: "bg-transparent border-transparent",
        outline: "bg-transparent border-border",
        interactive:
          "bg-card text-card-foreground border-border shadow-sm hover:shadow-md hover:border-primary/20 cursor-pointer",
      },
      padding: {
        none: "p-0",
        sm: "p-4",
        default: "p-6",
        lg: "p-8",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "default",
    },
  }
);

export type CardVariants = VariantProps<typeof cardVariants>;

// ============================================
// INPUT VARIANTS
// ============================================

export const inputVariants = cva(
  [
    "flex w-full",
    "rounded-lg border border-input",
    "bg-background text-foreground",
    "transition-all duration-200",
    "placeholder:text-muted-foreground",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "file:border-0 file:bg-transparent file:text-sm file:font-medium",
  ],
  {
    variants: {
      variant: {
        default: "border-input hover:border-primary/50",
        filled: "border-transparent bg-muted hover:bg-muted/80",
        ghost: "border-transparent bg-transparent hover:bg-muted/50",
        error: "border-destructive focus-visible:ring-destructive",
      },
      inputSize: {
        sm: "h-8 px-3 text-sm",
        default: "h-10 px-4 text-sm",
        lg: "h-12 px-4 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      inputSize: "default",
    },
  }
);

export type InputVariants = VariantProps<typeof inputVariants>;

// ============================================
// AVATAR VARIANTS
// ============================================

export const avatarVariants = cva(
  [
    "relative flex shrink-0 items-center justify-center",
    "overflow-hidden rounded-full",
    "bg-muted",
  ],
  {
    variants: {
      size: {
        xs: "h-6 w-6 text-[10px]",
        sm: "h-8 w-8 text-xs",
        default: "h-10 w-10 text-sm",
        lg: "h-12 w-12 text-base",
        xl: "h-14 w-14 text-lg",
        "2xl": "h-20 w-20 text-2xl",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

export type AvatarVariants = VariantProps<typeof avatarVariants>;

// ============================================
// ALERT VARIANTS
// ============================================

export const alertVariants = cva(
  [
    "relative w-full rounded-xl border p-4",
    "[&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  ],
  {
    variants: {
      variant: {
        default: "bg-background text-foreground border-border",
        info: "bg-primary/5 text-primary border-primary/20 [&>svg]:text-primary",
        success: "bg-success/5 text-success border-success/20 [&>svg]:text-success",
        warning: "bg-warning/5 text-warning border-warning/20 [&>svg]:text-warning",
        destructive: "bg-destructive/5 text-destructive border-destructive/20 [&>svg]:text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export type AlertVariants = VariantProps<typeof alertVariants>;

// ============================================
// NAV LINK VARIANTS
// ============================================

export const navLinkVariants = cva(
  [
    "flex items-center gap-3",
    "px-3 py-2 rounded-lg",
    "text-sm font-medium",
    "transition-all duration-200",
    "hover:bg-accent hover:text-accent-foreground",
    "[&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        default: "text-muted-foreground",
        active: "bg-primary/10 text-primary",
        ghost: "text-foreground hover:bg-muted",
      },
      size: {
        sm: "px-2 py-1.5 text-xs",
        default: "px-3 py-2 text-sm",
        lg: "px-4 py-3 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export type NavLinkVariants = VariantProps<typeof navLinkVariants>;

// ============================================
// TABLE VARIANTS
// ============================================

export const tableVariants = cva(["w-full caption-bottom text-sm"], {
  variants: {
    variant: {
      default: "",
      bordered: "[&_th]:border [&_td]:border",
      striped: "[&_tbody_tr:nth-child(odd)]:bg-muted/50",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export const tableHeaderVariants = cva(
  ["h-12 px-4 text-left align-middle font-medium text-muted-foreground"],
  {
    variants: {
      sticky: {
        true: "sticky top-0 z-10 bg-background",
        false: "",
      },
    },
    defaultVariants: {
      sticky: false,
    },
  }
);

export const tableCellVariants = cva(["p-4 align-middle"], {
  variants: {
    align: {
      left: "text-left",
      center: "text-center",
      right: "text-right",
    },
  },
  defaultVariants: {
    align: "left",
  },
});

// ============================================
// SEPARATOR VARIANTS
// ============================================

export const separatorVariants = cva(["shrink-0 bg-border"], {
  variants: {
    orientation: {
      horizontal: "h-[1px] w-full",
      vertical: "h-full w-[1px]",
    },
  },
  defaultVariants: {
    orientation: "horizontal",
  },
});

export type SeparatorVariants = VariantProps<typeof separatorVariants>;

// ============================================
// SKELETON VARIANTS
// ============================================

export const skeletonVariants = cva(["animate-pulse rounded-md bg-muted"], {
  variants: {
    variant: {
      default: "",
      text: "h-4 w-full",
      heading: "h-8 w-3/4",
      avatar: "h-10 w-10 rounded-full",
      button: "h-10 w-24",
      card: "h-32 w-full",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export type SkeletonVariants = VariantProps<typeof skeletonVariants>;

// ============================================
// TOAST VARIANTS
// ============================================

export const toastVariants = cva(
  [
    "group pointer-events-auto relative flex w-full items-center justify-between",
    "space-x-4 overflow-hidden rounded-xl border p-4 pr-8 shadow-lg",
    "transition-all",
  ],
  {
    variants: {
      variant: {
        default: "bg-background text-foreground border-border",
        success: "bg-success text-success-foreground border-success",
        warning: "bg-warning text-warning-foreground border-warning",
        destructive: "bg-destructive text-white border-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export type ToastVariants = VariantProps<typeof toastVariants>;

// ============================================
// STAT CARD VARIANTS
// ============================================

export const statCardVariants = cva(
  ["rounded-xl border p-4 transition-all duration-200"],
  {
    variants: {
      variant: {
        default: "bg-card border-border",
        elevated: "bg-card border-border shadow-md",
        glass: "glass border-[var(--glass-border)]",
        gradient: "border-0 bg-gradient-to-br text-white",
      },
      trend: {
        up: "",
        down: "",
        neutral: "",
      },
    },
    compoundVariants: [
      {
        variant: "gradient",
        trend: "up",
        className: "from-success to-success/80",
      },
      {
        variant: "gradient",
        trend: "down",
        className: "from-destructive to-destructive/80",
      },
    ],
    defaultVariants: {
      variant: "default",
      trend: "neutral",
    },
  }
);

export type StatCardVariants = VariantProps<typeof statCardVariants>;

// ============================================
// PRODUCT SWITCHER VARIANTS
// ============================================

export const productSwitcherVariants = cva(
  [
    "flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer",
    "transition-all duration-200",
  ],
  {
    variants: {
      product: {
        gensales: "hover:bg-[#E57373]/10",
        genchat: "hover:bg-[oklch(0.65_0.20_145)]/10",
        genfin: "hover:bg-[oklch(0.75_0.18_65)]/10",
        genhr: "hover:bg-[oklch(0.55_0.25_310)]/10",
        gendo: "hover:bg-[oklch(0.60_0.22_200)]/10",
      },
      active: {
        true: "",
        false: "opacity-70 hover:opacity-100",
      },
    },
    compoundVariants: [
      { product: "gensales", active: true, className: "bg-[#E57373]/10" },
      { product: "genchat", active: true, className: "bg-[oklch(0.65_0.20_145)]/10" },
      { product: "genfin", active: true, className: "bg-[oklch(0.75_0.18_65)]/10" },
      { product: "genhr", active: true, className: "bg-[oklch(0.55_0.25_310)]/10" },
      { product: "gendo", active: true, className: "bg-[oklch(0.60_0.22_200)]/10" },
    ],
    defaultVariants: {
      active: false,
    },
  }
);

export type ProductSwitcherVariants = VariantProps<typeof productSwitcherVariants>;

// ============================================
// EXPORTS
// ============================================

export const variants = {
  button: buttonVariants,
  badge: badgeVariants,
  card: cardVariants,
  input: inputVariants,
  avatar: avatarVariants,
  alert: alertVariants,
  navLink: navLinkVariants,
  table: tableVariants,
  tableHeader: tableHeaderVariants,
  tableCell: tableCellVariants,
  separator: separatorVariants,
  skeleton: skeletonVariants,
  toast: toastVariants,
  statCard: statCardVariants,
  productSwitcher: productSwitcherVariants,
} as const;

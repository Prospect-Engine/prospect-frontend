/**
 * GENIEFY DESIGN TOKENS
 * =====================
 * Unified design tokens for all Geniefy products:
 * - GenSales (Outreach Automation)
 * - GenChat (AI Qualification)
 * - GenFin (Financial Management)
 * - GenHR (HR Management)
 * - GenDo (Task Management)
 *
 * These tokens ensure 100% brand consistency across all products.
 */

// ============================================
// COLOR PALETTE
// ============================================

export const colors = {
  // Primary Brand Colors (Apple-inspired Blue)
  primary: {
    50: "oklch(0.97 0.02 250)",
    100: "oklch(0.93 0.04 250)",
    200: "oklch(0.85 0.08 250)",
    300: "oklch(0.75 0.14 250)",
    400: "oklch(0.65 0.18 250)",
    500: "oklch(0.55 0.21 250)", // Main primary
    600: "oklch(0.48 0.20 250)",
    700: "oklch(0.40 0.18 250)",
    800: "oklch(0.32 0.15 250)",
    900: "oklch(0.25 0.12 250)",
    950: "oklch(0.18 0.10 250)",
  },

  // Semantic Colors
  success: {
    light: "oklch(0.72 0.19 145)",
    DEFAULT: "oklch(0.65 0.20 145)",
    dark: "oklch(0.55 0.18 145)",
    foreground: "oklch(1 0 0)",
  },

  warning: {
    light: "oklch(0.80 0.16 65)",
    DEFAULT: "oklch(0.75 0.18 65)",
    dark: "oklch(0.65 0.20 65)",
    foreground: "oklch(0 0 0)",
  },

  destructive: {
    light: "oklch(0.70 0.22 25)",
    DEFAULT: "oklch(0.63 0.26 25)",
    dark: "oklch(0.55 0.24 25)",
    foreground: "oklch(1 0 0)",
  },

  // Neutral Grays
  gray: {
    50: "oklch(0.98 0 0)",
    100: "oklch(0.96 0 0)",
    200: "oklch(0.92 0 0)",
    300: "oklch(0.87 0 0)",
    400: "oklch(0.70 0 0)",
    500: "oklch(0.55 0 0)",
    600: "oklch(0.45 0 0)",
    700: "oklch(0.35 0 0)",
    800: "oklch(0.25 0 0)",
    900: "oklch(0.15 0 0)",
    950: "oklch(0.10 0 0)",
  },

  // Product Accent Colors (for product identification)
  products: {
    gensales: "#E57373", // Light coral/red - Sales
    genchat: "oklch(0.65 0.20 145)", // Green - AI Chat
    genfin: "oklch(0.75 0.18 65)", // Orange - Finance
    genhr: "oklch(0.55 0.25 310)", // Purple - HR
    gendo: "oklch(0.60 0.22 200)", // Cyan - Tasks
  },

  // Chart Colors
  chart: {
    1: "oklch(0.55 0.21 250)", // Blue
    2: "oklch(0.72 0.19 145)", // Green
    3: "oklch(0.75 0.18 65)", // Orange
    4: "oklch(0.55 0.25 310)", // Purple
    5: "oklch(0.63 0.26 25)", // Red
    6: "oklch(0.60 0.22 200)", // Cyan
  },
} as const;

// ============================================
// TYPOGRAPHY
// ============================================

export const typography = {
  fonts: {
    sans: 'var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"',
    mono: 'var(--font-geist-mono), ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
  },

  sizes: {
    xs: "0.75rem", // 12px
    sm: "0.875rem", // 14px
    base: "1rem", // 16px
    lg: "1.125rem", // 18px
    xl: "1.25rem", // 20px
    "2xl": "1.5rem", // 24px
    "3xl": "1.875rem", // 30px
    "4xl": "2.25rem", // 36px
    "5xl": "3rem", // 48px
    "6xl": "3.75rem", // 60px
  },

  weights: {
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },

  lineHeights: {
    none: "1",
    tight: "1.25",
    snug: "1.375",
    normal: "1.5",
    relaxed: "1.625",
    loose: "2",
  },

  letterSpacing: {
    tighter: "-0.05em",
    tight: "-0.025em",
    normal: "0",
    wide: "0.025em",
    wider: "0.05em",
  },
} as const;

// ============================================
// SPACING
// ============================================

export const spacing = {
  0: "0",
  px: "1px",
  0.5: "0.125rem", // 2px
  1: "0.25rem", // 4px
  1.5: "0.375rem", // 6px
  2: "0.5rem", // 8px
  2.5: "0.625rem", // 10px
  3: "0.75rem", // 12px
  3.5: "0.875rem", // 14px
  4: "1rem", // 16px
  5: "1.25rem", // 20px
  6: "1.5rem", // 24px
  7: "1.75rem", // 28px
  8: "2rem", // 32px
  9: "2.25rem", // 36px
  10: "2.5rem", // 40px
  11: "2.75rem", // 44px
  12: "3rem", // 48px
  14: "3.5rem", // 56px
  16: "4rem", // 64px
  20: "5rem", // 80px
  24: "6rem", // 96px
  28: "7rem", // 112px
  32: "8rem", // 128px
  36: "9rem", // 144px
  40: "10rem", // 160px
  44: "11rem", // 176px
  48: "12rem", // 192px
  52: "13rem", // 208px
  56: "14rem", // 224px
  60: "15rem", // 240px
  64: "16rem", // 256px
  72: "18rem", // 288px
  80: "20rem", // 320px
  96: "24rem", // 384px
} as const;

// ============================================
// BORDER RADIUS
// ============================================

export const borderRadius = {
  none: "0",
  sm: "calc(0.875rem - 4px)", // 10px
  DEFAULT: "0.875rem", // 14px - Apple style
  md: "calc(0.875rem - 2px)", // 12px
  lg: "0.875rem", // 14px
  xl: "calc(0.875rem + 4px)", // 18px
  "2xl": "calc(0.875rem + 8px)", // 22px
  "3xl": "calc(0.875rem + 12px)", // 26px
  full: "9999px",
} as const;

// ============================================
// SHADOWS
// ============================================

export const shadows = {
  none: "none",
  sm: "0 2px 8px rgba(0, 0, 0, 0.04)",
  DEFAULT: "0 4px 16px rgba(0, 0, 0, 0.08)",
  md: "0 4px 16px rgba(0, 0, 0, 0.08)",
  lg: "0 8px 32px rgba(0, 0, 0, 0.12)",
  xl: "0 16px 48px rgba(0, 0, 0, 0.16)",
  "2xl": "0 24px 64px rgba(0, 0, 0, 0.20)",
  inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)",

  // Dark mode shadows
  dark: {
    sm: "0 2px 8px rgba(0, 0, 0, 0.3)",
    DEFAULT: "0 4px 16px rgba(0, 0, 0, 0.4)",
    md: "0 4px 16px rgba(0, 0, 0, 0.4)",
    lg: "0 8px 32px rgba(0, 0, 0, 0.5)",
    xl: "0 16px 48px rgba(0, 0, 0, 0.6)",
    "2xl": "0 24px 64px rgba(0, 0, 0, 0.7)",
  },

  // Glow effects
  glow: {
    primary: "0 0 20px rgba(0, 113, 227, 0.3)",
    success: "0 0 20px rgba(52, 199, 89, 0.3)",
    warning: "0 0 20px rgba(255, 149, 0, 0.3)",
    destructive: "0 0 20px rgba(255, 59, 48, 0.3)",
  },
} as const;

// ============================================
// TRANSITIONS
// ============================================

export const transitions = {
  duration: {
    75: "75ms",
    100: "100ms",
    150: "150ms",
    200: "200ms",
    300: "300ms",
    500: "500ms",
    700: "700ms",
    1000: "1000ms",
  },

  timing: {
    linear: "linear",
    ease: "ease",
    easeIn: "cubic-bezier(0.4, 0, 1, 1)",
    easeOut: "cubic-bezier(0, 0, 0.2, 1)",
    easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    bounce: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  },
} as const;

// ============================================
// Z-INDEX
// ============================================

export const zIndex = {
  auto: "auto",
  0: "0",
  10: "10",
  20: "20",
  30: "30",
  40: "40",
  50: "50", // Sticky headers
  100: "100", // Dropdowns
  200: "200", // Popovers
  300: "300", // Modals backdrop
  400: "400", // Modals
  500: "500", // Notifications
  999: "999", // Maximum
} as const;

// ============================================
// BREAKPOINTS
// ============================================

export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const;

// ============================================
// GLASSMORPHISM
// ============================================

export const glass = {
  light: {
    background: "rgba(255, 255, 255, 0.72)",
    border: "rgba(255, 255, 255, 0.5)",
    blur: "blur(20px) saturate(180%)",
  },
  dark: {
    background: "rgba(28, 28, 30, 0.72)",
    border: "rgba(255, 255, 255, 0.1)",
    blur: "blur(20px) saturate(180%)",
  },
  subtle: {
    light: {
      background: "rgba(255, 255, 255, 0.5)",
      blur: "blur(10px) saturate(150%)",
    },
    dark: {
      background: "rgba(28, 28, 30, 0.5)",
      blur: "blur(10px) saturate(150%)",
    },
  },
} as const;

// ============================================
// PRODUCT THEMES
// ============================================

export const productThemes = {
  gensales: {
    name: "GenSales",
    description: "Outreach Automation",
    icon: "Send",
    color: colors.products.gensales,
    gradient: "linear-gradient(135deg, #E57373 0%, #EF9A9A 100%)",
  },
  genchat: {
    name: "GenChat",
    description: "AI Qualification",
    icon: "MessageSquare",
    color: colors.products.genchat,
    gradient: "linear-gradient(135deg, #34c759 0%, #30d158 100%)",
  },
  genfin: {
    name: "GenFin",
    description: "Financial Management",
    icon: "DollarSign",
    color: colors.products.genfin,
    gradient: "linear-gradient(135deg, #ff9500 0%, #ffcc00 100%)",
  },
  genhr: {
    name: "GenHR",
    description: "HR Management",
    icon: "Users",
    color: colors.products.genhr,
    gradient: "linear-gradient(135deg, #af52de 0%, #bf5af2 100%)",
  },
  gendo: {
    name: "GenDo",
    description: "Task Management",
    icon: "CheckSquare",
    color: colors.products.gendo,
    gradient: "linear-gradient(135deg, #5ac8fa 0%, #64d2ff 100%)",
  },
} as const;

// Export all tokens
export const tokens = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  transitions,
  zIndex,
  breakpoints,
  glass,
  productThemes,
} as const;

export type Colors = typeof colors;
export type Typography = typeof typography;
export type Spacing = typeof spacing;
export type BorderRadius = typeof borderRadius;
export type Shadows = typeof shadows;
export type Transitions = typeof transitions;
export type ZIndex = typeof zIndex;
export type Breakpoints = typeof breakpoints;
export type Glass = typeof glass;
export type ProductThemes = typeof productThemes;
export type Tokens = typeof tokens;

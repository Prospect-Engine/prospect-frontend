/**
 * GENIEFY THEME UTILITIES
 * =======================
 * Shared utility functions for the unified design system.
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// ============================================
// CLASS NAME UTILITIES
// ============================================

/**
 * Merges Tailwind CSS classes intelligently.
 * Combines clsx for conditional classes and tailwind-merge for deduplication.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================
// COLOR UTILITIES
// ============================================

/**
 * Converts hex color to RGB values.
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Converts RGB values to hex color.
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

/**
 * Adjusts the lightness of an OKLCH color.
 */
export function adjustOklchLightness(oklch: string, adjustment: number): string {
  const match = oklch.match(/oklch\(([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\)/);
  if (!match) return oklch;
  const [, l, c, h] = match;
  const newL = Math.max(0, Math.min(1, parseFloat(l) + adjustment));
  return `oklch(${newL.toFixed(2)} ${c} ${h})`;
}

// ============================================
// FORMAT UTILITIES
// ============================================

/**
 * Formats a number as currency.
 */
export function formatCurrency(
  amount: number,
  currency: string = "USD",
  locale: string = "en-US"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formats a number with compact notation (e.g., 1.2K, 3.4M).
 */
export function formatCompactNumber(num: number, locale: string = "en-US"): string {
  return new Intl.NumberFormat(locale, {
    notation: "compact",
    compactDisplay: "short",
  }).format(num);
}

/**
 * Formats a number as percentage.
 */
export function formatPercentage(
  value: number,
  decimals: number = 1,
  locale: string = "en-US"
): string {
  return new Intl.NumberFormat(locale, {
    style: "percent",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
}

/**
 * Formats a date in a readable format.
 */
export function formatDate(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions,
  locale: string = "en-US"
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options,
  });
}

/**
 * Formats a date as relative time (e.g., "2 hours ago").
 */
export function formatRelativeTime(
  date: Date | string,
  locale: string = "en-US"
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  if (diffInSeconds < 60) return rtf.format(-diffInSeconds, "second");
  if (diffInSeconds < 3600) return rtf.format(-Math.floor(diffInSeconds / 60), "minute");
  if (diffInSeconds < 86400) return rtf.format(-Math.floor(diffInSeconds / 3600), "hour");
  if (diffInSeconds < 2592000) return rtf.format(-Math.floor(diffInSeconds / 86400), "day");
  if (diffInSeconds < 31536000) return rtf.format(-Math.floor(diffInSeconds / 2592000), "month");
  return rtf.format(-Math.floor(diffInSeconds / 31536000), "year");
}

// ============================================
// STRING UTILITIES
// ============================================

/**
 * Generates initials from a name (e.g., "John Doe" → "JD").
 */
export function getInitials(name: string, maxLength: number = 2): string {
  if (!name) return "";
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, maxLength)
    .join("")
    .toUpperCase();
}

/**
 * Truncates text with ellipsis.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

/**
 * Capitalizes the first letter of a string.
 */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Converts a string to title case.
 */
export function titleCase(text: string): string {
  return text
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Converts a string to kebab-case.
 */
export function kebabCase(text: string): string {
  return text
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
}

/**
 * Converts a string to camelCase.
 */
export function camelCase(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase());
}

// ============================================
// VALIDATION UTILITIES
// ============================================

/**
 * Validates an email address.
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates a URL.
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Checks if a value is empty (null, undefined, empty string, or empty array).
 */
export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
}

// ============================================
// ARRAY UTILITIES
// ============================================

/**
 * Groups an array by a key.
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce(
    (result, item) => {
      const groupKey = String(item[key]);
      if (!result[groupKey]) result[groupKey] = [];
      result[groupKey].push(item);
      return result;
    },
    {} as Record<string, T[]>
  );
}

/**
 * Removes duplicates from an array.
 */
export function unique<T>(array: T[]): T[] {
  return [...new Set(array)];
}

/**
 * Sorts an array of objects by a key.
 */
export function sortBy<T>(
  array: T[],
  key: keyof T,
  order: "asc" | "desc" = "asc"
): T[] {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    if (aVal < bVal) return order === "asc" ? -1 : 1;
    if (aVal > bVal) return order === "asc" ? 1 : -1;
    return 0;
  });
}

// ============================================
// DEBOUNCE & THROTTLE
// ============================================

/**
 * Creates a debounced version of a function.
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Creates a throttled version of a function.
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// ============================================
// LOCAL STORAGE UTILITIES
// ============================================

/**
 * Safely gets a value from localStorage with JSON parsing.
 */
export function getStorageItem<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

/**
 * Safely sets a value in localStorage with JSON stringification.
 */
export function setStorageItem<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Failed to save ${key} to localStorage:`, error);
  }
}

/**
 * Removes an item from localStorage.
 */
export function removeStorageItem(key: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(key);
}

// ============================================
// PRODUCT UTILITIES
// ============================================

export type ProductId = "gensales" | "genchat" | "genfin" | "genhr" | "gendo";

export const productConfig: Record<
  ProductId,
  {
    name: string;
    description: string;
    icon: string;
    path: string;
    color: string;
  }
> = {
  gensales: {
    name: "GenSales",
    description: "Outreach Automation",
    icon: "Send",
    path: "/sales",
    color: "#E57373",
  },
  genchat: {
    name: "GenChat",
    description: "AI Qualification",
    icon: "MessageSquare",
    path: "/chat",
    color: "oklch(0.65 0.20 145)",
  },
  genfin: {
    name: "GenFin",
    description: "Financial Management",
    icon: "DollarSign",
    path: "/finance",
    color: "oklch(0.75 0.18 65)",
  },
  genhr: {
    name: "GenHR",
    description: "HR Management",
    icon: "Users",
    path: "/hr",
    color: "oklch(0.55 0.25 310)",
  },
  gendo: {
    name: "GenDo",
    description: "Task Management",
    icon: "CheckSquare",
    path: "/do",
    color: "oklch(0.60 0.22 200)",
  },
};

/**
 * Gets the current product from the URL path.
 */
export function getCurrentProduct(pathname: string): ProductId | null {
  if (pathname.startsWith("/sales")) return "gensales";
  if (pathname.startsWith("/chat")) return "genchat";
  if (pathname.startsWith("/finance")) return "genfin";
  if (pathname.startsWith("/hr")) return "genhr";
  if (pathname.startsWith("/do")) return "gendo";
  return null;
}

/**
 * Gets the product configuration by ID.
 */
export function getProductConfig(productId: ProductId) {
  return productConfig[productId];
}

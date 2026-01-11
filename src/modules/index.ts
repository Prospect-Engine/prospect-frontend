/**
 * GENIEFY MODULES
 * ===============
 * Central export for all product modules.
 *
 * Each module is independent and contains:
 * - components/ - Module-specific React components
 * - hooks/ - Module-specific custom hooks
 * - lib/ - Module-specific utilities
 * - types/ - Module-specific TypeScript types
 * - pages/ - Page components (for migration)
 *
 * All modules share:
 * - @/theme - Unified design system
 * - @/shared - Shared utilities and components
 */

// Module configurations
export { genSalesConfig, MODULE_ID as GENSALES_ID } from "./gensales";
export { genChatConfig, MODULE_ID as GENCHAT_ID } from "./genchat";
export { genFinConfig, MODULE_ID as GENFIN_ID } from "./genfin";
export { genHrConfig, MODULE_ID as GENHR_ID } from "./genhr";
export { genDoConfig, MODULE_ID as GENDO_ID } from "./gendo";
export { genMarketingConfig, MODULE_ID as GENMARKETING_ID } from "./genmarketing";

// Import all configs
import { genSalesConfig } from "./gensales";
import { genChatConfig } from "./genchat";
import { genFinConfig } from "./genfin";
import { genHrConfig } from "./genhr";
import { genDoConfig } from "./gendo";
import { genMarketingConfig } from "./genmarketing";

// Module type
export type ModuleId = "gensales" | "genchat" | "genfin" | "genhr" | "gendo" | "genmarketing";

// All modules configuration
export const modules = {
  gensales: genSalesConfig,
  genchat: genChatConfig,
  genfin: genFinConfig,
  genhr: genHrConfig,
  gendo: genDoConfig,
  genmarketing: genMarketingConfig,
} as const;

// Get module by ID
export function getModule(id: ModuleId) {
  return modules[id];
}

// Get module by path
export function getModuleByPath(pathname: string): ModuleId | null {
  if (pathname.startsWith("/sales")) return "gensales";
  if (pathname.startsWith("/chat")) return "genchat";
  if (pathname.startsWith("/finance")) return "genfin";
  if (pathname.startsWith("/hr")) return "genhr";
  if (pathname.startsWith("/do")) return "gendo";
  if (pathname.startsWith("/marketing")) return "genmarketing";
  return null;
}

// Get all modules as array
export function getAllModules() {
  return Object.values(modules);
}

// Module metadata for product switcher
export const modulesList = [
  {
    id: "gensales" as const,
    name: "GenSales",
    description: "Outreach Automation",
    icon: "Send",
    path: "/sales",
    color: "#E57373",
    gradient: "linear-gradient(135deg, #E57373 0%, #EF9A9A 100%)",
  },
  {
    id: "genchat" as const,
    name: "GenChat",
    description: "AI Qualification",
    icon: "MessageSquare",
    path: "/chat",
    color: "oklch(0.65 0.20 145)",
    gradient: "linear-gradient(135deg, #34c759 0%, #30d158 100%)",
  },
  {
    id: "genfin" as const,
    name: "GenFin",
    description: "Financial Management",
    icon: "DollarSign",
    path: "/finance",
    color: "oklch(0.75 0.18 65)",
    gradient: "linear-gradient(135deg, #ff9500 0%, #ffcc00 100%)",
  },
  {
    id: "genhr" as const,
    name: "GenHR",
    description: "HR Management",
    icon: "Users",
    path: "/hr",
    color: "oklch(0.55 0.25 310)",
    gradient: "linear-gradient(135deg, #af52de 0%, #bf5af2 100%)",
  },
  {
    id: "gendo" as const,
    name: "GenDo",
    description: "Task Management",
    icon: "CheckSquare",
    path: "/do",
    color: "oklch(0.60 0.22 200)",
    gradient: "linear-gradient(135deg, #5ac8fa 0%, #64d2ff 100%)",
  },
  {
    id: "genmarketing" as const,
    name: "GenMarketing",
    description: "AI Marketing Suite",
    icon: "Megaphone",
    path: "/marketing",
    color: "#00BCD4",
    gradient: "linear-gradient(135deg, #00BCD4 0%, #26C6DA 100%)",
  },
] as const;

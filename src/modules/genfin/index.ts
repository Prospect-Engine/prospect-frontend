/**
 * GENFIN MODULE
 * =============
 * Financial management platform for SMBs.
 *
 * Features:
 * - Financial dashboard
 * - Transaction management
 * - Invoice management
 * - Expense tracking
 * - Client management
 * - Financial reports
 * - Budget planning
 *
 * This module is independent and imports only from:
 * - @/theme (unified design system)
 * - @/shared (shared utilities and components)
 */

export const MODULE_ID = "genfin" as const;
export const MODULE_NAME = "GenFin";
export const MODULE_DESCRIPTION = "Financial Management";
export const MODULE_PATH = "/finance";
export const MODULE_COLOR = "oklch(0.75 0.18 65)";
export const MODULE_ICON = "DollarSign";

// Module configuration
export const genFinConfig = {
  id: MODULE_ID,
  name: MODULE_NAME,
  description: MODULE_DESCRIPTION,
  path: MODULE_PATH,
  color: MODULE_COLOR,
  icon: MODULE_ICON,

  // Navigation items for this module
  navigation: [
    { label: "Dashboard", path: "/finance", icon: "LayoutDashboard" },
    { label: "Transactions", path: "/finance/transactions", icon: "ArrowLeftRight" },
    { label: "Invoices", path: "/finance/invoices", icon: "FileText" },
    { label: "Expenses", path: "/finance/expenses", icon: "Receipt" },
    { label: "Clients", path: "/finance/clients", icon: "Users" },
    {
      label: "Reports",
      icon: "BarChart3",
      children: [
        { label: "Revenue", path: "/finance/reports/revenue", icon: "TrendingUp" },
        { label: "Expenses", path: "/finance/reports/expenses", icon: "TrendingDown" },
        { label: "Cash Flow", path: "/finance/reports/cash-flow", icon: "Wallet" },
        { label: "Profit & Loss", path: "/finance/reports/pnl", icon: "PieChart" },
      ],
    },
    { label: "Budgets", path: "/finance/budgets", icon: "Calculator" },
    { label: "Settings", path: "/finance/settings", icon: "Settings" },
  ],

  // Feature flags
  features: {
    transactions: true,
    invoices: true,
    expenses: true,
    clients: true,
    reports: true,
    budgets: true,
    multiCurrency: true,
    taxReports: true,
  },
} as const;

// Re-export module components (will be populated as we migrate)
// export * from "./components";
// export * from "./hooks";
// export * from "./lib";
// export * from "./types";

/**
 * GENSALES MODULE
 * ================
 * Multi-channel outreach automation platform.
 *
 * Features:
 * - Campaign management
 * - Sequence builder
 * - Unified inbox
 * - LinkedIn, Email, WhatsApp integrations
 * - Sales (leads, deals, pipeline)
 * - Analytics & reporting
 *
 * This module is independent and imports only from:
 * - @/theme (unified design system)
 * - @/shared (shared utilities and components)
 */

export const MODULE_ID = "gensales" as const;
export const MODULE_NAME = "GenSales";
export const MODULE_DESCRIPTION = "Outreach Automation";
export const MODULE_PATH = "/sales";
export const MODULE_COLOR = "#E57373";
export const MODULE_ICON = "Send";

// Module configuration
export const genSalesConfig = {
  id: MODULE_ID,
  name: MODULE_NAME,
  description: MODULE_DESCRIPTION,
  path: MODULE_PATH,
  color: MODULE_COLOR,
  icon: MODULE_ICON,

  // Navigation items for this module
  navigation: [
    { label: "Dashboard", path: "/sales", icon: "LayoutDashboard" },
    { label: "Campaigns", path: "/sales/campaigns", icon: "Megaphone" },
    { label: "Inbox", path: "/sales/inbox", icon: "Inbox" },
    { label: "Templates", path: "/sales/templates", icon: "FileText" },
    {
      label: "Sales",
      icon: "Users",
      children: [
        { label: "Leads", path: "/sales/leads", icon: "UserPlus" },
        { label: "Companies", path: "/sales/companies", icon: "Building2" },
        { label: "Deals", path: "/sales/deals", icon: "Handshake" },
        { label: "Pipeline", path: "/sales/pipeline", icon: "GitBranch" },
        { label: "Tasks", path: "/sales/tasks", icon: "CheckSquare" },
      ],
    },
    { label: "Analytics", path: "/sales/analytics", icon: "BarChart3" },
    {
      label: "Settings",
      icon: "Settings",
      children: [
        { label: "Integrations", path: "/sales/settings/integrations", icon: "Plug" },
        { label: "Workspaces", path: "/sales/settings/workspaces", icon: "Users" },
        { label: "Organization", path: "/sales/settings/organization", icon: "Building" },
      ],
    },
  ],

  // Feature flags
  features: {
    campaigns: true,
    inbox: true,
    sales: true,
    analytics: true,
    integrations: ["linkedin", "gmail", "whatsapp", "outlook"],
  },
} as const;

// Re-export module components (will be populated as we migrate)
// export * from "./components";
// export * from "./hooks";
// export * from "./lib";
// export * from "./types";

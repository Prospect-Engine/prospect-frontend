/**
 * GENMARKETING MODULE
 * ===================
 * AI-powered marketing suite for content creation and social media management.
 *
 * Features:
 * - Social Media Hub (multi-platform scheduling & publishing)
 * - AI Content Studio (generate marketing content)
 * - Content Calendar (plan and organize)
 * - SEO Tools (keyword research & optimization)
 * - CRM Integration (sync with GenSales)
 *
 * This module is independent and imports only from:
 * - @/theme (unified design system)
 * - @/shared (shared utilities and components)
 */

export const MODULE_ID = "genmarketing" as const;
export const MODULE_NAME = "GenMarketing";
export const MODULE_DESCRIPTION = "AI Marketing Suite";
export const MODULE_PATH = "/marketing";
export const MODULE_COLOR = "#00BCD4";
export const MODULE_ICON = "Megaphone";

// Module configuration
export const genMarketingConfig = {
  id: MODULE_ID,
  name: MODULE_NAME,
  description: MODULE_DESCRIPTION,
  path: MODULE_PATH,
  color: MODULE_COLOR,
  icon: MODULE_ICON,

  // Navigation items for this module
  navigation: [
    { label: "Dashboard", path: "/marketing", icon: "LayoutDashboard" },
    {
      label: "Social Media",
      icon: "Share2",
      children: [
        { label: "Social Hub", path: "/marketing/social", icon: "Globe" },
        { label: "Accounts", path: "/marketing/social/accounts", icon: "Users" },
        { label: "Compose", path: "/marketing/social/compose", icon: "PenSquare" },
        { label: "Analytics", path: "/marketing/social/analytics", icon: "BarChart3" },
      ],
    },
    {
      label: "AI Content",
      icon: "Sparkles",
      children: [
        { label: "Content Studio", path: "/marketing/content", icon: "Wand2" },
        { label: "AI Writer", path: "/marketing/content/writer", icon: "Bot" },
        { label: "Media Library", path: "/marketing/content/library", icon: "Image" },
      ],
    },
    { label: "Calendar", path: "/marketing/calendar", icon: "Calendar" },
    {
      label: "SEO Tools",
      icon: "Search",
      children: [
        { label: "SEO Dashboard", path: "/marketing/seo", icon: "TrendingUp" },
        { label: "Keywords", path: "/marketing/seo/keywords", icon: "Key" },
        { label: "Analyzer", path: "/marketing/seo/analyzer", icon: "FileSearch" },
      ],
    },
    {
      label: "Settings",
      icon: "Settings",
      children: [
        { label: "Integrations", path: "/marketing/settings/integrations", icon: "Plug" },
        { label: "Preferences", path: "/marketing/settings/preferences", icon: "Sliders" },
      ],
    },
  ],

  // Feature flags
  features: {
    socialMedia: true,
    aiContent: true,
    calendar: true,
    seo: true,
    integrations: ["facebook", "instagram", "linkedin", "twitter", "tiktok"],
  },
} as const;

// Re-export module components (will be populated as we build)
// export * from "./components";
// export * from "./hooks";
// export * from "./lib";
// export * from "./types";

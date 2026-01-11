/**
 * GENCHAT MODULE
 * ==============
 * AI-powered conversational platform for qualification and research.
 *
 * Features:
 * - Lead qualification (BANT scoring)
 * - AI recruiting interviews
 * - Customer feedback collection
 * - User research interviews
 * - Event registration
 * - Employee onboarding
 * - Customer support widget
 *
 * This module is independent and imports only from:
 * - @/theme (unified design system)
 * - @/shared (shared utilities and components)
 */

export const MODULE_ID = "genchat" as const;
export const MODULE_NAME = "GenChat";
export const MODULE_DESCRIPTION = "AI Qualification";
export const MODULE_PATH = "/chat";
export const MODULE_COLOR = "oklch(0.65 0.20 145)";
export const MODULE_ICON = "MessageSquare";

// Module configuration
export const genChatConfig = {
  id: MODULE_ID,
  name: MODULE_NAME,
  description: MODULE_DESCRIPTION,
  path: MODULE_PATH,
  color: MODULE_COLOR,
  icon: MODULE_ICON,

  // Navigation items for this module
  navigation: [
    { label: "Dashboard", path: "/chat", icon: "LayoutDashboard" },
    {
      label: "Lead Gen",
      icon: "Target",
      children: [
        { label: "Projects", path: "/chat/lead-gen/projects", icon: "FolderOpen" },
        { label: "Leads", path: "/chat/lead-gen/leads", icon: "Users" },
      ],
    },
    {
      label: "Recruiting",
      icon: "Briefcase",
      children: [
        { label: "Jobs", path: "/chat/recruiting/jobs", icon: "FileText" },
        { label: "Candidates", path: "/chat/recruiting/candidates", icon: "UserPlus" },
        { label: "Interviews", path: "/chat/recruiting/interviews", icon: "Video" },
      ],
    },
    {
      label: "Feedback",
      icon: "MessageCircle",
      children: [
        { label: "Surveys", path: "/chat/feedback/surveys", icon: "ClipboardList" },
        { label: "Responses", path: "/chat/feedback/responses", icon: "Inbox" },
      ],
    },
    {
      label: "Research",
      icon: "Search",
      children: [
        { label: "Studies", path: "/chat/research/studies", icon: "BookOpen" },
        { label: "Sessions", path: "/chat/research/sessions", icon: "Users" },
        { label: "Insights", path: "/chat/research/insights", icon: "Lightbulb" },
      ],
    },
    {
      label: "Events",
      icon: "Calendar",
      children: [
        { label: "Events", path: "/chat/events", icon: "CalendarDays" },
        { label: "Registrations", path: "/chat/events/registrations", icon: "Ticket" },
      ],
    },
    {
      label: "Onboarding",
      icon: "UserCheck",
      children: [
        { label: "Programs", path: "/chat/onboarding/programs", icon: "GraduationCap" },
        { label: "New Hires", path: "/chat/onboarding/new-hires", icon: "UserPlus" },
      ],
    },
    {
      label: "Support",
      icon: "Headphones",
      children: [
        { label: "Widgets", path: "/chat/support/widgets", icon: "MessageSquare" },
        { label: "Tickets", path: "/chat/support/tickets", icon: "Ticket" },
        { label: "Knowledge Base", path: "/chat/support/kb", icon: "Book" },
      ],
    },
    { label: "Settings", path: "/chat/settings", icon: "Settings" },
  ],

  // Feature flags
  features: {
    leadGen: true,
    recruiting: true,
    feedback: true,
    research: true,
    events: true,
    onboarding: true,
    support: true,
    aiProviders: ["openai", "anthropic", "google"],
  },
} as const;

// Re-export module components (will be populated as we migrate)
// export * from "./components";
// export * from "./hooks";
// export * from "./lib";
// export * from "./types";

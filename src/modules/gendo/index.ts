/**
 * GENDO MODULE
 * ============
 * Task and project management platform.
 *
 * Features:
 * - Project management
 * - Task management
 * - Kanban boards
 * - Team collaboration
 * - Time tracking
 * - Activity feeds
 *
 * This module is independent and imports only from:
 * - @/theme (unified design system)
 * - @/shared (shared utilities and components)
 */

export const MODULE_ID = "gendo" as const;
export const MODULE_NAME = "GenDo";
export const MODULE_DESCRIPTION = "Task Management";
export const MODULE_PATH = "/do";
export const MODULE_COLOR = "oklch(0.60 0.22 200)";
export const MODULE_ICON = "CheckSquare";

// Module configuration
export const genDoConfig = {
  id: MODULE_ID,
  name: MODULE_NAME,
  description: MODULE_DESCRIPTION,
  path: MODULE_PATH,
  color: MODULE_COLOR,
  icon: MODULE_ICON,

  // Navigation items for this module
  navigation: [
    { label: "Dashboard", path: "/do", icon: "LayoutDashboard" },
    { label: "My Tasks", path: "/do/tasks", icon: "CheckSquare" },
    {
      label: "Projects",
      icon: "FolderOpen",
      children: [
        { label: "All Projects", path: "/do/projects", icon: "Folder" },
        { label: "New Project", path: "/do/projects/new", icon: "Plus" },
      ],
    },
    { label: "Calendar", path: "/do/calendar", icon: "Calendar" },
    { label: "Team", path: "/do/team", icon: "Users" },
    {
      label: "Reports",
      icon: "BarChart3",
      children: [
        { label: "Overview", path: "/do/reports", icon: "PieChart" },
        { label: "Time Tracking", path: "/do/reports/time", icon: "Clock" },
        { label: "Productivity", path: "/do/reports/productivity", icon: "TrendingUp" },
      ],
    },
    { label: "Settings", path: "/do/settings", icon: "Settings" },
  ],

  // Feature flags
  features: {
    projects: true,
    tasks: true,
    kanban: true,
    calendar: true,
    team: true,
    timeTracking: true,
    reports: true,
    subtasks: true,
    labels: true,
    comments: true,
  },

  // Task statuses
  taskStatuses: [
    { id: "TODO", label: "To Do", color: "gray" },
    { id: "IN_PROGRESS", label: "In Progress", color: "blue" },
    { id: "IN_REVIEW", label: "In Review", color: "yellow" },
    { id: "DONE", label: "Done", color: "green" },
  ],

  // Task priorities
  taskPriorities: [
    { id: "LOW", label: "Low", color: "gray" },
    { id: "MEDIUM", label: "Medium", color: "blue" },
    { id: "HIGH", label: "High", color: "orange" },
    { id: "URGENT", label: "Urgent", color: "red" },
  ],
} as const;

// Re-export module components (will be populated as we migrate)
// export * from "./components";
// export * from "./hooks";
// export * from "./lib";
// export * from "./types";

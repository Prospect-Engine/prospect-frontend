/**
 * GENHR MODULE
 * ============
 * Human Resources management platform for SMBs.
 *
 * Features:
 * - Employee directory
 * - Leave management
 * - Attendance tracking
 * - Payroll processing
 * - Recruitment/ATS
 * - Performance reviews
 * - Reports & analytics
 *
 * This module is independent and imports only from:
 * - @/theme (unified design system)
 * - @/shared (shared utilities and components)
 */

export const MODULE_ID = "genhr" as const;
export const MODULE_NAME = "GenHR";
export const MODULE_DESCRIPTION = "HR Management";
export const MODULE_PATH = "/hr";
export const MODULE_COLOR = "oklch(0.55 0.25 310)";
export const MODULE_ICON = "Users";

// Module configuration
export const genHrConfig = {
  id: MODULE_ID,
  name: MODULE_NAME,
  description: MODULE_DESCRIPTION,
  path: MODULE_PATH,
  color: MODULE_COLOR,
  icon: MODULE_ICON,

  // Navigation items for this module
  navigation: [
    { label: "Dashboard", path: "/hr", icon: "LayoutDashboard" },
    { label: "Employees", path: "/hr/employees", icon: "Users" },
    {
      label: "Leave",
      icon: "Calendar",
      children: [
        { label: "Requests", path: "/hr/leave", icon: "CalendarDays" },
        { label: "Balances", path: "/hr/leave/balances", icon: "Clock" },
        { label: "Policies", path: "/hr/leave/policies", icon: "FileText" },
      ],
    },
    { label: "Attendance", path: "/hr/attendance", icon: "Clock" },
    {
      label: "Payroll",
      icon: "Wallet",
      children: [
        { label: "Run Payroll", path: "/hr/payroll", icon: "DollarSign" },
        { label: "History", path: "/hr/payroll/history", icon: "History" },
        { label: "Settings", path: "/hr/payroll/settings", icon: "Settings" },
      ],
    },
    {
      label: "Recruitment",
      icon: "Briefcase",
      children: [
        { label: "Jobs", path: "/hr/recruitment", icon: "FileText" },
        { label: "Candidates", path: "/hr/recruitment/candidates", icon: "UserPlus" },
        { label: "Pipeline", path: "/hr/recruitment/pipeline", icon: "GitBranch" },
      ],
    },
    {
      label: "Performance",
      icon: "Target",
      children: [
        { label: "Reviews", path: "/hr/performance", icon: "Star" },
        { label: "Goals", path: "/hr/performance/goals", icon: "Flag" },
        { label: "Feedback", path: "/hr/performance/feedback", icon: "MessageSquare" },
      ],
    },
    { label: "Reports", path: "/hr/reports", icon: "BarChart3" },
    { label: "Settings", path: "/hr/settings", icon: "Settings" },
  ],

  // Feature flags
  features: {
    employees: true,
    leave: true,
    attendance: true,
    payroll: true,
    recruitment: true,
    performance: true,
    reports: true,
    selfService: true,
    orgChart: true,
  },
} as const;

// Re-export module components (will be populated as we migrate)
// export * from "./components";
// export * from "./hooks";
// export * from "./lib";
// export * from "./types";

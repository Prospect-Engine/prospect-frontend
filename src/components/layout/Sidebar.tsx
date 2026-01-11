"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CreditCard,
  Megaphone,
  Users,
  MessageSquare,
  Wrench,
  BarChart3,
  Mail,
  Smartphone,
  Layout,
  UserX,
  PieChart,
  History,
  Inbox,
  MessageCircle,
  Zap,
  Building2,
  UserPlusIcon,
  UserCheckIcon,
  ListTodo,
  DollarSign,
  Search,
  Sparkles,
  Send,
  Bot,
  Banknote,
  UserCog,
  CheckSquare,
  FileText,
  Receipt,
  Wallet,
  CalendarDays,
  Clock,
  Briefcase,
  GraduationCap,
  ClipboardList,
  Kanban,
  Timer,
  FolderKanban,
  Share2,
  Globe,
  PenSquare,
  Wand2,
  Image,
  Calendar,
  TrendingUp,
  Key,
  FileSearch,
  Plug,
  Sliders,
  CalendarCheck,
  FormInput,
  Handshake,
  Activity,
  Lightbulb,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useMemo } from "react";
import { AuthService } from "@/lib/auth";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/context/AuthContext";
import { type ModuleId } from "@/modules";

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  description?: string;
}

interface ServiceNav {
  id: string;
  name: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  basePath: string;
  items: NavItem[];
}

// Product configurations with their navigation
const productConfigs: Record<ModuleId, { name: string; icon: LucideIcon; color: string; services: ServiceNav[] }> = {
  gensales: {
    name: "GenSales",
    icon: Send,
    color: "#E57373",  // Light coral/red
    services: [
      {
        id: "crm",
        name: "CRM",
        icon: Users,
        color: "text-purple-600",
        bgColor: "bg-purple-50 dark:bg-purple-500/10",
        basePath: "/sales",
        items: [
          { name: "All Leads", href: "/sales/leads", icon: UserPlusIcon },
          { name: "Companies", href: "/sales/companies", icon: Building2 },
          { name: "Pipeline", href: "/sales/pipeline", icon: UserCheckIcon },
          { name: "Deals", href: "/sales/deals", icon: Handshake },
          { name: "Chatforms", href: "/sales/chatforms", icon: Bot },
          { name: "Appointments", href: "/sales/appointments", icon: CalendarCheck },
          { name: "Analytics", href: "/sales/analytics", icon: BarChart3 },
        ],
      },
      {
        id: "outreach",
        name: "Outreach",
        icon: Megaphone,
        color: "text-green-600",
        bgColor: "bg-green-50 dark:bg-green-500/10",
        basePath: "/outreach",
        items: [
          { name: "Campaigns", href: "/outreach/campaigns", icon: Mail },
          { name: "Templates", href: "/outreach/templates", icon: Smartphone },
          { name: "Analytics", href: "/outreach/analytics", icon: BarChart3 },
        ],
      },
      {
        id: "inbox",
        name: "Unified Inbox",
        icon: Inbox,
        color: "text-orange-600",
        bgColor: "bg-orange-50 dark:bg-orange-500/10",
        basePath: "/conversations/inbox",
        items: [],
      },
    ],
  },
  genchat: {
    name: "Qualify",
    icon: Bot,
    color: "#81C784",  // Light green
    services: [],
  },
  genfin: {
    name: "GenFin",
    icon: Banknote,
    color: "#FFB74D",  // Light orange
    services: [
      {
        id: "dashboard",
        name: "Overview",
        icon: PieChart,
        color: "text-amber-600",
        bgColor: "bg-amber-50 dark:bg-amber-500/10",
        basePath: "/finance",
        items: [
          { name: "Dashboard", href: "/finance", icon: LayoutDashboard },
          { name: "Reports", href: "/finance/reports", icon: BarChart3 },
        ],
      },
      {
        id: "invoicing",
        name: "Invoicing",
        icon: FileText,
        color: "text-orange-600",
        bgColor: "bg-orange-50 dark:bg-orange-500/10",
        basePath: "/finance/invoices",
        items: [
          { name: "Invoices", href: "/finance/invoices", icon: FileText },
          { name: "Recurring", href: "/finance/invoices/recurring", icon: History },
          { name: "Quotes", href: "/finance/quotes", icon: Receipt },
        ],
      },
      {
        id: "expenses",
        name: "Expenses",
        icon: Receipt,
        color: "text-red-600",
        bgColor: "bg-red-50 dark:bg-red-500/10",
        basePath: "/finance/expenses",
        items: [
          { name: "All Expenses", href: "/finance/expenses", icon: Receipt },
          { name: "Categories", href: "/finance/expenses/categories", icon: ListTodo },
        ],
      },
      {
        id: "accounts",
        name: "Accounts",
        icon: Wallet,
        color: "text-yellow-600",
        bgColor: "bg-yellow-50 dark:bg-yellow-500/10",
        basePath: "/finance/accounts",
        items: [
          { name: "Bank Accounts", href: "/finance/accounts", icon: Wallet },
          { name: "Transactions", href: "/finance/transactions", icon: History },
          { name: "Budgets", href: "/finance/budgets", icon: DollarSign },
        ],
      },
    ],
  },
  genhr: {
    name: "GenHR",
    icon: UserCog,
    color: "#BA68C8",  // Light purple
    services: [
      {
        id: "dashboard",
        name: "Overview",
        icon: PieChart,
        color: "text-purple-600",
        bgColor: "bg-purple-50 dark:bg-purple-500/10",
        basePath: "/hr",
        items: [
          { name: "Dashboard", href: "/hr", icon: LayoutDashboard },
          { name: "Org Chart", href: "/hr/org-chart", icon: Users },
        ],
      },
      {
        id: "employees",
        name: "Employees",
        icon: Users,
        color: "text-violet-600",
        bgColor: "bg-violet-50 dark:bg-violet-500/10",
        basePath: "/hr/employees",
        items: [
          { name: "Directory", href: "/hr/employees", icon: Users },
          { name: "Departments", href: "/hr/departments", icon: Building2 },
          { name: "Positions", href: "/hr/positions", icon: Briefcase },
        ],
      },
      {
        id: "attendance",
        name: "Attendance",
        icon: Clock,
        color: "text-fuchsia-600",
        bgColor: "bg-fuchsia-50 dark:bg-fuchsia-500/10",
        basePath: "/hr/attendance",
        items: [
          { name: "Time Tracking", href: "/hr/attendance", icon: Clock },
          { name: "Leave Requests", href: "/hr/leave", icon: CalendarDays },
          { name: "Calendar", href: "/hr/calendar", icon: CalendarDays },
        ],
      },
      {
        id: "payroll",
        name: "Payroll",
        icon: DollarSign,
        color: "text-pink-600",
        bgColor: "bg-pink-50 dark:bg-pink-500/10",
        basePath: "/hr/payroll",
        items: [
          { name: "Payroll", href: "/hr/payroll", icon: DollarSign },
          { name: "Payslips", href: "/hr/payslips", icon: FileText },
        ],
      },
      {
        id: "recruiting",
        name: "AI Recruiting",
        icon: Bot,
        color: "text-blue-600",
        bgColor: "bg-blue-50 dark:bg-blue-500/10",
        basePath: "/hr/recruiting",
        items: [
          { name: "Dashboard", href: "/hr/recruiting", icon: LayoutDashboard },
          { name: "Jobs", href: "/hr/recruiting/jobs", icon: Briefcase },
          { name: "Candidates", href: "/hr/recruiting/candidates", icon: Users },
          { name: "Interviews", href: "/hr/recruiting/interviews", icon: CalendarDays },
          { name: "Pipeline", href: "/hr/recruiting/pipeline", icon: BarChart3 },
        ],
      },
      {
        id: "recruitment",
        name: "Recruitment",
        icon: GraduationCap,
        color: "text-rose-600",
        bgColor: "bg-rose-50 dark:bg-rose-500/10",
        basePath: "/hr/recruitment",
        items: [
          { name: "Jobs", href: "/hr/jobs", icon: Briefcase },
          { name: "Applications", href: "/hr/applications", icon: Inbox },
          { name: "Interviews", href: "/hr/interviews", icon: CalendarDays },
        ],
      },
    ],
  },
  gendo: {
    name: "GenDo",
    icon: CheckSquare,
    color: "#64B5F6",  // Light blue
    services: [
      {
        id: "dashboard",
        name: "Overview",
        icon: PieChart,
        color: "text-blue-600",
        bgColor: "bg-blue-50 dark:bg-blue-500/10",
        basePath: "/tasks",
        items: [
          { name: "Dashboard", href: "/tasks", icon: LayoutDashboard },
          { name: "My Tasks", href: "/tasks/my-tasks", icon: CheckSquare },
        ],
      },
      {
        id: "projects",
        name: "Projects",
        icon: FolderKanban,
        color: "text-indigo-600",
        bgColor: "bg-indigo-50 dark:bg-indigo-500/10",
        basePath: "/tasks/projects",
        items: [
          { name: "All Projects", href: "/tasks/projects", icon: FolderKanban },
          { name: "Create Project", href: "/tasks/projects/new", icon: Sparkles },
        ],
      },
      {
        id: "boards",
        name: "Boards",
        icon: Kanban,
        color: "text-sky-600",
        bgColor: "bg-sky-50 dark:bg-sky-500/10",
        basePath: "/tasks/boards",
        items: [
          { name: "Kanban Boards", href: "/tasks/boards", icon: Kanban },
        ],
      },
      {
        id: "time",
        name: "Time Tracking",
        icon: Timer,
        color: "text-cyan-600",
        bgColor: "bg-cyan-50 dark:bg-cyan-500/10",
        basePath: "/tasks/time",
        items: [
          { name: "Time Entries", href: "/tasks/time", icon: Timer },
          { name: "Reports", href: "/tasks/time/reports", icon: BarChart3 },
        ],
      },
    ],
  },
  genmarketing: {
    name: "GenMarketing",
    icon: Megaphone,
    color: "#00BCD4",  // Teal
    services: [
      {
        id: "social",
        name: "Social Media",
        icon: Share2,
        color: "text-cyan-600",
        bgColor: "bg-cyan-50 dark:bg-cyan-500/10",
        basePath: "/marketing/social",
        items: [
          { name: "Social Hub", href: "/marketing/social", icon: Globe },
          { name: "Accounts", href: "/marketing/social/accounts", icon: Users },
          { name: "Compose", href: "/marketing/social/compose", icon: PenSquare },
          { name: "Analytics", href: "/marketing/social/analytics", icon: BarChart3 },
        ],
      },
      {
        id: "content",
        name: "AI Content",
        icon: Sparkles,
        color: "text-teal-600",
        bgColor: "bg-teal-50 dark:bg-teal-500/10",
        basePath: "/marketing/content",
        items: [
          { name: "Content Studio", href: "/marketing/content", icon: Wand2 },
          { name: "AI Writer", href: "/marketing/content/writer", icon: Bot },
          { name: "Media Library", href: "/marketing/content/library", icon: Image },
        ],
      },
      {
        id: "calendar",
        name: "Calendar",
        icon: Calendar,
        color: "text-emerald-600",
        bgColor: "bg-emerald-50 dark:bg-emerald-500/10",
        basePath: "/marketing/calendar",
        items: [
          { name: "Content Calendar", href: "/marketing/calendar", icon: Calendar },
        ],
      },
      {
        id: "seo",
        name: "SEO Tools",
        icon: Search,
        color: "text-sky-600",
        bgColor: "bg-sky-50 dark:bg-sky-500/10",
        basePath: "/marketing/seo",
        items: [
          { name: "SEO Dashboard", href: "/marketing/seo", icon: TrendingUp },
          { name: "Keywords", href: "/marketing/seo/keywords", icon: Key },
          { name: "Analyzer", href: "/marketing/seo/analyzer", icon: FileSearch },
        ],
      },
      {
        id: "insights",
        name: "Insights",
        icon: Lightbulb,
        color: "text-amber-600",
        bgColor: "bg-amber-50 dark:bg-amber-500/10",
        basePath: "/marketing/insights",
        items: [
          { name: "Surveys", href: "/marketing/insights/surveys", icon: ClipboardList },
          { name: "Responses", href: "/marketing/insights/responses", icon: Inbox },
          { name: "Research", href: "/marketing/insights/research", icon: Search },
          { name: "Sessions", href: "/marketing/insights/sessions", icon: MessageCircle },
        ],
      },
      {
        id: "settings",
        name: "Settings",
        icon: Settings,
        color: "text-slate-600",
        bgColor: "bg-slate-50 dark:bg-slate-500/10",
        basePath: "/marketing/settings",
        items: [
          { name: "Integrations", href: "/marketing/settings/integrations", icon: Plug },
          { name: "Preferences", href: "/marketing/settings/preferences", icon: Sliders },
        ],
      },
    ],
  },
};

// Legacy services for backward compatibility (GenSales routes)
const services: ServiceNav[] = [
  {
    id: "crm",
    name: "CRM",
    icon: Users,
    color: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-500/10",
    basePath: "/sales",
    items: [
      { name: "All Leads", href: "/sales/leads", icon: UserPlusIcon },
      { name: "Companies", href: "/sales/companies", icon: Building2 },
      { name: "Pipeline", href: "/sales/pipeline", icon: UserCheckIcon },
      { name: "Deals", href: "/sales/deals", icon: Handshake },
      { name: "Chatforms", href: "/sales/chatforms", icon: Bot },
      { name: "Appointments", href: "/sales/appointments", icon: CalendarCheck },
      { name: "Analytics", href: "/sales/analytics", icon: BarChart3 },
    ],
  },
  {
    id: "outreach",
    name: "Outreach",
    icon: Megaphone,
    color: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-500/10",
    basePath: "/outreach",
    items: [
      { name: "Campaigns", href: "/outreach/campaigns", icon: Mail },
      { name: "Templates", href: "/outreach/templates", icon: Smartphone },
      { name: "Analytics", href: "/outreach/analytics", icon: BarChart3 },
    ],
  },
  {
    id: "inbox",
    name: "Unified Inbox",
    icon: Inbox,
    color: "text-orange-600",
    bgColor: "bg-orange-50 dark:bg-orange-500/10",
    basePath: "/conversations/inbox",
    items: [],
  },
];

// Settings section - Universal settings first, then app-specific
const settingsItems: NavItem[] = [
  { name: "Settings", href: "/settings", icon: Settings, description: "Universal settings" },
  { name: "Integrations", href: "/settings/integrations", icon: Zap },
  { name: "Billing", href: "/billing", icon: CreditCard },
];

interface SidebarProps {
  activePage?: string;
}

// Detect current product from pathname
function detectProduct(pathname: string): ModuleId {
  if (pathname.startsWith("/finance")) return "genfin";
  if (pathname.startsWith("/hr")) return "genhr";
  if (pathname.startsWith("/tasks")) return "gendo";
  if (pathname.startsWith("/marketing")) return "genmarketing";
  // Default to gensales for /sales, /dashboard, /outreach, etc.
  return "gensales";
}

export function Sidebar({ activePage }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname() || "";
  const [collapsed, setCollapsed] = useState(false);
  const [expandedServices, setExpandedServices] = useState<string[]>([]);
  const [settingsExpanded, setSettingsExpanded] = useState(false);
  const { user } = useAuth();
  const { permissions } = usePermissions();

  // Detect current product
  const currentProduct = detectProduct(pathname);
  const productConfig = productConfigs[currentProduct];
  const activeServices = productConfig?.services || services;

  // Permission checks
  const isImpersonated = !!user?.is_impersonate && !!user?.workspace_id;
  const notOwner = user?.role !== "OWNER";
  const hasViewBillingPermission = permissions?.includes("VIEW_BILLING");
  const hasIntegrateAccountPermission = permissions?.includes("INTEGRATE_ACCOUNT");
  const hasManageTeamsPermission = permissions?.includes("MANAGE_TEAMS");

  // Filter settings items based on permissions
  const filteredSettingsItems = useMemo(() => {
    return settingsItems.filter((item) => {
      if (item.name === "Billing" && isImpersonated && notOwner && !hasViewBillingPermission) {
        return false;
      }
      if (item.name === "Integrations" && isImpersonated && notOwner && !hasIntegrateAccountPermission) {
        return false;
      }
      return true;
    });
  }, [isImpersonated, notOwner, hasViewBillingPermission, hasIntegrateAccountPermission]);

  // Auto-expand service if user navigates to one of its pages (only on route change)
  useEffect(() => {
    const activeService = services.find(
      (service) =>
        pathname.startsWith(service.basePath) ||
        service.items.some((item) => pathname.startsWith(item.href))
    );
    if (activeService) {
      setExpandedServices((prev) =>
        prev.includes(activeService.id) ? prev : [...prev, activeService.id]
      );
    }

    // Auto-expand settings if on a settings page
    const isOnSettingsPage = settingsItems.some((item) => pathname.startsWith(item.href));
    if (isOnSettingsPage) {
      setSettingsExpanded(true);
    }
  }, [pathname]); // Only run on pathname change, not on state changes

  const toggleService = (serviceId: string) => {
    setExpandedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const isServiceActive = (service: ServiceNav) => {
    return (
      pathname.startsWith(service.basePath) ||
      service.items.some((item) => pathname.startsWith(item.href))
    );
  };

  const handleLogout = async () => {
    await AuthService.logout();
    router.push("/auth");
  };

  return (
    <div
      className={cn(
        "flex flex-col h-screen transition-all duration-300 ease-out",
        "bg-white/80 backdrop-blur-xl border-r border-black/[0.06]",
        "dark:bg-[#1c1c1e]/80 dark:border-white/[0.08]",
        collapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto pt-2 pb-4 px-3 space-y-4">
        {/* Dashboard + Collapse Toggle Row */}
        <div className="flex items-center gap-2">
          <Link
            href={
              currentProduct === "gensales" ? "/sales" :
              currentProduct === "genfin" ? "/finance" :
              currentProduct === "genhr" ? "/hr" :
              currentProduct === "gendo" ? "/tasks" :
              currentProduct === "genmarketing" ? "/marketing" : "/sales"
            }
            className={cn(
              "group flex items-center gap-3 px-3 py-2.5 rounded-xl flex-1",
              "transition-all duration-200 ease-out",
              collapsed && "justify-center",
              (pathname === "/sales" || pathname === "/finance" || pathname === "/hr" || pathname === "/tasks" || pathname === "/marketing")
                ? "text-white shadow-md"
                : "text-muted-foreground hover:text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
            )}
            style={{
              backgroundColor: (pathname === "/sales" || pathname === "/finance" || pathname === "/hr" || pathname === "/tasks" || pathname === "/marketing")
                ? productConfig?.color || "#0071e3"
                : undefined,
              boxShadow: (pathname === "/sales" || pathname === "/finance" || pathname === "/hr" || pathname === "/tasks" || pathname === "/marketing")
                ? `0 4px 14px ${productConfig?.color || "#0071e3"}33`
                : undefined,
            }}
          >
            <LayoutDashboard className="h-[18px] w-[18px] flex-shrink-0" />
            {!collapsed && (
              <span className="text-[14px] font-medium">Dashboard</span>
            )}
          </Link>

          {/* Collapse Toggle Button */}
          {!collapsed && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCollapsed(!collapsed);
              }}
              className={cn(
                "p-2 rounded-xl transition-all duration-200 flex-shrink-0",
                "text-muted-foreground hover:text-foreground",
                "hover:bg-black/[0.04] dark:hover:bg-white/[0.06]",
                "active:scale-95"
              )}
              title="Collapse sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Expand button when collapsed */}
        {collapsed && (
          <div className="flex justify-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCollapsed(false);
              }}
              className={cn(
                "p-2 rounded-xl transition-all duration-200",
                "text-muted-foreground hover:text-foreground",
                "hover:bg-black/[0.04] dark:hover:bg-white/[0.06]",
                "active:scale-95"
              )}
              title="Expand sidebar"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Services Section */}
        <div>
          {!collapsed && (
            <h3 className="px-3 mb-2 text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
              {productConfig?.name || "Services"}
            </h3>
          )}
          <div className="space-y-1">
            {activeServices.map((service) => {
              const isExpanded = expandedServices.includes(service.id);
              const isActive = isServiceActive(service);
              const ServiceIcon = service.icon;

              return (
                <div key={service.id}>
                  {/* Service Header - same behavior for collapsed and expanded */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleService(service.id);
                    }}
                    className={cn(
                      "w-full group flex items-center gap-3 px-3 py-2.5 rounded-xl",
                      "transition-all duration-200 ease-out",
                      collapsed && "justify-center",
                      isActive
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                    )}
                  >
                    <div
                      className={cn(
                        "p-1.5 rounded-lg transition-all duration-200",
                        isActive ? service.bgColor : "bg-transparent"
                      )}
                    >
                      <ServiceIcon
                        className={cn(
                          "h-[16px] w-[16px] flex-shrink-0",
                          isActive ? service.color : ""
                        )}
                      />
                    </div>
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-[14px] font-medium text-left">
                          {service.name}
                        </span>
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 transition-transform duration-200",
                            isExpanded && "rotate-180"
                          )}
                        />
                      </>
                    )}
                  </button>

                  {/* Service Sub-items - show dropdown for both collapsed and expanded */}
                  {isExpanded && (
                    <div className={cn(
                      "mt-1 space-y-0.5",
                      collapsed
                        ? "px-1"
                        : "ml-4 border-l border-black/[0.06] dark:border-white/[0.08] pl-3"
                    )}>
                      {service.items.map((item) => {
                        const isItemActive = pathname === item.href ||
                          (item.href !== service.basePath && pathname.startsWith(item.href));
                        const ItemIcon = item.icon;

                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                              "group flex items-center gap-2.5 px-3 py-2 rounded-lg",
                              "transition-all duration-200 ease-out text-[13px]",
                              collapsed && "justify-center",
                              isItemActive
                                ? cn("font-medium", service.color, service.bgColor)
                                : "text-muted-foreground hover:text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                            )}
                            title={collapsed ? item.name : undefined}
                          >
                            <ItemIcon className="h-[14px] w-[14px] flex-shrink-0" />
                            {!collapsed && <span>{item.name}</span>}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Settings Section */}
        <div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSettingsExpanded(!settingsExpanded);
            }}
            className={cn(
              "w-full group flex items-center gap-3 px-3 py-2.5 rounded-xl",
              "transition-all duration-200 ease-out",
              collapsed && "justify-center",
              filteredSettingsItems.some((item) => pathname.startsWith(item.href))
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
            )}
          >
            <div
              className={cn(
                "p-1.5 rounded-lg transition-all duration-200",
                filteredSettingsItems.some((item) => pathname.startsWith(item.href))
                  ? "bg-slate-100 dark:bg-slate-500/10"
                  : "bg-transparent"
              )}
            >
              <Settings
                className={cn(
                  "h-[16px] w-[16px] flex-shrink-0",
                  filteredSettingsItems.some((item) => pathname.startsWith(item.href))
                    ? "text-slate-600"
                    : ""
                )}
              />
            </div>
            {!collapsed && (
              <>
                <span className="flex-1 text-[14px] font-medium text-left">
                  Settings
                </span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    settingsExpanded && "rotate-180"
                  )}
                />
              </>
            )}
          </button>

          {/* Settings Sub-items - show dropdown for both collapsed and expanded */}
          {settingsExpanded && (
            <div className={cn(
              "mt-1 space-y-0.5",
              collapsed
                ? "px-1"
                : "ml-4 border-l border-black/[0.06] dark:border-white/[0.08] pl-3"
            )}>
              {filteredSettingsItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                const ItemIcon = item.icon;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "group flex items-center gap-2.5 px-3 py-2 rounded-lg",
                      "transition-all duration-200 ease-out text-[13px]",
                      collapsed && "justify-center",
                      isActive
                        ? "font-medium text-slate-600 bg-slate-50 dark:bg-slate-500/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                    )}
                    title={collapsed ? item.name : undefined}
                  >
                    <ItemIcon className="h-[14px] w-[14px] flex-shrink-0" />
                    {!collapsed && <span className="flex-1">{item.name}</span>}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      {/* Sign Out */}
      <div className="p-3 border-t border-black/[0.06] dark:border-white/[0.08]">
        <button
          onClick={handleLogout}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl",
            "text-muted-foreground transition-all duration-200",
            "hover:text-[#ff3b30] hover:bg-[#ff3b30]/10",
            "active:scale-[0.98]",
            collapsed ? "justify-center" : "justify-start"
          )}
        >
          <LogOut className="h-[18px] w-[18px]" />
          {!collapsed && (
            <span className="text-[14px] font-medium">Sign Out</span>
          )}
        </button>
      </div>
    </div>
  );
}

export default Sidebar;

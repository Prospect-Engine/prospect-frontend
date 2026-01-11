"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Settings,
  LogOut,
  Brain,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Kanban,
  UsersRound,
  Calendar,
  Layers,
  CreditCard,
  Target,
  MessageSquare,
  Search,
  UserPlus,
  Sparkles,
  Plug,
  Webhook,
  BarChart3,
  Palette,
  Code2,
  FileText,
  ClipboardList,
  Lightbulb,
  CalendarDays,
  UserCheck,
  Headphones,
  BookOpen,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  comingSoon?: boolean;
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

interface NavSection {
  title: string;
  items: NavItem[];
}

// Services with equal treatment - each has expandable sub-items
const services: ServiceNav[] = [
  {
    id: "recruiting",
    name: "Recruiting",
    icon: Users,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-500/10",
    basePath: "/admin/recruiting",
    items: [
      { name: "Dashboard", href: "/admin/recruiting", icon: LayoutDashboard },
      { name: "Jobs", href: "/admin/jobs", icon: Briefcase },
      { name: "Pipeline", href: "/admin/pipeline", icon: Kanban },
      { name: "Candidates", href: "/admin/candidates", icon: Users },
      { name: "Pools", href: "/admin/pools", icon: Layers },
      { name: "Interviews", href: "/admin/interviews", icon: Calendar },
    ],
  },
  {
    id: "lead-gen",
    name: "Lead Gen",
    icon: Target,
    color: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-500/10",
    basePath: "/admin/lead-gen",
    items: [
      { name: "Dashboard", href: "/admin/lead-gen", icon: LayoutDashboard },
      { name: "Projects", href: "/admin/lead-gen/projects", icon: Target },
      { name: "Leads", href: "/admin/lead-gen/leads", icon: Users },
    ],
  },
  {
    id: "feedback",
    name: "Feedback",
    icon: MessageSquare,
    color: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-500/10",
    basePath: "/admin/feedback",
    items: [
      { name: "Dashboard", href: "/admin/feedback", icon: LayoutDashboard },
      { name: "Surveys", href: "/admin/feedback/surveys", icon: ClipboardList },
      { name: "Responses", href: "/admin/feedback/responses", icon: MessageSquare },
    ],
  },
  {
    id: "research",
    name: "Research",
    icon: Search,
    color: "text-orange-600",
    bgColor: "bg-orange-50 dark:bg-orange-500/10",
    basePath: "/admin/research",
    items: [
      { name: "Dashboard", href: "/admin/research", icon: LayoutDashboard },
      { name: "Studies", href: "/admin/research/studies", icon: FileText },
      { name: "Sessions", href: "/admin/research/sessions", icon: Users },
      { name: "Insights", href: "/admin/research/insights", icon: Lightbulb },
    ],
  },
  {
    id: "events",
    name: "Events",
    icon: CalendarDays,
    color: "text-pink-600",
    bgColor: "bg-pink-50 dark:bg-pink-500/10",
    basePath: "/admin/events",
    items: [
      { name: "Dashboard", href: "/admin/events", icon: LayoutDashboard },
      { name: "Events List", href: "/admin/events/list", icon: CalendarDays },
      { name: "Registrations", href: "/admin/events/registrations", icon: Users },
    ],
  },
  {
    id: "onboarding",
    name: "Onboarding",
    icon: UserPlus,
    color: "text-teal-600",
    bgColor: "bg-teal-50 dark:bg-teal-500/10",
    basePath: "/admin/onboarding",
    items: [
      { name: "Dashboard", href: "/admin/onboarding", icon: LayoutDashboard },
      { name: "Programs", href: "/admin/onboarding/programs", icon: ClipboardList },
      { name: "New Hires", href: "/admin/onboarding/new-hires", icon: UserCheck },
    ],
  },
  {
    id: "support",
    name: "Support",
    icon: Headphones,
    color: "text-cyan-600",
    bgColor: "bg-cyan-50 dark:bg-cyan-500/10",
    basePath: "/admin/widget",
    items: [
      { name: "Dashboard", href: "/admin/widget", icon: LayoutDashboard },
      { name: "Widgets", href: "/admin/widget/widgets", icon: Code2 },
      { name: "Tickets", href: "/admin/widget/tickets", icon: MessageSquare },
      { name: "Knowledge Base", href: "/admin/widget/knowledge-base", icon: BookOpen },
    ],
  },
];

// Settings section
const settingsItems: NavItem[] = [
  { name: "Team", href: "/admin/team", icon: UsersRound },
  { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { name: "Integrations", href: "/admin/integrations", icon: Plug },
  { name: "Webhooks", href: "/admin/webhooks", icon: Webhook },
  { name: "Branding", href: "/admin/branding", icon: Palette },
  { name: "AI Config", href: "/admin/settings/ai-config", icon: Brain },
  { name: "Billing", href: "/admin/billing", icon: CreditCard },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedServices, setExpandedServices] = useState<string[]>([]);
  const [settingsExpanded, setSettingsExpanded] = useState(false);

  // Auto-expand service if user is on one of its pages
  useEffect(() => {
    const activeService = services.find(
      (service) =>
        pathname.startsWith(service.basePath) ||
        service.items.some((item) => pathname.startsWith(item.href))
    );
    if (activeService && !expandedServices.includes(activeService.id)) {
      setExpandedServices((prev) => [...prev, activeService.id]);
    }

    // Auto-expand settings if on a settings page
    const isOnSettingsPage = settingsItems.some((item) => pathname.startsWith(item.href));
    if (isOnSettingsPage && !settingsExpanded) {
      setSettingsExpanded(true);
    }
  }, [pathname]);

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

  return (
    <div
      className={cn(
        "flex flex-col h-screen transition-all duration-300 ease-out",
        "bg-white/80 backdrop-blur-xl border-r border-black/[0.06]",
        "dark:bg-[#1c1c1e]/80 dark:border-white/[0.08]",
        collapsed ? "w-[72px]" : "w-[280px]"
      )}
    >
      {/* Logo Section */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-black/[0.06] dark:border-white/[0.08]">
        {!collapsed && (
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-2.5 group"
          >
            <div className="relative">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0071e3] to-[#00c7ff] flex items-center justify-center shadow-lg shadow-[#0071e3]/20">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
            </div>
            <span className="text-lg font-semibold tracking-tight text-foreground">
              ChatQualify
            </span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "p-2 rounded-xl transition-all duration-200",
            "text-muted-foreground hover:text-foreground",
            "hover:bg-black/[0.04] dark:hover:bg-white/[0.06]",
            "active:scale-95"
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {/* Overview Section */}
        <div>
          {!collapsed && (
            <h3 className="px-3 mb-2 text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
              Overview
            </h3>
          )}
          <Link
            href="/admin/dashboard"
            className={cn(
              "group flex items-center gap-3 px-3 py-2.5 rounded-xl",
              "transition-all duration-200 ease-out",
              pathname === "/admin/dashboard"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                : "text-muted-foreground hover:text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
            )}
          >
            <LayoutDashboard className="h-[18px] w-[18px] flex-shrink-0" />
            {!collapsed && (
              <span className="text-[14px] font-medium">Dashboard</span>
            )}
          </Link>
        </div>

        {/* Services Section - All 6 services with equal treatment */}
        <div>
          {!collapsed && (
            <h3 className="px-3 mb-2 text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
              Services
            </h3>
          )}
          <div className="space-y-1">
            {services.map((service) => {
              const isExpanded = expandedServices.includes(service.id);
              const isActive = isServiceActive(service);
              const ServiceIcon = service.icon;

              return (
                <div key={service.id}>
                  {/* Service Header - Clickable to expand/collapse */}
                  <button
                    onClick={() => !collapsed && toggleService(service.id)}
                    className={cn(
                      "w-full group flex items-center gap-3 px-3 py-2.5 rounded-xl",
                      "transition-all duration-200 ease-out",
                      collapsed
                        ? isActive
                          ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                          : "text-muted-foreground hover:text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                        : isActive
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

                  {/* Service Sub-items */}
                  {!collapsed && isExpanded && (
                    <div className="ml-4 mt-1 space-y-0.5 border-l border-black/[0.06] dark:border-white/[0.08] pl-3">
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
                              isItemActive
                                ? cn("font-medium", service.color, service.bgColor)
                                : "text-muted-foreground hover:text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                            )}
                          >
                            <ItemIcon className="h-[14px] w-[14px] flex-shrink-0" />
                            <span>{item.name}</span>
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

        {/* Settings Section - Collapsible */}
        <div>
          {/* Settings Header - Clickable to expand/collapse */}
          <button
            onClick={() => !collapsed && setSettingsExpanded(!settingsExpanded)}
            className={cn(
              "w-full group flex items-center gap-3 px-3 py-2.5 rounded-xl",
              "transition-all duration-200 ease-out",
              collapsed
                ? settingsItems.some((item) => pathname.startsWith(item.href))
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                : settingsItems.some((item) => pathname.startsWith(item.href))
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
            )}
          >
            <div
              className={cn(
                "p-1.5 rounded-lg transition-all duration-200",
                settingsItems.some((item) => pathname.startsWith(item.href))
                  ? "bg-slate-100 dark:bg-slate-500/10"
                  : "bg-transparent"
              )}
            >
              <Settings
                className={cn(
                  "h-[16px] w-[16px] flex-shrink-0",
                  settingsItems.some((item) => pathname.startsWith(item.href))
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

          {/* Settings Sub-items */}
          {!collapsed && settingsExpanded && (
            <div className="ml-4 mt-1 space-y-0.5 border-l border-black/[0.06] dark:border-white/[0.08] pl-3">
              {settingsItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                const ItemIcon = item.icon;

                return (
                  <Link
                    key={item.name}
                    href={item.comingSoon ? "#" : item.href}
                    className={cn(
                      "group flex items-center gap-2.5 px-3 py-2 rounded-lg",
                      "transition-all duration-200 ease-out text-[13px]",
                      item.comingSoon
                        ? "opacity-50 cursor-not-allowed"
                        : isActive
                        ? "font-medium text-slate-600 bg-slate-50 dark:bg-slate-500/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                    )}
                    onClick={(e) => {
                      if (item.comingSoon) {
                        e.preventDefault();
                      }
                    }}
                  >
                    <ItemIcon className="h-[14px] w-[14px] flex-shrink-0" />
                    <span className="flex-1">{item.name}</span>
                    {item.comingSoon && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-black/[0.06] dark:bg-white/[0.1] text-muted-foreground">
                        Soon
                      </span>
                    )}
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
          onClick={() => signOut({ callbackUrl: "/login" })}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl",
            "text-muted-foreground transition-all duration-200",
            "hover:text-destructive hover:bg-destructive/10",
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

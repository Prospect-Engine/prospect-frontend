"use client";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  BarChart3,
  Megaphone,
  Users,
  MessageSquare,
  Settings,
  Wrench,
  Bell,
  ChevronDown,
  Building2,
  Briefcase,
  LogOut,
  UserCircle,
  CreditCard,
  Check,
  PieChart,
  Mail,
  Smartphone,
  Layout,
  Zap,
  Inbox,
  MessageCircle,
  History,
  Search,
  Star,
  Menu,
  X,
  ChevronRight,
  Sun,
  Moon,
  UserX,
  DollarSign,
  UserCheckIcon,
  UserPlusIcon,
  ListTodo,
  Link2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, useMemo, useRef } from "react";
import { useMobile } from "@/hooks/use-mobile";
import { AuthService } from "@/lib/auth";
// import { useTeams } from "@/hooks/useTeams";
import { useAccounts } from "@/hooks/useWorkspaceAccounts";
import { useAuth } from "@/context/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useSubscription } from "@/hooks/useSubscription";
import { useGetNotice } from "@/hooks/useGetNotice";
import { isNotificationRead } from "@/lib/notificationSession";
import { usePermissions } from "@/hooks/usePermissions";
import WorkspaceSwitcherDropdown from "@/components/workspace/WorkspaceSwitcherDropdown";

interface NavigationProps {
  activePage?: string;
  className?: string;
  isLoading?: boolean;
}

interface CurrentMemberState {
  id: string;
  name: string;
  current: boolean;
  workspaceId: string | null;
  workspaceName: string;
  recent: boolean;
  favorite: boolean;
}

interface CurrentWorkspaceState {
  id: string;
  name: string;
  current: boolean;
  recent: boolean;
  favorite: boolean;
  unread: boolean;
}

export default function Navigation({
  activePage = "Dashboard",
  className,
  isLoading = false,
}: NavigationProps) {
  const router = useRouter();
  const isMobile = useMobile();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [contextSearchQuery, setContextSearchQuery] = useState("");
  const [contextActiveTab, setContextActiveTab] = useState<
    "members" | "workspaces"
  >("members");
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(
    null
  );
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeMobileSubmenu, setActiveMobileSubmenu] = useState<string | null>(
    null
  );
  const [, setIsContextDropdownOpen] = useState(false);
  const [isMobileWorkspaceSwitcherOpen, setIsMobileWorkspaceSwitcherOpen] =
    useState(false);
  const { theme, setTheme } = useTheme();
  const [isTogglingTheme, setIsTogglingTheme] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Map activePage to proper navigation state
  const getNavigationState = useMemo(() => {
    // Handle Sales Settings as a special case - it goes to Settings section
    if (activePage === "SALES-SETTINGS") {
      return { mainMenu: "Settings", submenuItem: "Sales Settings" };
    }

    // Handle CRM subpages (under /sales route)
    if (activePage.startsWith("SALES-")) {
      const salesSubpage = activePage.replace("SALES-", "");
      return {
        mainMenu: "CRM",
        submenuItem:
          salesSubpage === "LEADS"
            ? "All Leads"
            : salesSubpage === "CONNECTIONS"
              ? "All Leads"
              : salesSubpage === "COMPANIES"
                ? "All Companies"
                : salesSubpage === "PIPELINE"
                  ? "Pipeline"
                  : salesSubpage === "TASKS"
                    ? "Tasks"
                    : salesSubpage === "DEALS"
                      ? "Deals"
                      : null,
      };
    }

    // Handle Conversations with specific submenu detection
    if (activePage === "Conversations") {
      if (typeof window !== "undefined") {
        const path = window.location.pathname;
        if (path === "/sales/inbox/whatsapp") {
          return { mainMenu: "Conversations", submenuItem: "Whatsapp" };
        }
        if (path === "/conversations/inbox") {
          return { mainMenu: "Conversations", submenuItem: "Inbox" };
        }
        if (path === "/conversations/replies") {
          return { mainMenu: "Conversations", submenuItem: "Replies" };
        }
        // Handle any other conversation-related paths
        if (path.startsWith("/conversations/")) {
          return { mainMenu: "Conversations", submenuItem: "Inbox" };
        }
        if (path.startsWith("/sales/inbox/")) {
          return { mainMenu: "Conversations", submenuItem: "Whatsapp" };
        }
      }
      // Default to Inbox if no specific path match
      return { mainMenu: "Conversations", submenuItem: "Inbox" };
    }

    // Handle Analytics with specific submenu detection
    if (activePage === "Analytics") {
      if (typeof window !== "undefined") {
        const path = window.location.pathname;
        if (path === "/analytics/team-stat") {
          return { mainMenu: "Analytics", submenuItem: "Team Statistics" };
        }
        if (path === "/analytics/activity") {
          return { mainMenu: "Analytics", submenuItem: "Activity" };
        }
        if (path === "/sales") {
          return { mainMenu: "Analytics", submenuItem: "Dashboard" };
        }
      }
      // Default to Dashboard if no specific path match
      return { mainMenu: "Analytics", submenuItem: "Dashboard" };
    }

    // Handle Settings with specific submenu detection
    if (activePage === "Settings") {
      if (typeof window !== "undefined") {
        const path = window.location.pathname;
        if (path === "/settings/teams") {
          return { mainMenu: "Settings", submenuItem: "Teams" };
        }
        if (path === "/settings/organization") {
          return { mainMenu: "Settings", submenuItem: "Organization" };
        }
        if (
          path === "/settings/integrations" ||
          path.startsWith("/settings/integrations/")
        ) {
          return { mainMenu: "Settings", submenuItem: "Integrations" };
        }
        if (path === "/sales/settings") {
          return { mainMenu: "Settings", submenuItem: "Sales Settings" };
        }
        if (path === "/billing") {
          return { mainMenu: "Settings", submenuItem: "Billing" };
        }
        if (path === "/profile") {
          return { mainMenu: "Settings", submenuItem: "Sales Settings" }; // Profile is part of Sales Settings
        }
      }
      // Default to Billing if no specific path match
      return { mainMenu: "Settings", submenuItem: "Billing" };
    }

    // Handle Outreach with specific submenu detection
    if (activePage === "Outreach") {
      if (typeof window !== "undefined") {
        const path = window.location.pathname;
        if (
          path === "/outreach/campaigns" ||
          path.startsWith("/outreach/campaigns/")
        ) {
          return { mainMenu: "Outreach", submenuItem: "Campaigns" };
        }
        if (
          path === "/outreach/templates" ||
          path.startsWith("/outreach/templates/")
        ) {
          return { mainMenu: "Outreach", submenuItem: "Templates" };
        }
        if (path === "/outreach/invitations") {
          return { mainMenu: "Outreach", submenuItem: "Invitations" };
        }
        if (path === "/outreach/excluded") {
          return { mainMenu: "Outreach", submenuItem: "Excluded" };
        }
        if (path === "/outreach/settings") {
          return { mainMenu: "Outreach", submenuItem: "Outreach Settings" };
        }
      }
      // Default to Campaigns if no specific path match
      return { mainMenu: "Outreach", submenuItem: "Campaigns" };
    }

    // Handle Billing page specifically
    if (activePage === "Billing") {
      return { mainMenu: "Settings", submenuItem: "Billing" };
    }

    // Handle Tools with specific submenu detection
    if (activePage === "Tools") {
      if (typeof window !== "undefined") {
        const path = window.location.pathname;
        if (
          path === "/tools/lead-scraper" ||
          path.startsWith("/tools/lead-scraper/")
        ) {
          return { mainMenu: "Tools", submenuItem: "Lead Scraper" };
        }
      }
      // Default to Lead Scraper if no specific path match
      return { mainMenu: "Tools", submenuItem: "Lead Scraper" };
    }

    // Handle other specific mappings
    const mappings: {
      [key: string]: { mainMenu: string; submenuItem?: string };
    } = {
      Campaign: { mainMenu: "Outreach", submenuItem: "Campaigns" },
      Templates: { mainMenu: "Outreach", submenuItem: "Templates" },
    };

    // Check if we have a mapping for this activePage
    if (mappings[activePage]) {
      return mappings[activePage];
    }

    // Fallback: try to determine main menu from activePage
    if (activePage === "Dashboard") {
      return { mainMenu: "Analytics", submenuItem: "Dashboard" };
    }

    // Default fallback
    return { mainMenu: activePage };
  }, [activePage]);

  // Fetch real workspace data
  const {
    workspaces,
    currentWorkspaceId,
    loading: workspacesLoading,
  } = useAccounts();

  // Get auth context for workspace switching
  const {
    user,
    switchWorkspace,
    switchableAccounts,
    organizations,
    isAuthenticated,
    isLoading: authLoading,
    getAllSwitchableAccounts,
  } = useAuth();
  const { permissions } = usePermissions();

  // Get user profile data
  const {
    profile: userProfile,
    isLoading: profileLoading,
    refreshProfile,
  } = useUserProfile();

  // Get subscription data
  const { subscription, isLoading: subscriptionLoading } = useSubscription();

  const profileImage =
    userProfile?.avatar ?? (userProfile as any)?.imageUrl ?? null;

  // Get notifications data
  const {
    notifications,
    unreadCount,
    isLoading: notificationsLoading,
    error: notificationsError,
    markAsRead,
    refetch: refetchNotifications,
  } = useGetNotice();

  // Impersonation and permission checks
  const workspaceId = user?.workspace_id;
  const isImpersonated = !!user?.is_impersonate && !!workspaceId;
  const removeIntegrationRelated =
    isImpersonated && !permissions?.includes("INTEGRATE_ACCOUNT");
  const removeManageRelated =
    isImpersonated && !permissions?.includes("MANAGE_CAMPAIGNS");
  const notOwner = user?.role !== "OWNER";

  // Check if user has the required permissions for Settings menu
  const hasViewBillingPermission = permissions?.includes("VIEW_BILLING");
  const hasIntegrateAccountPermission =
    permissions?.includes("INTEGRATE_ACCOUNT");
  const hasManageTeamsPermission = permissions?.includes("MANAGE_TEAMS");

  const navigationItems = useMemo(
    () => [
      {
        name: "Analytics",
        icon: BarChart3,
        path: "/sales",
        submenu: [
          {
            name: "Dashboard",
            icon: PieChart,
            path: "/sales",
            description: "View and analyze data",
          },
          {
            name: "Activity",
            icon: History,
            path: "/analytics/activity",
            description: "View user activity and interactions",
          },
          {
            name: "Team Statistics",
            icon: Users,
            path: "/analytics/team-stat",
            description: "View team performance and statistics",
          },
          // {
          //   name: "Reports",
          //   icon: FileText,
          //   path: "/analytics/reports",
          //   description: "Generate detailed reports",
          // },
          // {
          //   name: "Performance",
          //   icon: TrendingUp,
          //   path: "/analytics/performance",
          //   description: "Track performance metrics",
          // },
          // {
          //   name: "Insights",
          //   icon: Lightbulb,
          //   path: "/analytics/insights",
          //   description: "Get actionable insights",
          // },
        ],
      },
      {
        name: "Outreach",
        icon: Megaphone,
        path: "/outreach",
        submenu: [
          {
            name: "Campaigns",
            icon: Mail,
            path: "/outreach/campaigns",
            description: "Create and manage campaigns",
          },
          {
            name: "Templates",
            icon: Smartphone,
            path: "/outreach/templates",
            description: "Design reusable templates",
          },
          {
            name: "Invitations",
            icon: Layout,
            path: "/outreach/invitations",
            description: "Track invitation status",
          },
          {
            name: "Excluded",
            icon: UserX,
            path: "/outreach/excluded",
            description: "Manage excluded contacts",
          },
        ],
      },
      {
        name: "CRM",
        icon: Users,
        path: "/sales",
        submenu: [
          {
            name: "All Leads",
            icon: UserPlusIcon,
            path: "/sales/leads",
            description: "Manage leads and connections",
          },
          {
            name: "All Companies",
            icon: Building2,
            path: "/sales/companies",
            description: "Manage Companies",
          },
          {
            name: "Pipeline",
            icon: UserCheckIcon,
            path: "/sales/pipeline",
            description: "Manage Pipeline",
          },
          {
            name: "Tasks",
            icon: ListTodo,
            path: "/sales/tasks",
            description: "Manage Tasks",
          },
          {
            name: "Deals",
            icon: DollarSign,
            path: "/sales/deals",
            description: "Manage Deals",
          },
        ],
      },
      {
        name: "Conversations",
        icon: MessageSquare,
        path: "/conversations",
        submenu: [
          {
            name: "Inbox",
            icon: Inbox,
            path: "/conversations/inbox",
            description: "Real-time conversations",
          },
          {
            name: "Whatsapp",
            icon: Inbox,
            path: "/sales/inbox/whatsapp",
            description: "Real-time whatsapp conversations",
          },
          {
            name: "Replies",
            icon: MessageCircle,
            path: "/conversations/replies",
            description: "Manage incoming messages",
          },
          // {
          //   name: "Support",
          //   icon: Headphones,
          //   path: "/conversations/support",
          //   description: "Customer support tickets",
          // },
          // {
          //   name: "History",
          //   icon: History,
          //   path: "/conversations/history",
          //   description: "View conversation history",
          // },
        ],
      },
      {
        name: "Settings",
        icon: Settings,
        path: "/settings",
        submenu: [
          {
            name: "Billing",
            icon: CreditCard,
            path: "/billing",
            description: "Personal account settings",
          },
          {
            name: "Workspaces",
            icon: Users,
            path: "/settings/workspaces",
            description: "Manage Workspace members",
          },
          {
            name: "Organization",
            icon: Building2,
            path: "/settings/organization",
            description: "Manage Organization settings",
          },
          {
            name: "Integrations",
            icon: Zap,
            path: "/settings/integrations",
            description: "Connect external services",
          },
          {
            name: "Outreach Settings",
            icon: Settings,
            path: "/outreach/settings",
            description: "Manage outreach settings",
          },
          {
            name: "Sales Settings",
            icon: Settings,
            path: "/sales/settings",
            description: "Manage Sales settings",
          },
          // {
          //   name: "Preferences",
          //   icon: Sliders,
          //   path: "/settings/preferences",
          //   description: "Customize your experience",
          // },
        ],
      },
      {
        name: "Tools",
        icon: Wrench,
        path: "/tools",
        submenu: [
          {
            name: "Lead Scraper",
            icon: Search,
            path: "/tools/lead-scraper",
            description: "Scrape leads from LinkedIn",
          },
          // {
          //   name: "Email Builder",
          //   icon: Palette,
          //   path: "/tools/email-builder",
          //   description: "Design beautiful emails",
          // },
          // {
          //   name: "A/B Testing",
          //   icon: TestTube,
          //   path: "/tools/ab-testing",
          //   description: "Test campaign variations",
          // },
          // {
          //   name: "Analytics Tools",
          //   icon: BarChart,
          //   path: "/tools/analytics",
          //   description: "Advanced analytics features",
          // },
          // {
          //   name: "API",
          //   icon: Code,
          //   path: "/tools/api",
          //   description: "Developer tools and API",
          // },
        ],
      },
    ],

    []
  );

  // Filter navigation items based on impersonation and permissions
  const filteredNavigationItems = useMemo(() => {
    return navigationItems
      .map(item => {
        if (!item.submenu) return item;

        const filteredSubmenu = item.submenu.filter(subItem => {
          // Apply impersonation and permission-based filtering
          if (
            removeIntegrationRelated &&
            ["Integrations"].includes(subItem.name)
          ) {
            return false;
          }
          if (
            removeManageRelated &&
            [
              "Tag Manager",
              "Lead Scraper",
              "Email Builder",
              "A/B Testing",
            ].includes(subItem.name)
          ) {
            return false;
          }
          if (
            subItem.name === "Connections" &&
            isImpersonated &&
            notOwner &&
            !permissions?.includes("VIEW_CONNECTIONS")
          ) {
            return false;
          }
          if (
            subItem.name === "Invitations" &&
            isImpersonated &&
            notOwner &&
            !permissions?.includes("VIEW_INVITATION") &&
            !permissions?.includes("MANAGE_INVITATION")
          ) {
            return false;
          }
          if (
            subItem.name === "Inbox" &&
            isImpersonated &&
            notOwner &&
            !permissions?.includes("VIEW_MESSAGES") &&
            !permissions?.includes("MANAGE_MESSAGES")
          ) {
            return false;
          }
          // Settings menu permission checks
          if (subItem.name === "Billing") {
            // Allow if user has VIEW_BILLING permission or is owner
            if (isImpersonated && notOwner && !hasViewBillingPermission) {
              return false;
            }
          }
          if (subItem.name === "Teams") {
            // Allow if user has MANAGE_TEAMS permission or is owner
            if (isImpersonated && notOwner && !hasManageTeamsPermission) {
              return false;
            }
          }
          if (subItem.name === "Integrations") {
            // Allow if user has INTEGRATE_ACCOUNT permission or is owner
            if (isImpersonated && notOwner && !hasIntegrateAccountPermission) {
              return false;
            }
          }
          return true;
        });

        return {
          ...item,
          submenu: filteredSubmenu,
        };
      })
      .filter(item => {
        // Remove top-level items if all their submenu items are filtered out
        if (item.submenu && item.submenu.length === 0) {
          return false;
        }
        return true;
      });
  }, [
    navigationItems,
    isImpersonated,
    removeIntegrationRelated,
    removeManageRelated,
    notOwner,
    permissions,
    hasViewBillingPermission,
    hasIntegrateAccountPermission,
    hasManageTeamsPermission,
  ]);

  const members = useMemo(() => {
    // Create members from workspace accounts data, grouping by workspace
    const memberMap = new Map();

    workspaces.forEach(account => {
      // Use user_id as the member ID, or account.id if user_id is not available
      const memberId = account.user_id || account.id;
      const workspaceId = account.id; // Use account.id as workspace identifier

      memberMap.set(memberId, {
        id: memberId,
        name: account.name,
        current: account.id === currentWorkspaceId,
        workspaceId: workspaceId,
        workspaceName: account.workspace_name,
        recent: account.is_recent || false,
        favorite: account.is_favorite || false,
      });
    });

    return Array.from(memberMap.values());
  }, [workspaces, currentWorkspaceId]);

  const workspacesData = useMemo(() => {
    // Create unique workspaces from workspace accounts data
    const workspaceMap = new Map();

    workspaces.forEach(account => {
      const workspaceId = account.id; // Use account.id as workspace identifier
      if (account.workspace_name && workspaceId) {
        workspaceMap.set(workspaceId, {
          id: workspaceId,
          name: account.workspace_name,
          current: workspaceId === selectedWorkspaceId,
          recent: true,
          favorite: false,
          unread: false,
        });
      }
    });

    return Array.from(workspaceMap.values());
  }, [workspaces, selectedWorkspaceId]);

  const [currentMember, setCurrentMember] = useState<CurrentMemberState>({
    id: "current",
    name: "", // Empty so fallback to userProfile.name or user.name works
    current: true,
    workspaceId: null,
    workspaceName: "", // Empty so fallback works
    recent: false,
    favorite: false,
  });

  const [currentWorkspace, setCurrentWorkspace] =
    useState<CurrentWorkspaceState>({
      id: "current",
      name: "", // Empty so fallback works
      current: true,
      recent: true,
      favorite: false,
      unread: false,
    });

  // Ensure we request the latest profile once the user is authenticated
  const hasRequestedProfileRef = useRef(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated && !hasRequestedProfileRef.current) {
      hasRequestedProfileRef.current = true;
      refreshProfile?.().catch(error => {
        console.error("Failed to refresh profile:", error);
      });
    }
  }, [authLoading, isAuthenticated, refreshProfile]);

  const filteredMembers = useMemo(() => {
    let filtered = members;

    // Filter by selected workspace if one is selected
    if (selectedWorkspaceId) {
      filtered = filtered.filter(
        member => member.workspaceId === selectedWorkspaceId
      );
    }

    // Filter by search query
    if (contextSearchQuery) {
      filtered = filtered.filter(member =>
        member.name.toLowerCase().includes(contextSearchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [contextSearchQuery, members, selectedWorkspaceId]);

  const filteredWorkspaces = useMemo(() => {
    return workspacesData.filter(workspace =>
      workspace.name.toLowerCase().includes(contextSearchQuery.toLowerCase())
    );
  }, [contextSearchQuery, workspacesData]);

  const handleDropdownClick = (itemName: string) => {
    setActiveDropdown(activeDropdown === itemName ? null : itemName);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Only check if click is inside the current dropdown or its trigger button
      if (activeDropdown) {
        const isInsideDropdown = target.closest("[data-dropdown]");
        const isInsideTrigger = target.closest(
          `[data-nav-item="${activeDropdown}"]`
        );

        // Close dropdown if click is outside both dropdown and its trigger
        if (!isInsideDropdown && !isInsideTrigger) {
          setActiveDropdown(null);
        }
      }
    };

    if (activeDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activeDropdown]);

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(prev => {
      const newState = !prev;
      // Prevent body scroll when menu is open
      if (newState) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
      return newState;
    });
    setActiveMobileSubmenu(null);
    setIsMobileWorkspaceSwitcherOpen(false);
  };

  const handleMobileSubmenuToggle = (itemName: string) => {
    setActiveMobileSubmenu(activeMobileSubmenu === itemName ? null : itemName);
  };

  const handleMobileNavigation = (path: string) => {
    router.push(path);
    setIsMobileMenuOpen(false);
    setActiveMobileSubmenu(null);
  };

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    setIsTogglingTheme(true);
    setTimeout(() => setIsTogglingTheme(false), 300);
  };

  const handleMemberSwitch = async (memberId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const account = workspaces.find(w => w.id === memberId);
    if (account && account.id) {
      try {
        await switchWorkspace(account.id);
      } catch (error) {
        console.error("Failed to switch workspace:", error);
      }
    }
    setIsContextDropdownOpen(false);
  };

  // Helper function to generate user initials
  const getUserInitials = (name: string): string => {
    if (!name) return "U";
    const words = name.trim().split(" ");
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }
    return (
      words[0].charAt(0) + words[words.length - 1].charAt(0)
    ).toUpperCase();
  };

  const handleLogout = async () => {
    // Clear authentication state
    await AuthService.logout();
    // Redirect to login page
    router.push("/auth");
  };

  // Close mobile menu when screen becomes large (lg breakpoint = 1024px) where button is hidden
  useEffect(() => {
    const handleResize = () => {
      // Close menu on lg screens (1024px+) where mobile menu button is hidden
      if (window.innerWidth >= 1024 && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
        setActiveMobileSubmenu(null);
        document.body.style.overflow = "";
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Check on mount

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [isMobileMenuOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <>
      <div
        className={cn(
          "overflow-visible relative z-10 lg:z-10 p-4 rounded-2xl border shadow-sm backdrop-blur-xl transition-all duration-300 bg-white/70 dark:bg-gray-800/70 border-white/20 dark:border-gray-600 hover:shadow-md",
          className
        )}
      >
        <div className="flex justify-between items-center">
          {/* Logo Section */}
          <div className="flex items-center">
            <Link
              href="/sales"
              className="flex items-center space-x-3 transition-opacity hover:opacity-80"
            >
              <div className="flex justify-center items-center w-9 h-9 bg-gradient-to-br from-gray-900 to-gray-700 rounded-2xl shadow-sm">
                <span className="text-sm font-semibold text-white">S</span>
              </div>
              <span className="hidden text-xl font-semibold tracking-tight text-gray-900 dark:text-white sm:block">
                SENDOUT.AI
              </span>
              <span className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white sm:hidden">
                SENDOUT
              </span>
            </Link>
          </div>

          {/* Small Device Navigation (iPad landscape, etc.) */}
          <nav className="hidden relative flex-1 justify-center items-center lg:flex xl:hidden">
            <div className="flex items-center space-x-1.5 md:space-x-2">
              {filteredNavigationItems.map(item => (
                <div key={item.name} className="relative">
                  <Button
                    data-nav-item={item.name}
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "min-w-[44px] min-h-[44px] px-3 py-2.5 md:px-4 md:py-3 rounded-xl font-medium transition-all duration-200 hover:scale-105 touch-manipulation",
                      getNavigationState.mainMenu === item.name
                        ? "bg-gray-900 dark:bg-gray-800 hover:bg-gray-900 dark:hover:bg-gray-700 text-white shadow-sm hover:shadow-md"
                        : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-gray-700"
                    )}
                    onClick={e => {
                      e.preventDefault();
                      if (item.submenu && item.submenu.length > 0) {
                        handleDropdownClick(item.name);
                      } else {
                        router.push(item.path);
                      }
                    }}
                    title={item.name}
                  >
                    <item.icon className="w-4 h-4 md:w-5 md:h-5" />
                  </Button>

                  {activeDropdown === item.name && item.submenu && (
                    <div
                      data-dropdown
                      className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 w-64 p-2 bg-white/95 dark:bg-gray-800/95 backdrop-blur-2xl border border-white/20 dark:border-gray-700/50 shadow-2xl rounded-2xl z-[9999] before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/10 before:to-transparent before:rounded-2xl before:pointer-events-none"
                    >
                      {/* <div className="px-3 py-2 mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="flex justify-center items-center w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg dark:from-gray-800 dark:to-gray-700">
                            <item.icon className="w-4 h-4 text-gray-700 dark:text-gray-200" />
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                              {item.name}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-300">
                              Manage your {item.name.toLowerCase()}
                            </p>
                          </div>
                        </div>
                      </div> */}
                      <div className="mb-2 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent dark:via-gray-700" />
                      <div className="space-y-1">
                        {item.submenu.map(subItem => (
                          <div
                            key={subItem.name}
                            className={cn(
                              "cursor-pointer rounded-xl px-3 py-2.5 transition-all duration-200 backdrop-blur-sm group min-h-[44px] flex items-center touch-manipulation",
                              getNavigationState.submenuItem === subItem.name
                                ? "bg-white/30 dark:bg-gray-600/50 text-white dark:text-white"
                                : "hover:bg-white/20 dark:hover:bg-gray-700/50 focus:bg-white/20 dark:focus:bg-gray-700/50"
                            )}
                            onClick={() => router.push(subItem.path)}
                          >
                            <div className="flex items-center space-x-3 w-full">
                              <div className="flex justify-center items-center w-7 h-7 bg-gray-100 rounded-lg transition-all duration-200 dark:bg-gray-700 group-hover:bg-white dark:group-hover:bg-white/30 group-hover:shadow-sm">
                                <subItem.icon className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300 group-hover:text-gray-700 dark:group-hover:text-white" />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-gray-900 dark:group-hover:text-white">
                                  {subItem.name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300">
                                  {subItem.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {/* <div className="mt-2 mb-2 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent dark:via-gray-700" />
                      <div className="px-3 py-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="justify-start w-full h-8 text-xs text-gray-600 rounded-lg backdrop-blur-sm dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/20 dark:hover:bg-gray-700/50"
                        >
                          View all {item.name.toLowerCase()} features →
                        </Button>
                      </div> */}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </nav>

          {/* Desktop Navigation */}
          <nav className="hidden overflow-visible relative flex-1 justify-center items-center xl:flex">
            <div className="flex items-center space-x-1.5">
              {filteredNavigationItems.map(item => (
                <div key={item.name} className="relative">
                  <Button
                    data-nav-item={item.name}
                    variant={
                      getNavigationState.mainMenu === item.name
                        ? "default"
                        : "ghost"
                    }
                    size="sm"
                    className={cn(
                      "min-h-[40px] px-4 py-2 rounded-xl font-medium transition-all duration-200 hover:scale-105 relative z-20 touch-manipulation",
                      getNavigationState.mainMenu === item.name
                        ? "bg-gray-900 dark:bg-gray-800 hover:bg-gray-800 dark:hover:bg-gray-700 text-white shadow-sm hover:shadow-md"
                        : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-gray-700"
                    )}
                    onClick={e => {
                      e.preventDefault();
                      if (item.submenu && item.submenu.length > 0) {
                        handleDropdownClick(item.name);
                      } else {
                        router.push(item.path);
                      }
                    }}
                  >
                    <item.icon className="mr-2 w-4 h-4" />
                    <span
                      className={
                        getNavigationState.mainMenu === item.name
                          ? "text-white"
                          : ""
                      }
                    >
                      {item.name}
                    </span>
                    <ChevronDown className="ml-1 w-3 h-3" />
                  </Button>

                  {activeDropdown === item.name && (
                    <div
                      data-dropdown
                      className="absolute top-full left-1/2 z-10 p-2 mt-1 w-80 rounded-2xl border shadow-2xl backdrop-blur-2xl transform -translate-x-1/2 bg-white/95 dark:bg-gray-800/95 border-white/30 dark:border-gray-700/50"
                    >
                      {/* <div className="px-3 py-2 mb-2">
                        <div className="flex items-center space-x-3 min-h-[40px]">
                          <div className="flex flex-shrink-0 justify-center items-center w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg dark:from-gray-800 dark:to-gray-700">
                            <item.icon className="w-4 h-4 text-gray-700 dark:text-gray-200" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                              {item.name}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-300">
                              Manage your {item.name.toLowerCase()}
                            </p>
                          </div>
                        </div>
                      </div> */}
                      <div className="mb-2 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent dark:via-gray-700" />
                      <div className="space-y-1">
                        {item.submenu.map(subItem => (
                          <div
                            key={subItem.name}
                            className={cn(
                              "cursor-pointer rounded-xl px-3 py-2 transition-all duration-200 group min-h-[44px] flex items-center touch-manipulation",
                              getNavigationState.submenuItem === subItem.name
                                ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                                : "hover:bg-gray-50 dark:hover:bg-gray-700 focus:bg-gray-50 dark:focus:bg-white/10"
                            )}
                            onClick={() => router.push(subItem.path)}
                          >
                            <div className="flex items-center space-x-3 w-full">
                              <div className="flex flex-shrink-0 justify-center items-center w-8 h-8 bg-gray-100 rounded-lg transition-all duration-200 dark:bg-gray-700 group-hover:bg-white dark:group-hover:bg-white/30 group-hover:shadow-sm">
                                <subItem.icon className="w-4 h-4 text-gray-600 dark:text-gray-300 group-hover:text-gray-700 dark:group-hover:text-white" />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-gray-900 dark:group-hover:text-white">
                                  {subItem.name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300">
                                  {subItem.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {/* <div className="mt-2 mb-2 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent dark:via-gray-700" /> */}
                      {/* <div className="px-3 py-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-xs text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg h-8 min-h-[40px]"
                        >
                          View all {item.name.toLowerCase()} features →
                        </Button>
                      </div> */}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </nav>

          {/* Right Side - Mobile Menu Button, Theme Toggle, Notifications and User */}
          <div className="flex items-center space-x-2 sm:space-x-3 relative">
            <Button
              variant="ghost"
              size="sm"
              className="min-w-[44px] min-h-[44px] rounded-xl transition-all duration-200 lg:hidden hover:bg-gray-100/80 active:bg-gray-200 dark:active:bg-gray-600 touch-manipulation relative z-50 cursor-pointer"
              style={{
                WebkitTapHighlightColor: "transparent",
                pointerEvents: "auto",
                touchAction: "manipulation",
              }}
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                handleMobileMenuToggle();
              }}
              onTouchStart={e => {
                e.stopPropagation();
              }}
              onTouchEnd={e => {
                e.preventDefault();
                e.stopPropagation();
                handleMobileMenuToggle();
              }}
              onMouseDown={e => {
                e.stopPropagation();
              }}
              aria-label="Toggle mobile menu"
              type="button"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-gray-600" />
              ) : (
                <Menu className="w-5 h-5 text-gray-600" />
              )}
            </Button>

            {/* Theme Toggle */}
            {mounted ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className={cn(
                  "min-w-[44px] min-h-[44px] rounded-xl bg-transparent hover:bg-transparent focus:bg-transparent active:bg-transparent dark:bg-transparent dark:hover:bg-transparent dark:focus:bg-transparent dark:active:bg-transparent ring-0 focus:ring-0 focus-visible:ring-0 shadow-none transition-transform duration-300 touch-manipulation",
                  isTogglingTheme && "rotate-180"
                )}
              >
                {theme === "dark" ? (
                  <Moon className="w-5 h-5 transition-transform duration-300 text-gray-600 dark:text-gray-200" />
                ) : (
                  <Sun className="w-5 h-5 transition-transform duration-300 text-gray-600 dark:text-gray-200" />
                )}
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                aria-label="Toggle theme"
                className="min-w-[44px] min-h-[44px] rounded-xl bg-transparent hover:bg-transparent focus:bg-transparent active:bg-transparent dark:bg-transparent dark:hover:bg-transparent dark:focus:bg-transparent dark:active:bg-transparent ring-0 focus:ring-0 focus-visible:ring-0 shadow-none transition-transform duration-300 touch-manipulation"
              >
                <Sun className="w-5 h-5 transition-transform duration-300 text-gray-600 dark:text-gray-200" />
              </Button>
            )}

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative min-w-[44px] min-h-[44px] rounded-xl transition-all duration-200 hover:bg-gray-100/80 dark:hover:bg-gray-700 touch-manipulation"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  {unreadCount > 0 && (
                    <div className="flex absolute -top-1 -right-1 justify-center items-center w-4 h-4 bg-red-500 rounded-full">
                      <span className="text-xs font-medium text-white">
                        {unreadCount}
                      </span>
                    </div>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-96 p-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-2xl border border-white/20 dark:border-gray-700/50 shadow-2xl rounded-2xl overflow-hidden z-[9999] before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/10 before:to-transparent before:rounded-2xl before:pointer-events-none"
                sideOffset={8}
              >
                <div className="px-6 py-4 bg-gradient-to-r border-b backdrop-blur-sm from-white/20 to-white/10 dark:from-gray-700/50 dark:to-gray-800/50 border-white/20 dark:border-gray-700/50">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        Notifications
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-300 mt-0.5">
                        Stay updated with your latest activities
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className="text-xs text-blue-700 bg-blue-100 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700"
                    >
                      {unreadCount} new
                    </Badge>
                  </div>
                </div>
                <div className="overflow-y-auto max-h-96">
                  <div className="space-y-0">
                    {notificationsError ? (
                      <div className="p-8 text-center">
                        <div className="flex justify-center items-center mx-auto mb-4 w-12 h-12 bg-red-100 rounded-full dark:bg-red-900/20">
                          <svg
                            className="w-6 h-6 text-red-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <p className="text-sm text-red-600 dark:text-red-400">
                          Failed to load notifications
                        </p>
                        <p className="mt-1 text-xs text-red-500 dark:text-red-500">
                          {notificationsError}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-3 text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                          onClick={refetchNotifications}
                        >
                          Try again
                        </Button>
                      </div>
                    ) : notifications.length > 0 ? (
                      notifications.map(notification => (
                        <div
                          key={notification.id}
                          className={cn(
                            "flex items-start space-x-3 p-4 transition-colors duration-200 cursor-pointer border-b border-white/20 dark:border-gray-700/50 last:border-b-0 backdrop-blur-sm",
                            notification.unread &&
                              !isNotificationRead(notification.id)
                              ? "bg-blue-50/30 dark:bg-blue-900/20"
                              : "hover:bg-white/20 dark:hover:bg-gray-700/50"
                          )}
                          onClick={() => {
                            if (
                              notification.unread &&
                              !isNotificationRead(notification.id)
                            ) {
                              markAsRead(notification.id);
                            }
                          }}
                        >
                          <div className="flex flex-shrink-0 justify-center items-center w-8 h-8 bg-gray-100 rounded-lg dark:bg-gray-700">
                            <span className="text-sm">{notification.icon}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-1">
                              <p
                                className={cn(
                                  "text-sm font-medium",
                                  notification.unread &&
                                    !isNotificationRead(notification.id)
                                    ? "text-gray-900 dark:text-white"
                                    : "text-gray-700 dark:text-gray-300"
                                )}
                              >
                                {notification.title}
                              </p>
                              <span className="text-xs text-gray-400 dark:text-gray-400">
                                {notification.time}
                              </span>
                            </div>
                            <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-400">
                              {notification.message}
                            </p>
                            {notification.unread &&
                              !isNotificationRead(notification.id) && (
                                <div className="flex-shrink-0 mt-2 w-2 h-2 bg-blue-500 rounded-full"></div>
                              )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center">
                        <div className="flex justify-center items-center mx-auto mb-4 w-12 h-12 bg-gray-100 rounded-full dark:bg-gray-700">
                          <Bell className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          No notifications yet
                        </p>
                        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                          We&apos;ll notify you when something important happens
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                {/* <div className="px-6 py-4 border-t backdrop-blur-sm bg-white/10 dark:bg-gray-800/30 border-white/20 dark:border-gray-700/50">
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      className="flex-1 h-9 text-sm text-gray-600 rounded-xl backdrop-blur-sm dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/20 dark:hover:bg-gray-700/50"
                    >
                      View all notifications
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 text-gray-600 rounded-xl backdrop-blur-sm dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/20 dark:hover:bg-gray-700/50"
                      onClick={refetchNotifications}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </Button>
                  </div>
                </div> */}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Workspace Switcher */}
            <div className="hidden md:block">
              <WorkspaceSwitcherDropdown
                currentAccount={{
                  name:
                    // Use current organization name if available
                    organizations.find(org => org.id === user?.organization_id)
                      ?.name ||
                    userProfile?.name ||
                    user?.name ||
                    "Current User",
                  workspace_name:
                    currentWorkspace?.name || userProfile?.workspace_id
                      ? workspaces.find(
                          w =>
                            w.id ===
                            (userProfile?.workspace_id ||
                              user?.workspace_id ||
                              "")
                        )?.workspace_name || "Current Workspace"
                      : "Current Workspace",
                }}
              />
            </div>

            {/* Subscription Status Indicator
            {subscription && (
              <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-500">
                <div className="flex items-center space-x-2">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    subscription.is_active && !subscription.is_canceled ? "bg-green-500" : 
                    subscription.is_trial || subscription.is_on_grace_period ? "bg-blue-500" : 
                    subscription.payment_status === 'past_due' ? "bg-yellow-500" : "bg-red-500"
                  )} />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                    {subscription.type === 'personal' ? 'Personal Plan' : subscription.type}
                  </span>
                </div>
              </div>
            )} */}

            {/* User Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative p-0 h-auto min-w-[44px] min-h-[44px] rounded-full touch-manipulation"
                >
                  <Avatar className="w-9 h-9 ring-2 ring-white shadow-sm transition-all duration-200 dark:ring-gray-700 hover:ring-gray-200 dark:hover:ring-gray-600">
                    {profileImage && (
                      <AvatarImage
                        src={profileImage}
                        alt={userProfile?.name || "User"}
                      />
                    )}
                    <AvatarFallback className="text-lg font-medium text-white bg-gray-900 dark:bg-gray-700">
                      {userProfile ? getUserInitials(userProfile.name) : "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-72 p-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-gray-200/60 dark:border-gray-600 shadow-xl rounded-2xl overflow-hidden z-[9999]"
                sideOffset={8}
              >
                {/* Profile Header */}
                <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 dark:to-gray-800 dark:from-gray-700 dark:border-gray-600">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-12 h-12 ring-2 ring-white shadow-sm dark:ring-gray-700">
                      {profileImage && (
                        <AvatarImage
                          src={profileImage}
                          alt={userProfile?.name || "User"}
                        />
                      )}
                      <AvatarFallback className="text-lg font-medium text-white bg-gray-900 dark:bg-gray-700">
                        {userProfile ? getUserInitials(userProfile.name) : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {userProfile?.name || "User"}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {userProfile?.email || "user@example.com"}
                      </p>
                      <div className="flex items-center mt-1 space-x-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Online
                        </span>
                        {subscription && (
                          <>
                            <span className="mx-1 text-xs text-gray-400 dark:text-gray-500">
                              •
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {subscription.type === "personal"
                                ? "Personal Plan"
                                : subscription.type}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Profile Actions */}
                <div className="p-2">
                  <div className="space-y-1">
                    <div
                      className="flex items-center px-3 py-2 space-x-3 rounded-xl transition-colors duration-200 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                      onClick={() => router.push("/profile")}
                    >
                      <div className="flex justify-center items-center w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg dark:from-gray-700 dark:to-gray-600">
                        <UserCircle className="w-4 h-4 text-gray-300 dark:text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Account Settings
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Manage your account details
                        </p>
                      </div>
                    </div>
                    <div
                      className="flex items-center px-3 py-2 space-x-3 rounded-xl transition-colors duration-200 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                      onClick={() => router.push("/billing")}
                    >
                      <div className="flex justify-center items-center w-8 h-8 bg-gradient-to-br from-green-100 to-green-200 rounded-lg dark:from-green-900/30 dark:to-green-800/30">
                        <CreditCard className="w-4 h-4 text-green-700 dark:text-green-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Billing & Plans
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Manage subscription and usage
                        </p>
                        {subscription && (
                          <div className="flex items-center mt-1 space-x-2">
                            <div
                              className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                subscription.is_active &&
                                  !subscription.is_canceled
                                  ? "bg-green-500"
                                  : subscription.is_trial ||
                                      subscription.is_on_grace_period
                                    ? "bg-blue-500"
                                    : subscription.payment_status === "past_due"
                                      ? "bg-yellow-500"
                                      : "bg-red-500"
                              )}
                            />
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {subscription.type === "personal"
                                ? "Personal Plan"
                                : subscription.type}
                            </span>
                            {(subscription.is_trial ||
                              subscription.is_on_grace_period) && (
                              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                                Trial
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    {/* <div
                      className="flex items-center px-3 py-2 space-x-3 rounded-xl transition-colors duration-200 cursor-pointer hover:bg-gray-50"
                      onClick={() => router.push("/settings")}
                    >
                      <div className="flex justify-center items-center w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg">
                        <Settings className="w-4 h-4 text-blue-700" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Account Settings
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Privacy and preferences
                        </p>
                      </div>
                    </div> */}
                  </div>

                  {/* <div className="my-3 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

                  <div className="flex items-center px-3 py-2 space-x-3 rounded-xl transition-colors duration-200 cursor-pointer hover:bg-gray-50">
                    <div className="flex justify-center items-center w-8 h-8 bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg">
                      <HelpCircle className="w-4 h-4 text-amber-700" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Help & Support
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Get help and contact support
                      </p>
                    </div>
                  </div> */}

                  <div className="my-3 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent dark:via-gray-600" />

                  <div
                    className="flex items-center px-3 py-2 space-x-3 rounded-xl transition-colors duration-200 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 group"
                    onClick={handleLogout}
                  >
                    <div className="flex justify-center items-center w-8 h-8 bg-gradient-to-br from-red-100 to-red-200 rounded-lg transition-all duration-200 dark:from-red-900/30 dark:to-red-800/30 group-hover:from-red-200 group-hover:to-red-300 dark:group-hover:from-red-800/40 dark:group-hover:to-red-700/40">
                      <LogOut className="w-4 h-4 text-red-700 dark:text-red-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-red-700 dark:text-red-400 group-hover:text-red-800 dark:group-hover:text-red-300">
                        Sign Out
                      </p>
                      <p className="text-xs text-red-500 dark:text-red-500 group-hover:text-red-600 dark:group-hover:text-red-400">
                        End your current session
                      </p>
                    </div>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-[100] backdrop-blur-sm lg:hidden bg-black/20"
          onClick={handleMobileMenuToggle}
          onTouchStart={e => {
            if (e.target === e.currentTarget) {
              handleMobileMenuToggle();
            }
          }}
        >
          <div
            className="absolute top-0 left-0 right-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border-b border-gray-200/60 dark:border-gray-700/60 shadow-xl rounded-b-2xl max-h-[90vh] overflow-y-auto z-[101]"
            onClick={e => e.stopPropagation()}
            onTouchStart={e => e.stopPropagation()}
          >
            {/* Mobile Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="flex justify-center items-center w-8 h-8 bg-gradient-to-br from-gray-900 to-gray-700 rounded-xl shadow-sm">
                  <span className="text-sm font-semibold text-white">S</span>
                </div>
                <span className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white">
                  SENDOUT.AI
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="min-w-[44px] min-h-[44px] rounded-xl hover:bg-gray-100/80 active:bg-gray-200 dark:active:bg-gray-600 touch-manipulation relative z-[102]"
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleMobileMenuToggle();
                }}
                onTouchStart={e => {
                  e.stopPropagation();
                }}
                aria-label="Close mobile menu"
                type="button"
              >
                <X className="w-5 h-5 text-gray-600" />
              </Button>
            </div>

            {/* Mobile Workspace Switcher */}
            <div className="p-4 border-b border-gray-100 sm:hidden">
              <div
                className="flex items-center p-3 space-x-3 bg-gray-50 rounded-xl transition-colors cursor-pointer hover:bg-gray-100"
                onClick={() =>
                  setIsMobileWorkspaceSwitcherOpen(
                    !isMobileWorkspaceSwitcherOpen
                  )
                }
              >
                <div className="flex justify-center items-center w-8 h-8 bg-white rounded-lg shadow-sm">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    W
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium leading-tight text-gray-900 dark:text-white">
                    {currentWorkspace?.name}
                  </p>
                  <p className="text-xs leading-tight text-gray-500">
                    {currentMember?.name}
                  </p>
                </div>
                <ChevronRight
                  className={cn(
                    "w-4 h-4 text-gray-400 transition-transform duration-200",
                    isMobileWorkspaceSwitcherOpen && "rotate-90"
                  )}
                />
              </div>

              {/* Mobile Workspace Options */}
              {isMobileWorkspaceSwitcherOpen && (
                <div className="overflow-hidden mt-3 rounded-2xl border shadow-xl backdrop-blur-xl bg-white/95 dark:bg-gray-800/95 border-gray-200/60 dark:border-gray-700/60">
                  {/* Header with Search */}
                  <div className="px-4 py-4 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center mb-3 space-x-3">
                      <div className="flex justify-center items-center w-8 h-8 bg-gray-100 rounded-lg">
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          W
                        </span>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                          Switch Context
                        </h3>
                        <p className="text-xs text-gray-500">
                          Change member or workspace
                        </p>
                      </div>
                    </div>

                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 w-4 h-4 text-gray-400 transform -translate-y-1/2" />
                      <Input
                        placeholder="Search members and workspaces..."
                        value={contextSearchQuery}
                        onChange={e => setContextSearchQuery(e.target.value)}
                        className="pl-10 h-9 bg-gray-50 border-gray-200 focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex p-1 space-x-1 bg-gray-50 rounded-lg">
                      <button
                        onClick={() => {
                          setContextActiveTab("members");
                          // Don't clear selected workspace when switching to members tab
                        }}
                        className={cn(
                          "flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200",
                          contextActiveTab === "members"
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                        )}
                      >
                        <UserCircle className="inline mr-1 w-3 h-3" />
                        Members
                      </button>
                      <button
                        onClick={() => {
                          setContextActiveTab("workspaces");
                          setSelectedWorkspaceId(null); // Clear workspace selection when switching to workspaces tab
                        }}
                        className={cn(
                          "flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200",
                          contextActiveTab === "workspaces"
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                        )}
                      >
                        <Briefcase className="inline mr-1 w-3 h-3" />
                        Workspaces
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="overflow-y-auto max-h-80">
                    {contextActiveTab === "members" && (
                      <div className="p-4">
                        {/* Show selected workspace info */}
                        {selectedWorkspaceId && (
                          <div className="p-2 mb-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center space-x-2">
                                <Briefcase className="w-4 h-4 text-blue-600" />
                                <span className="text-sm font-medium text-blue-900">
                                  Showing members from:{" "}
                                  {
                                    workspacesData.find(
                                      w => w.id === selectedWorkspaceId
                                    )?.name
                                  }
                                </span>
                              </div>
                              <button
                                onClick={() => setSelectedWorkspaceId(null)}
                                className="text-xs text-blue-600 underline hover:text-blue-800"
                              >
                                Show all members
                              </button>
                            </div>
                          </div>
                        )}
                        <div className="space-y-1">
                          {filteredMembers.map(member => (
                            <div
                              key={member.id}
                              className={cn(
                                "flex items-center justify-between p-2 rounded-lg transition-colors duration-200 cursor-pointer",
                                member.current
                                  ? "bg-gray-100 border border-gray-200"
                                  : "hover:bg-gray-50"
                              )}
                              onClick={() => {
                                handleMemberSwitch(
                                  member.id,
                                  {} as React.MouseEvent
                                );
                                setIsMobileWorkspaceSwitcherOpen(false);
                              }}
                            >
                              <div className="flex items-center space-x-2">
                                <div className="flex justify-center items-center w-6 h-6 bg-gray-100 rounded">
                                  <UserCircle className="w-3 h-3 text-gray-600" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {member.name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {member.workspaceName}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-1">
                                {member.favorite && (
                                  <Star className="w-3 h-3 text-amber-500 fill-current" />
                                )}
                                {member.current && (
                                  <Check className="w-4 h-4 text-gray-600" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        {filteredMembers.length === 0 && (
                          <div className="py-8 text-center">
                            <p className="text-sm text-gray-500">
                              No members found
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {contextActiveTab === "workspaces" && (
                      <div className="p-4">
                        <div className="space-y-1">
                          {filteredWorkspaces.map(workspace => (
                            <div
                              key={workspace.id}
                              className={cn(
                                "flex items-center justify-between p-2 rounded-lg transition-colors duration-200 cursor-pointer",
                                workspace.current
                                  ? "bg-gray-100 border border-gray-200"
                                  : "hover:bg-gray-50"
                              )}
                              onClick={() => {
                                setSelectedWorkspaceId(workspace.id);
                                setContextActiveTab("members");
                                // Don't close the mobile dropdown - let it stay open to show the filtered members
                              }}
                            >
                              <div className="flex items-center space-x-2">
                                <div className="flex justify-center items-center w-6 h-6 bg-gray-100 rounded">
                                  <Briefcase className="w-3 h-3 text-gray-600" />
                                </div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {workspace.name}
                                </p>
                              </div>
                              <div className="flex items-center space-x-1">
                                {workspace.favorite && (
                                  <Star className="w-3 h-3 text-amber-500 fill-current" />
                                )}
                                {workspace.current && (
                                  <Check className="w-4 h-4 text-gray-600" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        {filteredWorkspaces.length === 0 && (
                          <div className="py-8 text-center">
                            <p className="text-sm text-gray-500">
                              No workspaces found
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Navigation Items */}
            <div className="p-4 space-y-2">
              {filteredNavigationItems.map(item => (
                <div key={item.name} className="space-y-1">
                  <button
                    className={cn(
                      "w-full flex items-center justify-between min-h-[48px] p-3 rounded-xl transition-all duration-200 text-left touch-manipulation",
                      getNavigationState.mainMenu === item.name
                        ? "bg-gray-900 text-white shadow-sm"
                        : "text-gray-700 hover:bg-gray-50 active:bg-gray-100",
                      activeMobileSubmenu === item.name &&
                        getNavigationState.mainMenu !== item.name &&
                        "bg-gray-50"
                    )}
                    onClick={() => {
                      if (getNavigationState.mainMenu === item.name) {
                        handleMobileNavigation(item.path);
                      } else {
                        handleMobileSubmenuToggle(item.name);
                      }
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <ChevronRight
                      className={cn(
                        "w-4 h-4 transition-transform duration-200",
                        activeMobileSubmenu === item.name && "rotate-90"
                      )}
                    />
                  </button>

                  {/* Mobile Submenu */}
                  {activeMobileSubmenu === item.name && (
                    <div className="pl-4 ml-4 space-y-1 border-l-2 border-gray-100">
                      {item.submenu.map(subItem => (
                        <button
                          key={subItem.name}
                          className={cn(
                            "flex items-center min-h-[48px] p-3 space-x-3 w-full text-left rounded-lg transition-all duration-200 touch-manipulation",
                            getNavigationState.submenuItem === subItem.name
                              ? "bg-gray-100 text-gray-900"
                              : "hover:bg-gray-50 active:bg-gray-100"
                          )}
                          onClick={() => handleMobileNavigation(subItem.path)}
                        >
                          <div className="flex justify-center items-center w-8 h-8 bg-gray-100 rounded-lg">
                            <subItem.icon className="w-4 h-4 text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {subItem.name}
                            </p>
                            <p className="text-xs leading-relaxed text-gray-500">
                              {subItem.description}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Mobile Footer */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/50">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-8 h-8 ring-2 ring-white shadow-sm dark:ring-gray-700">
                    {profileImage && (
                      <AvatarImage
                        src={profileImage}
                        alt={userProfile?.name || "User"}
                      />
                    )}
                    <AvatarFallback className="text-sm font-medium text-white bg-gray-900 dark:bg-gray-700">
                      {userProfile ? getUserInitials(userProfile.name) : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {userProfile?.name || "User"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {userProfile?.email || "user@example.com"}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="min-w-[44px] min-h-[44px] rounded-xl hover:bg-white dark:hover:bg-gray-700 touch-manipulation"
                  aria-label="User settings"
                  onClick={() => router.push("/profile")}
                >
                  <Settings className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

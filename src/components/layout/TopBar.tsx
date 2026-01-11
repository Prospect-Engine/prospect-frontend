/**
 * UNIVERSAL TOP BAR
 * =================
 * Contains the app switcher and user controls.
 * Appears at the top of all Geniefy apps.
 */

"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import {
  Send,
  Bot,
  DollarSign,
  Users,
  CheckSquare,
  Bell,
  LogOut,
  UserCircle,
  CreditCard,
  Sun,
  Moon,
  Megaphone,
  LucideIcon,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { AuthService } from "@/lib/auth";
import { useAuth } from "@/context/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useGetNotice } from "@/hooks/useGetNotice";
import { isNotificationRead } from "@/lib/notificationSession";
import WorkspaceSwitcherDropdown from "@/components/workspace/WorkspaceSwitcherDropdown";
import { useAccounts } from "@/hooks/useWorkspaceAccounts";
import { ChatButton } from "@/components/chat/ChatButton";

// ============================================
// APP SWITCHER CONFIGURATION
// ============================================

interface AppConfig {
  id: string;
  name: string;
  shortName: string;
  icon: LucideIcon;
  color: string;
  path: string;
}

const apps: AppConfig[] = [
  {
    id: "gensales",
    name: "GenSales",
    shortName: "Sales",
    icon: Send,
    color: "#E57373",  // Light coral/red
    path: "/sales",
  },
  {
    id: "genfin",
    name: "GenFin",
    shortName: "Finance",
    icon: DollarSign,
    color: "#FFB74D",  // Light orange
    path: "/finance",
  },
  {
    id: "genhr",
    name: "GenHR",
    shortName: "HR",
    icon: Users,
    color: "#BA68C8",  // Light purple
    path: "/hr",
  },
  {
    id: "gendo",
    name: "GenDo",
    shortName: "Tasks",
    icon: CheckSquare,
    color: "#64B5F6",  // Light blue
    path: "/tasks",
  },
  {
    id: "genmarketing",
    name: "GenMarketing",
    shortName: "Marketing",
    icon: Megaphone,
    color: "#00BCD4",  // Teal
    path: "/marketing",
  },
];

function detectCurrentApp(pathname: string): string {
  if (pathname.startsWith("/finance")) return "genfin";
  if (pathname.startsWith("/hr")) return "genhr";
  if (pathname.startsWith("/tasks")) return "gendo";
  if (pathname.startsWith("/marketing")) return "genmarketing";
  if (
    pathname.startsWith("/sales") ||
    pathname.startsWith("/outreach") ||
    pathname.startsWith("/conversations") ||
    pathname.startsWith("/integration") ||
    pathname.startsWith("/analytics")
  )
    return "gensales";
  return "gensales";
}

// ============================================
// TOP BAR COMPONENT
// ============================================

interface TopBarProps {
  className?: string;
}

export function TopBar({ className }: TopBarProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [isTogglingTheme, setIsTogglingTheme] = useState(false);
  const [mounted, setMounted] = useState(false);

  const currentAppId = detectCurrentApp(router.pathname);

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    user,
    organizations,
    isAuthenticated,
    isLoading: authLoading,
  } = useAuth();

  const {
    profile: userProfile,
    isLoading: profileLoading,
    refreshProfile,
  } = useUserProfile();

  const { workspaces, currentWorkspaceId } = useAccounts();

  const profileImage =
    userProfile?.avatar ?? (userProfile as any)?.imageUrl ?? null;

  const {
    notifications,
    unreadCount,
    markAsRead,
  } = useGetNotice();

  const hasRequestedProfileRef = useRef(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated && !hasRequestedProfileRef.current) {
      hasRequestedProfileRef.current = true;
      refreshProfile?.().catch((error) => {
        console.error("Failed to refresh profile:", error);
      });
    }
  }, [authLoading, isAuthenticated, refreshProfile]);

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
    await AuthService.logout();
    router.push("/auth");
  };

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    setIsTogglingTheme(true);
    setTimeout(() => setIsTogglingTheme(false), 300);
  };

  const currentWorkspace = workspaces.find((w) => w.id === currentWorkspaceId);

  return (
    <header
      className={cn(
        "flex items-center justify-between h-12 px-3 border-b border-black/[0.04] dark:border-white/[0.06] bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-blur-xl sticky top-0 z-50",
        className
      )}
    >
      {/* Left Side - App Switcher */}
      <nav className="flex items-center gap-0.5">
          {apps.map((app) => {
            const isSelected = currentAppId === app.id;
            const Icon = app.icon;

            return (
              <Link key={app.id} href={app.path}>
                <button
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all duration-150 whitespace-nowrap text-[13px] font-medium",
                    isSelected
                      ? "bg-white dark:bg-[#2c2c2e] shadow-sm border border-black/[0.06] dark:border-white/[0.08]"
                      : "text-muted-foreground hover:text-foreground hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
                  )}
                >
                  <Icon
                    className="h-3.5 w-3.5"
                    style={{
                      color: isSelected ? app.color : undefined,
                    }}
                  />
                  <span style={{ color: isSelected ? app.color : undefined }}>
                    {app.shortName}
                  </span>
                </button>
              </Link>
            );
          })}
      </nav>

      {/* Right Side - User Controls */}
      <div className="flex items-center gap-1">
        {/* Theme Toggle */}
        {mounted ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className={cn(
              "w-8 h-8 p-0 rounded-lg bg-transparent hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-transform duration-300",
              isTogglingTheme && "rotate-180"
            )}
          >
            {theme === "dark" ? (
              <Moon className="w-4 h-4 text-muted-foreground" />
            ) : (
              <Sun className="w-4 h-4 text-muted-foreground" />
            )}
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            aria-label="Toggle theme"
            className="w-8 h-8 p-0 rounded-lg"
          >
            <Sun className="w-4 h-4 text-muted-foreground" />
          </Button>
        )}

        {/* Team Chat */}
        <ChatButton />

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="relative w-8 h-8 p-0 rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4 text-muted-foreground" />
              {unreadCount > 0 && (
                <div className="flex absolute -top-0.5 -right-0.5 justify-center items-center w-3.5 h-3.5 bg-[#ff3b30] rounded-full">
                  <span className="text-[10px] font-medium text-white">
                    {unreadCount}
                  </span>
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-96 p-0 bg-white/95 dark:bg-[#1c1c1e]/95 backdrop-blur-xl border border-black/[0.08] dark:border-white/[0.1] shadow-2xl rounded-2xl overflow-hidden z-[9999]"
            sideOffset={8}
          >
            <div className="px-6 py-4 border-b border-black/[0.04] dark:border-white/[0.06]">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-foreground">
                    Notifications
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Stay updated with your latest activities
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className="text-xs text-[#0071e3] bg-[#0071e3]/10"
                >
                  {unreadCount} new
                </Badge>
              </div>
            </div>
            <div className="overflow-y-auto max-h-96">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "flex items-start space-x-3 p-4 transition-colors duration-200 cursor-pointer border-b border-black/[0.04] dark:border-white/[0.04] last:border-b-0",
                      notification.unread && !isNotificationRead(notification.id)
                        ? "bg-[#0071e3]/5"
                        : "hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
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
                    <div className="flex flex-shrink-0 justify-center items-center w-8 h-8 bg-black/[0.04] dark:bg-white/[0.06] rounded-lg">
                      <span className="text-sm">{notification.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-sm font-medium text-foreground">
                          {notification.title}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {notification.time}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {notification.message}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <div className="flex justify-center items-center mx-auto mb-4 w-12 h-12 bg-black/[0.04] dark:bg-white/[0.06] rounded-full">
                    <Bell className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    No notifications yet
                  </p>
                </div>
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Workspace Switcher */}
        <WorkspaceSwitcherDropdown
          currentAccount={{
            name:
              organizations.find((org) => org.id === user?.organization_id)
                ?.name ||
              userProfile?.name ||
              user?.name ||
              "Current User",
            workspace_name:
              currentWorkspace?.workspace_name || "Current Workspace",
          }}
        />

        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative p-0 h-auto w-8 rounded-full ml-1"
            >
              <Avatar className="w-7 h-7 ring-1 ring-black/[0.06] dark:ring-white/[0.1]">
                {profileImage && (
                  <AvatarImage
                    src={profileImage}
                    alt={userProfile?.name || "User"}
                  />
                )}
                <AvatarFallback className="text-xs font-medium text-white bg-gradient-to-br from-[#0071e3] to-[#00c7ff]">
                  {userProfile ? getUserInitials(userProfile.name) : "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-72 p-0 bg-white/95 dark:bg-[#1c1c1e]/95 backdrop-blur-xl border border-black/[0.08] dark:border-white/[0.1] shadow-xl rounded-2xl overflow-hidden z-[9999]"
            sideOffset={8}
          >
            {/* Profile Header */}
            <div className="px-6 py-4 border-b border-black/[0.04] dark:border-white/[0.06]">
              <div className="flex items-center space-x-3">
                <Avatar className="w-12 h-12 ring-2 ring-white dark:ring-[#2c2c2e] shadow-sm">
                  {profileImage && (
                    <AvatarImage
                      src={profileImage}
                      alt={userProfile?.name || "User"}
                    />
                  )}
                  <AvatarFallback className="text-lg font-medium text-white bg-gradient-to-br from-[#0071e3] to-[#00c7ff]">
                    {userProfile ? getUserInitials(userProfile.name) : "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-foreground">
                    {userProfile?.name || "User"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {userProfile?.email || "user@example.com"}
                  </p>
                </div>
              </div>
            </div>

            {/* Profile Actions */}
            <div className="p-2">
              <div className="space-y-1">
                <div
                  className="flex items-center px-3 py-2 space-x-3 rounded-xl transition-colors duration-200 cursor-pointer hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                  onClick={() => router.push("/profile")}
                >
                  <div className="flex justify-center items-center w-8 h-8 bg-black/[0.04] dark:bg-white/[0.06] rounded-lg">
                    <UserCircle className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Account Settings
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Manage your account
                    </p>
                  </div>
                </div>
                <div
                  className="flex items-center px-3 py-2 space-x-3 rounded-xl transition-colors duration-200 cursor-pointer hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                  onClick={() => router.push("/billing")}
                >
                  <div className="flex justify-center items-center w-8 h-8 bg-[#34c759]/10 rounded-lg">
                    <CreditCard className="w-4 h-4 text-[#34c759]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Billing & Plans
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Manage subscription
                    </p>
                  </div>
                </div>
              </div>

              <div className="my-3 h-px bg-black/[0.04] dark:bg-white/[0.06]" />

              <div
                className="flex items-center px-3 py-2 space-x-3 rounded-xl transition-colors duration-200 cursor-pointer hover:bg-[#ff3b30]/10 group"
                onClick={handleLogout}
              >
                <div className="flex justify-center items-center w-8 h-8 bg-[#ff3b30]/10 rounded-lg">
                  <LogOut className="w-4 h-4 text-[#ff3b30]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#ff3b30]">Sign Out</p>
                  <p className="text-xs text-[#ff3b30]/70">End your session</p>
                </div>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

export default TopBar;

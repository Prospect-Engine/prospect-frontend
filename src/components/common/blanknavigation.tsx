"use client";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Sun, Moon, LogOut, UserCircle, CreditCard } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect, useMemo, useRef } from "react";
import { useMobile } from "@/hooks/use-mobile";
import { AuthService } from "@/lib/auth";
import { useAccounts } from "@/hooks/useWorkspaceAccounts";
import { useAuth } from "@/context/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useSubscription } from "@/hooks/useSubscription";
import WorkspaceSwitcherDropdown from "@/components/workspace/WorkspaceSwitcherDropdown";

interface NavbarWithoutMenuProps {
  className?: string;
}

export default function NavbarWithoutMenu({
  className,
}: NavbarWithoutMenuProps) {
  const router = useRouter();
  const isMobile = useMobile();
  const { theme, setTheme } = useTheme();
  const [isTogglingTheme, setIsTogglingTheme] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering theme toggle after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch real team data
  const { workspaces, currentWorkspaceId } = useAccounts();

  // Get auth context for impersonation
  const {
    user,
    switchableAccounts,
    organizations,
    isAuthenticated,
    isLoading: authLoading,
    getAllSwitchableAccounts,
  } = useAuth();

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

  // State to track when data is ready
  const [isDataReady, setIsDataReady] = useState(false);
  const [currentMember, setCurrentMember] = useState<{
    id: string;
    name: string;
    current: boolean;
    workspaceId: string | null;
    workspaceName: string;
    recent: boolean;
    favorite: boolean;
  }>({
    id: "current",
    name: "Current User",
    current: true,
    workspaceId: null,
    workspaceName: "Current Workspace",
    recent: false,
    favorite: false,
  });

  const [currentWorkspace, setCurrentWorkspace] = useState<{
    id: string;
    name: string;
    current: boolean;
    recent: boolean;
    favorite: boolean;
    unread: boolean;
  }>({
    id: "current",
    name: "Current Workspace",
    current: true,
    recent: true,
    favorite: false,
    unread: false,
  });

  // Ensure we request the latest profile once the user is authenticated
  const hasRequestedProfileRef = useRef(false);
  // Prevent infinite loop when fetching switchable accounts
  const hasFetchedAccountsRef = useRef(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated && !hasRequestedProfileRef.current) {
      hasRequestedProfileRef.current = true;
      refreshProfile?.().catch(error => {
        console.error("Failed to refresh profile:", error);
      });
    }
  }, [authLoading, isAuthenticated, refreshProfile]);

  // Use useEffect to ensure switchableAccounts and user are loaded
  useEffect(() => {
    const loadData = async () => {
      // Wait for auth to be ready
      if (authLoading) {
        return;
      }

      // If authenticated but switchableAccounts is empty, try to fetch it ONCE
      if (
        isAuthenticated &&
        user &&
        switchableAccounts.length === 0 &&
        getAllSwitchableAccounts &&
        !hasFetchedAccountsRef.current
      ) {
        hasFetchedAccountsRef.current = true;
        try {
          await getAllSwitchableAccounts();
          // After fetching, the effect will run again with updated switchableAccounts
          return;
        } catch (error) {
          console.error("Failed to load switchable accounts:", error);
          // Continue with fallback logic even if fetch fails
        }
      }

      // Calculate current member
      let teamName = "Current Workspace";
      let userName = userProfile?.name || user?.name || "Current User";

      if (user?.user_id && switchableAccounts.length > 0) {
        // Find the current account in switchableAccounts - match both user_id AND workspace_id
        const userWorkspaceId = user.workspace_id;
        const currentAccount = switchableAccounts.find(
          acc =>
            acc.user_id === user.user_id && acc.workspace_id === userWorkspaceId
        );

        if (currentAccount) {
          teamName = currentAccount.workspace_name || "Current Workspace";
          userName = currentAccount.name || "Current User";
        } else {
          // Final fallback to workspaces data
          const wsId =
            userProfile?.workspace_id ||
            userProfile?.team_id ||
            user?.workspace_id;
          if (wsId) {
            const account = workspaces.find(w => w.id === wsId);
            teamName = account?.workspace_name || "Current Workspace";
          }
          userName = userProfile?.name || user?.name || "Current User";
        }
      } else if (user?.name) {
        userName = user.name;
        if (
          userProfile?.workspace_id ||
          userProfile?.team_id ||
          user?.workspace_id
        ) {
          const account = workspaces.find(
            w =>
              w.id ===
              (userProfile?.workspace_id ||
                userProfile?.team_id ||
                user?.workspace_id)
          );
          teamName = account?.workspace_name || "Current Workspace";
        }
      }

      setCurrentMember({
        id: user?.user_id || user?.id || "current",
        name: userName,
        current: true,
        workspaceId: user?.workspace_id || null,
        workspaceName: teamName,
        recent: false,
        favorite: false,
      });

      // Calculate current workspace
      let workspaceName = "Current Workspace";

      if (user?.user_id && switchableAccounts.length > 0) {
        // Find the current account in switchableAccounts - match both user_id AND workspace_id
        const userWorkspaceId = user.workspace_id;
        const currentAccount = switchableAccounts.find(
          acc =>
            acc.user_id === user.user_id && acc.workspace_id === userWorkspaceId
        );

        if (currentAccount) {
          workspaceName = currentAccount.workspace_name || "Current Workspace";
        } else {
          // Final fallback to workspaces data
          const wsId =
            userProfile?.workspace_id ||
            userProfile?.team_id ||
            user?.workspace_id;
          if (wsId) {
            const account = workspaces.find(w => w.id === wsId);
            workspaceName = account?.workspace_name || "Current Workspace";
          }
        }
      }

      setCurrentWorkspace({
        id:
          userProfile?.workspace_id ||
          userProfile?.team_id ||
          user?.workspace_id ||
          "current",
        name: teamName,
        current: true,
        recent: true,
        favorite: false,
        unread: false,
      });

      setIsDataReady(true);
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    user,
    userProfile,
    // Note: workspaces removed from deps to prevent infinite loop - it's only used as fallback lookup
    switchableAccounts,
    isAuthenticated,
    authLoading,
  ]);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    setIsTogglingTheme(true);
    setTimeout(() => setIsTogglingTheme(false), 300);
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

  return (
    <div
      className={cn(
        "overflow-visible relative z-10 p-4 rounded-2xl border shadow-sm backdrop-blur-xl transition-all duration-300 bg-white/70 dark:bg-gray-800/70 border-white/20 dark:border-gray-600 hover:shadow-md",
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
            <div className="flex justify-center items-center w-9 h-9 bg-gradient-to-br rounded-2xl shadow-sm from-gray-900 to-gray-700">
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

        {/* Right Side - Theme Toggle, Team Switcher, and User */}
        <div className="flex items-center space-x-2 sm:space-x-3">
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

          {/* User Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative p-0 h-auto min-w-[44px] min-h-[44px] rounded-full touch-manipulation"
              >
                <Avatar className="w-9 h-9 ring-2 ring-white dark:ring-gray-700 shadow-sm transition-all duration-200 hover:ring-gray-200 dark:hover:ring-gray-600">
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
              <div className="px-6 py-4 bg-gradient-to-r to-white dark:to-gray-800 border-b from-gray-50 dark:from-gray-700 border-gray-100 dark:border-gray-600">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-12 h-12 ring-2 ring-white dark:ring-gray-700 shadow-sm">
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
                {/* <div className="space-y-1">
                  <div
                    className="flex items-center px-3 py-2 space-x-3 rounded-xl transition-colors duration-200 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                    onClick={() => router.push("/profile")}
                  >
                    <div className="flex justify-center items-center w-8 h-8 bg-gradient-to-br rounded-lg from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600">
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
                    <div className="flex justify-center items-center w-8 h-8 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 rounded-lg">
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
                </div> */}

                {/* <div className="my-3 h-px bg-gradient-to-r from-transparent to-transparent via-gray-200 dark:via-gray-600" /> */}

                <div
                  className="flex items-center px-3 py-2 space-x-3 rounded-xl transition-colors duration-200 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 group"
                  onClick={handleLogout}
                >
                  <div className="flex justify-center items-center w-8 h-8 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30 rounded-lg transition-all duration-200 group-hover:from-red-200 group-hover:to-red-300 dark:group-hover:from-red-800/40 dark:group-hover:to-red-700/40">
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
  );
}

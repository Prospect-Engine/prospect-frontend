"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Search,
  User,
  Settings,
  LogOut,
  ChevronDown,
  CheckCircle,
  AlertCircle,
  Building,
  Users,
  ArrowLeft,
  VenetianMask,
} from "lucide-react";
import { useAuth } from "../../hooks/sales-hooks/useAuth";
import { useGlobalSearch } from "../../hooks/sales-hooks/useGlobalSearch";
import SearchDropdown from "./SearchDropdown";
import { API_BASE_URL } from "../../services/sales-services/baseUrl";

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const {
    searchTerm,
    setSearchTerm,
    searchResults,
    isSearchOpen,
    isSearching,
    hasError,
    openSearch,
    closeSearch,
  } = useGlobalSearch();

  // Check for impersonation status
  useEffect(() => {
    const checkImpersonationStatus = () => {
      const impersonationToken = localStorage.getItem("impersonation_token");
      const originalToken = localStorage.getItem("original_token");
      const impersonatedUserData = localStorage.getItem("impersonated_user");
      const originalUserData = localStorage.getItem("original_user");

      if (impersonationToken && originalToken && impersonatedUserData) {
        setIsImpersonating(true);

        // Use stored original user data if available
        if (originalUserData) {
          // setOriginalUser(JSON.parse(originalUserData)); // This line was removed
        } else {
          // Fallback for legacy impersonation sessions
          // setOriginalUser({ // This line was removed
          //   name: 'Original User',
          //   email: 'owner@example.com',
          // });
        }
      } else {
        setIsImpersonating(false);
        // setImpersonatedUser(null); // This line was removed
        // setOriginalUser(null); // This line was removed
      }
    };

    checkImpersonationStatus();

    // Listen for storage changes (in case impersonation happens in another tab)
    window.addEventListener("storage", checkImpersonationStatus);

    return () => {
      window.removeEventListener("storage", checkImpersonationStatus);
    };
  }, []);

  // Function to stop impersonation
  const stopImpersonation = async () => {
    const originalToken = localStorage.getItem("original_token");

    if (originalToken) {
      try {
        // Restore original token
        localStorage.setItem("crm_access_token", originalToken);

        // Fetch the original user's profile to restore their data
        //
        const profileResponse = await fetch(`${API_BASE_URL}/auth/profile`, {
          headers: {
            Authorization: `Bearer ${originalToken}`,
            "Content-Type": "application/json",
          },
        });

        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          //

          // Update stored user data with original user's complete profile
          localStorage.setItem("user", JSON.stringify(profileData));
        }

        // Clear all impersonation data
        localStorage.removeItem("impersonation_token");
        localStorage.removeItem("original_token");
        localStorage.removeItem("impersonated_user");
        localStorage.removeItem("original_user");

        // Reload page to apply original user session
        window.location.reload();
      } catch (error) {
        // Fallback: still restore token and reload
        localStorage.removeItem("impersonation_token");
        localStorage.removeItem("original_token");
        localStorage.removeItem("impersonated_user");
        localStorage.removeItem("original_user");
        window.location.reload();
      }
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K to open search
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        openSearch();
      }

      // Escape to close search
      if (e.key === "Escape" && isSearchOpen) {
        e.preventDefault();
        closeSearch();
      }

      // Escape to close user menu
      if (e.key === "Escape" && showUserMenu) {
        e.preventDefault();
        setShowUserMenu(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isSearchOpen, openSearch, closeSearch, showUserMenu]);

  // Handle click outside to close user menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Helper function to handle navigation with smooth dropdown closing
  const handleNavigation = (path: string) => {
    setShowUserMenu(false);
    // Small delay to allow smooth close animation before navigation
    setTimeout(() => {
      router.push(path);
    }, 150);
  };

  return (
    <>
      <header className="px-6 py-1 bg-white border-b border-gray-200">
        <div className="flex justify-between items-center">
          {/* Left side - Search */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 w-4 h-4 text-gray-400 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search leads, tasks, deals, companies..."
                className="py-2 pr-4 pl-10 w-80 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent smooth-transition"
                onClick={openSearch}
                readOnly
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <kbd className="px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-100 rounded border border-gray-200">
                  ⌘K
                </kbd>
              </div>
            </div>
          </div>

          {/* Right side - Notifications and User */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button className="relative p-2 text-gray-500 dark:text-gray-400 rounded-lg smooth-transition hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
              <Bell className="w-5 h-5" />
              <span className="flex absolute -top-1 -right-1 justify-center items-center w-5 h-5 text-xs text-white bg-red-500 dark:bg-red-600 rounded-full">
                3
              </span>
            </button>

            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center p-2 space-x-3 rounded-lg smooth-transition hover:bg-gray-100"
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <img
                      src={
                        user?.avatar ||
                        `https://ui-avatars.com/api/?name=${user?.name}&background=random`
                      }
                      alt={user?.name}
                      className="w-8 h-8 rounded-full"
                    />
                    {isImpersonating && (
                      <div
                        className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full border-2 border-white"
                        title="Impersonating"
                      ></div>
                    )}
                  </div>
                  <div className="hidden text-left md:block">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.name}
                    </p>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">
                        {user?.globalRole}
                      </span>
                      {user?.emailVerified ? (
                        <CheckCircle className="w-3 h-3 text-green-500" />
                      ) : (
                        <AlertCircle className="w-3 h-3 text-yellow-500" />
                      )}
                      {isImpersonating && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 text-xs font-medium text-purple-700 bg-purple-100 rounded-full">
                          <VenetianMask className="mr-1 w-3 h-3" />
                          Impersonating
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-500 sidebar-chevron-rotate" />
                </div>
              </button>

              {/* User Dropdown Menu */}
              <div
                className={`absolute right-0 z-50 mt-2 w-96 bg-white rounded-lg border border-gray-200 shadow-lg transition-all duration-300 ease-in-out transform ${
                  showUserMenu
                    ? "opacity-100 scale-100 translate-y-0"
                    : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
                }`}
              >
                {/* Impersonation Status */}
                {isImpersonating && (
                  <div className="p-3 bg-purple-50 border-b border-purple-100">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <VenetianMask className="w-4 h-4 text-purple-600" />
                        <div>
                          <div className="text-sm font-medium text-purple-900">
                            Impersonating User
                          </div>
                          <div className="text-xs text-purple-600">
                            Viewing as: {user?.name}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={stopImpersonation}
                        className="flex items-center px-2 py-1 space-x-1 text-xs text-purple-700 bg-purple-100 rounded smooth-transition hover:bg-purple-200"
                      >
                        <ArrowLeft className="w-3 h-3" />
                        <span>Exit</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Organizations & Workspaces Connection View */}
                {user?.organizations && user.organizations.length > 0 && (
                  <div className="p-3 border-b border-gray-200">
                    <h4 className="mb-2 text-xs font-medium tracking-wide text-gray-500 uppercase">
                      Organization Network
                    </h4>
                    <div className="overflow-y-auto space-y-2 max-h-48">
                      {user.organizations
                        .filter(org => org.isActive)
                        .map((org, orgIndex) => {
                          const orgWorkspaces =
                            user.workspaces?.filter(
                              ws => ws.organizationId === org.id && ws.isActive
                            ) || [];
                          const orgColors = [
                            "from-blue-500 to-blue-600",
                            "from-purple-500 to-purple-600",
                            "from-green-500 to-green-600",
                            "from-orange-500 to-orange-600",
                          ];
                          const orgColor =
                            orgColors[orgIndex % orgColors.length];

                          return (
                            <div key={org.id} className="relative">
                              {/* Organization Node */}
                              <div className="flex items-center space-x-2 text-xs">
                                <div
                                  className={`flex justify-center items-center w-6 h-6 bg-gradient-to-r rounded-full shadow-sm ${orgColor}`}
                                >
                                  <Building className="w-3 h-3 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-gray-900 truncate">
                                    {org.name}
                                  </div>
                                  <div className="text-gray-500">
                                    {org.role}
                                  </div>
                                </div>
                                <div className="text-xs text-gray-400">
                                  {orgWorkspaces.length} workspace
                                  {orgWorkspaces.length !== 1 ? "s" : ""}
                                </div>
                              </div>

                              {/* Connected Workspaces */}
                              {orgWorkspaces.length > 0 && (
                                <div className="mt-1 ml-8 space-y-1">
                                  {orgWorkspaces.map(workspace => (
                                    <div
                                      key={workspace.id}
                                      className="flex relative items-center space-x-2 text-xs"
                                    >
                                      {/* Connection Line */}
                                      <div className="absolute top-2 -left-4 w-3 h-px bg-gray-300"></div>
                                      <div className="absolute top-2 -left-4 w-px h-3 bg-gray-300"></div>

                                      <div className="flex justify-center items-center w-4 h-4 bg-gray-100 rounded shadow-sm">
                                        <Users className="w-2 h-2 text-gray-600" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <span className="text-gray-700 truncate">
                                          {workspace.name}
                                        </span>
                                        <span className="ml-1 px-1 py-0.5 text-xs text-gray-500 bg-gray-100 rounded">
                                          {workspace.role}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="p-2">
                  <button
                    onClick={() =>
                      handleNavigation("/sales/settings?section=profile")
                    }
                    className="flex items-center px-3 py-2 w-full text-sm text-gray-700 rounded-md smooth-transition hover:bg-gray-100"
                  >
                    <User className="mr-3 w-4 h-4" />
                    View Profile
                  </button>
                  <button
                    onClick={() =>
                      handleNavigation("/sales/settings?section=profile")
                    }
                    className="flex items-center px-3 py-2 w-full text-sm text-gray-700 rounded-md smooth-transition hover:bg-gray-100"
                  >
                    <Settings className="mr-3 w-4 h-4" />
                    Settings
                  </button>
                  <button
                    onClick={logout}
                    className="flex items-center px-3 py-2 w-full text-sm text-red-600 rounded-md smooth-transition hover:bg-red-50"
                  >
                    <LogOut className="mr-3 w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Search Dropdown */}
      {isSearchOpen && (
        <SearchDropdown
          isOpen={isSearchOpen}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          searchResults={searchResults}
          isSearching={isSearching}
          hasError={hasError}
          onClose={closeSearch}
        />
      )}
    </>
  );
};

export default Header;

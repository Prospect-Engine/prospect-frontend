"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Users,
  Network,
  CheckSquare,
  MessageSquare,
  Mail,
  Linkedin,
  MessageCircle,
  Phone,
  BarChart3,
  HelpCircle,
  Settings,
  ChevronRight,
  ChevronDown,
  Filter,
  Calendar,
  Zap,
  TrendingUp,
  Star,
  LogOut,
  Building,
  Check,
  DollarSign,
} from "lucide-react";
import { useAuth } from "../../hooks/sales-hooks/useAuth";
import { useWorkspace } from "../../hooks/sales-hooks/useWorkspace";
import { useCountsContext } from "../../contexts/sales-contexts/CountsContext";
import { useCounts } from "../../hooks/sales-hooks/useCounts";

const Sidebar: React.FC = () => {
  const { logout } = useAuth();
  const {
    selectedOrganization,
    selectedWorkspace,
    setSelectedOrganization,
    setSelectedWorkspace,
    organizations,
    getWorkspacesForOrganization,
    isLoading: workspaceLoading,
  } = useWorkspace();
  const router = useRouter();
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  const [showOrgDropdown, setShowOrgDropdown] = useState(false);
  const [expandedOrgs, setExpandedOrgs] = useState<string[]>([]);

  const orgDropdownRef = useRef<HTMLDivElement>(null);
  const { counts } = useCountsContext();

  // Initialize counts by calling the useCounts hook
  useCounts();

  // Debug: Log counts to see if they're updating

  // Navigation items (removed useMemo to fix React error #310)
  const recordItems = [
    {
      icon: Users,
      label: "All Leads",
      path: "/sales/leads",
      color: "text-gray-700",
      count: counts?.leads?.total || 0,
    },
    {
      icon: Building,
      label: "All Companies",
      path: "/sales/companies",
      color: "text-gray-700",
      count: counts?.companies?.total || 0,
    },
    {
      icon: Network,
      label: "Pipeline",
      path: "/sales/pipeline",
      color: "text-blue-600",
      count: counts?.pipeline?.total || 0,
    },
  ];

  const feedItems = [
    {
      icon: CheckSquare,
      label: "Tasks",
      count: counts?.tasks?.total || 0,
      path: "/sales/tasks",
    },
    // {
    //   icon: MessageSquare,
    //   label: 'Engagement',
    //   count: 15,
    //   path: '/sales/inbox',
    // },
    {
      icon: DollarSign,
      label: "Deals",
      count: counts?.deals?.total || 0,
      path: "/sales/deals",
    },
  ];

  const inboxItems = [
    { icon: Mail, label: "Email", count: 12, type: "email" },
    { icon: Linkedin, label: "LinkedIn", count: 5, type: "linkedin" },
    { icon: MessageCircle, label: "Telegram", count: 3, type: "telegram" },
    { icon: Phone, label: "WhatsApp", count: 7, type: "whatsapp" },
  ];

  const otherItems = [
    { icon: BarChart3, label: "Analytics", path: "/sales/analytics" },
    // { icon: Calendar, label: 'Calendar' },
    // { icon: Filter, label: 'Saved Filters' },
    // { icon: Zap, label: 'Automations' },
  ];

  // Auto-expand sections based on current URL (moved from useEffect to direct logic)
  const getExpandedSections = () => {
    const newExpandedSections: string[] = [];

    // Determine which section should be expanded based on current path
    if (
      pathname === "/sales/leads" ||
      pathname === "/sales/companies" ||
      pathname === "/sales/pipeline"
    ) {
      newExpandedSections.push("records");
    }

    if (
      pathname === "/sales/tasks" ||
      pathname.startsWith("/sales/deals")
    ) {
      newExpandedSections.push("feed");
    }

    if (pathname === "/sales/inbox") {
      newExpandedSections.push("inbox");
    }

    if (
      pathname === "/sales/settings" ||
      pathname.startsWith("/sales/settings") ||
      pathname === "/sales/analytics"
    ) {
      newExpandedSections.push("other");
      newExpandedSections.push("settings");
    }

    return newExpandedSections;
  };

  // Combine automatic expansion with manual toggles
  const currentExpandedSections = [
    ...new Set([...expandedSections, ...getExpandedSections()]),
  ];

  // Handle organization expansion directly without useEffect
  const handleOrgExpansion = () => {
    if (
      selectedOrganization &&
      !expandedOrgs.includes(selectedOrganization.id)
    ) {
      setExpandedOrgs(prev => [...prev, selectedOrganization.id]);
    }
  };

  // Call it when needed instead of in useEffect
  if (selectedOrganization && !expandedOrgs.includes(selectedOrganization.id)) {
    handleOrgExpansion();
  }

  const toggleOrganization = (orgId: string) => {
    setExpandedOrgs(prev =>
      prev.includes(orgId) ? prev.filter(id => id !== orgId) : [...prev, orgId]
    );
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        orgDropdownRef.current &&
        !orgDropdownRef.current.contains(event.target as Node)
      ) {
        setShowOrgDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const handleNavigation = useCallback(
    (path: string) => {
      try {
        // Use router.push directly for client-side navigation
        router.push(path);
      } catch (error) {
        // Fallback to window.location if router fails
        window.location.href = path;
      }
    },
    [router]
  );

  return (
    <div className="flex relative flex-col w-64 h-screen bg-white border-r border-gray-200">
      {/* Organization & Workspace Selector */}
      <div className="overflow-visible relative p-2 border-b border-gray-200">
        <div className="relative" ref={orgDropdownRef}>
          <button
            onClick={() => setShowOrgDropdown(!showOrgDropdown)}
            className="flex items-center justify-between w-full px-2 py-1.5 text-left bg-white rounded-lg border border-gray-200 hover:bg-gray-50 smooth-transition"
            disabled={workspaceLoading}
          >
            <div className="flex items-center space-x-2">
              <div className="flex justify-center items-center w-6 h-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded shadow-sm">
                <span className="text-xs font-bold text-white">
                  {selectedWorkspace?.name?.charAt(0).toUpperCase() || "W"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                {workspaceLoading ? (
                  <div className="animate-pulse">
                    <div className="h-3 bg-gray-200 rounded w-16 mb-0.5"></div>
                    <div className="w-12 h-2 bg-gray-200 rounded"></div>
                  </div>
                ) : (
                  <>
                    <div className="text-xs font-medium text-gray-900 truncate">
                      {selectedWorkspace?.name || "Select Workspace"}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {selectedOrganization?.name ||
                        `${organizations.length} org${organizations.length !== 1 ? "s" : ""} available`}
                    </div>
                  </>
                )}
              </div>
            </div>
            <ChevronDown
              className={`w-3 h-3 text-gray-400 sidebar-chevron-rotate ${showOrgDropdown ? "rotate-180" : ""}`}
            />
          </button>

          <div
            className={`overflow-hidden absolute left-0 top-full z-50 mt-1 w-80 bg-white rounded-lg border border-gray-200 shadow-xl transition-all duration-300 ease-in-out transform ${
              showOrgDropdown && !workspaceLoading
                ? "opacity-100 scale-100 translate-y-0"
                : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
            }`}
          >
            <div className="overflow-y-auto max-h-64">
              {organizations.length === 0 ? (
                <div className="px-3 py-4 text-center">
                  <Building className="mx-auto mb-2 w-6 h-6 text-gray-300" />
                  <div className="text-xs text-gray-500">
                    No organizations available
                  </div>
                </div>
              ) : (
                organizations
                  .filter(
                    (org, index, self) =>
                      index === self.findIndex(o => o.id === org.id)
                  )
                  .map((org, orgIndex) => {
                    const orgWorkspaces = getWorkspacesForOrganization(org.id);
                    const isExpanded = expandedOrgs.includes(org.id);
                    const orgColors = [
                      "from-blue-500 to-blue-600",
                      "from-purple-500 to-purple-600",
                      "from-green-500 to-green-600",
                      "from-orange-500 to-orange-600",
                      "from-red-500 to-red-600",
                    ];
                    const orgColor = orgColors[orgIndex % orgColors.length];

                    return (
                      <div
                        key={org.id}
                        className="border-b border-gray-100 last:border-b-0"
                      >
                        {/* Organization Header - Clickable to expand/collapse */}
                        <button
                          onClick={() => toggleOrganization(org.id)}
                          className="w-full px-2 py-1.5 bg-gray-50 hover:bg-gray-100 smooth-transition"
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-2">
                              <div
                                className={`flex justify-center items-center w-5 h-5 bg-gradient-to-r rounded shadow-sm ${orgColor}`}
                              >
                                <span className="text-xs font-bold text-white">
                                  {org.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0 text-left">
                                <div className="text-xs font-medium text-gray-900 truncate">
                                  {org.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {orgWorkspaces.length} workspace
                                  {orgWorkspaces.length !== 1 ? "s" : ""}
                                </div>
                              </div>
                            </div>
                            <ChevronRight
                              className={`w-3 h-3 text-gray-400 sidebar-chevron-rotate ${isExpanded ? "rotate-90" : ""}`}
                            />
                          </div>
                        </button>

                        {/* Workspaces - Collapsible */}
                        <div
                          className={`overflow-hidden transition-all duration-300 ease-in-out ${
                            isExpanded
                              ? "max-h-96 opacity-100"
                              : "max-h-0 opacity-0"
                          }`}
                        >
                          {orgWorkspaces.length > 0 ? (
                            <div className="bg-white">
                              {orgWorkspaces.map((workspace, wsIndex) => {
                                const isSelected =
                                  selectedOrganization?.id === org.id &&
                                  selectedWorkspace?.id === workspace.id;
                                const wsColors = [
                                  "bg-blue-100 text-blue-700",
                                  "bg-purple-100 text-purple-700",
                                  "bg-green-100 text-green-700",
                                  "bg-orange-100 text-orange-700",
                                  "bg-red-100 text-red-700",
                                ];
                                const wsColor =
                                  wsColors[wsIndex % wsColors.length];

                                return (
                                  <button
                                    key={workspace.id}
                                    onClick={() => {
                                      setSelectedOrganization(org);
                                      setSelectedWorkspace(workspace);
                                      setShowOrgDropdown(false);
                                    }}
                                    className={`flex items-center w-full px-3 py-1.5 text-left hover:bg-blue-50 smooth-transition border-l-2 ${
                                      isSelected
                                        ? "bg-blue-50 border-blue-500"
                                        : "border-transparent hover:border-blue-200"
                                    }`}
                                  >
                                    <div className="flex flex-1 items-center space-x-2">
                                      <div
                                        className={`flex justify-center items-center w-4 h-4 rounded ${
                                          isSelected
                                            ? "text-white bg-blue-500"
                                            : wsColor
                                        }`}
                                      >
                                        <span className="text-xs font-semibold">
                                          {workspace.name
                                            .charAt(0)
                                            .toUpperCase()}
                                        </span>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div
                                          className={`font-medium text-xs truncate ${isSelected ? "text-blue-900" : "text-gray-900"}`}
                                        >
                                          {workspace.name}
                                        </div>
                                        {workspace.description && (
                                          <div
                                            className={`text-xs truncate ${isSelected ? "text-blue-600" : "text-gray-500"}`}
                                          >
                                            {workspace.description}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    {isSelected && (
                                      <Check className="w-3 h-3 text-blue-600" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="px-3 py-2 text-center bg-gray-50">
                              <div className="text-xs italic text-gray-400">
                                No workspaces
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="overflow-y-auto flex-1">
        {/* Leads Section */}
        <div className="p-4">
          <button
            onClick={() => toggleSection("records")}
            className="flex justify-between items-center mb-3 w-full smooth-transition"
          >
            <h3 className="text-xs font-medium tracking-wide text-gray-500 uppercase">
              Records
            </h3>
            {currentExpandedSections.includes("records") ? (
              <ChevronDown className="w-3 h-3 text-gray-400 sidebar-chevron-rotate" />
            ) : (
              <ChevronRight className="w-3 h-3 text-gray-400 sidebar-chevron-rotate" />
            )}
          </button>

          <div
            className={`sidebar-section-container ${currentExpandedSections.includes("records") ? "expanded" : "collapsed"}`}
          >
            <div className="space-y-1">
              {recordItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div
                    key={index}
                    className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer sidebar-item-hover ${
                      pathname === item.path
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-700"
                    }`}
                    onClick={() => handleNavigation(item.path)}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon
                        className={`w-4 h-4 ${item.color || "text-gray-500"}`}
                      />
                      <span className="text-sm">{item.label}</span>
                    </div>
                    <span className="px-2 py-1 text-xs text-gray-500 bg-gray-200 rounded-full">
                      {item.count || 0}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Feed Section */}
        <div className="px-4 pb-4">
          <button
            onClick={() => toggleSection("feed")}
            className="flex justify-between items-center mb-3 w-full smooth-transition"
          >
            <h3 className="text-xs font-medium tracking-wide text-gray-500 uppercase">
              Feed
            </h3>
            {currentExpandedSections.includes("feed") ? (
              <ChevronDown className="w-3 h-3 text-gray-400 sidebar-chevron-rotate" />
            ) : (
              <ChevronRight className="w-3 h-3 text-gray-400 sidebar-chevron-rotate" />
            )}
          </button>

          <div
            className={`sidebar-section-container ${currentExpandedSections.includes("feed") ? "expanded" : "collapsed"}`}
          >
            <div className="space-y-1">
              {feedItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div
                    key={index}
                    className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer sidebar-item-hover ${
                      pathname === item.path
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-700"
                    }`}
                    onClick={() => handleNavigation(item.path)}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">{item.label}</span>
                    </div>
                    {item.count > 0 && (
                      <span className="px-2 py-1 text-xs text-white bg-blue-500 rounded-full">
                        {item.count}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Inbox Section */}
        <div className="px-4 pb-4">
          <button
            onClick={() => toggleSection("inbox")}
            className="flex justify-between items-center mb-3 w-full smooth-transition"
          >
            <h3 className="text-xs font-medium tracking-wide text-gray-500 uppercase">
              Inbox
            </h3>
            {currentExpandedSections.includes("inbox") ? (
              <ChevronDown className="w-3 h-3 text-gray-400 sidebar-chevron-rotate" />
            ) : (
              <ChevronRight className="w-3 h-3 text-gray-400 sidebar-chevron-rotate" />
            )}
          </button>

          <div
            className={`sidebar-section-container ${currentExpandedSections.includes("inbox") ? "expanded" : "collapsed"}`}
          >
            <div className="space-y-1">
              {inboxItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div
                    key={index}
                    className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer sidebar-item-hover ${
                      pathname === "/inbox" &&
                      pathname.includes(`type=${item.type}`)
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700"
                    }`}
                    onClick={() =>
                      handleNavigation(`/sales/inbox?type=${item.type}`)
                    }
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="w-4 h-4" />
                      <span className="text-sm">{item.label}</span>
                    </div>
                    {item.count > 0 && (
                      <span className="px-2 py-1 text-xs text-white bg-red-500 rounded-full">
                        {item.count}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Other Section */}
        <div className="px-4 pb-4">
          <button
            onClick={() => toggleSection("other")}
            className="flex justify-between items-center mb-3 w-full smooth-transition"
          >
            <h3 className="text-xs font-medium tracking-wide text-gray-500 uppercase">
              Other
            </h3>
            {currentExpandedSections.includes("other") ? (
              <ChevronDown className="w-3 h-3 text-gray-400 sidebar-chevron-rotate" />
            ) : (
              <ChevronRight className="w-3 h-3 text-gray-400 sidebar-chevron-rotate" />
            )}
          </button>

          <div
            className={`sidebar-section-container ${currentExpandedSections.includes("other") ? "expanded" : "collapsed"}`}
          >
            <div className="space-y-1">
              {otherItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div
                    key={index}
                    className={`flex items-center px-3 py-2 space-x-3 rounded-md cursor-pointer sidebar-item-hover ${
                      pathname === item.path
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700"
                    }`}
                    onClick={() => handleNavigation(item.path)}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Performance Stats */}
        {/* <div className="px-4 pb-4">
          <h3 className="mb-3 text-xs font-medium tracking-wide text-gray-500 uppercase">
            Today's Stats
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-3 h-3 text-green-500" />
                <span className="text-gray-700">Leads Added</span>
              </div>
              <span className="font-semibold text-gray-900">12</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center space-x-2">
                <Mail className="w-3 h-3 text-blue-500" />
                <span className="text-gray-700">Emails Sent</span>
              </div>
              <span className="font-semibold text-gray-900">28</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center space-x-2">
                <Phone className="w-3 h-3 text-purple-500" />
                <span className="text-gray-700">Calls Made</span>
              </div>
              <span className="font-semibold text-gray-900">7</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center space-x-2">
                <Star className="w-3 h-3 text-yellow-500" />
                <span className="text-gray-700">Conversions</span>
              </div>
              <span className="font-semibold text-gray-900">3</span>
            </div>
          </div>
        </div> */}
      </div>

      {/* Trial Banner */}
      <div className="p-4 border-t border-gray-200">
        <div className="p-3 mb-4 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="flex justify-center items-center w-4 h-4 bg-blue-500 rounded-full">
              <span className="text-xs text-white">9</span>
            </div>
            <span className="text-sm font-medium text-blue-900">
              days left on trial
            </span>
          </div>
          <button
            className="py-2 mt-2 w-full text-xs text-white bg-blue-600 rounded-md hover:bg-blue-700 smooth-transition"
            onClick={() =>
              handleNavigation("/sales/settings?section=billing")
            }
          >
            Upgrade Now
          </button>
        </div>

        <div className="space-y-2">
          <div
            className="flex items-center px-3 py-2 space-x-3 text-gray-700 rounded-md cursor-pointer sidebar-item-hover"
            onClick={() => handleNavigation("/sales/settings?section=team")}
          >
            <Users className="w-4 h-4 text-gray-500" />
            <span className="text-sm">Invite Teammates</span>
          </div>
          <div className="flex items-center px-3 py-2 space-x-3 text-gray-700 rounded-md cursor-pointer sidebar-item-hover">
            <HelpCircle className="w-4 h-4 text-gray-500" />
            <span className="text-sm">Help</span>
          </div>
          <div
            className={`flex items-center space-x-3 px-3 py-2 rounded-md cursor-pointer sidebar-item-hover ${
              pathname === "/settings"
                ? "bg-blue-50 text-blue-700"
                : "text-gray-700"
            }`}
            onClick={() => handleNavigation("/sales/settings")}
          >
            <Settings className="w-4 h-4" />
            <span className="text-sm">Settings</span>
          </div>
        </div>

        {/* User Profile */}
        <div className="pt-4 mt-4 border-t border-gray-200">
          <button
            onClick={logout}
            className="flex items-center px-3 py-2 mt-3 space-x-3 w-full text-gray-700 rounded-md cursor-pointer sidebar-item-hover"
          >
            <LogOut className="w-4 h-4 text-gray-500" />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;

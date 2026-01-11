"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  Loader2,
  Search,
  UserCircle,
  Briefcase,
  Building2,
  Check,
  Star,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import ShowShortMessage from "@/base-component/ShowShortMessage";
import { CreateOrganizationModal } from "@/components/organization/create-organization-modal";

interface WorkspaceSwitcherDropdownProps {
  className?: string;
  currentAccount?: {
    name: string;
    workspace_name?: string;
  };
}

export function WorkspaceSwitcherDropdown({
  className,
  currentAccount,
}: WorkspaceSwitcherDropdownProps) {
  const {
    switchableAccounts,
    organizations,
    switchWorkspace,
    switchOrganization,
    getAllOrganizations,
    isLoading,
    user,
  } = useAuth();
  const [isSwitching, setIsSwitching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<
    "members" | "workspaces" | "organizations"
  >("members");
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(
    null
  );
  const [isOpen, setIsOpen] = useState(false);
  const [isCreateOrgModalOpen, setIsCreateOrgModalOpen] = useState(false);

  // Helper to get workspace ID
  const getWorkspaceId = (account: any) => account.workspace_id;

  // Helper to get workspace name
  const getWorkspaceName = (account: any) => account.workspace_name;

  // Helper to get organization ID
  const getOrganizationId = (account: any) => account.organization_id;

  const handleAccountSwitch = async (account: any) => {
    setIsSwitching(true);
    // Close dropdown immediately for better UX
    setIsOpen(false);
    try {
      const workspaceId = getWorkspaceId(account);
      const organizationId = getOrganizationId(account);

      ShowShortMessage("Switching...", "info");

      // If no workspace_id but has organization_id, switch organization (auto-selects first workspace)
      if (!workspaceId && organizationId) {
        const result = await switchOrganization(organizationId);
        if (result.needsWorkspaceCreation) {
          ShowShortMessage("Please create a workspace to continue", "info");
        } else {
          ShowShortMessage(`Switched to ${account.name}`, "success");
        }
      } else if (workspaceId) {
        await switchWorkspace(workspaceId);
        const workspaceName = getWorkspaceName(account);
        ShowShortMessage(
          `Successfully switched to ${account.name}${workspaceName ? ` (${workspaceName})` : ""}`,
          "success"
        );
      } else {
        throw new Error("No workspace or organization ID found");
      }
    } catch (error) {
      let errorMessage = "Failed to switch";

      if (error instanceof Error) {
        if (error.message.includes("Network")) {
          errorMessage =
            "Network error. Please check your connection and try again.";
        } else if (
          error.message.includes("401") ||
          error.message.includes("403")
        ) {
          errorMessage = "Authentication error. Please log in again.";
        } else if (error.message.includes("500")) {
          errorMessage = "Server error. Please try again later.";
        } else {
          errorMessage = error.message;
        }
      }

      ShowShortMessage(errorMessage, "error");
    } finally {
      setIsSwitching(false);
    }
  };

  // Process switchable accounts into members and workspaces
  const members = useMemo(() => {
    const memberList: any[] = [];

    switchableAccounts.forEach(account => {
      const workspaceId = getWorkspaceId(account);
      const memberId = `${account.user_id}-${workspaceId || "personal"}`;

      // Determine if this is the current user based on user context
      const userWorkspaceId = user?.workspace_id;
      const isCurrentUser =
        user?.user_id === account.user_id && userWorkspaceId === workspaceId;

      memberList.push({
        id: memberId,
        name: account.name,
        current: isCurrentUser,
        workspaceId: workspaceId,
        workspaceName: getWorkspaceName(account),
        recent: false,
        favorite: false,
        // Store original account data for switching
        originalAccount: account,
      });
    });

    // Sort members: current user first, then others alphabetically
    const currentUser = memberList.find(member => member.current);
    const otherMembers = memberList.filter(member => !member.current);

    // Sort other members alphabetically by name
    otherMembers.sort((a, b) => a.name.localeCompare(b.name));

    // Return current user first, then sorted others
    return currentUser ? [currentUser, ...otherMembers] : otherMembers;
  }, [switchableAccounts, user]);

  const workspaces = useMemo(() => {
    const workspaceMap = new Map();

    switchableAccounts.forEach(account => {
      const workspaceId = getWorkspaceId(account);
      const workspaceName = getWorkspaceName(account);
      if (workspaceName && workspaceId) {
        workspaceMap.set(workspaceId, {
          id: workspaceId,
          name: workspaceName,
          current: workspaceId === selectedWorkspaceId,
          recent: true,
          favorite: false,
          unread: false,
        });
      }
    });

    return Array.from(workspaceMap.values());
  }, [switchableAccounts, selectedWorkspaceId]);

  // Filter members based on selected workspace and search
  const filteredMembers = useMemo(() => {
    let filtered = members;

    // Filter by selected workspace if one is selected
    if (selectedWorkspaceId) {
      filtered = filtered.filter(
        member => member.workspaceId === selectedWorkspaceId
      );
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(member =>
        member.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [searchQuery, members, selectedWorkspaceId]);

  // Filter workspaces based on search
  const filteredWorkspaces = useMemo(() => {
    return workspaces.filter(workspace =>
      workspace.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, workspaces]);

  const handleWorkspaceSwitch = (workspaceId: string) => {
    setSelectedWorkspaceId(workspaceId);
    setActiveTab("members");
  };

  const handleCreateOrganization = async (organizationName: string) => {
    try {
      const response = await fetch("/api/auth/organizations/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ organization_name: organizationName }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        ShowShortMessage(
          `Organization "${organizationName}" created successfully`,
          "success"
        );

        // Refresh organizations list and user data
        await getAllOrganizations();

        // Switch to the new organization
        if (data.organization?.id) {
          await switchOrganization(data.organization.id);
        }

        // Close the modal
        setIsCreateOrgModalOpen(false);
        setIsOpen(false);
      } else {
        throw new Error(data.message || "Failed to create organization");
      }
    } catch (error) {
      ShowShortMessage(
        error instanceof Error
          ? error.message
          : "Failed to create organization",
        "error"
      );
      throw error;
    }
  };

  const displayName = currentAccount?.name || "Select Account";
  const displayWorkspace = currentAccount?.workspace_name ?? "";

  return (
    <div className={cn("relative", className)}>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-8 px-2 gap-1.5 rounded-lg cursor-pointer transition-all duration-150 group hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
            disabled={isLoading || isSwitching}
          >
            <div className="w-5 h-5 rounded bg-black/[0.04] dark:bg-white/[0.08] flex items-center justify-center">
              <span className="text-foreground font-medium text-[10px]">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="text-left hidden md:block">
              <p className="text-foreground font-medium text-[12px] leading-tight max-w-[120px] truncate">
                {displayName}
              </p>
              {displayWorkspace && (
                <p className="text-muted-foreground text-[10px] leading-tight max-w-[120px] truncate">
                  {displayWorkspace}
                </p>
              )}
            </div>
            <ChevronDown className="w-3 h-3 text-muted-foreground group-hover:text-foreground transition-colors" />
            {isSwitching && <Loader2 className="w-3 h-3 animate-spin" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-96 p-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl border border-white/20 dark:border-gray-700/50 shadow-2xl rounded-2xl overflow-hidden z-[9999] before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/10 before:to-transparent before:rounded-2xl before:pointer-events-none"
        >
          {/* Header with Search */}
          <div className="px-4 py-4 border-b border-white/20 dark:border-gray-700/50 bg-white/10 dark:bg-gray-800/30 backdrop-blur-sm">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <span className="text-gray-700 dark:text-white font-semibold text-sm">
                  W
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                  Switch Context
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-300">
                  Change member or workspace
                </p>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-300" />
              <Input
                placeholder="Search members and workspaces..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10 h-9 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-500 focus:bg-white dark:focus:bg-white/20 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="px-4 py-2 border-b border-white/20 dark:border-gray-700/50 bg-white/10 dark:bg-gray-800/30 backdrop-blur-sm">
            <div className="flex space-x-1 bg-white/20 dark:bg-gray-700/50 rounded-lg p-1 backdrop-blur-sm">
              <button
                onClick={() => {
                  setActiveTab("members");
                }}
                className={cn(
                  "flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200",
                  activeTab === "members"
                    ? "bg-white/80 dark:bg-gray-600/80 text-gray-900 dark:text-white shadow-sm backdrop-blur-sm"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                )}
              >
                <UserCircle className="w-3 h-3 inline mr-1" />
                Members
              </button>
              <button
                onClick={() => {
                  setActiveTab("workspaces");
                  setSelectedWorkspaceId(null);
                }}
                className={cn(
                  "flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200",
                  activeTab === "workspaces"
                    ? "bg-white/80 dark:bg-gray-600/80 text-gray-900 dark:text-white shadow-sm backdrop-blur-sm"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                )}
              >
                <Briefcase className="w-3 h-3 inline mr-1" />
                Workspaces
              </button>
              <button
                onClick={() => {
                  setActiveTab("organizations");
                  setSelectedWorkspaceId(null);
                }}
                className={cn(
                  "flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200",
                  activeTab === "organizations"
                    ? "bg-white/80 dark:bg-gray-600/80 text-gray-900 dark:text-white shadow-sm backdrop-blur-sm"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                )}
              >
                <Building2 className="w-3 h-3 inline mr-1" />
                Orgs
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-80 overflow-y-auto hide-scrollbar">
            {activeTab === "members" && (
              <div className="p-4">
                {/* Show selected workspace info */}
                {selectedWorkspaceId && (
                  <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Briefcase className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                          Showing members from:{" "}
                          {
                            workspaces.find(w => w.id === selectedWorkspaceId)
                              ?.name
                          }
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedWorkspaceId(null)}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 underline"
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
                          ? "bg-white/30 dark:bg-gray-600/50 border border-white/20 dark:border-gray-500/50 backdrop-blur-sm"
                          : "hover:bg-white/20 dark:hover:bg-gray-700/50 backdrop-blur-sm"
                      )}
                      onClick={() => {
                        // Use the stored original account data
                        const originalAccount = member.originalAccount;

                        if (!originalAccount) {
                          ShowShortMessage("Account not found", "error");
                          return;
                        }

                        handleAccountSwitch({
                          workspace_id: getWorkspaceId(originalAccount),
                          user_id: originalAccount.user_id,
                          organization_id: getOrganizationId(originalAccount),
                          name: originalAccount.name,
                          workspace_name: getWorkspaceName(originalAccount),
                        });
                      }}
                    >
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                          <UserCircle className="w-3 h-3 text-gray-600 dark:text-gray-300" />
                        </div>
                        <div>
                          <p className="font-medium text-sm text-gray-900 dark:text-white">
                            {member.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-300">
                            {member.workspaceName}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        {member.favorite && (
                          <Star className="w-3 h-3 text-amber-500 fill-current" />
                        )}
                        {member.current && (
                          <Check className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {filteredMembers.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-500 dark:text-gray-300">
                      No members found
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "workspaces" && (
              <div className="p-4">
                <div className="space-y-1">
                  {filteredWorkspaces.map(workspace => (
                    <div
                      key={workspace.id}
                      className={cn(
                        "flex items-center justify-between p-2 rounded-lg transition-colors duration-200 cursor-pointer",
                        workspace.current
                          ? "bg-white/30 dark:bg-gray-600/50 border border-white/20 dark:border-gray-500/50 backdrop-blur-sm"
                          : "hover:bg-white/20 dark:hover:bg-gray-700/50 backdrop-blur-sm"
                      )}
                      onClick={() => handleWorkspaceSwitch(workspace.id)}
                    >
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                          <Briefcase className="w-3 h-3 text-gray-600 dark:text-gray-300" />
                        </div>
                        <p className="font-medium text-sm text-gray-900 dark:text-white">
                          {workspace.name}
                        </p>
                      </div>
                      <div className="flex items-center space-x-1">
                        {workspace.favorite && (
                          <Star className="w-3 h-3 text-amber-500 fill-current" />
                        )}
                        {workspace.current && (
                          <Check className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {filteredWorkspaces.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-500 dark:text-gray-300">
                      No workspaces found
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "organizations" && (
              <div className="p-4">
                <div className="space-y-1">
                  {organizations
                    .filter(org =>
                      org.name.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map(org => {
                      const isCurrentOrg = user?.organization_id === org.id;
                      return (
                        <div
                          key={org.id}
                          className={cn(
                            "flex items-center justify-between p-2 rounded-lg transition-colors duration-200 cursor-pointer",
                            isCurrentOrg
                              ? "bg-white/30 dark:bg-gray-600/50 border border-white/20 dark:border-gray-500/50 backdrop-blur-sm"
                              : "hover:bg-white/20 dark:hover:bg-gray-700/50 backdrop-blur-sm"
                          )}
                          onClick={() => {
                            if (!isCurrentOrg) {
                              handleAccountSwitch({
                                organization_id: org.id,
                                name: org.name,
                              });
                            }
                          }}
                        >
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                              <Building2 className="w-3 h-3 text-gray-600 dark:text-gray-300" />
                            </div>
                            <div>
                              <p className="font-medium text-sm text-gray-900 dark:text-white">
                                {org.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-300">
                                {org.role}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            {isCurrentOrg && (
                              <Check className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* Create Organization Button */}
                <div className="mt-3 pt-3 border-t border-white/20 dark:border-gray-700/50">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setIsCreateOrgModalOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Organization
                  </Button>
                </div>

                {organizations.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-500 dark:text-gray-300">
                      No organizations found
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Create Organization Modal */}
      <CreateOrganizationModal
        open={isCreateOrgModalOpen}
        onOpenChange={setIsCreateOrgModalOpen}
        onCreate={handleCreateOrganization}
      />
    </div>
  );
}

// Legacy alias for backward compatibility
export const TeamSwitcherDropdown = WorkspaceSwitcherDropdown;

export default WorkspaceSwitcherDropdown;

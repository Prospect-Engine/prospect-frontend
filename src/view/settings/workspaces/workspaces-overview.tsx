"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  WorkspaceDetailsModal,
  CreateWorkspaceModal,
  DeleteWorkspaceModal,
  InviteWorkspaceMemberModal,
} from "@/components/workspace";
import { Plus, Users, Trash2, Eye, UserPlus, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { formatDateTime } from "@/utils/formatDateTime";
import { toast } from "sonner";
import { getCookie } from "cookies-next";

interface Workspace {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
  owner: string;
  admin?: string;
  manageMember?: boolean;
  createdAt: string;
  status: "Active" | "Inactive";
  seatAllocation?: {
    allocated_seats: number;
    used_seats: number;
    user_allocations?: unknown[];
  };
}

interface ApiResponse {
  data: Workspace[];
  page: number;
  limit: number;
  total: number;
}

export function WorkspacesOverviewView() {
  const { user } = useAuth();
  const { permissions } = usePermissions();
  const [seatInfo, setSeatInfo] = useState({
    total: 0,
    used: 0,
    available: 0,
  });
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [seatLoading, setSeatLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(
    null
  );
  const [cookieUserName, setCookieUserName] = useState<string | null>(null);

  // Helper function to get user name from cookies
  const getUserNameFromCookies = async (): Promise<string | null> => {
    try {
      const access_token = getCookie("access_token");
      const tokenString =
        access_token instanceof Promise ? await access_token : access_token;

      if (!tokenString) {
        return null;
      }

      // Parse JWT token to get user name
      const tokenPayload = JSON.parse(atob(tokenString.split(".")[1]));

      if (tokenPayload && tokenPayload.name) {
        return tokenPayload.name;
      }

      return null;
    } catch (error) {
      return null;
    }
  };

  // Helper function to get full user data from cookies
  const getUserDataFromCookies = async () => {
    try {
      const access_token = getCookie("access_token");
      const tokenString =
        access_token instanceof Promise ? await access_token : access_token;

      if (!tokenString) {
        return null;
      }

      // Parse JWT token to get user data
      const tokenPayload = JSON.parse(atob(tokenString.split(".")[1]));

      if (tokenPayload && tokenPayload.user_id) {
        return {
          id: tokenPayload.user_id,
          user_id: tokenPayload.user_id,
          username: tokenPayload.username || tokenPayload.email,
          email: tokenPayload.username || tokenPayload.email,
          role: tokenPayload.role_id || tokenPayload.role,
          name: tokenPayload.name,
          joined_at: tokenPayload.joined_at,
          is_onboarded: tokenPayload.is_onboarded,
          onboarding_date: tokenPayload.onboarding_date,
          current_onboarding_step: tokenPayload.current_onboarding_step,
          is_impersonate: !!tokenPayload.is_impersonate,
          workspace_id: tokenPayload.workspace_id || tokenPayload.team_id,
          organization_id:
            tokenPayload.organization_id || tokenPayload.tenant_id,
        };
      }

      return null;
    } catch (error) {
      return null;
    }
  };

  // Helper function to check if current user is the owner of a workspace
  const isWorkspaceOwner = (workspace: Workspace) => {
    const userName = user?.name || cookieUserName;
    return userName === workspace.owner;
  };

  // Helper function to check if current user is an admin of a workspace
  const isWorkspaceAdmin = (workspace: Workspace) => {
    const userName = user?.name || cookieUserName;
    return userName === workspace.admin;
  };

  // Helper function to check if current user is a manage member of a workspace
  const isWorkspaceManageMember = (workspace: Workspace) => {
    return workspace.manageMember === true;
  };

  // Helper function to check if user can view workspace information
  const canViewWorkspaceInfo = (workspace: Workspace) => {
    return (
      isWorkspaceOwner(workspace) ||
      isWorkspaceAdmin(workspace) ||
      isWorkspaceManageMember(workspace)
    );
  };

  // Helper function to check if current user is an owner of any workspace
  const isAnyWorkspaceOwner = () => {
    return workspaces.some(workspace => isWorkspaceOwner(workspace));
  };

  // Helper function to check if current user is an admin of any workspace
  const isAnyWorkspaceAdmin = () => {
    return workspaces.some(workspace => isWorkspaceAdmin(workspace));
  };

  // Fetch seat statistics from API
  const fetchSeatInfo = async () => {
    try {
      setSeatLoading(true);

      const response = await fetch("/api/workspaces/seat-stat");

      if (!response.ok) {
        throw new Error(`Failed to fetch seat info: ${response.status}`);
      }

      const data = await response.json();

      setSeatInfo({
        total: data.total_seat,
        used: data.used_seat,
        available: data.total_seat - data.used_seat,
      });
    } catch (err) {
      toast.error("Failed to load seat information");
    } finally {
      setSeatLoading(false);
    }
  };

  // Fetch workspaces data from API
  const fetchWorkspaces = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/workspaces/all");

      const result = await response.json();

      // Handle both array response and wrapped response { data: [...] }
      const workspacesArray = Array.isArray(result)
        ? result
        : result.data || [];

      // Transform the data to handle status case conversion
      const transformedWorkspaces = workspacesArray.map(
        (workspace: Workspace) => ({
          ...workspace,
          status: (workspace.status?.charAt(0).toUpperCase() +
            workspace.status?.slice(1).toLowerCase()) as "Active" | "Inactive",
        })
      );

      setWorkspaces(transformedWorkspaces);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch workspaces";
      setError(errorMessage);
      toast.error("Failed to load workspaces");
    } finally {
      setLoading(false);
    }
  };

  // Load user name from cookies on component mount
  useEffect(() => {
    const loadUserNameFromCookies = async () => {
      try {
        const userName = await getUserNameFromCookies();
        setCookieUserName(userName);
      } catch (error) {}
    };

    loadUserNameFromCookies();
  }, []);

  useEffect(() => {
    fetchWorkspaces();
    fetchSeatInfo();
  }, []);

  const handleCreateWorkspace = async (workspaceData: {
    name: string;
    description?: string;
    allocated_seats?: number;
  }) => {
    try {
      // Create a stable ID for the optimistic workspace
      const tempId = `temp-${Date.now()}`;

      // Optimistic update - add the workspace to the list immediately
      const optimisticWorkspace: Workspace = {
        id: tempId,
        name: workspaceData.name,
        description: workspaceData.description,
        memberCount: 0,
        owner: user?.name || "You",
        createdAt: new Date().toISOString(),
        status: "Active" as const,
        seatAllocation: {
          allocated_seats: workspaceData.allocated_seats ?? 0,
          used_seats: 0,
          user_allocations: [],
        },
      };

      // Add optimistic workspace to the list
      setWorkspaces(prevWorkspaces => [optimisticWorkspace, ...prevWorkspaces]);

      const createPayload = {
        name: workspaceData.name,
        allocated_seats:
          typeof workspaceData.allocated_seats === "number"
            ? workspaceData.allocated_seats
            : Number(workspaceData.allocated_seats ?? 0),
      } as { name: string; allocated_seats: number };
      // Extra guard: if user typed quickly and state lagged, use DOM value if present
      try {
        const input = document.getElementById(
          "allocated-seats"
        ) as HTMLInputElement | null;
        if (input && input.value !== "") {
          const fromDom = Number(input.value);
          if (!Number.isNaN(fromDom)) createPayload.allocated_seats = fromDom;
        }
      } catch {}

      const response = await fetch("/api/workspaces/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(createPayload),
      });

      const data = await response.json();

      if (!response.ok) {
        // Remove optimistic workspace on error
        setWorkspaces(prevWorkspaces =>
          prevWorkspaces.filter(workspace => workspace.id !== tempId)
        );

        // Handle specific error cases
        if (
          response.status === 409 ||
          (data.err && data.err.includes("same name conflict"))
        ) {
          toast.error(
            "A workspace with this name already exists. Please choose a different name."
          );
          return;
        }

        const apiMessage =
          data?.message ||
          data?.err ||
          `Failed to create workspace: ${response.status}`;
        toast.error(apiMessage);
        return;
      }

      // Update the optimistic workspace with real data if available
      // Use a more stable update approach to prevent flickering
      if (data && data.data) {
        setWorkspaces(prevWorkspaces =>
          prevWorkspaces.map(workspace =>
            workspace.id === tempId
              ? { ...data.data, id: data.data.id || tempId }
              : workspace
          )
        );
      } else if (data && data.id) {
        // Update just the ID if that's all we have
        setWorkspaces(prevWorkspaces =>
          prevWorkspaces.map(workspace =>
            workspace.id === tempId ? { ...workspace, id: data.id } : workspace
          )
        );
      }
      // If no real data, keep the optimistic workspace as is

      // Refresh seat info in background without affecting the workspaces list
      fetchSeatInfo().catch(err => {});

      setCreateModalOpen(false);
      toast.success("Workspace created successfully!");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create workspace";
      toast.error(errorMessage);
      // Stop propagation; we've notified the user via toast
    }
  };

  const handleInviteMember = async () => {
    // Here you would typically make an API call to invite the member
    // After successful invitation, refresh seat info
    try {
      // TODO: Add actual API call for inviting member
      // await inviteMemberAPI(memberData)

      // Refresh seat info as member count might have changed
      await fetchSeatInfo();
      toast.success("Member invited successfully!");
    } catch (err) {
      toast.error("Failed to invite member");
    }
  };

  const handleDeleteWorkspace = async (workspaceId: string) => {
    try {
      // Optimistic update - remove the workspace from the list immediately
      setWorkspaces(prevWorkspaces =>
        prevWorkspaces.filter(workspace => workspace.id !== workspaceId)
      );

      const response = await fetch(`/api/workspaces/${workspaceId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        // Restore the workspace on error by refreshing the list
        await fetchWorkspaces();
        const errorMessage =
          data.message ||
          data.err ||
          `Failed to delete workspace: ${response.status}`;
        toast.error(errorMessage);
        return;
      }

      // Refresh seat info in background without affecting the workspaces list
      fetchSeatInfo().catch(err => {});

      setDeleteModalOpen(false);
      setSelectedWorkspace(null);
      toast.success("Workspace deleted successfully!");
    } catch (err) {
      // Restore the workspace on error by refreshing the list
      await fetchWorkspaces();
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete workspace";
      toast.error(errorMessage);
    }
  };

  const handleUpdateWorkspace = async (
    workspaceId: string,
    newName: string,
    allocatedSeats?: number
  ) => {
    try {
      const updatePayload =
        allocatedSeats !== undefined
          ? {
              name: newName,
              allocated_seats: Number(allocatedSeats),
            }
          : { name: newName };

      const response = await fetch(`/api/workspaces/${workspaceId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatePayload),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error cases
        if (
          response.status === 409 ||
          (data.err && data.err.includes("same name conflict"))
        ) {
          throw new Error(
            "A workspace with this name already exists. Please choose a different name."
          );
        }
        throw new Error(
          data.message ||
            data.err ||
            `Failed to update workspace: ${response.status}`
        );
      }

      // Update the selectedWorkspace immediately if it's the one being updated
      if (selectedWorkspace && selectedWorkspace.id === workspaceId) {
        setSelectedWorkspace({
          ...selectedWorkspace,
          name: newName,
          seatAllocation:
            allocatedSeats !== undefined
              ? {
                  allocated_seats: allocatedSeats,
                  used_seats: selectedWorkspace.seatAllocation?.used_seats ?? 0,
                  user_allocations:
                    selectedWorkspace.seatAllocation?.user_allocations ?? [],
                }
              : selectedWorkspace.seatAllocation,
        });
      }

      // Update the workspaces list directly without refetching
      setWorkspaces(prevWorkspaces =>
        prevWorkspaces.map(workspace =>
          workspace.id === workspaceId
            ? {
                ...workspace,
                name: newName,
                seatAllocation:
                  allocatedSeats !== undefined
                    ? {
                        allocated_seats: allocatedSeats,
                        used_seats: workspace.seatAllocation?.used_seats ?? 0,
                        user_allocations:
                          workspace.seatAllocation?.user_allocations ?? [],
                      }
                    : workspace.seatAllocation,
              }
            : workspace
        )
      );
      toast.success("Workspace updated successfully!");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update workspace";
      toast.error(errorMessage);
      throw err; // Re-throw to let the modal handle the error state
    }
  };

  const totalMembers = workspaces.reduce(
    (sum, workspace) => sum + workspace.memberCount,
    0
  );
  const activeWorkspaces = workspaces.filter(
    workspace => workspace.status === "Active"
  ).length;

  // Loading state - wait for user and workspaces data (seat info can load separately)
  if (loading || !user) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Workspaces List Skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <Skeleton className="h-6 w-24" />
          </div>
          <div className="divide-y divide-gray-100">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-5 w-12" />
                    </div>
                    <div className="flex items-center gap-6">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-28" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-gray-600 dark:text-gray-400 mb-2">
            Error loading workspaces
          </div>
          <div className="text-sm text-gray-600 mb-4">{error}</div>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="text-gray-700"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Workspaces Overview
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage and overview all Workspaces in your organization
          </p>
        </div>
        <div className="flex items-center gap-3">
          {(permissions?.includes("MANAGE_MEMBER") ||
            isAnyWorkspaceOwner() ||
            isAnyWorkspaceAdmin()) && (
            <Button
              variant="outline"
              onClick={() => setInviteModalOpen(true)}
              className="border-gray-200 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Workspace Member
            </Button>
          )}
          <Button
            onClick={() => setCreateModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Workspace
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Workspaces
            </CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {workspaces.length}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {activeWorkspaces} active workspaces
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Workspace Members
            </CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {totalMembers}
            </div>
            <p className="text-xs text-gray-500 mt-1">Across all Workspaces</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Seat Usage
            </CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {seatLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-lg">Loading...</span>
                </div>
              ) : (
                `${seatInfo.used}/${seatInfo.total}`
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {seatLoading
                ? "Fetching seat information..."
                : `${seatInfo.available} seats available`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Workspaces List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            All Workspaces
          </h3>
        </div>
        <div className="divide-y divide-gray-100">
          {workspaces.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Workspaces found
              </h3>
              <p className="text-gray-500 mb-4">
                Get started by creating your first Workspace.
              </p>
              <Button
                onClick={() => setCreateModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Workspace
              </Button>
            </div>
          ) : (
            workspaces.map(workspace => (
              <div
                key={workspace.id}
                className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {workspace.name}
                      </h4>
                      <Badge className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                        {workspace.status}
                      </Badge>
                      {isWorkspaceOwner(workspace) && (
                        <Badge className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                          Owner
                        </Badge>
                      )}
                      {isWorkspaceAdmin(workspace) && (
                        <Badge className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                          Admin
                        </Badge>
                      )}
                      {isWorkspaceManageMember(workspace) && (
                        <Badge className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                          Manage Member
                        </Badge>
                      )}
                      {workspace.id.startsWith("temp-") && (
                        <Badge className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                          Creating...
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {workspace.memberCount} members
                      </span>
                      <span>
                        Owner:{" "}
                        {isWorkspaceOwner(workspace) ? "You" : workspace.owner}
                      </span>
                      <span>
                        Created: {formatDateTime(workspace.createdAt)}
                      </span>
                      <span>
                        Allocated seats:{" "}
                        {workspace.seatAllocation?.allocated_seats ?? 0}
                      </span>
                      <span>
                        Used seats: {workspace.seatAllocation?.used_seats ?? 0}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {canViewWorkspaceInfo(workspace) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDetailsModal(workspace)}
                        className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    )}
                    {isWorkspaceOwner(workspace) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDeleteModal(workspace)}
                        className="text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modals */}
      <CreateWorkspaceModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onWorkspaceCreated={handleCreateWorkspace}
      />

      {selectedWorkspace && (
        <>
          <WorkspaceDetailsModal
            team={selectedWorkspace}
            open={detailsModalOpen}
            onOpenChange={setDetailsModalOpen}
            onTeamUpdated={handleUpdateWorkspace}
            isOwner={isWorkspaceOwner(selectedWorkspace)}
          />
          <DeleteWorkspaceModal
            team={selectedWorkspace}
            open={deleteModalOpen}
            onOpenChange={setDeleteModalOpen}
            onTeamDeleted={handleDeleteWorkspace}
          />
        </>
      )}

      <InviteWorkspaceMemberModal
        open={inviteModalOpen}
        onOpenChange={setInviteModalOpen}
        onMemberInvited={handleInviteMember}
        showTeamSelection={true}
        availableTeams={workspaces
          .filter(workspace => !workspace.id.startsWith("temp-")) // Filter out workspaces that are still being created
          .map(workspace => ({ id: workspace.id, name: workspace.name }))}
      />
    </div>
  );

  function openDetailsModal(workspace: Workspace) {
    setSelectedWorkspace(workspace);
    setDetailsModalOpen(true);
  }

  function openDeleteModal(workspace: Workspace) {
    setSelectedWorkspace(workspace);
    setDeleteModalOpen(true);
  }
}

// Legacy alias for backward compatibility
export const TeamsOverviewView = WorkspacesOverviewView;

"use client";

import { useState, useEffect, useCallback } from "react";
import AppLayout from "@/components/layout/AppLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Plus,
  ArrowLeft,
  AlertTriangle,
  Building2,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { usePermissions } from "@/hooks/usePermissions";
import { useSeatStatistics } from "@/hooks/useSeatStatistics";
import {
  useSeatAllocations,
  WorkspaceAllocation,
  UserAllocation,
} from "@/hooks/useSeatAllocations";
import { WorkspaceAllocationTable } from "@/components/billing/WorkspaceAllocationTable";
import { WorkspaceAllocationModal } from "@/components/billing/WorkspaceAllocationModal";
import { UserAllocationModal } from "@/components/billing/UserAllocationModal";

/**
 * Seat Management Page
 *
 * Full management UI for the 4-tier seat allocation hierarchy:
 * Organization → Workspace → User → Integration
 */
export default function SeatManagementPage() {
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  const {
    statistics,
    isLoading: statsLoading,
    refreshStatistics,
  } = useSeatStatistics();
  const {
    workspaceAllocations,
    workspaceAllocationsLoading,
    fetchWorkspaceAllocations,
    createWorkspaceAllocation,
    updateWorkspaceAllocation,
    deleteWorkspaceAllocation,
    createUserAllocation,
    updateUserAllocation,
    deleteUserAllocation,
    isMutating,
    mutationError,
    clearMutationError,
  } = useSeatAllocations();

  // Modal state
  const [workspaceModalOpen, setWorkspaceModalOpen] = useState(false);
  const [workspaceModalMode, setWorkspaceModalMode] = useState<
    "create" | "edit"
  >("create");
  const [selectedWorkspaceAllocation, setSelectedWorkspaceAllocation] =
    useState<WorkspaceAllocation | null>(null);

  const [userModalOpen, setUserModalOpen] = useState(false);
  const [userModalMode, setUserModalMode] = useState<"create" | "edit">(
    "create"
  );
  const [selectedUserAllocation, setSelectedUserAllocation] =
    useState<UserAllocation | null>(null);
  const [userModalWorkspaceAllocation, setUserModalWorkspaceAllocation] =
    useState<WorkspaceAllocation | null>(null);

  // Permission check
  const canManageBilling = hasPermission("MANAGE_BILLING");

  // Load data when permissions are loaded (auth is ready)
  useEffect(() => {
    if (!permissionsLoading && canManageBilling) {
      refreshStatistics();
      fetchWorkspaceAllocations();
    }
    // Only re-run when permissions loading state changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permissionsLoading, canManageBilling]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    refreshStatistics();
    fetchWorkspaceAllocations();
  }, [refreshStatistics, fetchWorkspaceAllocations]);

  // Workspace allocation handlers
  const handleAddWorkspaceAllocation = useCallback(() => {
    setSelectedWorkspaceAllocation(null);
    setWorkspaceModalMode("create");
    setWorkspaceModalOpen(true);
  }, []);

  const handleEditWorkspaceAllocation = useCallback(
    (allocation: WorkspaceAllocation) => {
      setSelectedWorkspaceAllocation(allocation);
      setWorkspaceModalMode("edit");
      setWorkspaceModalOpen(true);
    },
    []
  );

  const handleDeleteWorkspaceAllocation = useCallback(
    async (allocation: WorkspaceAllocation) => {
      if (
        !confirm(
          `Are you sure you want to delete the allocation for ${allocation.workspaceName}? This will also delete all user allocations within this workspace.`
        )
      ) {
        return;
      }

      const success = await deleteWorkspaceAllocation(allocation.id);
      if (success) {
        handleRefresh();
      }
    },
    [deleteWorkspaceAllocation, handleRefresh]
  );

  const handleWorkspaceAllocationSubmit = useCallback(
    async (data: { workspaceId?: string; allocatedSeats: number }) => {
      if (workspaceModalMode === "create" && data.workspaceId) {
        const result = await createWorkspaceAllocation({
          workspaceId: data.workspaceId,
          allocatedSeats: data.allocatedSeats,
        });
        if (result) {
          setWorkspaceModalOpen(false);
          handleRefresh();
        }
      } else if (workspaceModalMode === "edit" && selectedWorkspaceAllocation) {
        const result = await updateWorkspaceAllocation(
          selectedWorkspaceAllocation.id,
          { allocatedSeats: data.allocatedSeats }
        );
        if (result) {
          setWorkspaceModalOpen(false);
          handleRefresh();
        }
      }
    },
    [
      workspaceModalMode,
      selectedWorkspaceAllocation,
      createWorkspaceAllocation,
      updateWorkspaceAllocation,
      handleRefresh,
    ]
  );

  // User allocation handlers
  const handleAddUserAllocation = useCallback(
    (workspaceAllocation: WorkspaceAllocation) => {
      setUserModalWorkspaceAllocation(workspaceAllocation);
      setSelectedUserAllocation(null);
      setUserModalMode("create");
      setUserModalOpen(true);
    },
    []
  );

  const handleEditUserAllocation = useCallback(
    (allocation: UserAllocation) => {
      // Find the workspace allocation for this user allocation
      const workspaceAllocation = workspaceAllocations.find(
        wa => wa.id === allocation.workspaceAllocationId
      );
      setUserModalWorkspaceAllocation(workspaceAllocation || null);
      setSelectedUserAllocation(allocation);
      setUserModalMode("edit");
      setUserModalOpen(true);
    },
    [workspaceAllocations]
  );

  const handleDeleteUserAllocation = useCallback(
    async (allocation: UserAllocation) => {
      if (
        !confirm(
          `Are you sure you want to delete the allocation for ${allocation.userName}?`
        )
      ) {
        return;
      }

      const success = await deleteUserAllocation(allocation.id);
      if (success) {
        handleRefresh();
      }
    },
    [deleteUserAllocation, handleRefresh]
  );

  const handleUserAllocationSubmit = useCallback(
    async (data: {
      workspaceId?: string;
      userId?: string;
      allocatedSeats: number;
    }) => {
      if (userModalMode === "create" && data.workspaceId && data.userId) {
        const result = await createUserAllocation({
          workspaceId: data.workspaceId,
          userId: data.userId,
          allocatedSeats: data.allocatedSeats,
        });
        if (result) {
          setUserModalOpen(false);
          handleRefresh();
        }
      } else if (userModalMode === "edit" && selectedUserAllocation) {
        const result = await updateUserAllocation(selectedUserAllocation.id, {
          allocatedSeats: data.allocatedSeats,
        });
        if (result) {
          setUserModalOpen(false);
          handleRefresh();
        }
      }
    },
    [
      userModalMode,
      selectedUserAllocation,
      createUserAllocation,
      updateUserAllocation,
      handleRefresh,
    ]
  );

  // Loading state
  if (permissionsLoading || statsLoading) {
    return (
      <AppLayout activePage="Billing">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-96" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <Skeleton className="h-8 w-16 mx-auto mb-2" />
                  <Skeleton className="h-4 w-24 mx-auto" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  // Permission denied
  if (!canManageBilling) {
    return (
      <AppLayout activePage="Billing">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Link href="/billing">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Seat Management
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Manage seat allocations across workspaces
              </p>
            </div>
          </div>

          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Permission Required
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-center">
                You need the &quot;Manage Billing&quot; permission to access
                seat management.
              </p>
              <Link href="/billing" className="mt-4">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Billing
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const organization = statistics?.organization;

  return (
    <AppLayout activePage="Billing">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/billing">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Seat Management
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Allocate and manage seats across workspaces and users
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isMutating}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={handleAddWorkspaceAllocation}
              disabled={isMutating}
            >
              <Plus className="h-4 w-4 mr-2" />
              Allocate to Workspace
            </Button>
          </div>
        </div>

        {/* Error message */}
        {mutationError && (
          <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-950 rounded-lg text-red-600 dark:text-red-400">
            <AlertTriangle className="h-5 w-5" />
            <span>{mutationError}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearMutationError}
              className="ml-auto"
            >
              Dismiss
            </Button>
          </div>
        )}

        {/* Organization Summary */}
        {organization && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold">
                    {organization.totalSeats}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Total Seats
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {organization.allocatedSeats}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Allocated to Workspaces
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">
                    {organization.usedSeats}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    In Use
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {organization.availableSeats}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Available
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Utilization Progress */}
        {organization && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Organization Utilization
                  </span>
                  <span className="font-medium">
                    {organization.utilizationPercentage.toFixed(1)}%
                  </span>
                </div>
                <Progress
                  value={organization.utilizationPercentage}
                  className="h-3"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    {organization.usedSeats} of {organization.totalSeats} seats
                    used
                  </span>
                  <span>
                    {organization.availableSeats} seats available for allocation
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Workspace Allocations Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle>Workspace Allocations</CardTitle>
                <CardDescription>
                  View and manage seat allocations for each workspace. Expand
                  rows to see user allocations.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <WorkspaceAllocationTable
              workspaceAllocations={workspaceAllocations}
              isLoading={workspaceAllocationsLoading}
              onEditWorkspaceAllocation={handleEditWorkspaceAllocation}
              onDeleteWorkspaceAllocation={handleDeleteWorkspaceAllocation}
              onAddUserAllocation={handleAddUserAllocation}
              onEditUserAllocation={handleEditUserAllocation}
              onDeleteUserAllocation={handleDeleteUserAllocation}
              onRefresh={handleRefresh}
              disabled={isMutating}
            />
          </CardContent>
        </Card>

        {/* Workspace Allocation Modal */}
        <WorkspaceAllocationModal
          open={workspaceModalOpen}
          onOpenChange={setWorkspaceModalOpen}
          mode={workspaceModalMode}
          allocation={selectedWorkspaceAllocation}
          existingWorkspaceIds={workspaceAllocations.map(wa => wa.workspaceId)}
          maxAvailableSeats={organization?.availableSeats || 0}
          onSubmit={handleWorkspaceAllocationSubmit}
        />

        {/* User Allocation Modal */}
        <UserAllocationModal
          open={userModalOpen}
          onOpenChange={setUserModalOpen}
          mode={userModalMode}
          workspaceAllocation={userModalWorkspaceAllocation}
          allocation={selectedUserAllocation}
          existingUserIds={[]} // Would be populated from the workspace's user allocations
          onSubmit={handleUserAllocationSubmit}
        />
      </div>
    </AppLayout>
  );
}

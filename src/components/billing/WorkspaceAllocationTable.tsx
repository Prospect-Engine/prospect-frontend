"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronDown,
  ChevronRight,
  Pencil,
  Trash2,
  Plus,
  Building2,
  RefreshCw,
} from "lucide-react";
import { UserAllocationRow } from "./UserAllocationRow";
import {
  WorkspaceAllocation,
  UserAllocation,
  useSeatAllocations,
} from "@/hooks/useSeatAllocations";

interface WorkspaceAllocationTableProps {
  workspaceAllocations: WorkspaceAllocation[];
  isLoading: boolean;
  onEditWorkspaceAllocation: (allocation: WorkspaceAllocation) => void;
  onDeleteWorkspaceAllocation: (allocation: WorkspaceAllocation) => void;
  onAddUserAllocation: (workspaceAllocation: WorkspaceAllocation) => void;
  onEditUserAllocation: (allocation: UserAllocation) => void;
  onDeleteUserAllocation: (allocation: UserAllocation) => void;
  onRefresh: () => void;
  disabled?: boolean;
}

/**
 * Table component for displaying workspace seat allocations
 * with expandable rows showing user allocations
 */
export function WorkspaceAllocationTable({
  workspaceAllocations,
  isLoading,
  onEditWorkspaceAllocation,
  onDeleteWorkspaceAllocation,
  onAddUserAllocation,
  onEditUserAllocation,
  onDeleteUserAllocation,
  onRefresh,
  disabled = false,
}: WorkspaceAllocationTableProps) {
  const [expandedWorkspaces, setExpandedWorkspaces] = useState<Set<string>>(
    new Set()
  );
  const [userAllocationsMap, setUserAllocationsMap] = useState<
    Map<string, UserAllocation[]>
  >(new Map());
  const [loadingWorkspaces, setLoadingWorkspaces] = useState<Set<string>>(
    new Set()
  );

  const { fetchUserAllocations, userAllocations, userAllocationsLoading } =
    useSeatAllocations();

  // Toggle workspace expansion
  const toggleWorkspace = useCallback(
    async (workspaceId: string) => {
      const newExpanded = new Set(expandedWorkspaces);

      if (newExpanded.has(workspaceId)) {
        newExpanded.delete(workspaceId);
      } else {
        newExpanded.add(workspaceId);

        // Fetch user allocations if not already loaded
        if (!userAllocationsMap.has(workspaceId)) {
          setLoadingWorkspaces(prev => new Set(prev).add(workspaceId));
          await fetchUserAllocations(workspaceId);
          setLoadingWorkspaces(prev => {
            const newSet = new Set(prev);
            newSet.delete(workspaceId);
            return newSet;
          });
        }
      }

      setExpandedWorkspaces(newExpanded);
    },
    [expandedWorkspaces, userAllocationsMap, fetchUserAllocations]
  );

  // Update user allocations map when fetched
  useEffect(() => {
    if (userAllocations.length > 0 && !userAllocationsLoading) {
      const workspaceId = userAllocations[0]?.workspaceAllocationId;
      if (workspaceId) {
        // Find the workspace allocation that matches
        const workspaceAllocation = workspaceAllocations.find(wa =>
          userAllocations.some(ua => ua.workspaceAllocationId === wa.id)
        );
        if (workspaceAllocation) {
          setUserAllocationsMap(prev => {
            const newMap = new Map(prev);
            newMap.set(workspaceAllocation.workspaceId, userAllocations);
            return newMap;
          });
        }
      }
    }
  }, [userAllocations, userAllocationsLoading, workspaceAllocations]);

  if (isLoading) {
    return <WorkspaceAllocationTableSkeleton />;
  }

  if (workspaceAllocations.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium">No workspace allocations</p>
        <p className="text-sm mt-1">
          Allocate seats to workspaces to get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={disabled}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8" />
            <TableHead>Workspace</TableHead>
            <TableHead className="text-center">Allocated</TableHead>
            <TableHead className="text-center">Used</TableHead>
            <TableHead className="text-center">Available</TableHead>
            <TableHead>Utilization</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {workspaceAllocations.map(allocation => {
            const isExpanded = expandedWorkspaces.has(allocation.workspaceId);
            const isLoadingUsers = loadingWorkspaces.has(
              allocation.workspaceId
            );
            const workspaceUsers =
              userAllocationsMap.get(allocation.workspaceId) || [];
            const utilizationPercentage =
              allocation.allocatedSeats > 0
                ? (allocation.usedSeats / allocation.allocatedSeats) * 100
                : 0;

            return (
              <>
                {/* Workspace row */}
                <TableRow key={allocation.id}>
                  {/* Expand/collapse button */}
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => toggleWorkspace(allocation.workspaceId)}
                      disabled={disabled}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>

                  {/* Workspace name */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {allocation.workspaceName}
                      </span>
                    </div>
                  </TableCell>

                  {/* Allocated seats */}
                  <TableCell className="text-center">
                    <span className="font-mono font-medium">
                      {allocation.allocatedSeats}
                    </span>
                  </TableCell>

                  {/* Used seats */}
                  <TableCell className="text-center">
                    <span className="font-mono text-primary">
                      {allocation.usedSeats}
                    </span>
                  </TableCell>

                  {/* Available seats */}
                  <TableCell className="text-center">
                    <span className="font-mono text-green-600">
                      {allocation.availableSeats}
                    </span>
                  </TableCell>

                  {/* Utilization */}
                  <TableCell>
                    <div className="flex items-center gap-2 min-w-[120px]">
                      <Progress
                        value={utilizationPercentage}
                        className="h-2 flex-1"
                      />
                      <span className="text-xs text-muted-foreground w-10 text-right">
                        {utilizationPercentage.toFixed(0)}%
                      </span>
                    </div>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onAddUserAllocation(allocation)}
                        disabled={disabled || allocation.availableSeats === 0}
                        title={
                          allocation.availableSeats === 0
                            ? "No available seats"
                            : "Add user allocation"
                        }
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onEditWorkspaceAllocation(allocation)}
                        disabled={disabled}
                        title="Edit allocation"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => onDeleteWorkspaceAllocation(allocation)}
                        disabled={disabled || allocation.usedSeats > 0}
                        title={
                          allocation.usedSeats > 0
                            ? "Cannot delete: seats in use"
                            : "Delete allocation"
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>

                {/* User allocation rows (expanded) */}
                {isExpanded && (
                  <>
                    {isLoadingUsers ? (
                      <TableRow className="bg-muted/30">
                        <TableCell colSpan={7}>
                          <div className="flex items-center gap-2 py-2 pl-12">
                            <Skeleton className="h-4 w-4 rounded-full" />
                            <Skeleton className="h-4 w-48" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : workspaceUsers.length === 0 ? (
                      <TableRow className="bg-muted/30">
                        <TableCell colSpan={7}>
                          <div className="text-sm text-muted-foreground py-2 pl-12">
                            No user allocations in this workspace
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      workspaceUsers.map(userAllocation => (
                        <UserAllocationRow
                          key={userAllocation.id}
                          allocation={userAllocation}
                          onEdit={onEditUserAllocation}
                          onDelete={onDeleteUserAllocation}
                          disabled={disabled}
                        />
                      ))
                    )}
                  </>
                )}
              </>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

/**
 * Skeleton loader for the WorkspaceAllocationTable
 */
function WorkspaceAllocationTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Skeleton className="h-9 w-24" />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8" />
            <TableHead>Workspace</TableHead>
            <TableHead className="text-center">Allocated</TableHead>
            <TableHead className="text-center">Used</TableHead>
            <TableHead className="text-center">Available</TableHead>
            <TableHead>Utilization</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[1, 2, 3].map(i => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-6 w-6" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-32" />
              </TableCell>
              <TableCell className="text-center">
                <Skeleton className="h-4 w-8 mx-auto" />
              </TableCell>
              <TableCell className="text-center">
                <Skeleton className="h-4 w-8 mx-auto" />
              </TableCell>
              <TableCell className="text-center">
                <Skeleton className="h-4 w-8 mx-auto" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-2 w-full" />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default WorkspaceAllocationTable;

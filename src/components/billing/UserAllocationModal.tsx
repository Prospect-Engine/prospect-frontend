"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, AlertTriangle } from "lucide-react";
import {
  UserAllocation,
  WorkspaceAllocation,
} from "@/hooks/useSeatAllocations";

interface WorkspaceMember {
  id: string;
  name: string;
  email: string;
}

interface UserAllocationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  workspaceAllocation: WorkspaceAllocation | null;
  allocation?: UserAllocation | null;
  existingUserIds?: string[];
  onSubmit: (data: {
    workspaceId?: string;
    userId?: string;
    allocatedSeats: number;
  }) => Promise<void>;
}

/**
 * Modal for creating or editing user seat allocations within a workspace
 */
export function UserAllocationModal({
  open,
  onOpenChange,
  mode,
  workspaceAllocation,
  allocation,
  existingUserIds = [],
  onSubmit,
}: UserAllocationModalProps) {
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [allocatedSeats, setAllocatedSeats] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const submissionRef = useRef(false);

  // Calculate max seats for this allocation
  const maxSeats =
    mode === "edit" && allocation && workspaceAllocation
      ? workspaceAllocation.availableSeats + allocation.allocatedSeats
      : workspaceAllocation?.availableSeats || 0;

  // Minimum seats (cannot go below current usage in edit mode)
  const minSeats = mode === "edit" && allocation ? allocation.usedSeats : 1;

  // Fetch workspace members
  const fetchMembers = useCallback(async () => {
    if (!workspaceAllocation) return;

    setMembersLoading(true);
    try {
      const response = await fetch(`/api/workspaces/members/list?limit=100`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        // API returns { success: true, data: { data: [...], total, page, limit } }
        // Unwrap the response - handle various nesting levels
        const responseData = data?.success && data?.data ? data.data : data;
        const membersList =
          responseData?.data || responseData?.items || responseData || [];
        // Ensure membersList is an array
        const membersArray = Array.isArray(membersList) ? membersList : [];
        setMembers(
          membersArray.map((m: any) => ({
            id: m.user_id || m.id,
            name: m.name || m.user?.name || "Unknown",
            email: m.email || m.user?.email || "",
          }))
        );
      }
    } catch (err) {
      console.error("[UserAllocationModal] Failed to fetch members:", err);
    } finally {
      setMembersLoading(false);
    }
  }, [workspaceAllocation]);

  // Filter out users that already have allocations (for create mode)
  const availableMembers =
    mode === "create"
      ? members.filter(m => !existingUserIds.includes(m.id))
      : members;

  // Reset form and fetch members when modal opens
  useEffect(() => {
    if (open) {
      if (mode === "edit" && allocation) {
        setSelectedUserId(allocation.userId);
        setAllocatedSeats(allocation.allocatedSeats);
      } else {
        setSelectedUserId("");
        setAllocatedSeats(Math.min(1, maxSeats));
      }
      setError("");
      setIsSubmitting(false);
      submissionRef.current = false;

      // Fetch members
      fetchMembers();
    }
  }, [open, mode, allocation, maxSeats, fetchMembers]);

  const validateForm = useCallback((): boolean => {
    if (mode === "create" && !selectedUserId) {
      setError("Please select a user");
      return false;
    }

    if (allocatedSeats < minSeats) {
      setError(
        `Cannot allocate less than ${minSeats} seats (currently in use)`
      );
      return false;
    }

    if (allocatedSeats > maxSeats) {
      setError(`Cannot allocate more than ${maxSeats} seats (workspace limit)`);
      return false;
    }

    return true;
  }, [mode, selectedUserId, allocatedSeats, minSeats, maxSeats]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    if (isSubmitting || submissionRef.current) {
      return;
    }

    setIsSubmitting(true);
    submissionRef.current = true;
    setError("");

    try {
      await onSubmit({
        workspaceId:
          mode === "create" ? workspaceAllocation?.workspaceId : undefined,
        userId: mode === "create" ? selectedUserId : undefined,
        allocatedSeats,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save allocation"
      );
    } finally {
      setIsSubmitting(false);
      submissionRef.current = false;
    }
  }, [
    validateForm,
    isSubmitting,
    onSubmit,
    mode,
    workspaceAllocation,
    selectedUserId,
    allocatedSeats,
  ]);

  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      setSelectedUserId("");
      setAllocatedSeats(1);
      setError("");
      setMembers([]);
      setIsSubmitting(false);
      submissionRef.current = false;
      onOpenChange(false);
    }
  }, [onOpenChange, isSubmitting]);

  const handleSeatsChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(e.target.value, 10);
      if (!isNaN(value)) {
        setAllocatedSeats(Math.max(minSeats, Math.min(maxSeats, value)));
      }
    },
    [minSeats, maxSeats]
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "create"
              ? "Allocate Seats to User"
              : "Edit User Allocation"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? `Select a user from ${workspaceAllocation?.workspaceName || "the workspace"} and specify how many seats to allocate.`
              : `Adjust the seat allocation for ${allocation?.userName || "this user"}.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Workspace info */}
          <div>
            <Label>Workspace</Label>
            <div className="mt-1 text-sm font-medium">
              {workspaceAllocation?.workspaceName || "Unknown Workspace"}
            </div>
          </div>

          {/* User selector (create mode only) */}
          {mode === "create" && (
            <div>
              <Label htmlFor="user">User *</Label>
              {membersLoading ? (
                <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading workspace members...
                </div>
              ) : availableMembers.length === 0 ? (
                <div className="mt-1 flex items-center gap-2 text-sm text-yellow-600">
                  <AlertTriangle className="h-4 w-4" />
                  {members.length === 0
                    ? "No members found in this workspace"
                    : "All workspace members already have allocations"}
                </div>
              ) : (
                <Select
                  value={selectedUserId}
                  onValueChange={setSelectedUserId}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMembers.map(member => (
                      <SelectItem key={member.id} value={member.id}>
                        <div className="flex flex-col">
                          <span>{member.name}</span>
                          {member.email && (
                            <span className="text-xs text-muted-foreground">
                              {member.email}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* Edit mode: show user name */}
          {mode === "edit" && allocation && (
            <div>
              <Label>User</Label>
              <div className="mt-1 text-sm font-medium">
                {allocation.userName}
              </div>
            </div>
          )}

          {/* Seat count input */}
          <div>
            <Label htmlFor="seats">Number of Seats *</Label>
            <Input
              id="seats"
              type="number"
              min={minSeats}
              max={maxSeats}
              value={allocatedSeats}
              onChange={handleSeatsChange}
              className="mt-1"
              disabled={isSubmitting || maxSeats === 0}
            />
            <div className="mt-1 text-xs text-muted-foreground">
              {mode === "edit" && allocation && allocation.usedSeats > 0 && (
                <span>Minimum: {minSeats} (seats in use). </span>
              )}
              Maximum available: {maxSeats}
            </div>
          </div>

          {/* Current usage info (edit mode) */}
          {mode === "edit" && allocation && (
            <div className="p-3 bg-muted rounded-md text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-muted-foreground">Currently used:</span>
                  <span className="ml-2 font-medium">
                    {allocation.usedSeats}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Available:</span>
                  <span className="ml-2 font-medium text-green-600">
                    {allocation.availableSeats}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Warning if no seats available */}
          {maxSeats === 0 && (
            <div className="flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-950 rounded-md text-yellow-600 dark:text-yellow-400">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">
                No seats available in this workspace. Increase the workspace
                allocation first.
              </span>
            </div>
          )}

          {error && (
            <div className="text-sm text-red-600 animate-in fade-in duration-200">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={
                isSubmitting ||
                submissionRef.current ||
                (mode === "create" && !selectedUserId) ||
                maxSeats === 0
              }
              className="min-w-[100px]"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </div>
              ) : mode === "create" ? (
                "Allocate Seats"
              ) : (
                "Update Allocation"
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default UserAllocationModal;

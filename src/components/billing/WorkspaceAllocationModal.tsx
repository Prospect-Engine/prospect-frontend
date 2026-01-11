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
import { useTeams, Workspace } from "@/hooks/useTeams";
import { WorkspaceAllocation } from "@/hooks/useSeatAllocations";

interface WorkspaceAllocationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  allocation?: WorkspaceAllocation | null;
  existingWorkspaceIds?: string[];
  maxAvailableSeats: number;
  onSubmit: (data: {
    workspaceId?: string;
    allocatedSeats: number;
  }) => Promise<void>;
}

/**
 * Modal for creating or editing workspace seat allocations
 */
export function WorkspaceAllocationModal({
  open,
  onOpenChange,
  mode,
  allocation,
  existingWorkspaceIds = [],
  maxAvailableSeats,
  onSubmit,
}: WorkspaceAllocationModalProps) {
  const { workspaces, loading: workspacesLoading } = useTeams();

  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>("");
  const [allocatedSeats, setAllocatedSeats] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const submissionRef = useRef(false);

  // Filter out workspaces that already have allocations (for create mode)
  const availableWorkspaces =
    mode === "create"
      ? workspaces.filter(ws => !existingWorkspaceIds.includes(ws.id))
      : workspaces;

  // Calculate max seats for this allocation
  const maxSeats =
    mode === "edit" && allocation
      ? maxAvailableSeats + allocation.allocatedSeats
      : maxAvailableSeats;

  // Minimum seats (cannot go below current usage in edit mode)
  const minSeats = mode === "edit" && allocation ? allocation.usedSeats : 1;

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      if (mode === "edit" && allocation) {
        setSelectedWorkspaceId(allocation.workspaceId);
        setAllocatedSeats(allocation.allocatedSeats);
      } else {
        setSelectedWorkspaceId("");
        setAllocatedSeats(Math.min(1, maxAvailableSeats));
      }
      setError("");
      setIsSubmitting(false);
      submissionRef.current = false;
    }
  }, [open, mode, allocation, maxAvailableSeats]);

  const validateForm = useCallback((): boolean => {
    if (mode === "create" && !selectedWorkspaceId) {
      setError("Please select a workspace");
      return false;
    }

    if (allocatedSeats < minSeats) {
      setError(
        `Cannot allocate less than ${minSeats} seats (currently in use)`
      );
      return false;
    }

    if (allocatedSeats > maxSeats) {
      setError(
        `Cannot allocate more than ${maxSeats} seats (organization limit)`
      );
      return false;
    }

    return true;
  }, [mode, selectedWorkspaceId, allocatedSeats, minSeats, maxSeats]);

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
        workspaceId: mode === "create" ? selectedWorkspaceId : undefined,
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
    selectedWorkspaceId,
    allocatedSeats,
  ]);

  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      setSelectedWorkspaceId("");
      setAllocatedSeats(1);
      setError("");
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
              ? "Allocate Seats to Workspace"
              : "Edit Workspace Allocation"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Select a workspace and specify how many seats to allocate."
              : `Adjust the seat allocation for ${allocation?.workspaceName || "this workspace"}.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Workspace selector (create mode only) */}
          {mode === "create" && (
            <div>
              <Label htmlFor="workspace">Workspace *</Label>
              {workspacesLoading ? (
                <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading workspaces...
                </div>
              ) : availableWorkspaces.length === 0 ? (
                <div className="mt-1 flex items-center gap-2 text-sm text-yellow-600">
                  <AlertTriangle className="h-4 w-4" />
                  All workspaces already have allocations
                </div>
              ) : (
                <Select
                  value={selectedWorkspaceId}
                  onValueChange={setSelectedWorkspaceId}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select a workspace" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableWorkspaces.map(ws => (
                      <SelectItem key={ws.id} value={ws.id}>
                        {ws.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* Edit mode: show workspace name */}
          {mode === "edit" && allocation && (
            <div>
              <Label>Workspace</Label>
              <div className="mt-1 text-sm font-medium">
                {allocation.workspaceName}
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
                No seats available at organization level. Consider upgrading
                your plan.
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
                (mode === "create" && !selectedWorkspaceId) ||
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

export default WorkspaceAllocationModal;

"use client";

import type React from "react";

import { useState, useRef, useEffect, useCallback } from "react";
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

interface CreateWorkspaceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWorkspaceCreated?: (workspaceData: {
    name: string;
    allocated_seats?: number;
  }) => void;
  // Legacy prop name for backward compatibility
  onTeamCreated?: (teamData: {
    name: string;
    allocated_seats?: number;
  }) => void;
}

export function CreateWorkspaceModal({
  open,
  onOpenChange,
  onWorkspaceCreated,
  onTeamCreated,
}: CreateWorkspaceModalProps) {
  // Support both prop names for backward compatibility
  const handleCreated = onWorkspaceCreated || onTeamCreated;
  const [workspaceName, setWorkspaceName] = useState("");
  const [allocatedSeats, setAllocatedSeats] = useState<number>(0);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const submissionRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset submission state when modal opens
  useEffect(() => {
    if (open) {
      setWorkspaceName("");
      setAllocatedSeats(0);
      setError("");
      setIsCreating(false);
      submissionRef.current = false;

      // Focus the input when modal opens
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  const handleCreateWorkspace = useCallback(async () => {
    if (!workspaceName.trim()) {
      setError("Workspace name is required");
      return;
    }

    if (allocatedSeats < 0) {
      setError("Allocated seats cannot be negative");
      return;
    }

    // Check submission guard
    if (isCreating || submissionRef.current) {
      return;
    }

    // Set submission guard
    setIsCreating(true);
    submissionRef.current = true;
    setError("");

    try {
      await handleCreated?.({
        name: workspaceName.trim(),
        allocated_seats: Number(Math.max(0, Number(allocatedSeats) || 0)),
      });

      // Close modal immediately on success
      setWorkspaceName("");
      setAllocatedSeats(0);
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create workspace"
      );
    } finally {
      // Reset submission state
      setIsCreating(false);
      submissionRef.current = false;
    }
  }, [workspaceName, allocatedSeats, isCreating, handleCreated, onOpenChange]);

  const handleClose = useCallback(() => {
    if (!isCreating) {
      setWorkspaceName("");
      setError("");
      setIsCreating(false);
      submissionRef.current = false;
      onOpenChange(false);
    }
  }, [onOpenChange, isCreating]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !isCreating) {
        e.preventDefault();
        handleCreateWorkspace();
      }
    },
    [handleCreateWorkspace, isCreating]
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Workspace</DialogTitle>
          <DialogDescription>
            Create a new workspace to organize your members and manage
            permissions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="workspace-name">Workspace Name *</Label>
            <Input
              ref={inputRef}
              id="workspace-name"
              value={workspaceName}
              onChange={e => setWorkspaceName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="e.g., Development Workspace"
              className="mt-1"
              required
              disabled={isCreating}
            />
          </div>

          <div>
            <Label htmlFor="allocated-seats">Allocated seats</Label>
            <Input
              id="allocated-seats"
              type="number"
              value={allocatedSeats}
              onChange={e => {
                const next = parseInt(e.target.value || "0", 10);
                setAllocatedSeats(next);
              }}
              className="mt-1 w-40"
              min={0}
              step={1}
              disabled={isCreating}
            />
          </div>

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
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreateWorkspace}
              disabled={
                !workspaceName.trim() || isCreating || submissionRef.current
              }
              className="min-w-[100px]"
            >
              {isCreating ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </div>
              ) : (
                "Create Workspace"
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Legacy alias for backward compatibility
export const CreateTeamModal = CreateWorkspaceModal;

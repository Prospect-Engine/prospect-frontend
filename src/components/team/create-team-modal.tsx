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

interface CreateTeamModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTeamCreated: (teamData: { name: string; allocated_seats?: number }) => void;
}

export function CreateTeamModal({
  open,
  onOpenChange,
  onTeamCreated,
}: CreateTeamModalProps) {
  const [teamName, setTeamName] = useState("");
  const [allocatedSeats, setAllocatedSeats] = useState<number>(0);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const submissionRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset submission state when modal opens
  useEffect(() => {
    if (open) {
      setTeamName("");
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

  const handleCreateTeam = useCallback(async () => {
    if (!teamName.trim()) {
      setError("Team name is required");
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
      await onTeamCreated({
        name: teamName.trim(),
        allocated_seats: Number(Math.max(0, Number(allocatedSeats) || 0)),
      });

      // Close modal immediately on success
      setTeamName("");
      setAllocatedSeats(0);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create team");
    } finally {
      // Reset submission state
      setIsCreating(false);
      submissionRef.current = false;
    }
  }, [teamName, allocatedSeats, isCreating, onTeamCreated, onOpenChange]);

  const handleClose = useCallback(() => {
    if (!isCreating) {
      setTeamName("");
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
        handleCreateTeam();
      }
    },
    [handleCreateTeam, isCreating]
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Team</DialogTitle>
          <DialogDescription>
            Create a new team to organize your members and manage permissions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="team-name">Team Name *</Label>
            <Input
              ref={inputRef}
              id="team-name"
              value={teamName}
              onChange={e => setTeamName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="e.g., Development Team"
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
              onClick={handleCreateTeam}
              disabled={!teamName.trim() || isCreating || submissionRef.current}
              className="min-w-[100px]"
            >
              {isCreating ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </div>
              ) : (
                "Create Team"
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

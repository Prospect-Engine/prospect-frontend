"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface Team {
  id: string;
  name: string;
  memberCount: number;
}

interface DeleteTeamModalProps {
  team: Team;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTeamDeleted: (teamId: string) => void;
}

export function DeleteTeamModal({
  team,
  open,
  onOpenChange,
  onTeamDeleted,
}: DeleteTeamModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canDelete = team.memberCount === 0; // Only allow deletion when team has no members

  const handleDelete = useCallback(async () => {
    if (!canDelete) {
      setError(
        "Cannot delete team while it still has members. Remove all members before deleting the team."
      );
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/workspaces/${team.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(
          data.message ||
            data.err ||
            `Failed to delete team: ${response.status}`
        );
        return;
      }

      // Call the parent callback to handle the optimistic update
      onTeamDeleted(team.id);
      setIsDeleting(false);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete team");
      setIsDeleting(false);
    }
  }, [team.id, canDelete, onTeamDeleted, onOpenChange]);

  const handleClose = useCallback(() => {
    if (!isDeleting) {
      setError(null);
      onOpenChange(false);
    }
  }, [onOpenChange, isDeleting]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Team
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &quot;{team.name}&quot;? This action
            cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!canDelete && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This team has {team.memberCount} member
                {team.memberCount !== 1 ? "s" : ""}. Remove all members before
                deleting the team.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Team Details:</h4>
            <div className="text-sm space-y-1">
              <div>Name: {team.name}</div>
              <div>Members: {team.memberCount}</div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!canDelete || isDeleting}
            className="min-w-[120px]"
          >
            {isDeleting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Deleting...
              </div>
            ) : (
              "Delete Team"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

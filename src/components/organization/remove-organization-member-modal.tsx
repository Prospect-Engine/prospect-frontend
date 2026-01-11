"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, Loader2 } from "lucide-react";

interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id?: string;
  email: string;
  name: string;
  role: string;
  status: string;
  permissions: string[];
  invited_by: string;
  created_at: string;
  accepted_at?: string;
}

interface RemoveOrganizationMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: OrganizationMember;
  onRemove: (memberId: string) => Promise<void>;
}

export function RemoveOrganizationMemberModal({
  open,
  onOpenChange,
  member,
  onRemove,
}: RemoveOrganizationMemberModalProps) {
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState("");
  const submissionRef = useRef(false);

  const handleRemove = useCallback(async () => {
    // Check submission guard
    if (isRemoving || submissionRef.current) {
      return;
    }

    // Set submission guard
    setIsRemoving(true);
    submissionRef.current = true;
    setError("");

    try {
      await onRemove(member.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove member");
    } finally {
      setIsRemoving(false);
      submissionRef.current = false;
    }
  }, [member.id, isRemoving, onRemove]);

  const handleClose = useCallback(() => {
    if (!isRemoving) {
      setError("");
      setIsRemoving(false);
      submissionRef.current = false;
      onOpenChange(false);
    }
  }, [onOpenChange, isRemoving]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Remove Organization Member
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to remove this member from your organization?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <div className="font-medium text-gray-900 dark:text-white">
              {member.name}
            </div>
            <div className="text-sm text-gray-500">{member.email}</div>
            <div className="text-xs text-gray-400 mt-1">
              Role: {member.role}
            </div>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p className="font-medium text-amber-600 dark:text-amber-400 mb-2">
              Warning: This action will:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-500">
              <li>
                Remove the member from all workspaces in this organization
              </li>
              <li>Revoke all organization-level permissions</li>
              <li>This action cannot be undone</li>
            </ul>
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
              disabled={isRemoving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleRemove}
              disabled={isRemoving || submissionRef.current}
              className="min-w-[100px]"
            >
              {isRemoving ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Removing...
                </div>
              ) : (
                "Remove Member"
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

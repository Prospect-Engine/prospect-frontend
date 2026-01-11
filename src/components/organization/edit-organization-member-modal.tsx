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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";

// Organization permissions
const ORGANIZATION_PERMISSIONS = [
  { value: "MANAGE_ORGANIZATION", label: "Manage Organization" },
  { value: "MANAGE_BILLING", label: "Manage Billing" },
  { value: "MANAGE_MEMBERS", label: "Manage Members" },
  { value: "MANAGE_WORKSPACES", label: "Manage Workspaces" },
  { value: "MANAGE_WHITE_LABEL", label: "Manage White Label" },
  { value: "VIEW_ANALYTICS", label: "View Analytics" },
];

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

interface EditOrganizationMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: OrganizationMember;
  onUpdate: (
    memberId: string,
    updates: {
      role?: string;
      permissions?: string[];
      name?: string;
    }
  ) => Promise<void>;
}

export function EditOrganizationMemberModal({
  open,
  onOpenChange,
  member,
  onUpdate,
}: EditOrganizationMemberModalProps) {
  const [name, setName] = useState(member.name);
  const [role, setRole] = useState<string>(member.role);
  const [permissions, setPermissions] = useState<string[]>(member.permissions);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const submissionRef = useRef(false);

  // Reset form when modal opens or member changes
  useEffect(() => {
    if (open) {
      setName(member.name);
      setRole(member.role);
      setPermissions([...member.permissions]);
      setError("");
      setIsSubmitting(false);
      submissionRef.current = false;
    }
  }, [open, member]);

  const togglePermission = (permission: string) => {
    setPermissions(prev =>
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  const handleSubmit = useCallback(async () => {
    // Check submission guard
    if (isSubmitting || submissionRef.current) {
      return;
    }

    // Set submission guard
    setIsSubmitting(true);
    submissionRef.current = true;
    setError("");

    try {
      const updates: { role?: string; permissions?: string[]; name?: string } =
        {};

      // Only include changed fields
      if (name !== member.name) {
        updates.name = name.trim();
      }
      if (role !== member.role) {
        updates.role = role;
      }

      // Check if permissions changed
      const permissionsChanged =
        permissions.length !== member.permissions.length ||
        !permissions.every(p => member.permissions.includes(p));
      if (permissionsChanged) {
        updates.permissions = permissions;
      }

      // Only update if there are changes
      if (Object.keys(updates).length === 0) {
        onOpenChange(false);
        return;
      }

      await onUpdate(member.id, updates);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update member");
    } finally {
      setIsSubmitting(false);
      submissionRef.current = false;
    }
  }, [name, role, permissions, member, isSubmitting, onUpdate, onOpenChange]);

  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      setError("");
      setIsSubmitting(false);
      submissionRef.current = false;
      onOpenChange(false);
    }
  }, [onOpenChange, isSubmitting]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !isSubmitting) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit, isSubmitting]
  );

  const isOwner = member.role === "OWNER";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Organization Member</DialogTitle>
          <DialogDescription>
            Update member details and permissions for {member.email}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="edit-name">Name</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="John Doe"
              className="mt-1"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Label htmlFor="edit-role">Role</Label>
            <Select
              value={role}
              onValueChange={setRole}
              disabled={isSubmitting || isOwner}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {isOwner && <SelectItem value="OWNER">Owner</SelectItem>}
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="MEMBER">Member</SelectItem>
              </SelectContent>
            </Select>
            {isOwner && (
              <p className="text-xs text-gray-500 mt-1">
                Owner role cannot be changed
              </p>
            )}
          </div>

          <div>
            <Label>Permissions</Label>
            <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
              {ORGANIZATION_PERMISSIONS.map(perm => (
                <div key={perm.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`edit-${perm.value}`}
                    checked={permissions.includes(perm.value)}
                    onCheckedChange={() => togglePermission(perm.value)}
                    disabled={isSubmitting}
                  />
                  <Label
                    htmlFor={`edit-${perm.value}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {perm.label}
                  </Label>
                </div>
              ))}
            </div>
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
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || submissionRef.current}
              className="min-w-[100px]"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </div>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

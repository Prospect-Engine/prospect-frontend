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

interface InviteOrganizationMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvite: (data: {
    email: string;
    name?: string;
    role: string;
    permissions?: string[];
  }) => Promise<void>;
}

export function InviteOrganizationMemberModal({
  open,
  onOpenChange,
  onInvite,
}: InviteOrganizationMemberModalProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<string>("MEMBER");
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const submissionRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setEmail("");
      setName("");
      setRole("MEMBER");
      setPermissions([]);
      setError("");
      setIsSubmitting(false);
      submissionRef.current = false;

      // Focus the input when modal opens
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  const togglePermission = (permission: string) => {
    setPermissions(prev =>
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  const handleSubmit = useCallback(async () => {
    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address");
      return;
    }

    // Check submission guard
    if (isSubmitting || submissionRef.current) {
      return;
    }

    // Set submission guard
    setIsSubmitting(true);
    submissionRef.current = true;
    setError("");

    try {
      await onInvite({
        email: email.trim(),
        name: name.trim() || undefined,
        role,
        permissions: permissions.length > 0 ? permissions : undefined,
      });

      // Reset form on success
      setEmail("");
      setName("");
      setRole("MEMBER");
      setPermissions([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to invite member");
    } finally {
      setIsSubmitting(false);
      submissionRef.current = false;
    }
  }, [email, name, role, permissions, isSubmitting, onInvite]);

  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      setEmail("");
      setName("");
      setRole("MEMBER");
      setPermissions([]);
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Organization Member</DialogTitle>
          <DialogDescription>
            Invite a new member to your organization. They will receive an email
            invitation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              ref={inputRef}
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="member@example.com"
              className="mt-1"
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Label htmlFor="name">Name (optional)</Label>
            <Input
              id="name"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="John Doe"
              className="mt-1"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Label htmlFor="role">Role *</Label>
            <Select
              value={role}
              onValueChange={setRole}
              disabled={isSubmitting}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="MEMBER">Member</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Permissions (optional)</Label>
            <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
              {ORGANIZATION_PERMISSIONS.map(perm => (
                <div key={perm.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={perm.value}
                    checked={permissions.includes(perm.value)}
                    onCheckedChange={() => togglePermission(perm.value)}
                    disabled={isSubmitting}
                  />
                  <Label
                    htmlFor={perm.value}
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
              disabled={!email.trim() || isSubmitting || submissionRef.current}
              className="min-w-[100px]"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Inviting...
                </div>
              ) : (
                "Send Invitation"
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

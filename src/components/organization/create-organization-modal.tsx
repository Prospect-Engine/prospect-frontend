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
import { Loader2 } from "lucide-react";

interface CreateOrganizationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (organizationName: string) => Promise<void>;
}

export function CreateOrganizationModal({
  open,
  onOpenChange,
  onCreate,
}: CreateOrganizationModalProps) {
  const [organizationName, setOrganizationName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const submissionRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setOrganizationName("");
      setError("");
      setIsSubmitting(false);
      submissionRef.current = false;

      // Focus the input when modal opens
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  const handleSubmit = useCallback(async () => {
    if (!organizationName.trim()) {
      setError("Organization name is required");
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
      await onCreate(organizationName.trim());

      // Reset form on success
      setOrganizationName("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create organization"
      );
    } finally {
      setIsSubmitting(false);
      submissionRef.current = false;
    }
  }, [organizationName, isSubmitting, onCreate]);

  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      setOrganizationName("");
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
          <DialogTitle>Create New Organization</DialogTitle>
          <DialogDescription>
            Create a new organization to manage multiple workspaces and teams.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="organization-name">Organization Name *</Label>
            <Input
              ref={inputRef}
              id="organization-name"
              type="text"
              value={organizationName}
              onChange={e => setOrganizationName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="My Organization"
              className="mt-1"
              required
              disabled={isSubmitting}
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
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={
                !organizationName.trim() ||
                isSubmitting ||
                submissionRef.current
              }
              className="min-w-[100px]"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </div>
              ) : (
                "Create Organization"
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

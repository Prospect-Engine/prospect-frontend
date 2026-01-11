/**
 * Manual Sync Button
 * ==================
 * Button to manually trigger CRM sync for a LinkedIn connection.
 */

import React, { useState } from "react";
import { RefreshCw, Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { CRMSyncTriggerResponse } from "@/types/connection";

interface ManualSyncButtonProps {
  connectionId: string;
  organizationId: string;
  workspaceId: string;
  onSyncComplete?: (result: CRMSyncTriggerResponse) => void;
  disabled?: boolean;
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

type SyncState = "idle" | "syncing" | "success" | "error";

export function ManualSyncButton({
  connectionId,
  organizationId,
  workspaceId,
  onSyncComplete,
  disabled = false,
  className,
  variant = "outline",
  size = "sm",
}: ManualSyncButtonProps) {
  const [syncState, setSyncState] = useState<SyncState>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleSync = async () => {
    if (syncState === "syncing" || disabled) return;

    setSyncState("syncing");
    setErrorMessage("");

    try {
      const response = await fetch(
        `/api/connections/${connectionId}/sync-to-crm`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            organization_id: organizationId,
            workspace_id: workspaceId,
          }),
          credentials: "include",
        }
      );

      const data: CRMSyncTriggerResponse = await response.json();

      if (data.success) {
        setSyncState("success");
        onSyncComplete?.(data);
        // Reset to idle after 2 seconds
        setTimeout(() => setSyncState("idle"), 2000);
      } else {
        setSyncState("error");
        setErrorMessage(data.error || "Sync failed");
        // Reset to idle after 3 seconds
        setTimeout(() => setSyncState("idle"), 3000);
      }
    } catch (error) {
      setSyncState("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Network error"
      );
      setTimeout(() => setSyncState("idle"), 3000);
    }
  };

  const renderIcon = () => {
    switch (syncState) {
      case "syncing":
        return <RefreshCw className="h-4 w-4 animate-spin" />;
      case "success":
        return <Check className="h-4 w-4 text-green-600" />;
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <RefreshCw className="h-4 w-4" />;
    }
  };

  const getTooltipContent = () => {
    switch (syncState) {
      case "syncing":
        return "Syncing to CRM...";
      case "success":
        return "Synced successfully!";
      case "error":
        return errorMessage || "Sync failed";
      default:
        return "Sync to CRM";
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size={size}
            onClick={handleSync}
            disabled={disabled || syncState === "syncing"}
            className={cn(
              "transition-colors",
              syncState === "success" && "border-green-200 bg-green-50",
              syncState === "error" && "border-red-200 bg-red-50",
              className
            )}
          >
            {renderIcon()}
            {size !== "icon" && (
              <span className="ml-1.5">
                {syncState === "syncing"
                  ? "Syncing..."
                  : syncState === "success"
                    ? "Synced"
                    : syncState === "error"
                      ? "Failed"
                      : "Sync to CRM"}
              </span>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getTooltipContent()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default ManualSyncButton;

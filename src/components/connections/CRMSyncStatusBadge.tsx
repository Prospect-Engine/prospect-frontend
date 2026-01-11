/**
 * CRM Sync Status Badge
 * =====================
 * Displays the CRM sync status for a LinkedIn connection.
 * Shows whether the connection has been synced to CRM contacts.
 */

import React from "react";
import { Check, Clock, AlertTriangle, MinusCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { CRMSyncStatus, CRMSyncStatusType } from "@/types/connection";

interface CRMSyncStatusBadgeProps {
  status?: CRMSyncStatus;
  className?: string;
  showLabel?: boolean;
}

const statusConfig: Record<
  CRMSyncStatusType,
  {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    colorClass: string;
    bgClass: string;
  }
> = {
  SYNCED: {
    icon: Check,
    label: "Synced to CRM",
    colorClass: "text-green-600",
    bgClass: "bg-green-50 border-green-200",
  },
  PENDING: {
    icon: Clock,
    label: "Pending Sync",
    colorClass: "text-amber-600",
    bgClass: "bg-amber-50 border-amber-200",
  },
  FAILED: {
    icon: AlertTriangle,
    label: "Sync Failed",
    colorClass: "text-red-600",
    bgClass: "bg-red-50 border-red-200",
  },
  SKIPPED: {
    icon: MinusCircle,
    label: "Skipped",
    colorClass: "text-gray-500",
    bgClass: "bg-gray-50 border-gray-200",
  },
};

export function CRMSyncStatusBadge({
  status,
  className,
  showLabel = false,
}: CRMSyncStatusBadgeProps) {
  // If no status, show as not synced yet
  if (!status) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium",
                "bg-gray-50 border-gray-200 text-gray-500",
                className
              )}
            >
              <MinusCircle className="h-3.5 w-3.5" />
              {showLabel && <span>Not Synced</span>}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Connection has not been synced to CRM yet</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const config = statusConfig[status.status];
  const Icon = config.icon;

  const tooltipContent = () => {
    switch (status.status) {
      case "SYNCED":
        return (
          <div className="space-y-1">
            <p className="font-medium">Synced to CRM</p>
            {status.contact_id && (
              <p className="text-xs text-muted-foreground">
                Contact ID: {status.contact_id}
              </p>
            )}
            {status.match_type && (
              <p className="text-xs text-muted-foreground">
                Match type: {status.match_type.replace("_", " ")}
              </p>
            )}
            {status.synced_at && (
              <p className="text-xs text-muted-foreground">
                Synced: {new Date(status.synced_at).toLocaleString()}
              </p>
            )}
          </div>
        );
      case "FAILED":
        return (
          <div className="space-y-1">
            <p className="font-medium">Sync Failed</p>
            {status.error && (
              <p className="text-xs text-red-600">{status.error}</p>
            )}
          </div>
        );
      case "PENDING":
        return <p>Waiting to sync to CRM</p>;
      case "SKIPPED":
        return <p>Sync was skipped (CRM sync disabled)</p>;
      default:
        return null;
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium",
              config.bgClass,
              config.colorClass,
              className
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {showLabel && <span>{config.label}</span>}
          </div>
        </TooltipTrigger>
        <TooltipContent>{tooltipContent()}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default CRMSyncStatusBadge;

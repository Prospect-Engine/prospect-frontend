"use client";

import { useSyncStatus } from "@/hooks/useSyncStatus";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface SyncStatusPanelProps {
  integrationId: string;
  integrationType: string;
}

/**
 * Status configuration for different sync states.
 * Maps sync status to display properties.
 */
const STATUS_CONFIG = {
  IDLE: {
    label: "Synced",
    color: "bg-green-500",
    textColor: "text-green-700",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    icon: CheckCircle,
  },
  SYNCING_FULL: {
    label: "Full Sync",
    color: "bg-blue-500",
    textColor: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    icon: RefreshCw,
  },
  SYNCING_INCREMENTAL: {
    label: "Syncing",
    color: "bg-blue-500",
    textColor: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    icon: RefreshCw,
  },
  VERIFYING: {
    label: "Verifying",
    color: "bg-yellow-500",
    textColor: "text-yellow-700",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    icon: Clock,
  },
  FAILED: {
    label: "Failed",
    color: "bg-red-500",
    textColor: "text-red-700",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    icon: AlertCircle,
  },
} as const;

/**
 * Sync statuses that indicate sync is currently in progress.
 */
const IN_PROGRESS_STATUSES = [
  "SYNCING_FULL",
  "SYNCING_INCREMENTAL",
  "VERIFYING",
];

/**
 * SyncStatusPanel component displays the connection sync status for a LinkedIn integration.
 * It shows sync progress, connection counts, last sync time, and allows manual sync triggering.
 *
 * Features:
 * - Only renders for LINKEDIN integrations (returns null for others)
 * - Shows status badge with appropriate color based on sync state
 * - Displays progress bar when syncing (0-100%)
 * - Shows connection count (synced / total)
 * - Shows last sync timestamp using relative time format
 * - Shows failure reason when status is FAILED
 * - Sync button with cooldown indicator
 *
 * @param integrationId - The UUID of the integration
 * @param integrationType - The type of integration (e.g., "LINKEDIN", "EMAIL")
 */
export function SyncStatusPanel({
  integrationId,
  integrationType,
}: SyncStatusPanelProps) {
  // Determine if this is a LinkedIn integration
  const isLinkedIn = integrationType === "LINKEDIN";

  // Always call hooks unconditionally, but enable only for LinkedIn
  const { syncStatus, isLoading, error, triggerSync, isTriggeringSync } =
    useSyncStatus({ integrationId, enabled: isLinkedIn });

  // Only show for LinkedIn integrations
  if (!isLinkedIn) {
    return null;
  }

  // Loading skeleton state
  if (isLoading) {
    return (
      <div className="border border-border/20 rounded-xl p-4 mt-3 animate-pulse bg-white/30 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="h-4 bg-gray-200 rounded w-28" />
          <div className="h-5 bg-gray-200 rounded w-16" />
        </div>
        <div className="h-2 bg-gray-200 rounded w-full mb-3" />
        <div className="flex justify-between mb-2">
          <div className="h-4 bg-gray-200 rounded w-20" />
          <div className="h-4 bg-gray-200 rounded w-16" />
        </div>
        <div className="h-3 bg-gray-200 rounded w-24" />
      </div>
    );
  }

  // Silently fail if there's an error or no sync status - sync status is optional UI
  if (error || !syncStatus) {
    return null;
  }

  const config = STATUS_CONFIG[syncStatus.status];
  const StatusIcon = config.icon;
  const isSyncing = IN_PROGRESS_STATUSES.includes(syncStatus.status);

  /**
   * Handle manual sync trigger with toast notifications.
   */
  const handleTriggerSync = async () => {
    const result = await triggerSync();
    if (result.success) {
      toast.success("Sync started", {
        description: "Connection sync has been initiated.",
      });
    } else {
      toast.error("Sync failed", {
        description: result.message,
      });
    }
  };

  /**
   * Get human-readable text for last sync time.
   */
  const getLastSyncText = (): string => {
    const lastSync =
      syncStatus.last_full_sync_at || syncStatus.last_incremental_sync_at;
    if (!lastSync) return "Never synced";
    try {
      return `Last sync ${formatDistanceToNow(new Date(lastSync), { addSuffix: true })}`;
    } catch {
      return "Unknown";
    }
  };

  /**
   * Get cooldown remaining text if manual sync is not available.
   */
  const getCooldownText = (): string | null => {
    if (syncStatus.can_trigger_manual_sync) return null;
    if (!syncStatus.last_manual_sync_at) return "Cooldown active";

    try {
      const lastManual = new Date(syncStatus.last_manual_sync_at);
      const nextAvailable = new Date(
        lastManual.getTime() + 24 * 60 * 60 * 1000
      );
      return `Available ${formatDistanceToNow(nextAvailable, { addSuffix: true })}`;
    } catch {
      return "Cooldown active";
    }
  };

  return (
    <div
      className={`border rounded-xl p-4 mt-3 space-y-3 bg-white/30 backdrop-blur-sm ${config.borderColor}`}
    >
      {/* Header with title and status badge */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-foreground">Connection Sync</h4>
        <Badge
          variant="outline"
          className={`flex items-center gap-1.5 ${config.bgColor} ${config.textColor} ${config.borderColor}`}
        >
          <span
            className={`w-2 h-2 rounded-full ${config.color} ${
              isSyncing ? "animate-pulse" : ""
            }`}
          />
          {config.label}
        </Badge>
      </div>

      {/* Progress bar when syncing */}
      {isSyncing && (
        <div className="space-y-1">
          <Progress value={syncStatus.sync_progress} className="h-2" />
          <p className="text-xs text-muted-foreground text-right">
            {syncStatus.sync_progress}%
          </p>
        </div>
      )}

      {/* Connection counts */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Connections</span>
        <span className="font-medium">
          {syncStatus.synced_count.toLocaleString()}
          {syncStatus.linkedin_count != null &&
            syncStatus.linkedin_count > 0 && (
              <span className="text-muted-foreground">
                {" "}
                / {syncStatus.linkedin_count.toLocaleString()}
              </span>
            )}
        </span>
      </div>

      {/* Last sync time */}
      <p className="text-xs text-muted-foreground">{getLastSyncText()}</p>

      {/* Failure reason */}
      {syncStatus.status === "FAILED" && syncStatus.failure_reason && (
        <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{syncStatus.failure_reason}</span>
        </div>
      )}

      {/* Sync button */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleTriggerSync}
          disabled={
            !syncStatus.can_trigger_manual_sync || isTriggeringSync || isSyncing
          }
          className="w-full rounded-xl border-border/30 hover:border-border/50 transition-all duration-200"
        >
          {isTriggeringSync ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw
              className={`w-4 h-4 mr-2 ${isSyncing ? "animate-spin" : ""}`}
            />
          )}
          {isSyncing
            ? "Syncing..."
            : isTriggeringSync
              ? "Starting..."
              : "Sync Now"}
        </Button>
      </div>

      {/* Cooldown text */}
      {!syncStatus.can_trigger_manual_sync && !isSyncing && (
        <p className="text-xs text-muted-foreground text-center">
          {getCooldownText()}
        </p>
      )}
    </div>
  );
}

export default SyncStatusPanel;

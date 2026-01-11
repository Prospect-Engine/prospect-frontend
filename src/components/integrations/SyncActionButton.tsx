"use client";

import { useSyncStatus } from "@/hooks/useSyncStatus";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RefreshCw, Loader2, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface SyncActionButtonProps {
  integrationId: string;
  integrationType: string;
}

/**
 * SyncActionButton displays a sync button with cooldown awareness.
 * Shows different states: Sync Now, Syncing, Cooldown countdown.
 */
export function SyncActionButton({
  integrationId,
  integrationType,
}: SyncActionButtonProps) {
  const isLinkedIn = integrationType.toUpperCase() === "LINKEDIN";

  const { syncStatus, isLoading, error, triggerSync, isTriggeringSync } =
    useSyncStatus({ integrationId, enabled: isLinkedIn });

  // Don't render for non-LinkedIn integrations
  if (!isLinkedIn) {
    return null;
  }

  // Loading state - show disabled button
  if (isLoading) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled
        className="rounded-xl border-border/40"
      >
        <Loader2 className="w-4 h-4 animate-spin" />
      </Button>
    );
  }

  // Error or no data - don't render
  if (error || !syncStatus) {
    return null;
  }

  const isSyncing = [
    "SYNCING_FULL",
    "SYNCING_INCREMENTAL",
    "VERIFYING",
  ].includes(syncStatus.status);

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
      const now = new Date();

      if (nextAvailable <= now) return null;

      // Calculate hours remaining
      const hoursRemaining = Math.ceil(
        (nextAvailable.getTime() - now.getTime()) / (1000 * 60 * 60)
      );

      return `~${hoursRemaining}h`;
    } catch {
      return "Cooldown";
    }
  };

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

  const cooldownText = getCooldownText();
  const canSync =
    syncStatus.can_trigger_manual_sync && !isSyncing && !isTriggeringSync;

  // Currently syncing
  if (isSyncing) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled
        className="rounded-xl border-blue-200 bg-blue-50 text-blue-700"
      >
        <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" />
        Syncing...
      </Button>
    );
  }

  // Triggering sync
  if (isTriggeringSync) {
    return (
      <Button variant="outline" size="sm" disabled className="rounded-xl">
        <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
        Starting...
      </Button>
    );
  }

  // On cooldown
  if (cooldownText) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled
              className="rounded-xl border-border/40 text-slate-400"
            >
              <Clock className="w-4 h-4 mr-1.5" />
              {cooldownText}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-sm">Manual sync available in {cooldownText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Ready to sync
  return (
    <Button
      variant="default"
      size="sm"
      onClick={handleTriggerSync}
      disabled={!canSync}
      className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-sm hover:shadow-md transition-all duration-200"
    >
      <RefreshCw className="w-4 h-4 mr-1.5" />
      Sync Now
    </Button>
  );
}

export default SyncActionButton;

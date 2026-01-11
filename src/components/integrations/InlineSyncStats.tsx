"use client";

import { useSyncStatus } from "@/hooks/useSyncStatus";
import { formatDistanceToNow } from "date-fns";

interface InlineSyncStatsProps {
  integrationId: string;
}

/**
 * InlineSyncStats displays sync statistics inline (connections count, sync status, last sync time)
 * This is a compact version designed for the minimal row layout.
 */
export function InlineSyncStats({ integrationId }: InlineSyncStatsProps) {
  const { syncStatus, isLoading, error } = useSyncStatus({
    integrationId,
    enabled: true,
  });

  // Don't render anything if loading, error, or no data
  if (isLoading || error || !syncStatus) {
    return null;
  }

  const isSyncing = [
    "SYNCING_FULL",
    "SYNCING_INCREMENTAL",
    "VERIFYING",
  ].includes(syncStatus.status);

  /**
   * Get human-readable text for last sync time.
   */
  const getLastSyncText = (): string => {
    const lastSync =
      syncStatus.last_full_sync_at || syncStatus.last_incremental_sync_at;
    if (!lastSync) return "";
    try {
      return formatDistanceToNow(new Date(lastSync), { addSuffix: true });
    } catch {
      return "";
    }
  };

  const lastSyncText = getLastSyncText();

  return (
    <>
      {/* Separator */}
      <span className="text-slate-300">•</span>

      {/* Connection Count */}
      <span className="text-slate-600">
        <span className="font-semibold text-slate-900">
          {syncStatus.synced_count.toLocaleString()}
        </span>{" "}
        connections
      </span>

      {/* Sync Status */}
      {isSyncing ? (
        <>
          <span className="text-slate-300">•</span>
          <span className="text-blue-600 font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            Syncing {syncStatus.sync_progress}%
          </span>
        </>
      ) : syncStatus.status === "FAILED" ? (
        <>
          <span className="text-slate-300">•</span>
          <span className="text-red-600 font-medium">Sync failed</span>
        </>
      ) : syncStatus.status === "IDLE" ? (
        <>
          <span className="text-slate-300">•</span>
          <span className="text-emerald-600 font-medium">Synced</span>
        </>
      ) : null}

      {/* Last Sync Time */}
      {lastSyncText && !isSyncing && (
        <>
          <span className="text-slate-300">•</span>
          <span className="text-slate-500">{lastSyncText}</span>
        </>
      )}
    </>
  );
}

export default InlineSyncStats;

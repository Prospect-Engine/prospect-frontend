"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ConnectionSyncState } from "@/types/connection";

/**
 * Options for the useSyncStatus hook.
 */
interface UseSyncStatusOptions {
  /** The integration ID to fetch sync status for */
  integrationId: string;
  /** Whether the hook should be enabled (default: true) */
  enabled?: boolean;
  /** Poll interval in milliseconds when sync is in progress (default: 5000) */
  pollInterval?: number;
}

/**
 * Return type for the useSyncStatus hook.
 */
interface UseSyncStatusReturn {
  /** The current sync status, or null if not yet loaded */
  syncStatus: ConnectionSyncState | null;
  /** Whether the initial fetch is in progress */
  isLoading: boolean;
  /** Error from the last fetch attempt, or null if no error */
  error: Error | null;
  /** Trigger a manual connection sync */
  triggerSync: () => Promise<{ success: boolean; message: string }>;
  /** Whether a sync trigger request is in progress */
  isTriggeringSync: boolean;
  /** Manually refetch the sync status */
  refetch: () => Promise<void>;
}

/**
 * Sync statuses that indicate sync is in progress and we should poll.
 */
const IN_PROGRESS_STATUSES = [
  "SYNCING_FULL",
  "SYNCING_INCREMENTAL",
  "VERIFYING",
];

/**
 * Hook for fetching and polling LinkedIn connection sync status.
 *
 * Features:
 * - Fetches sync status on mount
 * - Polls every 5 seconds when sync is in progress (SYNCING_FULL, SYNCING_INCREMENTAL, VERIFYING)
 * - Stops polling when sync is IDLE or FAILED
 * - Provides triggerSync function to manually trigger a sync
 * - Handles loading and error states
 * - Automatically refetches after triggering a sync
 *
 * @example
 * ```tsx
 * const { syncStatus, isLoading, triggerSync, isTriggeringSync } = useSyncStatus({
 *   integrationId: 'uuid-here',
 *   enabled: true,
 *   pollInterval: 5000,
 * });
 * ```
 */
export function useSyncStatus({
  integrationId,
  enabled = true,
  pollInterval = 5000,
}: UseSyncStatusOptions): UseSyncStatusReturn {
  const [syncStatus, setSyncStatus] = useState<ConnectionSyncState | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isTriggeringSync, setIsTriggeringSync] = useState(false);

  // Use ref for interval to avoid stale closures
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Fetch the current sync status from the API.
   */
  const fetchStatus = useCallback(async () => {
    if (!integrationId) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `/api/integration/sync-status?id=${integrationId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          credentials: "same-origin",
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            `Failed to fetch sync status (${response.status})`
        );
      }

      const data = await response.json();
      setSyncStatus(data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch sync status:", err);
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setIsLoading(false);
    }
  }, [integrationId]);

  /**
   * Trigger a manual connection sync.
   * Returns a result object indicating success/failure and a message.
   */
  const triggerSync = useCallback(async (): Promise<{
    success: boolean;
    message: string;
  }> => {
    if (!integrationId) {
      return { success: false, message: "No integration ID provided" };
    }

    setIsTriggeringSync(true);

    try {
      const response = await fetch(
        `/api/integration/trigger-sync?id=${integrationId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          credentials: "same-origin",
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        return {
          success: false,
          message:
            data.message || `Failed to trigger sync (${response.status})`,
        };
      }

      // Refetch status after triggering sync
      await fetchStatus();

      return {
        success: true,
        message: data.message || "Sync triggered successfully",
      };
    } catch (err) {
      console.error("Failed to trigger sync:", err);
      return {
        success: false,
        message: err instanceof Error ? err.message : "Failed to trigger sync",
      };
    } finally {
      setIsTriggeringSync(false);
    }
  }, [integrationId, fetchStatus]);

  // Initial fetch when enabled or integrationId changes
  useEffect(() => {
    if (enabled && integrationId) {
      setIsLoading(true);
      fetchStatus();
    } else {
      setIsLoading(false);
      setSyncStatus(null);
    }
  }, [enabled, integrationId, fetchStatus]);

  // Polling logic: poll when sync is in progress
  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Don't poll if disabled, no status, or sync is not in progress
    if (!enabled || !syncStatus) {
      return;
    }

    const isSyncing = IN_PROGRESS_STATUSES.includes(syncStatus.status);

    if (!isSyncing) {
      return;
    }

    // Start polling
    intervalRef.current = setInterval(() => {
      fetchStatus();
    }, pollInterval);

    // Cleanup on unmount or when conditions change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, syncStatus?.status, pollInterval, fetchStatus]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  return {
    syncStatus,
    isLoading,
    error,
    triggerSync,
    isTriggeringSync,
    refetch: fetchStatus,
  };
}

export default useSyncStatus;

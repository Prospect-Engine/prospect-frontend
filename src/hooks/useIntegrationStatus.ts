"use client";

import { useState, useEffect, useRef } from "react";

export interface IntegrationStatus {
  status: string;
  isReconnecting: boolean;
  error: string | null;
}

/**
 * Hook for polling integration status updates
 * Polls every 5 seconds when status is RECONNECTING
 * Stops polling when status changes to CONNECTED or ERROR
 */
export function useIntegrationStatus(
  integrationId: string,
  initialStatus: string
): IntegrationStatus {
  const [status, setStatus] = useState(initialStatus);
  const [isReconnecting, setIsReconnecting] = useState(
    initialStatus === "RECONNECTING"
  );
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Start polling if status is RECONNECTING
    if (status === "RECONNECTING") {
      setIsReconnecting(true);

      // Poll every 5 seconds (research decision R5-002)
      intervalRef.current = setInterval(async () => {
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

          if (response.ok) {
            const data = await response.json();
            const newStatus = data.connection_status || data.connectionStatus;

            setStatus(newStatus);

            // Stop polling if no longer reconnecting
            if (newStatus !== "RECONNECTING") {
              setIsReconnecting(false);
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
              }
            }
          }
        } catch (err) {
          console.error("Failed to fetch integration status", err);
          setError("Failed to fetch status");
        }
      }, 5000);
    }

    // Cleanup on unmount or status change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [integrationId, status]);

  return { status, isReconnecting, error };
}

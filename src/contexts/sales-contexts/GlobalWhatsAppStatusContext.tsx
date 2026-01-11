"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { API_BASE_URL } from "../../services/sales-services/baseUrl";
import toastService from "../../services/sales-services/toastService";
import { useAuth } from "../../hooks/sales-hooks/useAuth";
import { useWorkspace } from "../../hooks/sales-hooks/useWorkspace";

interface GlobalWhatsAppStatusContextType {
  subscribeToStatusUpdates: () => void;
  unsubscribeFromStatusUpdates: () => void;
}

const GlobalWhatsAppStatusContext = createContext<
  GlobalWhatsAppStatusContextType | undefined
>(undefined);

export const useGlobalWhatsAppStatus = () => {
  const context = useContext(GlobalWhatsAppStatusContext);
  if (context === undefined) {
    throw new Error(
      "useGlobalWhatsAppStatus must be used within a GlobalWhatsAppStatusProvider"
    );
  }
  return context;
};

interface GlobalWhatsAppStatusProviderProps {
  children: React.ReactNode;
}

export const GlobalWhatsAppStatusProvider: React.FC<
  GlobalWhatsAppStatusProviderProps
> = ({ children }) => {
  const { user } = useAuth();
  const { selectedOrganization, selectedWorkspace } = useWorkspace();
  const abortControllerRef = useRef<AbortController | null>(null);
  const isSubscribedRef = useRef(false);

  const subscribeToStatusUpdates = useCallback(() => {
    if (isSubscribedRef.current) return;

    // Check if SSE is disabled via environment variable
    if (process.env.NEXT_PUBLIC_DISABLE_SSE === "true") {
      //
      return;
    }

    if (!user || !selectedOrganization || !selectedWorkspace) {
      return;
    }

    const token = localStorage.getItem("crm_access_token");
    if (!token) {
      return;
    }

    // Get workspace and organization IDs from context
    const workspaceId = selectedWorkspace.id;
    const organizationId = selectedOrganization.id;

    const base = API_BASE_URL;
    const sseUrl = `${base.replace(/\/$/, "")}/whatsapp/accounts/status-updates?organizationId=${organizationId}&workspaceId=${workspaceId}`;

    //

    abortControllerRef.current = new AbortController();

    (async () => {
      try {
        const response = await fetch(sseUrl, {
          headers: {
            Accept: "text/event-stream",
            Authorization: `Bearer ${token}`,
          },
          signal: abortControllerRef.current!.signal,
        });

        if (!response.ok || !response.body) {
          if (response.status === 401) {
            // Reset subscription state to allow retry with fresh token
            isSubscribedRef.current = false;
          } else {
          }
          // Don't throw an error, just return silently as this is an optional feature
          isSubscribedRef.current = false;
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const chunks = buffer.split("\n\n");
          buffer = chunks.pop() || "";

          for (const chunk of chunks) {
            const dataLines = chunk
              .split("\n")
              .filter(l => l.startsWith("data:"))
              .map(l => l.slice(5).trim());

            if (!dataLines.length) continue;

            const dataStr = dataLines.join("\n");
            try {
              const data = JSON.parse(dataStr);
              //

              if (data.type === "status_update") {
                const accountName = data.accountName || "WhatsApp Account";
                const status = data.status;
                const previousStatus = data.previousStatus;

                // Show toast notification for status changes
                if (status === "CONNECTED" && previousStatus !== "CONNECTED") {
                  toastService.success(`${accountName} is now connected`, {
                    duration: 3000,
                    position: "bottom-right",
                  });
                } else if (
                  status === "DISCONNECTED" &&
                  previousStatus !== "DISCONNECTED"
                ) {
                  toastService.error(`${accountName} has been disconnected`, {
                    duration: 5000,
                    position: "bottom-right",
                  });
                } else if (status === "QR_READY") {
                  toastService.info(`QR code ready for ${accountName}`, {
                    duration: 3000,
                    position: "bottom-right",
                  });
                } else if (status === "CONNECTING") {
                  toastService.info(`Connecting ${accountName}...`, {
                    duration: 2000,
                    position: "bottom-right",
                  });
                }
              } else if (data.type === "connection_error") {
                const accountName = data.accountName || "WhatsApp Account";
                const error = data.error || "Unknown error";

                toastService.error(
                  `Connection error for ${accountName}: ${error}`,
                  {
                    duration: 5000,
                    position: "bottom-right",
                  }
                );
              }
            } catch (error) {}
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          // Reset subscription state on error
          isSubscribedRef.current = false;
        }
      }
    })();

    isSubscribedRef.current = true;
  }, [user, selectedOrganization, selectedWorkspace]);

  const unsubscribeFromStatusUpdates = () => {
    if (abortControllerRef.current) {
      //
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    isSubscribedRef.current = false;
  };

  // Auto-subscribe when component mounts
  useEffect(() => {
    // Small delay to ensure auth is ready, then try to subscribe
    // This is optional functionality, so we don't want to block the app if it fails
    const timer = setTimeout(() => {
      try {
        subscribeToStatusUpdates();
      } catch (error) {}
    }, 1000);

    // Set up periodic retry for failed connections
    const retryInterval = setInterval(() => {
      if (!isSubscribedRef.current) {
        const token = localStorage.getItem("crm_access_token");
        if (token && user && selectedOrganization && selectedWorkspace) {
          try {
            subscribeToStatusUpdates();
          } catch (error) {}
        }
      }
    }, 30000); // Retry every 30 seconds

    return () => {
      clearTimeout(timer);
      clearInterval(retryInterval);
      unsubscribeFromStatusUpdates();
    };
  }, [user, selectedOrganization, selectedWorkspace, subscribeToStatusUpdates]);

  const value: GlobalWhatsAppStatusContextType = {
    subscribeToStatusUpdates,
    unsubscribeFromStatusUpdates,
  };

  return (
    <GlobalWhatsAppStatusContext.Provider value={value}>
      {children}
    </GlobalWhatsAppStatusContext.Provider>
  );
};

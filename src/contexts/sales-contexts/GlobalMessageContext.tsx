"use client";
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

interface GlobalMessageContextType {
  subscribeToMessages: () => void;
  unsubscribeFromMessages: () => void;
}

const GlobalMessageContext = createContext<
  GlobalMessageContextType | undefined
>(undefined);

export const useGlobalMessages = () => {
  const context = useContext(GlobalMessageContext);
  if (context === undefined) {
    throw new Error(
      "useGlobalMessages must be used within a GlobalMessageProvider"
    );
  }
  return context;
};

interface GlobalMessageProviderProps {
  children: React.ReactNode;
}

export const GlobalMessageProvider: React.FC<GlobalMessageProviderProps> = ({
  children,
}) => {
  const { user } = useAuth();
  const { selectedOrganization, selectedWorkspace } = useWorkspace();
  const abortControllerRef = useRef<AbortController | null>(null);
  const isSubscribedRef = useRef(false);

  const subscribeToMessages = useCallback(() => {
    if (isSubscribedRef.current) return;

    // Check if SSE is disabled via environment variable
    if (process.env.NEXT_PUBLIC_DISABLE_SSE === "true") {
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
    const sseUrl = `${base.replace(/\/$/, "")}/whatsapp/accounts/message-updates?organizationId=${organizationId}&workspaceId=${workspaceId}`;

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

              if (data.type === "message_update") {
                // Only show notifications if we're not in the inbox view
                if (!window.location.pathname.includes("/inbox")) {
                  // Show toast notification for new messages
                  const fromName = data.fromName || "Contact";
                  const preview =
                    data.content?.substring(0, 50) +
                    (data.content?.length > 50 ? "..." : "");

                  toastService.success(
                    `New message from ${fromName}: ${preview}`,
                    {
                      duration: 5000,
                      position: "bottom-right",
                    }
                  );

                  // Play notification sound
                  playNotificationSound();
                }
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

  const unsubscribeFromMessages = () => {
    if (abortControllerRef.current) {
      //
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    isSubscribedRef.current = false;
  };

  // Function to play notification sound
  const playNotificationSound = () => {
    try {
      // Create audio context for notification sound
      const audioContext = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Configure sound
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // 800Hz tone
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime); // 30% volume
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.1
      );

      // Play sound
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);

      //
    } catch (error) {}
  };

  // Auto-subscribe when component mounts
  useEffect(() => {
    // Small delay to ensure auth is ready, then try to subscribe
    // This is optional functionality, so we don't want to block the app if it fails
    const timer = setTimeout(() => {
      try {
        subscribeToMessages();
      } catch (error) {}
    }, 1000);

    // Set up periodic retry for failed connections
    const retryInterval = setInterval(() => {
      if (!isSubscribedRef.current) {
        const token = localStorage.getItem("crm_access_token");
        if (token && user && selectedOrganization && selectedWorkspace) {
          try {
            subscribeToMessages();
          } catch (error) {}
        }
      }
    }, 30000); // Retry every 30 seconds

    return () => {
      clearTimeout(timer);
      clearInterval(retryInterval);
      unsubscribeFromMessages();
    };
  }, [user, selectedOrganization, selectedWorkspace, subscribeToMessages]);

  const value: GlobalMessageContextType = {
    subscribeToMessages,
    unsubscribeFromMessages,
  };

  return (
    <GlobalMessageContext.Provider value={value}>
      {children}
    </GlobalMessageContext.Provider>
  );
};

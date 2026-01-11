"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { io, Socket } from "socket.io-client";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  subscribeToIntegration: (
    integrationId: string,
    callback: (data: any) => void
  ) => void;
  subscribeToDebugUrl: (
    integrationId: string,
    callback: (data: any) => void
  ) => void;
  unsubscribeFromIntegration: (integrationId: string) => void;
  subscribeToMessages: (callback: (data: any) => void) => void;
  unsubscribeFromMessages: (callback: (data: any) => void) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

interface SocketProviderProps {
  children: React.ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Use ref to avoid closure issues with event listeners
  const subscriptionsRef = useRef<Map<string, (data: any) => void>>(new Map());
  const debugUrlSubscriptionsRef = useRef<Map<string, (data: any) => void>>(
    new Map()
  );
  const messageSubscribersRef = useRef<Set<(data: any) => void>>(new Set());

  useEffect(() => {
    // Initialize socket connection to Next.js backend Socket.IO relay
    // Next.js relay will forward events to/from White Walker worker service
    const newSocket = io({
      path: "/api/socket",
      transports: ["websocket", "polling"],
      timeout: 10000,
      forceNew: true,
      autoConnect: true, // Auto-connect on initialization
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      auth: {
        token: "test-token-123", // TODO: Replace with actual JWT token from auth context
      },
    });

    newSocket.on("connect", () => {
      setIsConnected(true);
    });

    newSocket.on("disconnect", reason => {
      console.log("❌ Socket disconnected from Next.js relay:", reason);
      setIsConnected(false);
    });

    newSocket.on("connect_error", error => {
      console.error("⚠️ Socket connection failed:", error.message);
      console.error("   Make sure Next.js dev server is running");
      setIsConnected(false);
    });

    newSocket.on("reconnect", attemptNumber => {
      console.log(`✅ Socket reconnected after ${attemptNumber} attempts`);
    });

    newSocket.on("reconnect_attempt", attemptNumber => {
      console.log(`🔄 Reconnection attempt ${attemptNumber}...`);
    });

    // Listen for authentication progress updates
    newSocket.on("auth:progress", data => {
      console.log("📨 Auth progress update received:", data);

      // Call the callback for this integration
      const callback = subscriptionsRef.current.get(data.integrationId);
      if (callback) {
        console.log(
          `📨 Calling callback for integration: ${data.integrationId}`
        );
        callback(data);
      } else {
        console.warn(
          `⚠️ No callback registered for integration: ${data.integrationId}`
        );
      }
    });

    // Listen for debug URLs (for captcha solving)
    newSocket.on("debug-url", data => {
      // Call the debug-url callback for this integration
      const callback = debugUrlSubscriptionsRef.current.get(data.integrationId);
      if (callback) {
        console.log(
          `🔧 Calling debug-url callback for integration: ${data.integrationId}`
        );
        callback(data);
      } else {
        console.warn(
          `⚠️ No debug-url callback registered for integration: ${data.integrationId}`
        );
      }
    });

    // Listen for test events (for testing)
    newSocket.on("test-event", data => {
      console.log("🧪 Test event received:", data);
    });

    // Listen for new messages
    newSocket.on("message:received", data => {
      console.log("📨 Message received:", data);
      messageSubscribersRef.current.forEach(callback => callback(data));
    });

    // Listen for errors
    newSocket.on("error", error => {
      console.error("🚨 Socket error:", error);
    });

    setSocket(newSocket);

    return () => {
      console.log("👋 Closing socket connection");
      newSocket.close();
    };
  }, []);

  const subscribeToIntegration = useCallback(
    (integrationId: string, callback: (data: any) => void) => {
      if (!socket) {
        console.warn("⚠️ Cannot subscribe: Socket not initialized");
        return;
      }

      // Store the callback
      subscriptionsRef.current.set(integrationId, callback);

      if (!socket.connected) {
        console.warn(
          "⚠️ Socket not connected yet. Will join room when connected."
        );
        return;
      }

      // Join the integration-specific room on the server
      socket.emit("join-room", {
        integrationId: integrationId,
        userId: "frontend-user", // TODO: Replace with actual user ID from auth context
        tenantId: "frontend-tenant", // TODO: Replace with actual tenant ID from auth context
      });

      console.log(`✅ Joined room: integration:${integrationId}`);
    },
    [socket]
  );

  const subscribeToDebugUrl = useCallback(
    (integrationId: string, callback: (data: any) => void) => {
      if (!socket) {
        console.warn(
          "⚠️ Cannot subscribe to debug-url: Socket not initialized"
        );
        return;
      }

      // Store the debug-url callback
      debugUrlSubscriptionsRef.current.set(integrationId, callback);

      if (!socket.connected) {
        console.warn(
          "⚠️ Socket not connected yet. Will join room when connected."
        );
        return;
      }

      // Join the integration-specific room on the server (if not already joined)
      socket.emit("join-room", {
        integrationId: integrationId,
        userId: "frontend-user", // TODO: Replace with actual user ID from auth context
        tenantId: "frontend-tenant", // TODO: Replace with actual tenant ID from auth context
      });

      console.log(`✅ Joined room for debug-url: integration:${integrationId}`);
    },
    [socket]
  );

  const unsubscribeFromIntegration = useCallback(
    (integrationId: string) => {
      if (!socket) return;

      console.log(`🔌 Unsubscribing from integration: ${integrationId}`);

      // Remove the callbacks
      subscriptionsRef.current.delete(integrationId);
      debugUrlSubscriptionsRef.current.delete(integrationId);

      // Note: Socket.IO rooms are automatically left when the client disconnects
      // We don't have a "leave-room" event on the server, so we just remove the callback
      console.log(`✅ Unsubscribed from integration: ${integrationId}`);
    },
    [socket]
  );

  const subscribeToMessages = useCallback((callback: (data: any) => void) => {
    messageSubscribersRef.current.add(callback);
  }, []);

  const unsubscribeFromMessages = useCallback(
    (callback: (data: any) => void) => {
      messageSubscribersRef.current.delete(callback);
    },
    []
  );

  const value: SocketContextType = {
    socket,
    isConnected,
    subscribeToIntegration,
    subscribeToDebugUrl,
    unsubscribeFromIntegration,
    subscribeToMessages,
    unsubscribeFromMessages,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
}

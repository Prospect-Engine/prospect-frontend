/**
 * Socket.IO Relay Server
 *
 * Architecture:
 * Browser (with access_token cookie) ←→ Next.js Socket Server ←→ White Walker Worker Socket (:7645)
 *
 * This API route creates a Socket.IO server that:
 * 1. Accepts connections from browser clients (extracts JWT from cookies)
 * 2. Maintains a persistent connection to White Walker worker service
 * 3. Relays authentication progress events bidirectionally
 * 4. Forwards JWT authentication to White Walker for validation
 *
 * Benefits:
 * - No CORS issues (browser connects to same origin)
 * - JWT automatically sent via HTTP-only cookies
 * - Next.js extracts and forwards to White Walker
 * - Clean separation of concerns
 */

import { Server as NetServer } from "http";
import { NextApiRequest, NextApiResponse } from "next";
import { Server as SocketIOServer } from "socket.io";
import { Socket as SocketIOClient, io as ioClient } from "socket.io-client";

// Augment NextApiResponse to include socket server
export type NextApiResponseServerIO = NextApiResponse & {
  socket: {
    server: NetServer & {
      io?: SocketIOServer;
    };
  };
};

// White Walker worker configuration
const GRAY_EAGLE_URL =
  process.env.GRAY_EAGLE_SOCKET_URL || "http://localhost:7645";
const GRAY_EAGLE_NAMESPACE = "/auth-progress";

// Store persistent connection to White Walker per user token
const whiteWalkerConnections = new Map<string, SocketIOClient>();

/**
 * Parse cookie string and extract specific cookie value
 */
function parseCookie(
  cookieString: string | undefined,
  cookieName: string
): string | null {
  if (!cookieString) return null;

  const cookies = cookieString.split(";");
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === cookieName) {
      return value;
    }
  }
  return null;
}

/**
 * Get or create White Walker connection for a specific user token
 * Maintains one connection per unique JWT token for proper auth
 */
function getWhiteWalkerConnection(
  io: SocketIOServer,
  accessToken: string
): SocketIOClient {
  // Check if we already have a connection for this token
  const existingConnection = whiteWalkerConnections.get(accessToken);
  if (existingConnection?.connected) {
    console.log("[Socket Relay] Reusing existing White Walker connection");
    return existingConnection;
  }

  console.log(
    `[Socket Relay] Creating new White Walker connection with JWT auth...`
  );

  const whiteWalkerClient = ioClient(
    `${GRAY_EAGLE_URL}${GRAY_EAGLE_NAMESPACE}`,
    {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
      transports: ["websocket", "polling"],
      auth: {
        token: accessToken, // Forward JWT from browser cookie
      },
    }
  );

  whiteWalkerClient.on("connect", () => {
    console.log(
      `[Socket Relay] ✅ Connected to White Walker: ${whiteWalkerClient.id}`
    );
  });

  whiteWalkerClient.on("disconnect", reason => {
    console.log(`[Socket Relay] ❌ Disconnected from White Walker: ${reason}`);
    // Remove from cache on disconnect
    whiteWalkerConnections.delete(accessToken);
  });

  whiteWalkerClient.on("connect_error", error => {
    console.error(
      "[Socket Relay] White Walker connection error:",
      error.message
    );
  });

  // Relay events from White Walker to all browser clients
  whiteWalkerClient.on("auth:progress", (data: any) => {
    console.log(
      "[Socket Relay] 📨 Relaying auth:progress from White Walker to browsers:",
      data.integrationId,
      data.step
    );

    // Broadcast to all clients in the specific integration room
    const room = `integration:${data.integrationId}`;
    io.to(room).emit("auth:progress", data);
  });

  whiteWalkerClient.on("debug-url", (data: any) => {
    console.log(
      "[Socket Relay] 📨 Relaying debug-url from White Walker to browsers:",
      data.integrationId
    );

    const room = `integration:${data.integrationId}`;
    io.to(room).emit("debug-url", data);
  });

  whiteWalkerClient.on("mock-auth-ack", (data: any) => {
    console.log("[Socket Relay] 📨 Relaying mock-auth-ack from White Walker");
    // Broadcast to all clients
    io.emit("mock-auth-ack", data);
  });

  // Cache the connection
  whiteWalkerConnections.set(accessToken, whiteWalkerClient);

  return whiteWalkerClient;
}

/**
 * Socket.IO API Route Handler
 */
export default function handler(
  req: NextApiRequest,
  res: NextApiResponseServerIO
) {
  // Check if Socket.IO server is already initialized
  if (res.socket.server.io) {
    console.log("[Socket Relay] Socket.IO server already running");
    res.end();
    return;
  }

  console.log(
    "[Socket Relay] Initializing Socket.IO server with JWT authentication..."
  );

  // Initialize Socket.IO server
  const io = new SocketIOServer(res.socket.server, {
    path: "/api/socket",
    addTrailingSlash: false,
    cors: {
      origin: "*", // In production, restrict to your frontend domain
      methods: ["GET", "POST"],
      credentials: true, // Allow cookies
    },
  });

  res.socket.server.io = io;

  // Middleware: Extract JWT from cookies and authenticate
  io.use(async (socket, next) => {
    try {
      // Extract access_token cookie from Socket.IO handshake
      const cookieString = socket.request.headers.cookie;
      const accessToken = parseCookie(cookieString, "access_token");

      if (!accessToken) {
        console.log("[Socket Relay] ❌ No access_token cookie found");
        return next(
          new Error("Authentication required - no access_token cookie")
        );
      }

      console.log("[Socket Relay] ✅ JWT extracted from cookie");

      // Store token in socket data for later use
      socket.data.accessToken = accessToken;

      // Get or create White Walker connection with this token
      const whiteWalkerClient = getWhiteWalkerConnection(io, accessToken);
      socket.data.whiteWalkerClient = whiteWalkerClient;

      next();
    } catch (error) {
      console.error("[Socket Relay] Authentication error:", error);
      next(new Error("Authentication failed"));
    }
  });

  // Handle browser client connections
  io.on("connection", clientSocket => {
    console.log(
      `[Socket Relay] 🔌 Browser client connected (authenticated): ${clientSocket.id}`
    );

    const whiteWalkerClient = clientSocket.data
      .whiteWalkerClient as SocketIOClient;

    // Handle room joining
    clientSocket.on("join-room", (data: { integrationId: string }) => {
      const room = `integration:${data.integrationId}`;
      clientSocket.join(room);

      console.log(
        `[Socket Relay] 📍 Browser client ${clientSocket.id} joined room: ${room}`
      );

      // Forward join-room to White Walker (with JWT authentication)
      if (whiteWalkerClient?.connected) {
        whiteWalkerClient.emit("join-room", data);
        console.log(
          `[Socket Relay] 📍 Forwarded join-room to White Walker: ${room}`
        );
      } else {
        console.warn(
          "[Socket Relay] ⚠️ White Walker not connected yet, will join when connected"
        );
      }
    });

    // Relay mock auth events from browser to White Walker
    clientSocket.on("trigger-mock-auth", (data: any) => {
      console.log(
        "[Socket Relay] 📤 Relaying trigger-mock-auth from browser to White Walker:",
        data.integrationId,
        data.step
      );

      if (whiteWalkerClient?.connected) {
        whiteWalkerClient.emit("trigger-mock-auth", data);
      } else {
        console.error(
          "[Socket Relay] ❌ Cannot relay: White Walker not connected"
        );
        clientSocket.emit("error", {
          message: "White Walker service not available",
        });
      }
    });

    // Relay test event requests from browser to White Walker
    clientSocket.on("request-test-event", (data: any) => {
      console.log(
        "[Socket Relay] 📤 Relaying request-test-event from browser to White Walker:",
        data.integrationId
      );

      if (whiteWalkerClient?.connected) {
        whiteWalkerClient.emit("request-test-event", data);
      } else {
        console.error(
          "[Socket Relay] ❌ Cannot relay: White Walker not connected"
        );
        clientSocket.emit("error", {
          message: "White Walker service not available",
        });
      }
    });

    // Handle disconnection
    clientSocket.on("disconnect", reason => {
      console.log(
        `[Socket Relay] 🔌 Browser client disconnected: ${clientSocket.id} (${reason})`
      );
    });
  });

  console.log(
    "[Socket Relay] ✅ Socket.IO server initialized with JWT authentication"
  );
  res.end();
}

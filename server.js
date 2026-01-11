/**
 * Custom Next.js Server with Socket.IO Support
 *
 * This custom server initializes Socket.IO on startup and integrates with Next.js.
 * Required because Socket.IO needs to attach to the HTTP server before Next.js handles routes.
 *
 * Usage: node server.js
 */
require('dotenv').config();
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server: SocketIOServer } = require('socket.io');
const { io: ioClient } = require('socket.io-client');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0'; // 0.0.0.0 for production, allows external access
const port = parseInt(process.env.PORT || '3000', 10);

// Initialize Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// White Walker configuration
const WHITE_WALKER_URL = process.env.NEXT_PUBLIC_WHITE_WALKER_SOCKET_URL;
const WHITE_WALKER_NAMESPACE = '/auth-progress';

// Store White Walker connections per token
const whiteWalkerConnections = new Map();

/**
 * Parse cookie string to extract specific cookie
 */
function parseCookie(cookieString, cookieName) {
  if (!cookieString) return null;

  const cookies = cookieString.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === cookieName) {
      return value;
    }
  }
  return null;
}

/**
 * Get or create White Walker connection with JWT
 */
function getWhiteWalkerConnection(io, accessToken) {
  const existing = whiteWalkerConnections.get(accessToken);
  if (existing?.connected) {
    console.log('[Socket Server] Reusing White Walker connection');
    return existing;
  }

  console.log('[Socket Server] Creating White Walker connection with JWT...');

  const client = ioClient(`${WHITE_WALKER_URL}${WHITE_WALKER_NAMESPACE}`, {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
    transports: ['websocket', 'polling'],
    auth: { token: accessToken },
  });

  client.on('connect', () => {
    console.log(`[Socket Server] ✅ White Walker connected: ${client.id}`);
  });

  client.on('disconnect', (reason) => {
    console.log(`[Socket Server] ❌ White Walker disconnected: ${reason}`);
    whiteWalkerConnections.delete(accessToken);
  });

  client.on('connect_error', (error) => {
    console.error('[Socket Server] White Walker error:', error.message);
  });

  // Relay auth:progress events to browser clients
  client.on('auth:progress', (data) => {
    console.log(`[Socket Server] 📨 Relay auth:progress: ${data.integrationId} - ${data.step}`);
    const room = `integration:${data.integrationId}`;
    io.to(room).emit('auth:progress', data);
  });

  // Relay debug-url events
  client.on('debug-url', (data) => {
    console.log(`[Socket Server] 📨 Relay debug-url: ${data.integrationId}`);
    const room = `integration:${data.integrationId}`;
    io.to(room).emit('debug-url', data);
  });

  // Relay mock acknowledgments
  client.on('mock-auth-ack', (data) => {
    console.log('[Socket Server] 📨 Relay mock-auth-ack');
    io.emit('mock-auth-ack', data);
  });

  whiteWalkerConnections.set(accessToken, client);
  return client;
}

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error handling request', err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  });

  // Initialize Socket.IO
  const io = new SocketIOServer(httpServer, {
    path: '/api/socket',
    addTrailingSlash: false,
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  console.log('[Socket Server] Initializing Socket.IO server with JWT authentication...');

  // Socket.IO authentication middleware
  io.use(async (socket, next) => {
    try {
      // Extract access_token from cookies
      const cookieString = socket.request.headers.cookie;
      const accessToken = parseCookie(cookieString, 'access_token');

      if (!accessToken) {
        console.log(`[Socket Server] ❌ Client ${socket.id} - No access_token cookie`);
        return next(new Error('Authentication required'));
      }

      console.log(`[Socket Server] ✅ Client ${socket.id} - JWT extracted from cookie`);

      // Store token and create White Walker connection
      socket.data.accessToken = accessToken;
      socket.data.whiteWalkerClient = getWhiteWalkerConnection(io, accessToken);

      next();
    } catch (error) {
      console.error('[Socket Server] Auth error:', error);
      next(new Error('Authentication failed'));
    }
  });

  // Handle browser client connections
  io.on('connection', (socket) => {
    console.log(`[Socket Server] 🔌 Browser connected (authenticated): ${socket.id}`);

    const whiteWalkerClient = socket.data.whiteWalkerClient;

    // Handle room joining
    socket.on('join-room', (data) => {
      const room = `integration:${data.integrationId}`;
      socket.join(room);
      console.log(`[Socket Server] 📍 Browser ${socket.id} joined: ${room}`);

      // Forward to White Walker
      if (whiteWalkerClient?.connected) {
        whiteWalkerClient.emit('join-room', data);
        console.log(`[Socket Server] 📍 Forwarded join-room to White Walker`);
      }
    });

    // Relay mock auth
    socket.on('trigger-mock-auth', (data) => {
      console.log(`[Socket Server] 📤 Relay trigger-mock-auth: ${data.integrationId}`);
      if (whiteWalkerClient?.connected) {
        whiteWalkerClient.emit('trigger-mock-auth', data);
      }
    });

    // Relay test events
    socket.on('request-test-event', (data) => {
      console.log(`[Socket Server] 📤 Relay request-test-event: ${data.integrationId}`);
      if (whiteWalkerClient?.connected) {
        whiteWalkerClient.emit('request-test-event', data);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket Server] 🔌 Browser ${socket.id} disconnected: ${reason}`);
    });
  });

  // Start server
  httpServer
    .once('error', (err) => {
      console.error('Server error:', err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`[Next.js] ✅ Server ready on http://${hostname}:${port}`);
      console.log(`[Socket.IO] ✅ Server ready on path /api/socket`);
      console.log(`[Socket.IO] 🔗 Relay to White Walker: ${WHITE_WALKER_URL}${WHITE_WALKER_NAMESPACE}`);
    });
});

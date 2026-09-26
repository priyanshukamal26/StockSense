import { Server as SocketIOServer } from "socket.io";
import { Server as HttpServer } from "http";
import { verifyAccessToken } from "../lib/jwt";

let io: SocketIOServer | null = null;

export function initSocket(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL ?? "http://localhost:3000",
      credentials: true,
    },
  });

  // Auth middleware for socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      return next(new Error("Authentication required"));
    }
    try {
      const payload = verifyAccessToken(token);
      socket.data.user = payload;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.data.user;
    console.info(`[Socket] User connected: ${user?.loginId} (${socket.id})`);

    // Join a room per user so we can emit targeted notifications
    if (user?.sub) {
      void socket.join(`user:${user.sub}`);
    }

    socket.on("disconnect", () => {
      console.info(`[Socket] User disconnected: ${user?.loginId}`);
    });
  });

  return io;
}

export function getSocket(): SocketIOServer {
  if (!io) throw new Error("Socket.IO not initialized");
  return io;
}

/**
 * Emit a notification to a specific user (or broadcast to all if userId is null)
 */
export function emitNotification(
  userId: string | null,
  notification: unknown
): void {
  if (!io) return;
  if (userId) {
    io.to(`user:${userId}`).emit("notification:new", notification);
  } else {
    io.emit("notification:new", notification);
  }
}

/**
 * Emit a stock update signal so the frontend invalidates its cache
 */
export function emitStockUpdated(productId: string, locationId: string): void {
  if (!io) return;
  io.emit("stock:updated", { productId, locationId });
}

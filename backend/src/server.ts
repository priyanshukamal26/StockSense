import "dotenv/config";
import http from "http";
import app from "./app";
import { initSocket } from "./common/realtime/socket";
import { initCronJobs } from "./common/lib/cron";
import prisma from "./common/lib/prisma";

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;

const httpServer = http.createServer(app);
initSocket(httpServer);
initCronJobs();

async function main() {
  try {
    await prisma.$connect();
    console.info(`[DB] Connected to PostgreSQL via Prisma`);
  } catch (err) {
    console.error("[DB] Failed to connect:", err);
    process.exit(1);
  }

  httpServer.listen(PORT, () => {
    console.info(`[Server] StockSense API running on http://localhost:${PORT}`);
    console.info(`[Server] Environment: ${process.env.NODE_ENV ?? "development"}`);
  });

  // Graceful shutdown
  process.on("SIGTERM", async () => {
    console.info("[Server] SIGTERM received — shutting down gracefully");
    await prisma.$disconnect();
    httpServer.close(() => {
      console.info("[Server] Closed");
      process.exit(0);
    });
  });
}

main();

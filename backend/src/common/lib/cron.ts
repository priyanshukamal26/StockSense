import cron from "node-cron";
import prisma from "./prisma";
import { emitNotification } from "../realtime/socket";
import { NotificationType, OperationStatus } from "@prisma/client";

/**
 * Initializes scheduled background jobs (Phase 9.3 - Aditya Kumar).
 * Daily late operations digest: runs at 00:00 every day, finds pending operations
 * past their scheduled date, logs count and emits real-time alert.
 */
export function initCronJobs() {
  // Run every day at midnight: '0 0 * * *'
  // In development, also runs once shortly after startup
  cron.schedule("0 0 * * *", async () => {
    await checkLateOperationsDigest();
  });

  console.info("[Cron] Background cron jobs initialized (daily late operations digest).");
}

export async function checkLateOperationsDigest() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lateOperations = await prisma.operation.findMany({
      where: {
        status: {
          notIn: [OperationStatus.DONE, OperationStatus.CANCELLED],
        },
        scheduledDate: {
          lt: today,
        },
      },
      include: {
        responsible: { select: { id: true, fullName: true } },
      },
    });

    if (lateOperations.length === 0) return;

    const message = `Daily Digest: ${lateOperations.length} operation(s) are currently late and require attention.`;

    // Create system notification for late operations
    const notification = await prisma.notification.create({
      data: {
        type: NotificationType.OPERATION_LATE,
        title: "Late Operations Alert",
        message,
      },
    });

    emitNotification(null, {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      createdAt: notification.createdAt.toISOString(),
      isRead: false,
    });

    console.info(`[Cron] Emitted late operations digest for ${lateOperations.length} operations.`);
  } catch (err) {
    console.error("[Cron] Error checking late operations digest:", err);
  }
}

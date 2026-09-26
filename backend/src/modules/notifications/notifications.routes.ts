import { Router } from "express";
import { requireAuth } from "../../common/middleware/auth-guard";
import prisma from "../../common/lib/prisma";

export const notificationsRouter = Router();
notificationsRouter.use(requireAuth);

// GET /notifications
notificationsRouter.get("/", async (req, res, next) => {
  try {
    const { isRead } = req.query as Record<string, string>;
    const userId = req.user!.sub;

    const where: Record<string, unknown> = {
      OR: [{ userId }, { userId: null }],
    };
    if (isRead !== undefined) where.isRead = isRead === "true";

    const notifications = await prisma.notification.findMany({
      where,
      include: {
        referenceProduct: { select: { id: true, name: true, sku: true } },
        referenceOperation: { select: { id: true, reference: true, operationType: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: { OR: [{ userId }, { userId: null }], isRead: false },
    });

    res.json({ data: notifications, unreadCount });
  } catch (err) {
    next(err);
  }
});

// PATCH /notifications/read-all
notificationsRouter.patch("/read-all", async (req, res, next) => {
  try {
    const userId = req.user!.sub;
    await prisma.notification.updateMany({
      where: { OR: [{ userId }, { userId: null }], isRead: false },
      data: { isRead: true },
    });
    res.json({ message: "All notifications marked as read." });
  } catch (err) {
    next(err);
  }
});

// PATCH /notifications/:id/read
notificationsRouter.patch("/:id/read", async (req, res, next) => {
  try {
    const notification = await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true },
    });
    res.json({ notification });
  } catch (err) {
    next(err);
  }
});

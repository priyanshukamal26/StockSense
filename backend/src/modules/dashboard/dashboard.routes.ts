import { Router } from "express";
import { requireAuth } from "../../common/middleware/auth-guard";
import prisma from "../../common/lib/prisma";
import { OperationStatus } from "@prisma/client";

export const dashboardRouter = Router();
dashboardRouter.use(requireAuth);

const today = () => new Date(new Date().setHours(0, 0, 0, 0));

// GET /dashboard/summary
dashboardRouter.get("/summary", async (_req, res, next) => {
  try {
    const [
      totalProducts,
      lowStockCount,
      outOfStockCount,
      receiptStats,
      deliveryStats,
      transfersScheduled,
    ] = await Promise.all([
      prisma.product.count({ where: { isActive: true } }),

      // Low stock: on_hand <= reorder_point (and reorder_point > 0)
      prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(DISTINCT p.id)::bigint as count
        FROM products p
        JOIN stock_quantities sq ON sq.product_id = p.id
        WHERE p.is_active = true
          AND p.reorder_point > 0
          AND sq.on_hand_qty > 0
          AND sq.on_hand_qty <= p.reorder_point
      `.then((r) => Number(r[0]?.count ?? 0)),

      // Out of stock: on_hand = 0 across all locations
      prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(DISTINCT p.id)::bigint as count
        FROM products p
        WHERE p.is_active = true
          AND (
            SELECT COALESCE(SUM(sq.on_hand_qty), 0)
            FROM stock_quantities sq
            WHERE sq.product_id = p.id
          ) = 0
      `.then((r) => Number(r[0]?.count ?? 0)),

      // Receipt stats
      Promise.all([
        // toReceive: non-done/cancelled receipts
        prisma.operation.count({
          where: { operationType: "RECEIPT", status: { notIn: ["DONE", "CANCELLED"] } },
        }),
        // late: scheduledDate < today, status not done/cancelled
        prisma.operation.count({
          where: {
            operationType: "RECEIPT",
            status: { notIn: ["DONE", "CANCELLED"] },
            scheduledDate: { lt: today() },
          },
        }),
        // operations: scheduledDate >= today
        prisma.operation.count({
          where: {
            operationType: "RECEIPT",
            status: { notIn: ["DONE", "CANCELLED"] },
            scheduledDate: { gte: today() },
          },
        }),
      ]).then(([toReceive, late, operations]) => ({ toReceive, late, operations })),

      // Delivery stats
      Promise.all([
        prisma.operation.count({
          where: { operationType: "DELIVERY", status: { notIn: ["DONE", "CANCELLED"] } },
        }),
        prisma.operation.count({
          where: {
            operationType: "DELIVERY",
            status: { notIn: ["DONE", "CANCELLED"] },
            scheduledDate: { lt: today() },
          },
        }),
        prisma.operation.count({
          where: { operationType: "DELIVERY", status: "WAITING" },
        }),
        prisma.operation.count({
          where: {
            operationType: "DELIVERY",
            status: { notIn: ["DONE", "CANCELLED"] },
            scheduledDate: { gte: today() },
          },
        }),
      ]).then(([toDeliver, late, waiting, operations]) => ({ toDeliver, late, waiting, operations })),

      // Internal transfers scheduled (not done/cancelled, date >= today)
      prisma.operation.count({
        where: {
          operationType: "INTERNAL_TRANSFER",
          status: { notIn: ["DONE", "CANCELLED"] },
        },
      }),
    ]);

    res.json({
      totalProducts,
      lowStockCount,
      outOfStockCount,
      receipts: receiptStats,
      deliveries: deliveryStats,
      transfersScheduled,
    });
  } catch (err) {
    next(err);
  }
});

// GET /dashboard/filters
dashboardRouter.get("/filters", async (_req, res, next) => {
  try {
    const [warehouses, categories] = await Promise.all([
      prisma.warehouse.findMany({ select: { id: true, name: true, shortCode: true }, orderBy: { name: "asc" } }),
      prisma.productCategory.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    ]);

    res.json({
      operationTypes: ["RECEIPT", "DELIVERY", "INTERNAL_TRANSFER", "ADJUSTMENT"],
      statuses: ["DRAFT", "WAITING", "READY", "DONE", "CANCELLED"],
      warehouses,
      categories,
    });
  } catch (err) {
    next(err);
  }
});

import { Router } from "express";
import { requireAuth } from "../../common/middleware/auth-guard";
import { validate } from "../../common/middleware/validate";
import { AppError } from "../../common/middleware/error-handler";
import prisma from "../../common/lib/prisma";
import { z } from "zod";
import { emitStockUpdated, emitNotification } from "../../common/realtime/socket";
import { OperationType, OperationStatus } from "@prisma/client";

export const stockRouter = Router();
stockRouter.use(requireAuth);

// GET /stock — per-location availability
stockRouter.get("/", async (req, res, next) => {
  try {
    const { locationId, productId, warehouseId, page = "1", pageSize = "50" } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const take = Math.min(parseInt(pageSize), 100);

    const where: Record<string, unknown> = {};
    if (locationId) where.locationId = locationId;
    if (productId) where.productId = productId;
    if (warehouseId) where.location = { warehouseId };

    const [quantities, total] = await Promise.all([
      prisma.stockQuantity.findMany({
        where,
        include: {
          product: { include: { category: true } },
          location: { include: { warehouse: true } },
        },
        orderBy: [{ product: { name: "asc" } }, { location: { name: "asc" } }],
        skip,
        take,
      }),
      prisma.stockQuantity.count({ where }),
    ]);

    const data = quantities.map((sq) => ({
      id: sq.id,
      productId: sq.productId,
      product: sq.product,
      locationId: sq.locationId,
      location: sq.location,
      onHandQty: sq.onHandQty,
      reservedQty: sq.reservedQty,
      freeToUseQty: Number(sq.onHandQty) - Number(sq.reservedQty),
      costPerUnit: sq.product.costPerUnit,
      isLowStock: Number(sq.onHandQty) <= Number(sq.product.reorderPoint) && Number(sq.product.reorderPoint) > 0,
      updatedAt: sq.updatedAt,
    }));

    res.json({ data, meta: { page: parseInt(page), pageSize: take, total } });
  } catch (err) { next(err); }
});

// POST /stock/adjust — inline adjustment from Stock view
stockRouter.post(
  "/adjust",
  validate(z.object({
    productId: z.string().uuid(),
    locationId: z.string().uuid(),
    countedQty: z.number().min(0, "Counted quantity must be zero or greater."),
    reason: z.string().optional(),
  })),
  async (req, res, next) => {
    try {
      const { productId, locationId, countedQty, reason } = req.body;
      const userId = req.user!.sub;

      // Find current stock
      const current = await prisma.stockQuantity.findUnique({
        where: { productId_locationId: { productId, locationId } },
      });
      const currentQty = Number(current?.onHandQty ?? 0);
      const diff = countedQty - currentQty;

      if (diff === 0) {
        res.json({ message: "No change needed." });
        return;
      }

      // Get the warehouse for this location (to generate reference)
      const location = await prisma.location.findUniqueOrThrow({ where: { id: locationId } });
      const warehouseId = location.warehouseId;
      if (!warehouseId) throw AppError.conflict("Cannot adjust stock at a virtual location.");

      // Get the inventory_loss virtual location
      const inventoryLoss = await prisma.location.findFirst({
        where: { locationType: "INVENTORY_LOSS" },
      });
      const vendorLoc = await prisma.location.findFirst({
        where: { locationType: "VENDOR" },
      });

      const fromLocationId = diff > 0 ? vendorLoc!.id : locationId;
      const toLocationId = diff > 0 ? locationId : (inventoryLoss?.id ?? locationId);

      await prisma.$transaction(async (tx) => {
        // Generate reference
        const seq = await tx.referenceSequence.upsert({
          where: { warehouseId_operationType: { warehouseId, operationType: OperationType.ADJUSTMENT } },
          create: { warehouseId, operationType: OperationType.ADJUSTMENT, lastNumber: 1 },
          update: { lastNumber: { increment: 1 } },
        });
        const warehouse = await tx.warehouse.findUniqueOrThrow({ where: { id: warehouseId } });
        const ref = `${warehouse.shortCode}/ADJ/${String(seq.lastNumber).padStart(4, "0")}`;

        // Create operation
        const op = await tx.operation.create({
          data: {
            reference: ref,
            operationType: OperationType.ADJUSTMENT,
            sourceLocationId: fromLocationId,
            destinationLocationId: toLocationId,
            responsibleUserId: userId,
            scheduledDate: new Date(),
            status: OperationStatus.DONE,
            doneAt: new Date(),
            notes: reason,
            lines: {
              create: {
                productId,
                demandQty: Math.abs(diff),
                doneQty: Math.abs(diff),
              },
            },
          },
        });

        // Create stock move
        await tx.stockMove.create({
          data: {
            operationId: op.id,
            productId,
            fromLocationId,
            toLocationId,
            quantity: Math.abs(diff),
            createdById: userId,
          },
        });

        // Update stock quantity
        await tx.stockQuantity.upsert({
          where: { productId_locationId: { productId, locationId } },
          create: { productId, locationId, onHandQty: countedQty },
          update: { onHandQty: countedQty },
        });

        return op;
      });

      // Check for low stock
      const updated = await prisma.stockQuantity.findUnique({
        where: { productId_locationId: { productId, locationId } },
        include: { product: true },
      });
      if (updated && Number(updated.onHandQty) <= Number(updated.product.reorderPoint) && Number(updated.product.reorderPoint) > 0) {
        const notification = await prisma.notification.create({
          data: {
            type: Number(updated.onHandQty) === 0 ? "OUT_OF_STOCK" : "LOW_STOCK",
            title: `Low Stock: ${updated.product.name}`,
            message: `${updated.product.name} at ${locationId} has only ${updated.onHandQty} ${updated.product.unitOfMeasure} remaining (reorder point: ${updated.product.reorderPoint}).`,
            referenceProductId: productId,
          },
        });
        emitNotification(null, notification);
      }

      emitStockUpdated(productId, locationId);
      res.json({ message: "Stock adjusted successfully." });
    } catch (err) { next(err); }
  }
);

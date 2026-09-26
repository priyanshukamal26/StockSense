import { Router } from "express";
import { requireAuth, requireRole } from "../../common/middleware/auth-guard";
import { validate } from "../../common/middleware/validate";
import { AppError } from "../../common/middleware/error-handler";
import { UserRole } from "@prisma/client";
import prisma from "../../common/lib/prisma";
import { z } from "zod";

export const warehousesRouter = Router();
warehousesRouter.use(requireAuth);

const warehouseSchema = z.object({
  name: z.string().min(1, "Name is required.").max(100),
  shortCode: z
    .string()
    .min(1, "Short code is required.")
    .max(10, "Short code must be ≤10 characters.")
    .regex(/^[A-Z0-9]+$/, "Short code must be uppercase alphanumeric."),
  address: z.string().min(1, "Address is required."),
});

// GET /warehouses
warehousesRouter.get("/", async (_req, res, next) => {
  try {
    const warehouses = await prisma.warehouse.findMany({
      include: { _count: { select: { locations: true } } },
      orderBy: { createdAt: "asc" },
    });
    res.json({ data: warehouses, warehouses });
  } catch (err) { next(err); }
});

// POST /warehouses — INVENTORY_MANAGER or ADMIN
warehousesRouter.post(
  "/",
  requireRole([UserRole.ADMIN, UserRole.INVENTORY_MANAGER, UserRole.WAREHOUSE_STAFF]),
  validate(warehouseSchema),
  async (req, res, next) => {
    try {
      const warehouse = await prisma.warehouse.create({ data: req.body });
      res.status(201).json({ data: warehouse, warehouse });
    } catch (err) { next(err); }
  }
);

// GET /warehouses/:id
warehousesRouter.get("/:id", async (req, res, next) => {
  try {
    const warehouse = await prisma.warehouse.findUniqueOrThrow({
      where: { id: req.params.id },
      include: { locations: true },
    });
    res.json({ data: warehouse, warehouse });
  } catch (err) { next(err); }
});

// PATCH /warehouses/:id
warehousesRouter.patch(
  "/:id",
  requireRole([UserRole.ADMIN, UserRole.INVENTORY_MANAGER, UserRole.WAREHOUSE_STAFF]),
  validate(warehouseSchema.partial()),
  async (req, res, next) => {
    try {
      const warehouse = await prisma.warehouse.update({
        where: { id: req.params.id },
        data: req.body,
      });
      res.json({ data: warehouse, warehouse });
    } catch (err) { next(err); }
  }
);

// DELETE /warehouses/:id — blocks if referenced
warehousesRouter.delete(
  "/:id",
  requireRole([UserRole.ADMIN, UserRole.INVENTORY_MANAGER, UserRole.WAREHOUSE_STAFF]),
  async (req, res, next) => {
    try {
      // Check for open operations referencing this warehouse's locations
      const ops = await prisma.operation.count({
        where: {
          status: { notIn: ["DONE", "CANCELLED"] },
          OR: [
            { sourceLocation: { warehouseId: req.params.id } },
            { destinationLocation: { warehouseId: req.params.id } },
          ],
        },
      });
      if (ops > 0) {
        throw AppError.conflict(
          "Can't delete — this warehouse has existing stock or operations."
        );
      }
      await prisma.warehouse.delete({ where: { id: req.params.id } });
      res.status(204).send();
    } catch (err) { next(err); }
  }
);

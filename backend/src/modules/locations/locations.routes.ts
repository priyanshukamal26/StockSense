import { Router } from "express";
import { requireAuth, requireRole } from "../../common/middleware/auth-guard";
import { validate } from "../../common/middleware/validate";
import { AppError } from "../../common/middleware/error-handler";
import { UserRole, LocationType } from "@prisma/client";
import prisma from "../../common/lib/prisma";
import { z } from "zod";

export const locationsRouter = Router();
locationsRouter.use(requireAuth);

const locationSchema = z.object({
  name: z.string().min(1, "Name is required.").max(100),
  shortCode: z
    .string()
    .min(1, "Short code is required.")
    .max(20, "Short code must be ≤20 characters."),
  warehouseId: z.string().uuid("Invalid warehouse ID.").nullable().optional(),
  locationType: z.nativeEnum(LocationType).optional(),
});

// GET /locations — supports ?warehouseId=
locationsRouter.get("/", async (req, res, next) => {
  try {
    const where = req.query.warehouseId
      ? { warehouseId: req.query.warehouseId as string }
      : undefined;
    const locations = await prisma.location.findMany({
      where,
      include: { warehouse: { select: { id: true, name: true, shortCode: true } } },
      orderBy: { name: "asc" },
    });
    res.json({ data: locations });
  } catch (err) { next(err); }
});

// POST /locations
locationsRouter.post(
  "/",
  requireRole([UserRole.ADMIN, UserRole.INVENTORY_MANAGER]),
  validate(locationSchema),
  async (req, res, next) => {
    try {
      const location = await prisma.location.create({ data: req.body });
      res.status(201).json({ location });
    } catch (err) { next(err); }
  }
);

// GET /locations/:id
locationsRouter.get("/:id", async (req, res, next) => {
  try {
    const location = await prisma.location.findUniqueOrThrow({
      where: { id: req.params.id },
      include: { warehouse: true },
    });
    res.json({ location });
  } catch (err) { next(err); }
});

// PATCH /locations/:id
locationsRouter.patch(
  "/:id",
  requireRole([UserRole.ADMIN, UserRole.INVENTORY_MANAGER]),
  validate(locationSchema.partial()),
  async (req, res, next) => {
    try {
      const location = await prisma.location.update({
        where: { id: req.params.id },
        data: req.body,
      });
      res.json({ location });
    } catch (err) { next(err); }
  }
);

// DELETE /locations/:id — blocks if stock or open operations reference it
locationsRouter.delete(
  "/:id",
  requireRole([UserRole.ADMIN, UserRole.INVENTORY_MANAGER]),
  async (req, res, next) => {
    try {
      const [stockCount, opCount] = await Promise.all([
        prisma.stockQuantity.count({
          where: { locationId: req.params.id, onHandQty: { gt: 0 } },
        }),
        prisma.operation.count({
          where: {
            status: { notIn: ["DONE", "CANCELLED"] },
            OR: [
              { sourceLocationId: req.params.id },
              { destinationLocationId: req.params.id },
            ],
          },
        }),
      ]);

      if (stockCount > 0 || opCount > 0) {
        throw AppError.conflict(
          "Can't delete — this location has existing stock or operations."
        );
      }

      await prisma.location.delete({ where: { id: req.params.id } });
      res.status(204).send();
    } catch (err) { next(err); }
  }
);

import { Router } from "express";
import { requireAuth, requireRole } from "../../common/middleware/auth-guard";
import { validate } from "../../common/middleware/validate";
import { AppError } from "../../common/middleware/error-handler";
import { UserRole, LocationType } from "@prisma/client";
import prisma from "../../common/lib/prisma";
import { z } from "zod";
import { Decimal } from "@prisma/client/runtime/library";

export const productsRouter = Router();
productsRouter.use(requireAuth);

const productSchema = z.object({
  sku: z.string().min(1, "SKU is required.").max(30),
  name: z.string().min(1, "Name is required.").max(200),
  categoryId: z.string().uuid("Invalid category ID."),
  unitOfMeasure: z.string().min(1, "Unit of measure is required.").max(20),
  costPerUnit: z.number().nonnegative("Cost must be zero or positive."),
  reorderPoint: z.number().min(0, "Reorder point must be zero or greater.").default(0),
  reorderQty: z.number().min(0, "Reorder quantity must be zero or greater.").default(0),
  initialStock: z
    .union([
      z.number(),
      z.object({
        locationId: z.string().uuid().optional(),
        qty: z.number(),
      }),
    ])
    .optional()
    .nullable(),
});

// GET /products — supports ?search=&categoryId=&isActive=
productsRouter.get("/", async (req, res, next) => {
  try {
    const { search, categoryId, isActive, page = "1", pageSize = "20" } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const take = Math.min(parseInt(pageSize), 100);

    const where: Record<string, unknown> = {};
    if (isActive !== undefined) where.isActive = isActive === "true";
    else where.isActive = true;
    if (categoryId) where.categoryId = categoryId;
    if (search) {
      where.OR = [
        { sku: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: true },
        orderBy: { name: "asc" },
        skip,
        take,
      }),
      prisma.product.count({ where }),
    ]);

    res.json({ data: products, meta: { page: parseInt(page), pageSize: take, total } });
  } catch (err) { next(err); }
});

// POST /products
productsRouter.post(
  "/",
  requireRole([UserRole.ADMIN, UserRole.INVENTORY_MANAGER, UserRole.WAREHOUSE_STAFF]),
  validate(productSchema),
  async (req, res, next) => {
    try {
      const { initialStock, ...productData } = req.body;

      const product = await prisma.$transaction(async (tx) => {
        const existing = await tx.product.findUnique({ where: { sku: productData.sku } });
        if (existing) throw AppError.conflict("This SKU already exists.");

        const p = await tx.product.create({ data: productData, include: { category: true } });

        let initQty = 0;
        let initLocId: string | undefined = undefined;

        if (typeof initialStock === "number") {
          initQty = initialStock;
        } else if (initialStock && typeof initialStock === "object") {
          initQty = initialStock.qty || 0;
          initLocId = initialStock.locationId;
        }

        if (initQty > 0) {
          if (!initLocId) {
            const defaultLoc = await tx.location.findFirst({
              where: { locationType: LocationType.INTERNAL },
              orderBy: { name: "asc" },
            });
            initLocId = defaultLoc?.id;
          }

          if (initLocId) {
            await tx.stockQuantity.upsert({
              where: { productId_locationId: { productId: p.id, locationId: initLocId } },
              create: { productId: p.id, locationId: initLocId, onHandQty: initQty },
              update: { onHandQty: { increment: initQty } },
            });
          }
        }

        return p;
      });

      res.status(201).json({ data: product, product });
    } catch (err) { next(err); }
  }
);

// GET /products/:id
productsRouter.get("/:id", async (req, res, next) => {
  try {
    const product = await prisma.product.findUniqueOrThrow({
      where: { id: req.params.id },
      include: {
        category: true,
        stockQuantities: { include: { location: true } },
      },
    });
    res.json({ data: product, product });
  } catch (err) { next(err); }
});

// PATCH /products/:id
productsRouter.patch(
  "/:id",
  requireRole([UserRole.ADMIN, UserRole.INVENTORY_MANAGER, UserRole.WAREHOUSE_STAFF]),
  validate(productSchema.omit({ initialStock: true, sku: true }).partial()),
  async (req, res, next) => {
    try {
      const product = await prisma.product.update({
        where: { id: req.params.id },
        data: req.body,
        include: { category: true },
      });
      res.json({ data: product, product });
    } catch (err) { next(err); }
  }
);

// DELETE /products/:id — soft delete if has stock history
productsRouter.delete(
  "/:id",
  requireRole([UserRole.ADMIN, UserRole.INVENTORY_MANAGER, UserRole.WAREHOUSE_STAFF]),
  async (req, res, next) => {
    try {
      const hasMoves = await prisma.stockMove.count({ where: { productId: req.params.id } });
      if (hasMoves > 0) {
        // Soft delete
        await prisma.product.update({
          where: { id: req.params.id },
          data: { isActive: false },
        });
        res.json({ message: "Product deactivated (has stock history)." });
      } else {
        await prisma.product.delete({ where: { id: req.params.id } });
        res.status(204).send();
      }
    } catch (err) { next(err); }
  }
);

import { Router } from "express";
import { requireAuth, requireRole } from "../../common/middleware/auth-guard";
import { validate } from "../../common/middleware/validate";
import { UserRole } from "@prisma/client";
import prisma from "../../common/lib/prisma";
import { z } from "zod";

export const categoriesRouter = Router();
categoriesRouter.use(requireAuth);

const categorySchema = z.object({
  name: z.string().min(1, "Category name is required.").max(100),
  description: z.string().optional(),
});

// GET /categories
categoriesRouter.get("/", async (_req, res, next) => {
  try {
    const categories = await prisma.productCategory.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { name: "asc" },
    });
    res.json({ data: categories, categories });
  } catch (err) { next(err); }
});

// POST /categories
categoriesRouter.post(
  "/",
  requireRole([UserRole.ADMIN, UserRole.INVENTORY_MANAGER, UserRole.WAREHOUSE_STAFF]),
  validate(categorySchema),
  async (req, res, next) => {
    try {
      const category = await prisma.productCategory.create({ data: req.body });
      res.status(201).json({ data: category, category });
    } catch (err) { next(err); }
  }
);

// GET /categories/:id
categoriesRouter.get("/:id", async (req, res, next) => {
  try {
    const category = await prisma.productCategory.findUniqueOrThrow({
      where: { id: req.params.id },
    });
    res.json({ data: category, category });
  } catch (err) { next(err); }
});

// PATCH /categories/:id
categoriesRouter.patch(
  "/:id",
  requireRole([UserRole.ADMIN, UserRole.INVENTORY_MANAGER, UserRole.WAREHOUSE_STAFF]),
  validate(categorySchema.partial()),
  async (req, res, next) => {
    try {
      const category = await prisma.productCategory.update({
        where: { id: req.params.id },
        data: req.body,
      });
      res.json({ data: category, category });
    } catch (err) { next(err); }
  }
);

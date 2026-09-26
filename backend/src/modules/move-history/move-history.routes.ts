import { Router } from "express";
import { requireAuth } from "../../common/middleware/auth-guard";
import prisma from "../../common/lib/prisma";

export const moveHistoryRouter = Router();
moveHistoryRouter.use(requireAuth);

// GET /move-history
moveHistoryRouter.get("/", async (req, res, next) => {
  try {
    const {
      search,
      fromDate,
      toDate,
      productId,
      page = "1",
      pageSize = "20",
    } = req.query as Record<string, string>;

    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const take = Math.min(parseInt(pageSize), 100);

    const where: Record<string, unknown> = {};
    if (productId) where.productId = productId;
    if (fromDate || toDate) {
      where.movedAt = {
        ...(fromDate ? { gte: new Date(fromDate) } : {}),
        ...(toDate ? { lte: new Date(toDate + "T23:59:59.999Z") } : {}),
      };
    }
    if (search) {
      where.OR = [
        { operation: { reference: { contains: search, mode: "insensitive" } } },
        { operation: { contact: { name: { contains: search, mode: "insensitive" } } } },
      ];
    }

    const [moves, total] = await Promise.all([
      prisma.stockMove.findMany({
        where,
        include: {
          product: { select: { id: true, sku: true, name: true, unitOfMeasure: true } },
          fromLocation: { select: { id: true, name: true, shortCode: true, locationType: true } },
          toLocation: { select: { id: true, name: true, shortCode: true, locationType: true } },
          operation: {
            select: {
              id: true,
              reference: true,
              operationType: true,
              contact: { select: { id: true, name: true } },
            },
          },
          createdBy: { select: { id: true, fullName: true } },
        },
        orderBy: { movedAt: "desc" },
        skip,
        take,
      }),
      prisma.stockMove.count({ where }),
    ]);

    // Compute direction per docs/05 §7
    const data = moves.map((m) => {
      let direction: "IN" | "OUT" | "INTERNAL";
      const fromType = m.fromLocation.locationType;
      const toType = m.toLocation.locationType;
      if (fromType === "VENDOR") direction = "IN";
      else if (toType === "CUSTOMER" || toType === "INVENTORY_LOSS") direction = "OUT";
      else direction = "INTERNAL";

      return {
        ...m,
        direction,
      };
    });

    res.json({ data, meta: { page: parseInt(page), pageSize: take, total } });
  } catch (err) {
    next(err);
  }
});

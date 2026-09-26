import { Router } from "express";
import { requireAuth } from "../../common/middleware/auth-guard";
import { requireRole } from "../../common/middleware/auth-guard";
import { UserRole } from "@prisma/client";
import prisma from "../../common/lib/prisma";
import { z } from "zod";
import { validate } from "../../common/middleware/validate";

export const usersRouter = Router();

usersRouter.use(requireAuth);

// GET /users — Admin only
usersRouter.get("/", requireRole([UserRole.ADMIN]), async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true, loginId: true, email: true, fullName: true,
        role: true, isActive: true, createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });
    res.json({ data: users });
  } catch (err) { next(err); }
});

// PATCH /users/me — self-service profile update
usersRouter.patch(
  "/me",
  validate(z.object({
    fullName: z.string().min(1).max(100).optional(),
    email: z.string().email("Enter a valid email address.").optional(),
  })),
  async (req, res, next) => {
    try {
      const user = await prisma.user.update({
        where: { id: req.user!.sub },
        data: req.body,
        select: { id: true, loginId: true, email: true, fullName: true, role: true, isActive: true, createdAt: true },
      });
      res.json({ user });
    } catch (err) { next(err); }
  }
);

// PATCH /users/:id — Admin only (role/active)
usersRouter.patch(
  "/:id",
  requireRole([UserRole.ADMIN]),
  validate(z.object({
    role: z.nativeEnum(UserRole).optional(),
    isActive: z.boolean().optional(),
  })),
  async (req, res, next) => {
    try {
      const user = await prisma.user.update({
        where: { id: req.params.id },
        data: req.body,
        select: { id: true, loginId: true, email: true, fullName: true, role: true, isActive: true, updatedAt: true },
      });
      res.json({ user });
    } catch (err) { next(err); }
  }
);

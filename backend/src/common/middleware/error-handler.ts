import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  // Zod validation error
  if (err instanceof ZodError) {
    const fields: Record<string, string> = {};
    for (const issue of err.errors) {
      const path = issue.path.join(".");
      if (path) fields[path] = issue.message;
    }
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Validation failed. Check the fields object for details.",
        fields,
      },
    });
    return;
  }

  // Known operational errors (thrown from services)
  if (err instanceof AppError) {
    res.status(err.status).json({
      error: { code: err.code, message: err.message },
    });
    return;
  }

  // Prisma unique constraint violation
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      res.status(409).json({
        error: {
          code: "CONFLICT",
          message: "A record with these values already exists.",
        },
      });
      return;
    }
    if (err.code === "P2025") {
      res.status(404).json({
        error: { code: "NOT_FOUND", message: "Record not found." },
      });
      return;
    }
  }

  // Unexpected
  console.error("[Error] Unhandled error:", err);
  res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred." },
  });
}

/**
 * Domain-specific error class — throw from services instead of using res.status() directly.
 */
export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number = 400
  ) {
    super(message);
    this.name = "AppError";
  }

  static notFound(message = "Not found.") {
    return new AppError("NOT_FOUND", message, 404);
  }

  static conflict(message: string) {
    return new AppError("CONFLICT", message, 409);
  }

  static forbidden(message = "Forbidden.") {
    return new AppError("FORBIDDEN", message, 403);
  }

  static unauthenticated(message = "Authentication required.") {
    return new AppError("UNAUTHENTICATED", message, 401);
  }
}

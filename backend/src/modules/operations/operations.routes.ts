import { Router } from "express";
import { requireAuth } from "../../common/middleware/auth-guard";
import { validate, validateQuery } from "../../common/middleware/validate";
import { OperationsService } from "./operations.service";
import { createOperationDto, updateOperationDto, listOperationsQuery } from "./operations.dto";

export const operationsRouter = Router();
operationsRouter.use(requireAuth);

// GET /operations
operationsRouter.get(
  "/",
  validateQuery(listOperationsQuery),
  async (req, res, next) => {
    try {
      const result = await OperationsService.list(req.query as Record<string, string>);
      res.json(result);
    } catch (err) { next(err); }
  }
);

// POST /operations
operationsRouter.post(
  "/",
  validate(createOperationDto),
  async (req, res, next) => {
    try {
      const operation = await OperationsService.create(req.body, req.user!.sub);
      res.status(201).json({ operation });
    } catch (err) { next(err); }
  }
);

// GET /operations/:id
operationsRouter.get("/:id", async (req, res, next) => {
  try {
    const operation = await OperationsService.getById(req.params.id);
    res.json({ operation });
  } catch (err) { next(err); }
});

// PATCH /operations/:id
operationsRouter.patch(
  "/:id",
  validate(updateOperationDto),
  async (req, res, next) => {
    try {
      const operation = await OperationsService.update(req.params.id, req.body);
      res.json({ operation });
    } catch (err) { next(err); }
  }
);

// POST /operations/:id/mark-todo
operationsRouter.post("/:id/mark-todo", async (req, res, next) => {
  try {
    const operation = await OperationsService.markTodo(req.params.id);
    res.json({ operation });
  } catch (err) { next(err); }
});

// POST /operations/:id/validate
operationsRouter.post("/:id/validate", async (req, res, next) => {
  try {
    const operation = await OperationsService.validate(req.params.id, req.user!.sub);
    res.json({ operation });
  } catch (err) { next(err); }
});

// POST /operations/:id/cancel
operationsRouter.post("/:id/cancel", async (req, res, next) => {
  try {
    const operation = await OperationsService.cancel(req.params.id);
    res.json({ operation });
  } catch (err) { next(err); }
});

// GET /operations/:id/print — returns operation data for PDF rendering
operationsRouter.get("/:id/print", async (req, res, next) => {
  try {
    const operation = await OperationsService.getById(req.params.id);
    // The frontend renders the PDF — this endpoint returns the full data needed
    res.json({ operation, generatedAt: new Date().toISOString() });
  } catch (err) { next(err); }
});

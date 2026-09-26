import express from "express";
import cors from "cors";
import helmet from "helmet";
import { errorHandler } from "./common/middleware/error-handler";
import { authRouter } from "./modules/auth/auth.routes";
import { usersRouter } from "./modules/users/users.routes";
import { warehousesRouter } from "./modules/warehouses/warehouses.routes";
import { locationsRouter } from "./modules/locations/locations.routes";
import { categoriesRouter } from "./modules/categories/categories.routes";
import { productsRouter } from "./modules/products/products.routes";
import { stockRouter } from "./modules/stock/stock.routes";
import { operationsRouter } from "./modules/operations/operations.routes";
import { moveHistoryRouter } from "./modules/move-history/move-history.routes";
import { dashboardRouter } from "./modules/dashboard/dashboard.routes";
import { notificationsRouter } from "./modules/notifications/notifications.routes";

const app = express();

// ─── Security & transport middleware ─────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/warehouses", warehousesRouter);
app.use("/api/locations", locationsRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/products", productsRouter);
app.use("/api/stock", stockRouter);
app.use("/api/operations", operationsRouter);
app.use("/api/move-history", moveHistoryRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/notifications", notificationsRouter);

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: { code: "NOT_FOUND", message: "Route not found" } });
});

// ─── Error handler (must be last) ────────────────────────────────────────────
app.use(errorHandler);

export default app;

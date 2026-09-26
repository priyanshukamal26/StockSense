# 05 — API Specification (REST, JSON)

Base URL: `/api`. All authenticated routes require `Authorization: Bearer <accessToken>`.
All error responses use one shape (see §8). All list endpoints support `?page=&pageSize=` (default 20, max 100).

## 1. Auth (`/api/auth`) — Person A owns backend, Person B owns the matching UI (Phase 3)

| Method | Path | Body | Notes |
|---|---|---|---|
| POST | `/auth/signup` | `{ loginId, email, password, confirmPassword, fullName }` | Enforces: loginId unique + 6–12 chars; email unique; password ≥8 chars incl. upper/lower/special. Returns `201` + user (no password). |
| POST | `/auth/login` | `{ loginId, password }` | On mismatch → `401` `{ message: "Invalid Login Id or Password" }` (verbatim, per wireframe). On success → `{ accessToken, refreshToken, user }`. |
| POST | `/auth/refresh` | `{ refreshToken }` | Rotates and returns a new access/refresh pair. |
| POST | `/auth/logout` | `{ refreshToken }` | Revokes the refresh token. |
| POST | `/auth/forgot-password` | `{ loginIdOrEmail }` | Generates a 6-digit OTP, 5-minute expiry, emails it (or returns/logs it in dev mode). Always `200` (do not leak whether the account exists). |
| POST | `/auth/verify-otp` | `{ loginIdOrEmail, otp }` | Returns a short-lived `resetToken` on success. |
| POST | `/auth/reset-password` | `{ resetToken, newPassword, confirmPassword }` | Same password complexity rule as signup. |
| GET | `/auth/me` | — | Returns the current authenticated user. |

## 2. Users (`/api/users`) — Admin-only management, Phase 3

| Method | Path | Notes |
|---|---|---|
| GET | `/users` | List (Admin only). |
| PATCH | `/users/:id` | Update role/active state (Admin only). |
| PATCH | `/users/me` | Self-service profile update (full name, email) — "My Profile" menu item. |

## 3. Warehouses & Locations (`/api/warehouses`, `/api/locations`) — Phase 6

| Method | Path | Notes |
|---|---|---|
| GET / POST | `/warehouses` | Fields: `name`, `shortCode` (unique, ≤10 chars), `address`. |
| GET / PATCH / DELETE | `/warehouses/:id` | Delete blocked (`409`) if locations or operations reference it. |
| GET / POST | `/locations` | Fields: `name`, `shortCode`, `warehouseId`, `locationType`. `?warehouseId=` filter. |
| GET / PATCH / DELETE | `/locations/:id` | Delete blocked if stock or open operations reference it. |

## 4. Product Categories & Products (`/api/categories`, `/api/products`) — Phase 5

| Method | Path | Notes |
|---|---|---|
| GET / POST | `/categories` | `name` unique. |
| GET / POST | `/products` | Fields: `sku` (unique), `name`, `categoryId`, `unitOfMeasure`, `costPerUnit`, `reorderPoint`, `reorderQty`, optional `initialStock: { locationId, qty }` on create. `?search=` matches sku or name (SKU search & smart filters). |
| GET / PATCH / DELETE | `/products/:id` | Soft-delete via `isActive=false` if it has stock history (never hard-delete a product with `StockMove` rows). |

## 5. Stock (`/api/stock`) — Phase 5

| Method | Path | Notes |
|---|---|---|
| GET | `/stock` | Per-location availability. `?locationId=&productId=&warehouseId=`. Returns `onHandQty`, `reservedQty`, computed `freeToUseQty`, `costPerUnit`. Matches the wireframe's Stock table exactly. |
| POST | `/stock/adjust` | Shortcut used by the inline "update stock from here" wireframe note — internally creates an `ADJUSTMENT` operation in `DRAFT` then immediately validates it (see §6.4). Body: `{ productId, locationId, countedQty, reason }`. |

## 6. Operations (`/api/operations`) — one engine, `?type=RECEIPT|DELIVERY|INTERNAL_TRANSFER|ADJUSTMENT` — Phases 7 & 8

| Method | Path | Notes |
|---|---|---|
| GET | `/operations?type=&status=&warehouseId=&search=` | List view backing Receipts/Delivery/Transfers/Adjustments screens. `search` matches `reference` or `contact.name`. Response includes `isLate` (computed). Supports `?view=kanban` grouping hint (grouped by status) for the kanban toggle. |
| POST | `/operations` | Body: `{ operationType, sourceLocationId, destinationLocationId, contactId?, scheduledDate, lines: [{ productId, demandQty }] }`. Server generates `reference` (see `04-database-schema.md` §5) and sets `status=DRAFT`. `responsibleUserId` defaults to the current user ("auto-fill with the current logged-in user"). |
| GET | `/operations/:id` | Full detail incl. lines, computed per-line "insufficient stock" flag for deliveries. |
| PATCH | `/operations/:id` | Edit while `DRAFT`/`WAITING` only (`409` otherwise). Add/remove/edit lines. |
| POST | `/operations/:id/mark-todo` | `DRAFT → READY` (Receipts/Transfers/Adjustments) or `DRAFT → WAITING`/`READY` for Deliveries depending on stock availability. This is the "To Do" button. |
| POST | `/operations/:id/validate` | Moves to `DONE`. Executes the transactional stock-move logic in `03-architecture-and-tech-stack.md` §5. `409` if a Delivery line is still short on stock (stays `WAITING`). This is the "Validate" button. |
| POST | `/operations/:id/cancel` | `→ CANCELLED` from any non-`DONE` state. |
| GET | `/operations/:id/print` | Returns a PDF (A4) of the receipt/delivery slip — "Print the receipt once it's Done." Allowed once status is `READY` or `DONE`. |

## 7. Move History (`/api/move-history`) — Phase 8, read-only

| Method | Path | Notes |
|---|---|---|
| GET | `/move-history?search=&fromDate=&toDate=&productId=` | Reads `StockMove` joined to `Operation`/`Product`/`Location`. Response includes a `direction: "IN" | "OUT" | "INTERNAL"` field the frontend uses for the green/red row coloring. One row per `StockMove` (so a multi-product reference naturally renders as multiple rows, per the wireframe). |

## 8. Dashboard (`/api/dashboard`) — Phase 4

| Method | Path | Notes |
|---|---|---|
| GET | `/dashboard/summary` | `{ totalProducts, lowStockCount, outOfStockCount, receipts: { toReceive, late, operations }, deliveries: { toDeliver, late, waiting, operations }, transfersScheduled }` — exact fields behind the two dashboard cards. |
| GET | `/dashboard/filters` | Returns the option lists for the dynamic filters (types/status/warehouses/categories). |

## 9. Notifications (`/api/notifications`) — Phase 9

| Method | Path | Notes |
|---|---|---|
| GET | `/notifications?isRead=` | Bell-icon dropdown feed. |
| PATCH | `/notifications/:id/read` | Mark one read. |
| PATCH | `/notifications/read-all` | Mark all read. |
| WS event `notification:new` | pushed via Socket.IO | Payload matches the `Notification` shape; fired on low-stock/out-of-stock detection and on operations becoming late. |
| WS event `stock:updated` | pushed via Socket.IO | `{ productId, locationId }` — frontend uses this to invalidate the Stock/Dashboard cache instead of polling. |

## 10. Standard error shape

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable, field-specific message",
    "fields": { "email": "Email is already in use" }
  }
}
```

| HTTP status | `code` | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` | zod DTO failure — always includes `fields`. |
| 401 | `UNAUTHENTICATED` | Missing/expired token. |
| 403 | `FORBIDDEN` | Role doesn't permit the action (see `09-validation-and-security.md`). |
| 404 | `NOT_FOUND` | Entity doesn't exist. |
| 409 | `CONFLICT` | e.g. validating a Delivery with insufficient stock, deleting a referenced Warehouse. |
| 500 | `INTERNAL_ERROR` | Unhandled — logged server-side, never leaks stack traces to the client. |

## 11. Pagination & list response envelope

```json
{
  "data": [ /* items */ ],
  "meta": { "page": 1, "pageSize": 20, "total": 137 }
}
```

# 01 — Problem Statement & Scope

> Source of truth: `StockSense.pdf` (Odoo Hiring Hackathon brief) + `StockSense_-_8_hours.excalidraw` (wireframes).
> This document is the **contract**. If any implementation detail conflicts with this file or with `02-wireframes-and-ux-flows.md`, the docs win — flag the conflict instead of silently deviating.

## 1. One-line pitch

**StockSense** is a modular Inventory Management System (IMS) that digitizes stock operations (receiving, delivering, transferring, adjusting) for a business, replacing manual registers and spreadsheets with a centralized, real-time, multi-warehouse web app.

## 2. Target users

| Role | Needs |
|---|---|
| **Inventory Manager** | Oversee incoming/outgoing stock, approve operations, view dashboard KPIs, manage products/warehouses/categories. |
| **Warehouse Staff** | Execute transfers, picking, shelving, physical counting, validate receipts/deliveries on the floor. |

Both roles share one login system; access differences are enforced by a `role` field (`INVENTORY_MANAGER`, `WAREHOUSE_STAFF`, `ADMIN`) — see `09-validation-and-security.md` for RBAC rules.

## 3. Authentication (as specified)

- Sign up / log in with a **Login ID** (not just email).
- **OTP-based password reset** ("Forgot Password").
- On success, redirect to the **Inventory Dashboard**.
- Exact validation rules are hand-annotated in the wireframes and are **non-negotiable**:
  1. Login ID must be **unique** and **6–12 characters**.
  2. Email must **not be a duplicate** in the database.
  3. Password must contain a **lowercase letter, an uppercase letter, a special character**, and be **more than 8 characters** long.
  4. Invalid login must show the exact message: `"Invalid Login Id or Password"`.

## 4. Dashboard (landing page)

Snapshot of inventory operations, shown immediately after login.

**KPIs**
- Total Products in Stock
- Low Stock / Out of Stock items
- Pending Receipts
- Pending Deliveries
- Internal Transfers Scheduled

**Dynamic filters**
- By document type: Receipts / Delivery / Internal Transfer / Adjustments
- By status: Draft, Waiting, Ready, Done, Cancelled
- By warehouse or location
- By product category

**Status semantics used across the whole app** (verbatim from wireframe annotations):
- **Late** = `scheduled_date < today`
- **Operations** (a.k.a. "to do") = `scheduled_date >= today` (open, non-done)
- **Waiting** = waiting for out-of-stock product to become available (delivery only)

## 5. Navigation (left sidebar)

1. **Dashboard**
2. **Operations** (submenu: Receipts, Delivery, Adjustment)
3. **Products** (includes a **Stock** view: per-product, per-location On Hand / Free-to-Use, editable)
4. **Move History** (read-only ledger of every stock movement)
5. **Settings** (submenu: Warehouse, Location)
6. **Profile menu** (top-right avatar): My Profile, Logout

## 6. Core features (functional requirements)

### 6.1 Product Management
Create/update products with: Name, SKU/Code, Category, Unit of Measure, optional initial stock, reordering rules (reorder point + reorder quantity), stock availability **per location**.

### 6.2 Receipts (Incoming Goods)
Used when items arrive from a vendor.
1. Create a new receipt.
2. Add supplier (contact) & products.
3. Input quantities received.
4. **Validate → stock increases automatically.**

*Example: Receive 50 units of "Steel Rods" → stock +50.*

### 6.3 Delivery Orders (Outgoing Goods)
Used when stock leaves the warehouse for a customer shipment.
1. Pick items.
2. Pack items.
3. **Validate → stock decreases automatically.**

*Example: Sales order for 10 chairs → delivery order reduces chairs by 10.*

### 6.4 Internal Transfers
Move stock inside the company (rack → rack, warehouse → warehouse, warehouse → production floor). **Every movement is logged in the ledger.**

### 6.5 Stock Adjustments
Fix mismatches between recorded stock and physical count.
1. Select product/location.
2. Enter counted quantity.
3. System auto-updates stock and **logs the adjustment**.

### 6.6 Additional features (explicitly requested)
- Alerts for low stock.
- Multi-warehouse support.
- SKU search & smart filters.

## 7. Canonical end-to-end example (use this as the acceptance test / live demo script)

This exact sequence, from the brief, must work correctly and is the basis for `10-testing-and-demo-script.md`:

| Step | Action | Stock effect |
|---|---|---|
| 1 | Receive 100 kg Steel from a vendor | Steel stock **+100** |
| 2 | Internal transfer: Main Store → Production Rack | Total stock unchanged; **location** updates |
| 3 | Deliver 20 kg Steel (finished goods) | Steel stock **−20** |
| 4 | Adjust: 3 kg Steel found damaged | Steel stock **−3** |
| — | — | **Everything is logged in the Stock Ledger.** |

## 8. Explicit non-goals / out of scope (v1)

- No payment processing, invoicing, or accounting integration.
- No barcode-scanner hardware integration (a manual SKU search stands in for it).
- No multi-tenant / multi-company support — single company, multiple warehouses.
- No native mobile app — responsive web only.

## 9. Hackathon evaluation priorities (what we are optimizing for)

Ranked by the brief's own emphasis, highest first:
1. **Database design** — normalized schema, real relations, a real RDBMS (PostgreSQL), not Firebase/Supabase/Mongo.
2. **Backend & API design** — built from scratch, minimal third-party API dependency.
3. **Real, dynamic data** — no static JSON as the "final" data source.
4. **Robust input validation** with graceful, specific error feedback.
5. **Team-wide Git usage** — every member commits meaningfully, individually attributable.
6. **Clean, interactive, consistent UI** — see `06-design-system-launchdarkly.md`.
7. **Judicious use of "trendy tech"** (we use real-time updates via WebSockets — justified, not decorative).
8. Coding standards, modularity, performance, scalability, security, usability, debugging, attention to detail.

Everything in `07-roles-and-phase-plan.md` is sequenced to hit these priorities early (DB + API in phases 1–3) rather than polishing UI before the data model is solid.

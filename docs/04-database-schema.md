# 04 — Database Schema (PostgreSQL via Prisma)

> This is the single most heavily-weighted deliverable per the brief ("database design and setup" is called out
> first). Treat this schema as **frozen** for the hackathon window unless the whole team agrees on a change —
> log any change in a short note at the bottom of this file with a date and reason.

## 1. Design principles

1. **3rd normal form.** No derived/duplicated data is stored where it can drift — e.g. `free_to_use_qty` is
   never a column, it is always computed as `on_hand_qty − reserved_qty` at query time.
2. **Append-only ledger.** `StockMove` rows are never updated or deleted — this is literally "the Stock Ledger"
   the PDF describes. Every visible stock number is derivable by replaying `StockMove`; `StockQuantity` is a
   materialized snapshot maintained transactionally for fast reads.
3. **Virtual locations model external parties**, exactly like the wireframe's `From: vendor` / `To: vendor`
   columns. A `Location` isn't always a physical rack — `VENDOR`, `CUSTOMER`, and `INVENTORY_LOSS` are virtual
   locations, so a receipt is just a stock move `vendor → WH/Stock1`, and a delivery is `WH/Stock1 → customer`.
   This is the same trick professional inventory systems (Odoo included) use to avoid special-casing "external"
   stock moves.
4. **Concurrency-safe reference numbers.** `WH/IN/0001` is generated from a dedicated `ReferenceSequence` row
   locked inside the same transaction that creates the `Operation` — never `COUNT(*) + 1` (which race-conditions
   under concurrent writes).
5. **One engine, four operation types.** Receipts, Deliveries, Internal Transfers and Adjustments are all rows
   in the same `Operation` + `OperationLine` tables, distinguished by `operation_type`. This avoids four
   near-duplicate schemas and four near-duplicate services — one validated state machine, reused everywhere.

## 2. Entity-relationship overview

```
User ──< PasswordResetOtp
User ──< Operation (responsible_user_id)
User ──< Notification

Warehouse ──< Location
Warehouse ──< ReferenceSequence

Location ──< StockQuantity >── Product
Location ──< Operation (source_location_id / destination_location_id)
Location ──< StockMove (from_location_id / to_location_id)

ProductCategory ──< Product ──< OperationLine
Product ──< StockMove
Product ──< Notification (reference_product_id, nullable)

Contact ──< Operation (contact_id, nullable)

Operation ──< OperationLine
Operation ──< StockMove
Operation ──< Notification (reference_operation_id, nullable)
```

## 3. Prisma schema (`backend/prisma/schema.prisma`)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ────────────────────────────────────────────────────────────────
// ENUMS
// ────────────────────────────────────────────────────────────────

enum UserRole {
  ADMIN
  INVENTORY_MANAGER
  WAREHOUSE_STAFF
}

enum LocationType {
  INTERNAL         // real rack / room / warehouse floor
  VENDOR           // virtual: source of Receipts
  CUSTOMER         // virtual: destination of Deliveries
  INVENTORY_LOSS   // virtual: absorbs negative Adjustment deltas
}

enum OperationType {
  RECEIPT
  DELIVERY
  INTERNAL_TRANSFER
  ADJUSTMENT
}

enum OperationStatus {
  DRAFT
  WAITING
  READY
  DONE
  CANCELLED
}

enum ContactType {
  VENDOR
  CUSTOMER
  BOTH
}

enum NotificationType {
  LOW_STOCK
  OUT_OF_STOCK
  OPERATION_LATE
  OPERATION_READY
  SYSTEM
}

// ────────────────────────────────────────────────────────────────
// AUTH
// ────────────────────────────────────────────────────────────────

model User {
  id            String   @id @default(uuid())
  loginId       String   @unique @db.VarChar(12) @map("login_id") // 6–12 chars, enforced in zod DTO
  email         String   @unique
  passwordHash  String   @map("password_hash")
  fullName      String   @map("full_name")
  role          UserRole @default(WAREHOUSE_STAFF)
  isActive      Boolean  @default(true) @map("is_active")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  passwordResetOtps PasswordResetOtp[]
  responsibleFor    Operation[]        @relation("ResponsibleUser")
  createdMoves      StockMove[]
  notifications     Notification[]

  @@map("users")
}

model PasswordResetOtp {
  id          String    @id @default(uuid())
  userId      String    @map("user_id")
  otpCode     String    @map("otp_code") @db.VarChar(6)
  expiresAt   DateTime  @map("expires_at")
  consumedAt  DateTime? @map("consumed_at")
  createdAt   DateTime  @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("password_reset_otps")
}

// ────────────────────────────────────────────────────────────────
// WAREHOUSE / LOCATION
// ────────────────────────────────────────────────────────────────

model Warehouse {
  id        String   @id @default(uuid())
  name      String
  shortCode String   @unique @map("short_code") @db.VarChar(10) // e.g. "WH"
  address   String
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  locations Location[]
  sequences ReferenceSequence[]

  @@map("warehouses")
}

model Location {
  id           String       @id @default(uuid())
  name         String
  shortCode    String       @map("short_code") @db.VarChar(20) // e.g. "Stock1"
  warehouseId  String?      @map("warehouse_id") // null for VENDOR / CUSTOMER virtual locations
  locationType LocationType @default(INTERNAL) @map("location_type")
  createdAt    DateTime     @default(now()) @map("created_at")
  updatedAt    DateTime     @updatedAt @map("updated_at")

  warehouse           Warehouse?     @relation(fields: [warehouseId], references: [id], onDelete: Cascade)
  stockQuantities     StockQuantity[]
  operationsAsSource  Operation[]    @relation("SourceLocation")
  operationsAsDest    Operation[]    @relation("DestinationLocation")
  movesAsFrom         StockMove[]    @relation("FromLocation")
  movesAsTo           StockMove[]    @relation("ToLocation")

  @@unique([warehouseId, shortCode])
  @@map("locations")
}

// ────────────────────────────────────────────────────────────────
// PRODUCT / CATEGORY / STOCK
// ────────────────────────────────────────────────────────────────

model ProductCategory {
  id          String  @id @default(uuid())
  name        String  @unique
  description String?

  products Product[]

  @@map("product_categories")
}

model Product {
  id              String   @id @default(uuid())
  sku             String   @unique @db.VarChar(30)
  name            String
  categoryId      String   @map("category_id")
  unitOfMeasure   String   @map("unit_of_measure") @db.VarChar(20) // e.g. UNIT, KG, LITER, BOX
  costPerUnit     Decimal  @map("cost_per_unit") @db.Decimal(12, 2)
  reorderPoint    Decimal  @default(0) @map("reorder_point") @db.Decimal(12, 2)
  reorderQty      Decimal  @default(0) @map("reorder_qty") @db.Decimal(12, 2)
  isActive        Boolean  @default(true) @map("is_active")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  category        ProductCategory  @relation(fields: [categoryId], references: [id])
  stockQuantities StockQuantity[]
  operationLines  OperationLine[]
  stockMoves      StockMove[]
  notifications   Notification[]

  @@index([sku])
  @@map("products")
}

/// Materialized per-(product, location) snapshot. Never write directly from the API layer —
/// only the Operation-validation transaction (see 05-api-specification.md) is allowed to mutate this.
model StockQuantity {
  id          String   @id @default(uuid())
  productId   String   @map("product_id")
  locationId  String   @map("location_id")
  onHandQty   Decimal  @default(0) @map("on_hand_qty") @db.Decimal(14, 3)
  reservedQty Decimal  @default(0) @map("reserved_qty") @db.Decimal(14, 3)
  updatedAt   DateTime @updatedAt @map("updated_at")

  product  Product  @relation(fields: [productId], references: [id])
  location Location @relation(fields: [locationId], references: [id])

  @@unique([productId, locationId])
  @@map("stock_quantities")
}

// ────────────────────────────────────────────────────────────────
// CONTACTS
// ────────────────────────────────────────────────────────────────

model Contact {
  id          String      @id @default(uuid())
  name        String
  contactType ContactType @map("contact_type")
  email       String?
  phone       String?
  address     String?
  createdAt   DateTime    @default(now()) @map("created_at")
  updatedAt   DateTime    @updatedAt @map("updated_at")

  operations Operation[]

  @@map("contacts")
}

// ────────────────────────────────────────────────────────────────
// OPERATIONS ENGINE (Receipt / Delivery / Internal Transfer / Adjustment)
// ────────────────────────────────────────────────────────────────

model ReferenceSequence {
  id            String        @id @default(uuid())
  warehouseId   String        @map("warehouse_id")
  operationType OperationType @map("operation_type")
  lastNumber    Int           @default(0) @map("last_number")

  warehouse Warehouse @relation(fields: [warehouseId], references: [id], onDelete: Cascade)

  @@unique([warehouseId, operationType])
  @@map("reference_sequences")
}

model Operation {
  id                    String          @id @default(uuid())
  reference             String          @unique @db.VarChar(30) // e.g. WH/IN/0001
  operationType         OperationType   @map("operation_type")
  sourceLocationId      String          @map("source_location_id")
  destinationLocationId String          @map("destination_location_id")
  contactId             String?         @map("contact_id") // null for INTERNAL_TRANSFER / ADJUSTMENT
  responsibleUserId     String          @map("responsible_user_id")
  scheduledDate         DateTime        @map("scheduled_date") @db.Date
  status                OperationStatus @default(DRAFT)
  doneAt                DateTime?       @map("done_at")
  notes                 String?
  createdAt             DateTime        @default(now()) @map("created_at")
  updatedAt             DateTime        @updatedAt @map("updated_at")

  sourceLocation      Location  @relation("SourceLocation", fields: [sourceLocationId], references: [id])
  destinationLocation Location  @relation("DestinationLocation", fields: [destinationLocationId], references: [id])
  contact             Contact?  @relation(fields: [contactId], references: [id])
  responsible         User      @relation("ResponsibleUser", fields: [responsibleUserId], references: [id])

  lines         OperationLine[]
  stockMoves    StockMove[]
  notifications Notification[]

  @@index([operationType, status, scheduledDate])
  @@map("operations")
}

model OperationLine {
  id          String   @id @default(uuid())
  operationId String   @map("operation_id")
  productId   String   @map("product_id")
  demandQty   Decimal  @map("demand_qty") @db.Decimal(14, 3)
  doneQty     Decimal? @map("done_qty") @db.Decimal(14, 3)
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  operation Operation @relation(fields: [operationId], references: [id], onDelete: Cascade)
  product   Product   @relation(fields: [productId], references: [id])

  @@index([operationId])
  @@map("operation_lines")
}

/// Append-only. Application code must never UPDATE or DELETE a StockMove — this table *is* the Stock Ledger.
model StockMove {
  id             String   @id @default(uuid())
  operationId    String   @map("operation_id")
  productId      String   @map("product_id")
  fromLocationId String   @map("from_location_id")
  toLocationId   String   @map("to_location_id")
  quantity       Decimal  @db.Decimal(14, 3)
  movedAt        DateTime @default(now()) @map("moved_at")
  createdById    String   @map("created_by_id")

  operation    Operation @relation(fields: [operationId], references: [id])
  product      Product   @relation(fields: [productId], references: [id])
  fromLocation Location  @relation("FromLocation", fields: [fromLocationId], references: [id])
  toLocation   Location  @relation("ToLocation", fields: [toLocationId], references: [id])
  createdBy    User      @relation(fields: [createdById], references: [id])

  @@index([productId, movedAt])
  @@index([fromLocationId])
  @@index([toLocationId])
  @@map("stock_moves")
}

// ────────────────────────────────────────────────────────────────
// NOTIFICATIONS
// ────────────────────────────────────────────────────────────────

model Notification {
  id                  String           @id @default(uuid())
  userId              String?          @map("user_id") // null = broadcast to all managers
  type                NotificationType
  title               String
  message             String
  referenceOperationId String?         @map("reference_operation_id")
  referenceProductId  String?          @map("reference_product_id")
  isRead              Boolean          @default(false) @map("is_read")
  createdAt           DateTime         @default(now()) @map("created_at")

  user              User?      @relation(fields: [userId], references: [id])
  referenceOperation Operation? @relation(fields: [referenceOperationId], references: [id])
  referenceProduct   Product?   @relation(fields: [referenceProductId], references: [id])

  @@index([userId, isRead])
  @@map("notifications")
}
```

## 4. Key computed values (never stored)

| Value | Formula | Used in |
|---|---|---|
| `freeToUseQty` | `stockQuantity.onHandQty - stockQuantity.reservedQty` | Stock view, delivery availability check |
| Operation `isLate` | `status NOT IN (DONE, CANCELLED) AND scheduledDate < today()` | Dashboard, Operations list badges |
| Operation `isDueToday/Operation` | `status NOT IN (DONE, CANCELLED) AND scheduledDate >= today()` | Dashboard "N operations" count |
| Product `isLowStock` | `SUM(stockQuantity.onHandQty) across locations <= product.reorderPoint` | Dashboard KPI, low-stock notification |

## 5. Reference number generation (concurrency-safe)

```ts
// backend/src/common/lib/reference-sequence.ts (pseudocode, used inside a Prisma $transaction)
const PREFIX: Record<OperationType, string> = {
  RECEIPT: "IN",
  DELIVERY: "OUT",
  INTERNAL_TRANSFER: "INT",
  ADJUSTMENT: "ADJ",
};

async function nextReference(tx, warehouseId: string, type: OperationType) {
  const seq = await tx.referenceSequence.upsert({
    where: { warehouseId_operationType: { warehouseId, operationType: type } },
    create: { warehouseId, operationType: type, lastNumber: 1 },
    update: { lastNumber: { increment: 1 } },
  });
  const warehouse = await tx.warehouse.findUniqueOrThrow({ where: { id: warehouseId } });
  const padded = String(seq.lastNumber).padStart(4, "0");
  return `${warehouse.shortCode}/${PREFIX[type]}/${padded}`; // e.g. WH/IN/0001
}
```

## 6. Enterprise Seed Data (`backend/prisma/seed.ts`)

The database is populated with a realistic, multi-warehouse operational dataset:
- **5 User Accounts**:
  - `demoadmin` / `admin123` (Admin)
  - `demoworker` / `worker123` (Warehouse Staff)
  - `admin01` / `Admin@1234` (Director of Operations)
  - `mgr001` / `Manager@1234` (Inventory Manager)
  - `staff01` / `Staff@1234` (Warehouse Staff)
- **3 Warehouses**:
  - `WH`: Central Logistics Hub (Chicago, IL)
  - `ECOM`: East Coast Fulfillment Hub (Newark, NJ)
  - `WEST`: West Distribution Center (Reno, NV)
- **13 Storage Locations**:
  - 10 Physical bays/racks: `WH/Stock1`, `WH/Stock2`, `WH/ProdRack`, `WH/ColdVault` (2–8°C), `ECOM-Stock`, `ECOM-Pack`, `ECOM-RMA`, `WEST-Stock`, `WEST-Bulk`, `WEST-Transit`.
  - 3 Virtual locations: `VENDOR` (Inbound), `CUSTOMER` (Outbound), `INVLOSS` (Shrinkage/Adjustment).
- **7 Product Categories**:
  - Electronics & Audio, Office Furniture, Industrial Hardware, Raw Materials & Metals, Packaging Supplies, Warehouse Equipment, Safety & PPE.
- **24 Diverse Catalog Products**:
  - Realistic SKUs, costs, reorder points, and units.
  - 19 products in healthy stock.
  - 3 products with active Low Stock warnings (`SENS-IOT-01`, `FORK-SCALE-01`, `RESP-N95-PRO`).
  - 2 products Out of Stock (`LITH-BAT-48V`, `MOTOR-STEP-24V`) to verify out-of-stock guard rails and backorders.
- **11 Corporate Contacts**:
  - 5 Vendors (Apex Industrial, Shenzhen MicroTech, Global Metal, EcoPack, Precision Ergonomics).
  - 5 Customers (Starlight Robotics, OmniRetail, Horizon Cloud, Vanguard Aerospace, Nexus Workspaces).
  - 1 Partner (`Azure Interior`).
- **28 Operations**:
  - Receipts (`WH/IN`, `ECOM/IN`, `WEST/IN`), Deliveries (`WH/OUT`, `ECOM/OUT`, `WEST/OUT`), Internal Transfers (`WH/INT`, `ECOM/INT`, `WEST/INT`), and Adjustments (`WH/ADJ`).
  - Spread across `DONE`, `READY`, `WAITING`, and `DRAFT` statuses with past, present, and future scheduled dates (activating the "Late" and "Waiting" dashboard telemetry).
- **32+ Immutable Stock Moves**:
  - Strict double-entry ledger entries in `StockMove` matching every completed operation and baseline inventory, conserving $\Delta = 0.00$.
- **6 Global System Notifications**:
  - Low stock warnings, critical stockout alerts, and overdue delivery notices broadcasted enterprise-wide.

## 7. Migration discipline

- One Prisma migration per meaningful schema change, named descriptively
  (`npx prisma migrate dev --name add_operation_lines`).
- Never edit a migration that has already been merged to `main` — add a new one.
- `npx prisma migrate deploy` is the only command run against a shared/demo database; `migrate dev` is local-only.

## 8. Changelog
| Date | Change | Reason |
|---|---|---|
| 2026-09-26 | Expanded seed dataset to 3 warehouses, 13 locations, 24 products, 28 operations, 32+ stock moves | Populate lively enterprise dataset with realistic operational velocity, low-stock alerts, and double-entry moves across all accounts |
| 2026-09-26 | Verified centralized global ledger architecture | All accounts view and mutate the same shared enterprise database state |


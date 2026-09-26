# 02 — Wireframes & UX Flows (source of truth: Excalidraw)

> Extracted directly from `StockSense_-_8_hours.excalidraw` (666 text annotations parsed) and the exported
> `WhatsApp_Image_2026-09-26_at_11_51_53_AM.jpeg` overview board. Original board: https://link.excalidraw.com/l/65VNwvy7c4X/3ENvQFu9o8R
>
> **Rule for the IDE agent:** every screen below must be built to match these annotations exactly — field names,
> column order, button labels, and status wording are copied verbatim from the designer's notes. Do not invent
> alternate copy. Where the wireframe is silent (Products master screen, Adjustment screen), a consistent
> pattern is proposed and explicitly flagged as **[ASSUMPTION]** — confirm with the team before treating it as final.

## 1. Global shell (present on every authenticated page)

Top nav bar, left to right: **Dashboard | Operations | Products | Move History | Settings**, and a profile
avatar icon (labelled `A` in the wireframe) at the far right that opens **My Profile / Logout**.

- **Operations** expands to a submenu: `1. Receipt` `2. Delivery` `3. Adjustment`.
- **Settings** expands to a submenu: `1. Warehouse` `2. Locations`.
- Two early wireframe iterations label the third nav item "Stock" instead of "Products" — we standardize on
  **Products**, with "Stock" as a tab/view inside the Products section (see §4).

## 2. Authentication

### 2.1 Login Page
Fields: `Login Id`, `Password` → button **SIGN IN**.
Link row: `Forget Password ? | Sign Up`.

**Validation logic (verbatim from designer notes):**
> Check for Login Credentials. Match creds, and allow the user to login. If creds do not match, throw an error message: **"Invalid Login Id or Password"**. When clicked on Sign Up, land on the Sign Up page. When clicked on Forget Password, land on the Forget Password page.

### 2.2 Sign Up Page
Fields: `Enter Login Id`, `Enter Email Id`, `Enter Password`, `Re-Enter Password` → button **SIGN UP**.

**Validation logic (verbatim):**
> For the Sign Up page, create a user record in the database on signup. Check creds as follows:
> 1. Login ID should be unique and must be between **6–12 characters**.
> 2. Email ID should not be a duplicate in the database.
> 3. Password must be unique and must contain a lowercase letter, an uppercase letter, and a special character, and length should be more than **8 characters**.

### 2.3 Forgot Password (OTP) — [ASSUMPTION, backed by PDF §Authentication: "OTP-based password reset"]
Not hand-drawn in the board beyond the `Forget Password?` link, but explicitly required by the PDF. Flow:
`Enter Login Id or Email` → `Send OTP` → `Enter 6-digit OTP` (5-minute expiry) → `Enter New Password` (same
complexity rule as Sign Up) → redirect to Login with a success toast.

## 3. Dashboard

Two large cards, side by side:

| Card | Header line | Sub line |
|---|---|---|
| **Receipt** | "4 to receive" | "1 Late · 6 operations" |
| **Delivery** | "4 to Deliver" | "1 Late · 2 waiting · 6 operations" |

**Definitions (verbatim):**
> Late: schedule date < today's date. Operations: schedule date > today's date. Waiting: waiting for the stock(s).

Clicking a card's counters routes to the matching Operations list, pre-filtered.

## 4. Products / Stock

### 4.1 Products master — [ASSUMPTION: not wireframed, built from the PDF spec]
List view with **New** button, search, and columns: `SKU`, `Product Name`, `Category`, `Unit of Measure`,
`Cost / Unit`, `Reorder Point`, `Active`. Clicking a row opens a create/edit form with: Name, SKU/Code,
Category (searchable select, with inline "+ create category"), Unit of Measure, Initial Stock (optional, only
on create), Reorder Point, Reorder Quantity.

### 4.2 Stock view (per-location availability) — wireframed
Table columns exactly as drawn: **Product | per unit cost | On hand | Free to Use**.

Example rows from the board: `Desk — 3000 Rs — 50 — 45`, `Table — 3000 Rs — 50 — 50`.

> "User must be able to update the stock from here."

This is a manual-adjustment entry point: editing `On hand` inline opens a quick Stock Adjustment for that
product/location (reuses the Adjustment flow in §8, never writes `on_hand` directly — see `04-database-schema.md`).
`Free to Use` = `On hand − Reserved` and is always **read-only/computed**.

## 5. Settings

### 5.1 Warehouse page
Form fields: `Name`, `Short Code`, `Address`. Caption: *"This page contains the warehouse details & location."*
List of existing warehouses above the form; simple CRUD.

### 5.2 Location page
Form fields: `Name`, `Short Code`, `Warehouse` (dropdown, e.g. `WH`). Caption:
*"This holds the multiple locations of warehouse, rooms, etc."* — i.e. Locations are racks/rooms/bins that
belong to a Warehouse (one warehouse → many locations).

## 6. Operations — Receipts (Incoming)

### 6.1 List view
Route: click **Operations → Receipt** → **lands on List View by default**.
Toolbar: **NEW** button, search icon (search by reference & contact), list/kanban toggle icon.

> "Allow user to search receipts based on reference & contacts."
> "Allow user to switch to the kanban view based on status."

Columns exactly as drawn: **Reference | From | To | Contact | Schedule date | Status**.

Example rows:
| Reference | From | To | Contact | Status |
|---|---|---|---|---|
| WH/IN/0001 | vendor | WH/Stock1 | Azure Interior | Ready |
| WH/IN/0002 | vendor | WH/Stock1 | Azure Interior | Ready |

Caption under the table: *"Populate all [purchase] orders added to [the] warehouse."*

### 6.2 Receipt reference numbering (verbatim)
```
WH/IN/0001
<Warehouse>/<Operation>/<ID>

Warehouse = short code of the warehouse
Operation = IN (Receipt) / OUT (Delivery)
ID        = auto-incremental, unique per warehouse + operation type
```
Applied consistently to all operation types: `IN` (Receipt), `OUT` (Delivery), and by extension (not drawn,
kept consistent) `INT` (Internal Transfer) and `ADJ` (Adjustment).

### 6.3 Receipt detail / form page
Header buttons: **Validate | Print | Cancel**. Status stepper top-right: **Draft → Ready → Done**.

Fields: `Receive From` (contact/vendor), `Scheduled Date`, `Responsible` (auto-filled with the logged-in user).
Products table: `Product` (e.g. `[DESK001] Desk`) | `Demand Qty`, plus an **Add New Product** row.

**Status meaning (verbatim):**
> Draft – Initial stage. Ready – Ready to receive. Done – Received.

**Button behaviour (verbatim):**
> To Do = shown when in Draft (click → moves to Ready). Validate = shown when in Ready (click → moves to Done).

**Printing:** *"Print the receipt once it's Done"* — rendered as an **A4-sized** printable document
(see `03-architecture-and-tech-stack.md` for the PDF generation approach).

Validating a receipt in `Ready` status: creates one `StockMove` per line from the source location (`vendor`,
a virtual location) to the destination location (e.g. `WH/Stock1`), and increases `on_hand_qty` there.

## 7. Operations — Delivery (Outgoing)

Mirrors Receipts with the same list-view UX (**NEW**, search by reference/contact, list/kanban toggle),
same column set (**Reference | From | To | Contact | Schedule date | Status**), same reference format
(`WH/OUT/0001`), and a wider status set.

Example rows: `WH/OUT/0001` from `WH/Stock1` to `vendor`* (the "To" contact for a delivery is the **customer**;
the wireframe reuses the demo contact "vendor"/"Azure Interior" for both flows — in the real data model this is
just a `Contact` of type `CUSTOMER`).

### 7.1 Delivery detail / form page
Header buttons: **Validate | Print | Cancel**. Status stepper: **Draft → Waiting → Ready → Done**.

Fields: `Delivery Address`, `Schedule Date`, `Responsible` (auto-filled), `Operation Type`.
Products table: `Product` | `Quantity`, plus **Add New Product**.

**Status meaning (verbatim):**
> Draft: Initial state. Waiting: waiting for the out-of-stock product to be in. Ready: ready to deliver.
> Done: delivered.

**Critical business rule (verbatim):**
> "Alert the notification & mark the line red if [the] product is not in stock."

i.e. if `demand_qty > free_to_use_qty` at the source location, that product row renders with a red/destructive
style and the operation cannot move past `Waiting` until stock is available — this is what drives the
`Waiting` status and the low/out-of-stock notification (see `05-api-specification.md` §Notifications).

## 8. Stock Adjustment — [ASSUMPTION: not wireframed, built from the PDF spec + kept visually consistent with §6/§7]

Same list/detail pattern: list view (**NEW**, reference `WH/ADJ/0001`, columns `Reference | Location | Contact:
—  | Schedule date | Status`), detail form with `Location`, `Responsible` (auto-filled), and a products table
of `Product | Recorded Qty (read-only) | Counted Qty (input) | Difference (computed)`. Because an adjustment
has no external counterpart, its status flow is simplified to **Draft → Done** (Validate applies the delta
immediately and writes the ledger entry) — flagged here for team confirmation.

## 9. Internal Transfer — [ASSUMPTION: not wireframed, built from the PDF spec]

Same list/detail pattern as Receipts, reference `WH/INT/0001`, `From` / `To` are both **internal** locations
(rack, warehouse, production floor). Status flow **Draft → Ready → Done** (no vendor/customer involved, so no
"Waiting on external stock" state is meaningful — though it still waits if the source location itself is short).

## 10. Move History

Route: click **Operations → Move History** → **lands on List View by default**. Toolbar: search (by reference
& contact), list/kanban toggle.

Columns exactly as drawn: **Reference | Date | Contact | From | To | Quantity | Status**.

**Behavioural rules (verbatim):**
> Populate all moves done between the From → To location in inventory.
> If a single reference has multiple products, display it in multiple rows.
> **In** moves should display in **green**. **Out** moves should display in **red**.

This is a **read-only ledger view** over the `StockMove` table (see `04-database-schema.md`) — it is the
single audit trail the PDF calls "the Stock Ledger," fed by Receipts, Deliveries, Transfers, and Adjustments
alike.

## 11. Screen-by-screen → data model cross-reference

| Wireframe screen | Backing table(s) |
|---|---|
| Login / Sign up / Forgot Password | `User`, `PasswordResetOtp` |
| Dashboard | Aggregation queries over `Operation` |
| Products master | `Product`, `ProductCategory` |
| Stock view | `StockQuantity` (joined to `Product`, `Location`) |
| Warehouse settings | `Warehouse` |
| Location settings | `Location` |
| Receipts list/detail | `Operation` (`type=RECEIPT`) + `OperationLine` |
| Delivery list/detail | `Operation` (`type=DELIVERY`) + `OperationLine` |
| Internal Transfer | `Operation` (`type=INTERNAL_TRANSFER`) + `OperationLine` |
| Stock Adjustment | `Operation` (`type=ADJUSTMENT`) + `OperationLine` |
| Move History | `StockMove` (append-only ledger) |
| Notifications | `Notification` |

Full column types, enums and relations are in `04-database-schema.md`.

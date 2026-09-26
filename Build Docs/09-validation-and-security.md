# 09 — Validation & Security Checklist

The brief calls out "robust input validation" and "usability/security" as explicit judging criteria. Every rule
below must be enforced **on the backend** (source of truth) and **mirrored on the frontend** (fast feedback) —
never trust the client alone.

## 1. Field-level validation rules (verbatim from the wireframes where specified)

| Field | Rule | Error message shown to the user |
|---|---|---|
| `loginId` | Unique, 6–12 characters, alphanumeric | "Login ID must be 6–12 characters." / "This Login ID is already taken." |
| `email` | Valid email format, unique | "Enter a valid email address." / "This email is already registered." |
| `password` | >8 characters, ≥1 lowercase, ≥1 uppercase, ≥1 special character | "Password must be over 8 characters and include an uppercase letter, a lowercase letter, and a special character." |
| `confirmPassword` | Must equal `password` | "Passwords do not match." |
| Login (wrong creds) | — | Exactly: **"Invalid Login Id or Password"** (verbatim from the wireframe — do not paraphrase this one) |
| OTP | Exactly 6 digits, unexpired, unused | "This code is invalid or has expired." |
| `warehouse.shortCode` / `location.shortCode` | Unique within its scope, ≤10/20 chars | "This short code is already used in this warehouse." |
| `product.sku` | Unique, non-empty | "This SKU already exists." |
| Quantities (`demandQty`, `countedQty`, initial stock) | Must be a positive number (or zero for adjustments going down) — never negative on-hand as a result | "Quantity must be zero or greater." |
| `scheduledDate` | Valid date; a past date is allowed (marks the operation `Late` immediately) but must not be null | "Please choose a schedule date." |
| Deleting a Warehouse/Location/Product | Blocked (`409`) if referenced by stock or open operations | "Can't delete — this [warehouse/location/product] has existing stock or operations." |
| Validating a Delivery | Blocked if any line's `demandQty > freeToUseQty` at the source location | "Not enough stock for [Product] — this delivery will stay in Waiting." |

## 2. Where validation lives

- **Zod schemas** in `backend/src/modules/*/dto.ts` are the single source of truth for shape + rules; every
  route handler validates `req.body`/`req.query` against its DTO before touching the database.
- The **same rules** are re-expressed as a `zod` schema imported by the frontend forms (via `shared/types` or a
  hand-synced copy) so `react-hook-form` gives inline errors before the request is even sent.
- Database-level constraints (`UNIQUE`, `NOT NULL`, foreign keys) are the last line of defense — the API must
  never rely on a Postgres constraint violation as its only validation (always pre-check and return a clean
  `409`/`400`, and additionally catch the DB constraint error gracefully as a safety net).

## 3. Authentication & session security

- Passwords hashed with **bcrypt**, cost factor 12+. Never log or return a password/hash.
- **JWT access token** (short-lived, ~15 min) + **refresh token** (longer-lived, stored hashed, rotated on
  every refresh, revocable on logout).
- OTP: 6-digit, single-use, 5-minute expiry, rate-limited to 1 request per 60 seconds per account.
- `POST /auth/login` and `POST /auth/forgot-password` are rate-limited (e.g. 5 attempts / 15 min / IP) to blunt
  brute force — implemented in Phase 3.3.
- Forgot-password never reveals whether an account exists ("If an account exists, an OTP has been sent.").

## 4. Authorization (RBAC)

| Action | ADMIN | INVENTORY_MANAGER | WAREHOUSE_STAFF |
|---|---|---|---|
| View dashboard, products, stock, move history | ✅ | ✅ | ✅ |
| Create/edit Products, Categories, Warehouses, Locations | ✅ | ✅ | ❌ |
| Create/edit/validate Receipts & Deliveries | ✅ | ✅ | ✅ |
| Create/validate Internal Transfers & Adjustments | ✅ | ✅ | ✅ |
| Cancel a Done operation (would require reversal) | ✅ | ❌ | ❌ |
| Manage users/roles | ✅ | ❌ | ❌ |

Enforced by a single `requireRole([...])` Express middleware per route — never checked only in the frontend.

## 5. Transport & general hardening

- `helmet` for standard secure headers; CORS locked to the known frontend origin(s) via env config.
- All mutating endpoints require `Content-Type: application/json` and a valid CSRF-safe bearer token (JWT in
  `Authorization` header, not a cookie, avoids CSRF by construction).
- Prisma parameterizes every query by construction — no raw string-concatenated SQL anywhere in the codebase.
- User-generated text (product names, notes, contact names) is rendered as text (React escapes by default) —
  no `dangerouslySetInnerHTML` for any user-controlled field.
- Environment secrets (`DATABASE_URL`, `JWT_SECRET`, SMTP creds) only in `.env` (git-ignored); `.env.example`
  documents the required keys with placeholder values.

## 6. Data-integrity guarantees specific to this domain

- Every stock mutation happens inside a **Prisma `$transaction`** (Operation status change + `StockMove`
  insert + `StockQuantity` upsert, all-or-nothing) — see `03-architecture-and-tech-stack.md` §5.
- `StockMove` rows are **append-only** at the application layer (no `PATCH`/`DELETE` route exists for them) —
  the ledger is auditable by construction.
- Reference numbers are generated under a row lock (`ReferenceSequence`), so concurrent "New Receipt" clicks
  from two warehouse staff never collide.

## 7. Pre-demo security smoke test (Phase 10 checklist)

- [ ] Signing up with a weak password is rejected with a specific message.
- [ ] Logging in with a wrong password shows exactly "Invalid Login Id or Password".
- [ ] A `WAREHOUSE_STAFF` account cannot reach `Settings → Warehouse` create/edit (API returns `403`, UI hides
      the action).
- [ ] Validating a Delivery for more stock than available is rejected and the line renders red.
- [ ] Deleting a Warehouse that has stock is rejected with a clear message.
- [ ] Expired/garbage JWT is rejected with `401`, and the frontend redirects to `/login`.
- [ ] `.env` is not committed; `git log -p -- .env` shows nothing.

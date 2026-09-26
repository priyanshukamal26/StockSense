# 07 — Roles & Phase Plan (10 phases × 3 subphases, 3 people)

## 1. How the split works

- **3 people, 10 phases, 3 subphases per phase → 30 subphases total → exactly 10 subphases per person.**
  Balanced by count *and* by difficulty (each phase has one backend-heavy, one frontend-heavy, and one
  integration/quality-heavy piece of work).
- Each person keeps one consistent lane across the whole project so their individual contribution is easy to
  point to in the presentation and in `git log --author`, while still touching real, demo-able features every
  phase (not just "infra" busywork).
- Replace the placeholder names below with real names/GitHub handles before `git init` (Phase 1.3).

| Person | Lane | One-line pitch for the "shared ownership" presentation |
|---|---|---|
| **Person A** | Backend & Database Lead | "I designed and built the data model and every API — the part that has to be *correct*, not just pretty." |
| **Person B** | Frontend & Design System Lead | "I built the LaunchDarkly-inspired UI on shadcn — every screen you're looking at." |
| **Person C** | Integration, Real-Time & Quality Lead | "I wired frontend to backend, built the live notification system, and made sure it's tested, secure, and demoable end to end." |

## 2. Dependency order

Phases are numbered in build order. A phase's subphases can run in parallel *within* the phase, but Phase N+1
generally depends on Phase N being merged (e.g., you cannot build the Receipts UI in Phase 7 before the
Operations schema from Phase 2 and the auth from Phase 3 exist). Two exceptions are called out inline.

## 3. Full phase table

### Phase 1 — Project Foundation & Environment Setup
*Nothing product-specific yet — get three people able to work in parallel without stepping on each other.*

| Sub | Owner | Deliverable |
|---|---|---|
| 1.1 | Person A | `backend/` scaffold: Node + Express + TypeScript, folder structure per `03-architecture-and-tech-stack.md`, ESLint + Prettier config, `.env.example`, Prisma installed & connected to a local Postgres. |
| 1.2 | Person B | `frontend/` scaffold: Next.js 14 (App Router) + TypeScript + Tailwind, shadcn/ui initialized and themed with the tokens from `06-design-system-launchdarkly.md`, base `AppShell` (empty sidebar + topbar) rendering. |
| 1.3 | Person C | `git init`, remote created, branch protection on `main`, `docker-compose.yml` (Postgres), `.github/workflows/ci.yml` (lint+typecheck), PR/issue templates, root `README.md` skeleton. **This subphase performs the exact "create these files" checklist in `08-git-workflow-and-contributions.md` §2.** |

### Phase 2 — Database Design & Core Data Modeling
| Sub | Owner | Deliverable |
|---|---|---|
| 2.1 | Person A | Prisma models: `User`, `PasswordResetOtp`, `Warehouse`, `Location`, `Contact` + first migration. |
| 2.2 | Person B | Prisma models: `ProductCategory`, `Product`, `StockQuantity` + migration; `backend/prisma/seed.ts` v1 (categories + products, matching the wireframe's Desk/Table example). |
| 2.3 | Person C | Prisma models: `ReferenceSequence`, `Operation`, `OperationLine`, `StockMove`, `Notification` + migration; seed v2 (demo warehouse/locations/contacts + the exact demo rows from the wireframes); indexing pass per `04-database-schema.md` §1–§7. |

### Phase 3 — Authentication & User Management
| Sub | Owner | Deliverable |
|---|---|---|
| 3.1 | Person A | `/api/auth/*` (signup, login, refresh, logout, `/me`) with bcrypt + JWT, exact validation rules from `02-wireframes-and-ux-flows.md` §2. |
| 3.2 | Person B | Login, Sign Up pages (pixel-matched to the wireframe fields/labels), react-hook-form + zod, inline field errors, dark-canvas auth layout per `06-design-system-launchdarkly.md` §5. |
| 3.3 | Person C | Forgot Password/OTP flow end-to-end (backend OTP gen/expiry/mailer with dev-mode console fallback + matching frontend screens), rate limiting on `/auth/*`, `helmet`/CORS setup. |

### Phase 4 — App Shell, Navigation & Dashboard
| Sub | Owner | Deliverable |
|---|---|---|
| 4.1 | Person A | `GET /api/dashboard/summary` + `/api/dashboard/filters` implementing the Late/Operations/Waiting logic verbatim from `02-wireframes-and-ux-flows.md` §3. |
| 4.2 | Person B | Full sidebar (Dashboard/Operations/Products/Move History/Settings + submenus), topbar (search, avatar menu), responsive shell. |
| 4.3 | Person C | Dashboard page wired to the API (two KPI cards, dynamic filters by type/status/warehouse/category), TanStack Query setup shared by the whole app. |

### Phase 5 — Product & Stock Management
| Sub | Owner | Deliverable |
|---|---|---|
| 5.1 | Person A | `/api/products`, `/api/categories`, `/api/stock` (incl. `POST /stock/adjust`) per `05-api-specification.md` §4–§5. |
| 5.2 | Person B | Products list + create/edit form, Category quick-create, SKU search + smart filters UI. |
| 5.3 | Person C | Stock view screen (Product/Cost/On hand/Free-to-Use table, matching the wireframe exactly) with inline "update stock from here" → adjustment modal; frontend+backend validation for non-negative quantities. |

### Phase 6 — Warehouse & Location Management
| Sub | Owner | Deliverable |
|---|---|---|
| 6.1 | Person A | `/api/warehouses`, `/api/locations` incl. delete-guard logic (409 if referenced). |
| 6.2 | Person B | Warehouse settings page + Location settings page, matching the two wireframed forms exactly (Name/Short Code/Address; Name/Short Code/Warehouse). |
| 6.3 | Person C | Reusable `LocationPicker`/`WarehousePicker` components used across Products, Stock, and every Operation form; multi-warehouse filtering wired into Dashboard & Stock views. |

### Phase 7 — Receipts & Delivery Operations
*The core of the app — the PDF's Receipt/Delivery examples must work exactly as written.*

| Sub | Owner | Deliverable |
|---|---|---|
| 7.1 | Person A | Operations engine backend: `POST/GET/PATCH /operations`, `mark-todo`, `validate`, `cancel`, reference-number generation, the transactional stock-move logic from `03-architecture-and-tech-stack.md` §5. |
| 7.2 | Person B | Receipts: list view (search, list/kanban toggle, status badges) + detail/form page (Receive From, Scheduled Date, Responsible, product lines, Validate/Print/Cancel + status stepper). |
| 7.3 | Person C | Delivery: list view + detail/form page incl. the red out-of-stock line rule and its live notification; A4 "Print" (receipt/delivery PDF) for both flows. |

### Phase 8 — Internal Transfers, Adjustments & Move History
| Sub | Owner | Deliverable |
|---|---|---|
| 8.1 | Person A | Internal Transfer + Stock Adjustment backend (reusing the Phase 7 engine with `operationType`); adjustment delta→ledger logic. |
| 8.2 | Person B | Internal Transfer UI + Stock Adjustment UI, visually consistent with Receipts/Delivery. |
| 8.3 | Person C | Move History: `GET /move-history` + list page with green/red IN-OUT coloring, multi-row-per-reference behavior, search/filter, wired end-to-end and manually verified against the PDF's 4-step demo scenario. |

### Phase 9 — Alerts, Notifications & Real-Time
| Sub | Owner | Deliverable |
|---|---|---|
| 9.1 | Person A | Low/out-of-stock detection on every stock mutation, `Notification` creation, Socket.IO gateway emitting `notification:new` / `stock:updated`. |
| 9.2 | Person B | Notification bell + dropdown, toast integration (`sonner`), live-updating badge counts, red-row styling wired to the out-of-stock signal. |
| 9.3 | Person C | `node-cron` daily "late operations" digest job, socket client wiring on the frontend (connect/reconnect handling), query-cache invalidation strategy, basic perf pass (N+1 query check on list endpoints). |

### Phase 10 — Testing, Hardening, Deployment & Demo Prep
| Sub | Owner | Deliverable |
|---|---|---|
| 10.1 | Person A | Backend Jest+Supertest suite (auth, validation edge cases, the full Receive→Transfer→Deliver→Adjust ledger scenario as an integration test), OpenAPI/Swagger doc generation. |
| 10.2 | Person B | Frontend component tests, accessibility pass, empty/loading/error states, final visual QA against `06-design-system-launchdarkly.md` §7 checklist. |
| 10.3 | Person C | Dockerize full stack, `docker-compose up` one-command demo, seed the exact demo dataset for judging, write & rehearse the live demo script (`10-testing-and-demo-script.md`), finalize `README.md`. |

## 4. Stretch goals (only if a phase finishes early — never at the cost of the core 10 phases)

- Kanban drag-and-drop for Operations (currently click-to-change-status).
- CSV export on Move History / Products.
- A small "why is this low stock" text summary generated from a **free/local** rule-based template (explicitly
  *not* a paid LLM API call) if the team wants a "trendy tech" checkbox — must be justified, not decorative,
  per the brief's own warning against copy-pasted trend-chasing.
- Public deploy (Neon/Render/Vercel free tiers) per `03-architecture-and-tech-stack.md` §6.

## 5. Presentation split (so "everyone participates")

Each person presents the phases they owned, live, from their own machine/branch:
- Person A: walks through the schema (`04-database-schema.md`) + the Receive/Deliver ledger transaction live in
  the DB (a query showing `StockMove` rows appearing).
- Person B: walks through the UI screen-by-screen against the original wireframe image, screen-sharing both.
- Person C: runs the live demo script end-to-end (signup → receive → transfer → deliver → adjust →
  notification pops up in real time), showing the Git history/PRs to back up "version control is a team sport."

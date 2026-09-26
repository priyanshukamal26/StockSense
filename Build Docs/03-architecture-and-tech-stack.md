# 03 — Architecture & Tech Stack

## 1. Guiding constraints (from the hackathon brief)

- **No BaaS.** No Firebase, Supabase, or MongoDB Atlas. We own the schema, the API, and the auth logic.
- **From scratch, minimal third-party APIs.** The only outbound network dependency is transactional email for
  OTP delivery, and even that has a zero-dependency local fallback for demoing offline/without SMTP creds.
- **Real, dynamic data.** PostgreSQL is the single source of truth at runtime; seed scripts only bootstrap demo
  data, they are never read at request time.
- **Everything free/open-source.** No paid tier is required to build, run, or judge this project.

## 2. High-level architecture

```
                     ┌────────────────────────────┐
                     │        Next.js 14 (App Router)      │
                     │  React + TypeScript + Tailwind      │
                     │  shadcn/ui component library        │
                     │  TanStack Query (server-state cache)│
                     │  react-hook-form + zod (client val.) │
                     └───────────────┬─────────────────────┘
                                     │ REST (JSON) over HTTPS
                                     │ + WebSocket (Socket.IO) for live updates
                     ┌───────────────▼─────────────────────┐
                     │           Node.js + Express + TS      │
                     │  Layered: routes → controllers →      │
                     │  services → repositories (Prisma)     │
                     │  zod DTO validation on every request  │
                     │  JWT auth middleware + RBAC guard      │
                     │  Socket.IO gateway (notifications)     │
                     │  node-cron (scheduled digest jobs)     │
                     └───────────────┬─────────────────────┘
                                     │ Prisma ORM (typed SQL)
                     ┌───────────────▼─────────────────────┐
                     │           PostgreSQL 16                │
                     │  Runs locally via Docker Compose       │
                     │  (or a free managed Postgres for demo  │
                     │   deploys — see §6)                    │
                     └───────────────────────────────────────┘
```

This is a classic **3-tier, monorepo** setup — deliberately boring and explicit, because the brief rewards
"scalable, well-structured, clear code" over cleverness.

## 3. Repository layout

```
StockSense/
├── docs/                      # this folder — the spec, read before writing any code
├── CLAUDE.md                  # agent operating instructions (read first, every session)
├── README.md
├── docker-compose.yml         # postgres (+ pgadmin optional) for local dev
├── .github/
│   ├── workflows/ci.yml       # lint + typecheck + test on every PR
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── ISSUE_TEMPLATE/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/            (routes, controller, service, dto, tests)
│   │   │   ├── users/
│   │   │   ├── warehouses/
│   │   │   ├── locations/
│   │   │   ├── products/
│   │   │   ├── categories/
│   │   │   ├── stock/
│   │   │   ├── operations/      (receipts, deliveries, transfers, adjustments share one engine)
│   │   │   ├── move-history/
│   │   │   ├── dashboard/
│   │   │   └── notifications/
│   │   ├── common/
│   │   │   ├── middleware/      (auth guard, error handler, rate limiter, validation)
│   │   │   ├── lib/              (prisma client, jwt, bcrypt, reference-sequence, mailer)
│   │   │   └── realtime/         (socket.io gateway)
│   │   ├── config/
│   │   └── server.ts
│   └── tests/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/login, /signup, /forgot-password
│   │   │   └── (dashboard)/dashboard, /products, /stock, /operations/*, /move-history, /settings/*
│   │   ├── components/
│   │   │   ├── ui/                # shadcn primitives (generated, do not hand-edit)
│   │   │   └── stocksense/        # composed, app-specific components
│   │   ├── lib/                    # api client, socket client, zod schemas, utils
│   │   ├── hooks/
│   │   └── styles/
│   └── tests/
└── shared/
    └── types/                     # types/enums shared between frontend & backend (hand-synced or generated)
```

## 4. Layer-by-layer stack

| Layer | Choice | Why (free / justified) |
|---|---|---|
| Database | **PostgreSQL 16** | Required by the brief; strongest free relational option; native enums, transactions, row-level locking for our reference-sequence generator. |
| ORM / migrations | **Prisma** | Type-safe queries, first-class migration history (shows deliberate schema evolution to reviewers), open source. |
| Backend runtime | **Node.js 20 + Express + TypeScript** | Lets frontend and backend share types/validation schemas (zod) in one language; Express keeps the layering explicit and easy to review (vs. a heavier opinionated framework). |
| Validation | **zod** (backend DTOs) + **react-hook-form + zod** (frontend forms) | One schema definition can be shared/mirrored client & server → the exact rules in `09-validation-and-security.md` are enforced twice, gracefully. |
| Auth | **Custom JWT** (access + refresh) + **bcrypt** password hashing | No auth-as-a-service; matches the hand-drawn login/signup/OTP flow exactly. |
| Real-time | **Socket.IO** | Genuinely used: live low-stock alerts and dashboard KPI refresh without polling — not decorative. Self-hosted, no external dependency. |
| Scheduled jobs | **node-cron** | Recomputes "Late" operations and sends the daily digest; in-process, no external scheduler service. |
| Email (OTP) | **Nodemailer** with a free SMTP relay (e.g. a personal Gmail App Password or Mailtrap free sandbox for dev) | The one outbound integration the PDF requires ("OTP-based password reset"). **Fallback:** in `NODE_ENV=development`/demo mode, the OTP is also returned in the API response and logged to the server console, so the judged demo never depends on a live mailbox. |
| Frontend framework | **Next.js 14 (App Router) + React 18 + TypeScript** | File-based routing maps cleanly onto the sidebar/nav structure in the wireframes; SSR where useful for the dashboard. |
| Styling | **Tailwind CSS** | Pairs with shadcn/ui; enables the LaunchDarkly-inspired design tokens in `06-design-system-launchdarkly.md`. |
| Component library | **shadcn/ui** (Radix primitives, copied into the repo, not an npm black box) | Accessible by default; we theme it to the LaunchDarkly palette instead of using default shadcn styling — this is what "premium, $10k-site" polish comes from. |
| Server-state cache | **TanStack Query** | Avoids hand-rolled loading/error/caching logic for every list/detail screen (products, receipts, deliveries…). |
| Charts (dashboard) | **Recharts** | MIT-licensed, no API key, enough for KPI trend sparklines. |
| Icons | **lucide-react** | MIT-licensed, ships with shadcn by default. |
| PDF generation (Print receipt/delivery, A4) | **@react-pdf/renderer** (backend) or `window.print()` with a print stylesheet | Free, no external "convert to PDF" API call. |
| Testing | **Jest + Supertest** (backend), **Vitest + React Testing Library** (frontend), **Playwright** (optional e2e for the demo script) | All free, no paid CI minutes required beyond GitHub's free tier. |
| CI | **GitHub Actions** (free for public/hackathon repos) | Lint + typecheck + unit tests on every PR — enforces the git workflow in `08-git-workflow-and-contributions.md`. |
| Containerization | **Docker Compose** (Postgres, optionally pgAdmin) | Removes "works on my machine" risk during judging; no cloud dependency required to run the whole stack. |

## 5. Data flow example: validating a Receipt (ties §6/§7 of the wireframe doc together)

1. Frontend `POST /api/operations/:id/validate`.
2. Backend `OperationsService.validate(id)`:
   - Loads the `Operation` + its `OperationLine[]` inside a **DB transaction**.
   - Guards: status must currently be `READY`; every line's `done_qty` defaults to `demand_qty` unless overridden.
   - For each line: creates one immutable `StockMove` row (`from_location_id → to_location_id`, qty), then
     `upsert`s `StockQuantity` for `(product_id, to_location_id)` (+qty) and, if `from_location_id` is internal,
     for `(product_id, from_location_id)` (−qty).
   - Sets `Operation.status = DONE`, `done_at = now()`.
   - Commits the transaction (all-or-nothing — this is why a real RDBMS with transactions matters here, not a
     document store).
   - Emits a `stock:updated` Socket.IO event and, if any resulting `StockQuantity.free_to_use_qty` is below the
     product's `reorder_point`, creates a `LOW_STOCK` `Notification` and emits `notification:new`.
3. Frontend invalidates the relevant TanStack Query caches (Stock view, Dashboard KPIs, Move History) and shows
   a success toast; if a `notification:new` socket event arrives, the bell icon updates live without a refetch.

## 6. Environments & deployment (secondary priority — local demo reliability comes first)

- **Local dev (primary, judged demo):** `docker compose up -d postgres`, `npm run dev` in `backend/` and
  `frontend/`. This is what the brief implicitly asks for: "avoid dependency that can impact your project when
  the third-party platform has bugs" — nothing about the live demo depends on an external host being up.
- **Optional public deploy (stretch goal, phase 10):** free-tier Postgres (Neon or Railway free tier) +
  backend on Render/Railway free tier + frontend on Vercel free tier. Documented but not required for judging.

## 7. What we deliberately do **not** use

- No Firebase / Supabase / MongoDB Atlas (explicitly disallowed).
- No low-code form builders or headless CMS for the product/stock data.
- No paid AI APIs. If an AI feature is added as a stretch (e.g., a "why is this low stock" summary), it must
  run against a free/local model or be clearly optional and off by default — see the stretch-goal note in
  `07-roles-and-phase-plan.md`.

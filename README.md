# StockSense — Inventory Management System

> **Odoo Hiring Hackathon** submission.

StockSense is a modular, real-time Inventory Management System (IMS) that digitizes stock operations — receiving, delivering, transferring, and adjusting — for multi-warehouse businesses. Built with PostgreSQL, Node.js/Express, and Next.js 14.

---

## Team

| Person | Role | GitHub | LinkedIn |
|--------|------|--------|----------|
| Priyanshu Kamal | Backend & Database Lead | [@priyanshukamal26](https://github.com/priyanshukamal26/) | [priyanshukamal](https://www.linkedin.com/in/priyanshukamal/) |
| Somya Vishnoi | Frontend & Design System Lead | [@Somya-Vishnoi](https://github.com/Somya-Vishnoi) | [Somya-Vishnoi](https://www.linkedin.com/in/Somya-Vishnoi/) |
| Aditya Kumar | Integration, Real-Time & Quality Lead | [@kumaradi9508](https://github.com/kumaradi9508) | [aditya958](https://www.linkedin.com/in/aditya958) |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Database | PostgreSQL 16 (Docker) |
| ORM | Prisma |
| Backend | Node.js 20 + Express + TypeScript |
| Auth | Custom JWT + bcrypt |
| Real-time | Socket.IO |
| Frontend | Next.js 14 (App Router) + React 18 + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| State | TanStack Query |
| Validation | zod (backend DTOs + frontend forms via react-hook-form) |

---

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+
- npm 10+

### 1. Start the database

```bash
docker compose up -d
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your secrets
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env.local
# Edit .env.local if needed
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Demo Credentials (seeded)

All accounts access the same centralized, global enterprise inventory ledger in real time:

| Role | Login ID | Password | Access Level |
|------|----------|----------|--------------|
| **Admin (Quick Demo)** | `demoadmin` | `admin123` | Full administrative control & validation |
| **Warehouse Worker (Quick Demo)** | `demoworker` | `worker123` | Floor operations & pick/pack workflow |
| Director of Operations | `admin01` | `Admin@1234` | Full enterprise oversight |
| Inventory Manager | `mgr001` | `Manager@1234` | Stock approvals & adjustments |
| Warehouse Staff | `staff01` | `Staff@1234` | Receipt & dispatch execution |

---

## Seeded Enterprise Dataset

The system includes a pre-populated, verified enterprise database:
- **3 Warehouses**: `WH` (Chicago Central Hub), `ECOM` (Newark Fulfillment), `WEST` (Reno Distribution).
- **13 Locations**: 10 Physical bays/racks/cold vault (2–8°C) + 3 Virtual locations (`VENDOR`, `CUSTOMER`, `INVLOSS`).
- **7 Product Categories**: Electronics, Office Furniture, Industrial Hardware, Raw Materials, Packaging, Warehouse Equipment, Safety & PPE.
- **24 Catalog Products**: 19 in healthy stock, 3 in low stock warnings (`SENS-IOT-01`, `FORK-SCALE-01`, `RESP-N95-PRO`), and 2 out of stock (`LITH-BAT-48V`, `MOTOR-STEP-24V`).
- **11 Corporate Contacts**: 5 Vendors, 5 Customers, 1 Dual partner (`Azure Interior`).
- **28 Operations**: Receipts, Deliveries, Internal Transfers, and Adjustments across `DONE`, `READY`, `WAITING`, and `DRAFT` statuses.
- **32+ Immutable Stock Moves**: Complete double-entry ledger records visible in `/move-history` conserving $\Delta = 0.00$.
- **6 Global System Alerts**: Real-time notifications for low stock, critical stockouts, and overdue receipts.

---

## Project Structure

```
StockSense/
├── docs/                  # Project specification (read before coding)
├── CLAUDE.md              # AI agent operating instructions
├── docker-compose.yml     # Postgres for local dev
├── .github/               # CI workflow + PR/issue templates
├── backend/               # Express + TypeScript API
│   ├── prisma/            # Schema, migrations, seed
│   └── src/               # Modular route → controller → service → repository
├── frontend/              # Next.js 14 App Router
│   └── src/               # App, components, hooks, lib
└── shared/                # Shared types/enums
```

---

## Documentation

All specs are in `docs/`. Read in order:

1. [01 — Problem Statement & Scope](docs/01-problem-statement-and-scope.md)
2. [02 — Wireframes & UX Flows](docs/02-wireframes-and-ux-flows.md)
3. [03 — Architecture & Tech Stack](docs/03-architecture-and-tech-stack.md)
4. [04 — Database Schema](docs/04-database-schema.md)
5. [05 — API Specification](docs/05-api-specification.md)
6. [06 — Design System](docs/06-design-system-launchdarkly.md)
7. [07 — Roles & Phase Plan](docs/07-roles-and-phase-plan.md)
8. [08 — Git Workflow](docs/08-git-workflow-and-contributions.md)
9. [09 — Validation & Security](docs/09-validation-and-security.md)
10. [10 — Testing & Demo Script](docs/10-testing-and-demo-script.md)

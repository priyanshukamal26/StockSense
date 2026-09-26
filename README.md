# StockSense — Inventory Management System

> **Odoo Hiring Hackathon** submission.

StockSense is a modular, real-time Inventory Management System (IMS) that digitizes stock operations — receiving, delivering, transferring, and adjusting — for multi-warehouse businesses. Built with PostgreSQL, Node.js/Express, and Next.js 14.

---

## Team

| Person | Role | GitHub |
|--------|------|--------|
| Priyanshu Kamal | Backend & Database Lead | — |
| Somya Vishnoi | Frontend & Design System Lead | — |
| Aditya Kumar | Integration, Real-Time & Quality Lead | — |

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
| Styling | Tailwind CSS + shadcn/ui (LaunchDarkly-themed) |
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

| Role | Login ID | Password |
|------|----------|----------|
| Admin | `admin01` | `Admin@1234` |
| Inventory Manager | `mgr001` | `Manager@1234` |
| Warehouse Staff | `staff01` | `Staff@1234` |

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

# StockSense

A modular Inventory Management System (IMS) built for the Odoo Hiring Hackathon — digitizes receiving,
delivery, internal transfers, and stock adjustments across multiple warehouses, with a real-time,
LaunchDarkly-inspired dashboard.

> **Start here:** every product, design, and architecture decision in this repo is documented in
> [`docs/`](./docs). Read [`CLAUDE.md`](./CLAUDE.md) before writing any code — it's the operating manual for
> anyone (human or AI agent) picking this project up.

## Documentation index

| Doc | Contents |
|---|---|
| [`docs/01-problem-statement-and-scope.md`](./docs/01-problem-statement-and-scope.md) | What we're building and why, straight from the hackathon brief |
| [`docs/02-wireframes-and-ux-flows.md`](./docs/02-wireframes-and-ux-flows.md) | Every screen, field, and interaction, extracted from the Excalidraw wireframes |
| [`docs/03-architecture-and-tech-stack.md`](./docs/03-architecture-and-tech-stack.md) | System architecture, stack choices and why |
| [`docs/04-database-schema.md`](./docs/04-database-schema.md) | Full PostgreSQL/Prisma schema |
| [`docs/05-api-specification.md`](./docs/05-api-specification.md) | Every REST endpoint |
| [`docs/06-design-system-launchdarkly.md`](./docs/06-design-system-launchdarkly.md) | Visual design system (LaunchDarkly-inspired, shadcn/ui) |
| [`docs/07-roles-and-phase-plan.md`](./docs/07-roles-and-phase-plan.md) | 10 phases × 3 subphases × 3 people |
| [`docs/08-git-workflow-and-contributions.md`](./docs/08-git-workflow-and-contributions.md) | Branching, commits, PR review rotation |
| [`docs/09-validation-and-security.md`](./docs/09-validation-and-security.md) | Every validation rule + security checklist |
| [`docs/10-testing-and-demo-script.md`](./docs/10-testing-and-demo-script.md) | Test plan + the exact live demo script |

## Tech stack (short version — see `docs/03` for the full rationale)

**Frontend:** Next.js 14 + TypeScript + Tailwind + shadcn/ui + TanStack Query
**Backend:** Node.js + Express + TypeScript + Prisma
**Database:** PostgreSQL (local via Docker Compose — no BaaS)
**Real-time:** Socket.IO · **Auth:** custom JWT + bcrypt + OTP password reset

## Getting started

```bash
# 1. Start Postgres
docker compose up -d

# 2. Backend
cd backend
cp .env.example .env
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev            # http://localhost:4000

# 3. Frontend (new terminal)
cd frontend
cp .env.example .env
npm install
npm run dev            # http://localhost:3000
```

Demo login (from the seed script — replace with real values once seeded):
```
Login ID: manager01
Password: Demo@1234
```

## Team & roles

| Person | Lane | Docs |
|---|---|---|
| Person A | Backend & Database Lead | `docs/04`, `docs/05` |
| Person B | Frontend & Design System Lead | `docs/06` |
| Person C | Integration, Real-Time & Quality Lead | `docs/09`, `docs/10` |

Full phase-by-phase ownership: [`docs/07-roles-and-phase-plan.md`](./docs/07-roles-and-phase-plan.md).
Live contribution tracker: [`docs/08-git-workflow-and-contributions.md`](./docs/08-git-workflow-and-contributions.md) §7.

## License

Built for the Odoo Hiring Hackathon. All content and design is original to the team.

# 10 — Testing Plan & Live Demo Script

## 1. Testing plan

| Layer | Tooling | What's covered |
|---|---|---|
| Backend unit | Jest | Zod DTO validation edge cases; reference-number formatting; reorder-point/low-stock calculation; password complexity regex. |
| Backend integration | Jest + Supertest + a disposable test Postgres schema | Full HTTP round-trips per module (auth, products, operations); the transactional stock-move logic under concurrent requests. |
| **Golden-path integration test (highest priority)** | Jest + Supertest | The PDF's own canonical example, run as one test: Receive 100kg Steel → Internal Transfer to Production Rack → Deliver 20kg → Adjust −3kg damaged → assert final `StockQuantity` and 4 `StockMove` ledger rows exist with the right locations/quantities. |
| Frontend component | Vitest + React Testing Library | Form validation messages (signup/login), status badge color mapping, red-line rendering when a delivery line is short on stock. |
| E2E (stretch) | Playwright | Full click-through of the demo script below against a running dev stack. |
| CI | GitHub Actions | Lint + typecheck + `jest`/`vitest` run on every PR (see `08-git-workflow-and-contributions.md`). |

## 2. Live demo script (rehearsed by Person C, referenced by everyone)

This is the PDF's "Simplified Example to Understand Inventory Flow," turned into a click-by-click script for
judging. Run it against the seeded demo data (`STEEL001` product, `WH` warehouse, `WH/Stock1` location,
`Production Rack` location).

| Step | Screen | Action | Expected result |
|---|---|---|---|
| 0 | Login | Sign in as the seeded Inventory Manager | Redirect to Dashboard; KPI cards show current pending counts |
| 1 | Operations → Receipt | Click **NEW**, set Receive From = vendor contact, add line `Steel Rod` qty `100`, Save | Status `Draft`, reference `WH/IN/000x` assigned |
| 1b | Receipt detail | Click **To Do**, then **Validate** | Status → `Ready` → `Done`; toast confirms; Stock view shows Steel `on_hand +100` at `WH/Stock1` |
| 2 | Operations → Adjustment *(internal transfer)* | Click **NEW**, From `WH/Stock1` → To `Production Rack`, qty `100`, Validate | Total Steel stock unchanged; `WH/Stock1` −100, `Production Rack` +100; Move History shows one green + one row for the transfer |
| 3 | Operations → Delivery | Click **NEW**, Delivery Address = customer contact, line `Steel Rod` qty `20`, Validate | Status → `Done`; `Production Rack` stock −20; Move History shows a red **OUT** row |
| 4 | Products → Stock (or Operations → Adjustment) | Adjust Steel at `Production Rack`: counted qty = current − 3 | Stock −3; Move History logs the adjustment; if this pushes Steel below its `reorderPoint`, a live **notification** pops up (bell icon + toast) without a page refresh — this is the Socket.IO payoff, shown live |
| 5 | Move History | Open the list | All four moves visible, correctly colored, correctly attributed to their reference/date/contact |
| 6 | Dashboard | Return to Dashboard | KPI counts reflect the new state (e.g. pending receipts decremented) |

**Talking point while running step 4:** this is the one moment to explicitly call out the real-time feature so
judges see it's functional, not just claimed.

## 3. Definition of done (per subphase, before opening a PR)

- [ ] Matches the relevant wireframe/field names in `02-wireframes-and-ux-flows.md` exactly.
- [ ] Backend: DTO validation covers every rule in `09-validation-and-security.md` that applies to this module.
- [ ] Backend: at least one integration test for the new endpoint(s).
- [ ] Frontend: loading, empty, and error states are all designed (no blank screens).
- [ ] No `console.log` debugging left in; no commented-out dead code.
- [ ] `npm run lint` and `npm run typecheck` pass locally.
- [ ] Commit messages follow `08-git-workflow-and-contributions.md` §4.

## 4. Pre-submission full regression (Phase 10.3)

1. `docker compose down -v && docker compose up -d` (clean database).
2. `npx prisma migrate deploy && npx prisma db seed` in `backend/`.
3. Run the full Jest + Vitest suites — all green.
4. Walk the entire demo script in §2 manually, on the actual machine that will be used to present.
5. Confirm three different GitHub accounts have authored commits (`git shortlog -sne`).

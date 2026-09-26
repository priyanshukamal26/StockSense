# 08 — Git Workflow & Individual Contributions

The brief is explicit: *"Proper use of Git. One member managing the repo isn't enough. Version control is a
team sport."* This doc is what makes each person's contribution independently visible to a reviewer scanning
`git log`, PRs, and file ownership — without slowing anyone down.

## 1. One-time setup (run once, at the very start of Phase 1.3, owned by Aditya Kumar)

```bash
mkdir StockSense && cd StockSense
git init
git branch -M main

# .gitignore (Node/Next/Prisma/env)
cat > .gitignore << 'EOF'
node_modules/
.next/
dist/
.env
.env.local
*.log
.DS_Store
backend/prisma/dev.db
coverage/
EOF

git add .gitignore
git commit -m "chore: initial commit — .gitignore [Phase 1.3 - Aditya Kumar]"

# Create GitHub remote (via gh CLI or the web UI), then:
git remote add origin <repo-url>
git push -u origin main
```

Then, on GitHub: enable branch protection on `main` — require 1 approving review + passing CI status check
before merge, disallow direct pushes.

## 2. Exact files/folders to create right after `git init` (in order, each committed separately so the
authorship of each piece is unambiguous)

| # | Path | Owner | Commit message |
|---|---|---|---|
| 1 | `.gitignore` | Aditya Kumar | `chore: initial commit — .gitignore [Phase 1.3 - Aditya Kumar]` |
| 2 | `README.md` (skeleton) | Aditya Kumar | `docs: add README skeleton [Phase 1.3 - Aditya Kumar]` |
| 3 | `docs/*.md` (all 10 files from this planning pass) | Aditya Kumar | `docs: add full project documentation set [Phase 1.3 - Aditya Kumar]` |
| 4 | `CLAUDE.md` | Aditya Kumar | `docs: add agent operating instructions [Phase 1.3 - Aditya Kumar]` |
| 5 | `docker-compose.yml` | Aditya Kumar | `chore: add postgres docker-compose for local dev [Phase 1.3 - Aditya Kumar]` |
| 6 | `.github/workflows/ci.yml`, PR/issue templates | Aditya Kumar | `ci: add lint/typecheck/test workflow and PR template [Phase 1.3 - Aditya Kumar]` |
| 7 | `backend/` scaffold (package.json, tsconfig, folder structure, empty `server.ts`) | Priyanshu Kamal | `feat(backend): scaffold express + typescript project [Phase 1.1 - Priyanshu Kamal]` |
| 8 | `frontend/` scaffold (Next.js + Tailwind + shadcn init) | Somya Vishnoi | `feat(frontend): scaffold next.js + tailwind + shadcn project [Phase 1.2 - Somya Vishnoi]` |

After step 8, `main` has a working (empty but running) full-stack skeleton with a fully documented spec — every
subsequent subphase branches off this.

## 3. Branching model

Trunk-based with short-lived feature branches, one branch per subphase:

```
main
 ├── phase-01/1.1-priyanshu-kamal-backend-scaffold
 ├── phase-01/1.2-somya-vishnoi-frontend-scaffold
 ├── phase-01/1.3-aditya-kumar-repo-setup
 ├── phase-02/2.1-priyanshu-kamal-auth-warehouse-models
 ├── phase-03/3.2-somya-vishnoi-login-signup-ui
 └── ...
```

Naming: `phase-<NN>/<subphase>-<owner>-<slug>` — this alone tells any reviewer which phase, who, and what,
without opening the PR.

## 4. Commit message convention (Conventional Commits + phase tag)

```
<type>(<scope>): <short description> [Phase <NN.n> - Person <A|B|C>]

type: feat | fix | docs | chore | test | refactor | style | perf
scope: auth | products | stock | operations | move-history | dashboard | notifications | ui | db | ci
```

Examples:
```
feat(auth): add signup endpoint with password complexity validation [Phase 3.1 - Priyanshu Kamal]
feat(ui): build receipts list view with list/kanban toggle [Phase 7.2 - Somya Vishnoi]
fix(operations): prevent validating a delivery with insufficient stock [Phase 7.1 - Priyanshu Kamal]
test(operations): add integration test for receive-transfer-deliver-adjust flow [Phase 10.1 - Priyanshu Kamal]
```

**Commit small and often.** A subphase should be 3–10 commits, not one giant commit — this is what makes
individual contribution legible later, and it's what a reviewer means by "version control is a team sport,"
not just "three names in the README."

## 5. Pull requests & review rotation

- One PR per subphase, opened against `main`, using `.github/PULL_REQUEST_TEMPLATE.md` (must link the phase/
  subphase number and check off the relevant row in `07-roles-and-phase-plan.md`).
- **Review rotation** (so everyone reviews and is reviewed — no single "repo manager"):
  - Priyanshu Kamal's PRs → reviewed by Somya Vishnoi
  - Somya Vishnoi's PRs → reviewed by Aditya Kumar
  - Aditya Kumar's PRs → reviewed by Priyanshu Kamal
- CI (lint + typecheck + tests) must pass before merge; squash-merge to keep `main` history readable.
- No self-merges. If a reviewer is unavailable, either of the other two may review — but never the author.

## 6. `CODEOWNERS` (soft guidance, not a hard gate — roles overlap on purpose, see Phase plan)

```
# .github/CODEOWNERS
/backend/src/modules/auth/          @priyanshu-kamal
/backend/prisma/                    @priyanshu-kamal
/backend/src/modules/operations/    @priyanshu-kamal
/frontend/src/app/(dashboard)/      @somya-vishnoi
/frontend/src/components/           @somya-vishnoi
/backend/src/common/realtime/       @aditya-kumar
/docker-compose.yml                 @aditya-kumar
/.github/                           @aditya-kumar
```

## 7. Live contribution tracker

Copy this table into the PR description or a pinned GitHub Project board; update the `Status` column as work
progresses (`todo` → `in-progress` → `in-review` → `done`). This is the literal source for "who committed what"
during the presentation.

| Phase.Sub | Owner | Branch | Status | PR # |
|---|---|---|---|---|
| 1.1 | Priyanshu Kamal | `phase-01/1.1-priyanshu-kamal-backend-scaffold` | todo | |
| 1.2 | Somya Vishnoi | `phase-01/1.2-somya-vishnoi-frontend-scaffold` | todo | |
| 1.3 | Aditya Kumar | `phase-01/1.3-aditya-kumar-repo-setup` | todo | |
| 2.1 | Priyanshu Kamal | `phase-02/2.1-priyanshu-kamal-auth-warehouse-models` | todo | |
| 2.2 | Somya Vishnoi | `phase-02/2.2-somya-vishnoi-product-stock-models` | todo | |
| 2.3 | Aditya Kumar | `phase-02/2.3-aditya-kumar-operations-ledger-models` | todo | |
| 3.1 | Priyanshu Kamal | `phase-03/3.1-priyanshu-kamal-auth-api` | todo | |
| 3.2 | Somya Vishnoi | `phase-03/3.2-somya-vishnoi-login-signup-ui` | todo | |
| 3.3 | Aditya Kumar | `phase-03/3.3-aditya-kumar-otp-security` | todo | |
| 4.1 | Priyanshu Kamal | `phase-04/4.1-priyanshu-kamal-dashboard-api` | todo | |
| 4.2 | Somya Vishnoi | `phase-04/4.2-somya-vishnoi-app-shell-nav` | todo | |
| 4.3 | Aditya Kumar | `phase-04/4.3-aditya-kumar-dashboard-wiring` | todo | |
| 5.1 | Priyanshu Kamal | `phase-05/5.1-priyanshu-kamal-product-stock-api` | todo | |
| 5.2 | Somya Vishnoi | `phase-05/5.2-somya-vishnoi-products-ui` | todo | |
| 5.3 | Aditya Kumar | `phase-05/5.3-aditya-kumar-stock-view-ui` | todo | |
| 6.1 | Priyanshu Kamal | `phase-06/6.1-priyanshu-kamal-warehouse-location-api` | todo | |
| 6.2 | Somya Vishnoi | `phase-06/6.2-somya-vishnoi-settings-ui` | todo | |
| 6.3 | Aditya Kumar | `phase-06/6.3-aditya-kumar-location-pickers` | todo | |
| 7.1 | Priyanshu Kamal | `phase-07/7.1-priyanshu-kamal-operations-engine` | todo | |
| 7.2 | Somya Vishnoi | `phase-07/7.2-somya-vishnoi-receipts-ui` | todo | |
| 7.3 | Aditya Kumar | `phase-07/7.3-aditya-kumar-delivery-ui-print` | todo | |
| 8.1 | Priyanshu Kamal | `phase-08/8.1-priyanshu-kamal-transfer-adjustment-api` | todo | |
| 8.2 | Somya Vishnoi | `phase-08/8.2-somya-vishnoi-transfer-adjustment-ui` | todo | |
| 8.3 | Aditya Kumar | `phase-08/8.3-aditya-kumar-move-history` | todo | |
| 9.1 | Priyanshu Kamal | `phase-09/9.1-priyanshu-kamal-alerts-realtime-api` | todo | |
| 9.2 | Somya Vishnoi | `phase-09/9.2-somya-vishnoi-notification-ui` | todo | |
| 9.3 | Aditya Kumar | `phase-09/9.3-aditya-kumar-cron-socket-perf` | todo | |
| 10.1 | Priyanshu Kamal | `phase-10/10.1-priyanshu-kamal-backend-tests` | todo | |
| 10.2 | Somya Vishnoi | `phase-10/10.2-somya-vishnoi-frontend-qa` | todo | |
| 10.3 | Aditya Kumar | `phase-10/10.3-aditya-kumar-deploy-demo-prep` | todo | |

## 8. What a reviewer will see (why this matters)

- `git shortlog -sne` shows roughly even commit counts across all three authors.
- `git log --author="Priyanshu Kamal" --oneline` alone tells the story of the database & API being built out phase by
  phase.
- 30 merged PRs, each reviewed by a *different* teammate than the author, each tagged to a phase/subphase in
  `07-roles-and-phase-plan.md` — directly answers "version control is a team sport."

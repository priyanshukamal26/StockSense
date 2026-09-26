# 08 — Git Workflow & Individual Contributions

The brief is explicit: *"Proper use of Git. One member managing the repo isn't enough. Version control is a
team sport."* This doc is what makes each person's contribution independently visible to a reviewer scanning
`git log`, PRs, and file ownership — without slowing anyone down.

## 1. One-time setup (run once, at the very start of Phase 1.3, owned by Person C)

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
git commit -m "chore: initial commit — .gitignore [Phase 1.3 - Person C]"

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
| 1 | `.gitignore` | Person C | `chore: initial commit — .gitignore [Phase 1.3 - Person C]` |
| 2 | `README.md` (skeleton) | Person C | `docs: add README skeleton [Phase 1.3 - Person C]` |
| 3 | `docs/*.md` (all 10 files from this planning pass) | Person C | `docs: add full project documentation set [Phase 1.3 - Person C]` |
| 4 | `CLAUDE.md` | Person C | `docs: add agent operating instructions [Phase 1.3 - Person C]` |
| 5 | `docker-compose.yml` | Person C | `chore: add postgres docker-compose for local dev [Phase 1.3 - Person C]` |
| 6 | `.github/workflows/ci.yml`, PR/issue templates | Person C | `ci: add lint/typecheck/test workflow and PR template [Phase 1.3 - Person C]` |
| 7 | `backend/` scaffold (package.json, tsconfig, folder structure, empty `server.ts`) | Person A | `feat(backend): scaffold express + typescript project [Phase 1.1 - Person A]` |
| 8 | `frontend/` scaffold (Next.js + Tailwind + shadcn init) | Person B | `feat(frontend): scaffold next.js + tailwind + shadcn project [Phase 1.2 - Person B]` |

After step 8, `main` has a working (empty but running) full-stack skeleton with a fully documented spec — every
subsequent subphase branches off this.

## 3. Branching model

Trunk-based with short-lived feature branches, one branch per subphase:

```
main
 ├── phase-01/1.1-person-a-backend-scaffold
 ├── phase-01/1.2-person-b-frontend-scaffold
 ├── phase-01/1.3-person-c-repo-setup
 ├── phase-02/2.1-person-a-auth-warehouse-models
 ├── phase-03/3.2-person-b-login-signup-ui
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
feat(auth): add signup endpoint with password complexity validation [Phase 3.1 - Person A]
feat(ui): build receipts list view with list/kanban toggle [Phase 7.2 - Person B]
fix(operations): prevent validating a delivery with insufficient stock [Phase 7.1 - Person A]
test(operations): add integration test for receive-transfer-deliver-adjust flow [Phase 10.1 - Person A]
```

**Commit small and often.** A subphase should be 3–10 commits, not one giant commit — this is what makes
individual contribution legible later, and it's what a reviewer means by "version control is a team sport,"
not just "three names in the README."

## 5. Pull requests & review rotation

- One PR per subphase, opened against `main`, using `.github/PULL_REQUEST_TEMPLATE.md` (must link the phase/
  subphase number and check off the relevant row in `07-roles-and-phase-plan.md`).
- **Review rotation** (so everyone reviews and is reviewed — no single "repo manager"):
  - Person A's PRs → reviewed by Person B
  - Person B's PRs → reviewed by Person C
  - Person C's PRs → reviewed by Person A
- CI (lint + typecheck + tests) must pass before merge; squash-merge to keep `main` history readable.
- No self-merges. If a reviewer is unavailable, either of the other two may review — but never the author.

## 6. `CODEOWNERS` (soft guidance, not a hard gate — roles overlap on purpose, see Phase plan)

```
# .github/CODEOWNERS
/backend/src/modules/auth/          @person-a
/backend/prisma/                    @person-a
/backend/src/modules/operations/    @person-a
/frontend/src/app/(dashboard)/      @person-b
/frontend/src/components/           @person-b
/backend/src/common/realtime/       @person-c
/docker-compose.yml                 @person-c
/.github/                           @person-c
```

## 7. Live contribution tracker

Copy this table into the PR description or a pinned GitHub Project board; update the `Status` column as work
progresses (`todo` → `in-progress` → `in-review` → `done`). This is the literal source for "who committed what"
during the presentation.

| Phase.Sub | Owner | Branch | Status | PR # |
|---|---|---|---|---|
| 1.1 | Person A | `phase-01/1.1-person-a-backend-scaffold` | todo | |
| 1.2 | Person B | `phase-01/1.2-person-b-frontend-scaffold` | todo | |
| 1.3 | Person C | `phase-01/1.3-person-c-repo-setup` | todo | |
| 2.1 | Person A | `phase-02/2.1-person-a-auth-warehouse-models` | todo | |
| 2.2 | Person B | `phase-02/2.2-person-b-product-stock-models` | todo | |
| 2.3 | Person C | `phase-02/2.3-person-c-operations-ledger-models` | todo | |
| 3.1 | Person A | `phase-03/3.1-person-a-auth-api` | todo | |
| 3.2 | Person B | `phase-03/3.2-person-b-login-signup-ui` | todo | |
| 3.3 | Person C | `phase-03/3.3-person-c-otp-security` | todo | |
| 4.1 | Person A | `phase-04/4.1-person-a-dashboard-api` | todo | |
| 4.2 | Person B | `phase-04/4.2-person-b-app-shell-nav` | todo | |
| 4.3 | Person C | `phase-04/4.3-person-c-dashboard-wiring` | todo | |
| 5.1 | Person A | `phase-05/5.1-person-a-product-stock-api` | todo | |
| 5.2 | Person B | `phase-05/5.2-person-b-products-ui` | todo | |
| 5.3 | Person C | `phase-05/5.3-person-c-stock-view-ui` | todo | |
| 6.1 | Person A | `phase-06/6.1-person-a-warehouse-location-api` | todo | |
| 6.2 | Person B | `phase-06/6.2-person-b-settings-ui` | todo | |
| 6.3 | Person C | `phase-06/6.3-person-c-location-pickers` | todo | |
| 7.1 | Person A | `phase-07/7.1-person-a-operations-engine` | todo | |
| 7.2 | Person B | `phase-07/7.2-person-b-receipts-ui` | todo | |
| 7.3 | Person C | `phase-07/7.3-person-c-delivery-ui-print` | todo | |
| 8.1 | Person A | `phase-08/8.1-person-a-transfer-adjustment-api` | todo | |
| 8.2 | Person B | `phase-08/8.2-person-b-transfer-adjustment-ui` | todo | |
| 8.3 | Person C | `phase-08/8.3-person-c-move-history` | todo | |
| 9.1 | Person A | `phase-09/9.1-person-a-alerts-realtime-api` | todo | |
| 9.2 | Person B | `phase-09/9.2-person-b-notification-ui` | todo | |
| 9.3 | Person C | `phase-09/9.3-person-c-cron-socket-perf` | todo | |
| 10.1 | Person A | `phase-10/10.1-person-a-backend-tests` | todo | |
| 10.2 | Person B | `phase-10/10.2-person-b-frontend-qa` | todo | |
| 10.3 | Person C | `phase-10/10.3-person-c-deploy-demo-prep` | todo | |

## 8. What a reviewer will see (why this matters)

- `git shortlog -sne` shows roughly even commit counts across all three authors.
- `git log --author="Person A" --oneline` alone tells the story of the database & API being built out phase by
  phase.
- 30 merged PRs, each reviewed by a *different* teammate than the author, each tagged to a phase/subphase in
  `07-roles-and-phase-plan.md` — directly answers "version control is a team sport."

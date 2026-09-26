# CLAUDE.md — Agent Operating Instructions for StockSense

You are building **StockSense**, an Inventory Management System for the Odoo Hiring Hackathon. This file is
read automatically at the start of every session (Claude Code) or should be pasted first (Antigravity / any
other IDE agent). **Read this file and every file in `docs/` before writing or changing any code.**

## 0. Non-negotiable rules

1. **Do not deviate from `docs/`.** The wireframes (`docs/02-wireframes-and-ux-flows.md`), the schema
   (`docs/04-database-schema.md`), and the API spec (`docs/05-api-specification.md`) are the contract. If a
   request from the user conflicts with them, or if you find yourself inventing a field name, screen, or status
   value that isn't in `docs/02`, **stop and say so** instead of improvising — either point to the `[ASSUMPTION]`
   note that already covers it, or ask.
2. **No shortcuts that undercut the judging criteria in `docs/01` §9**: no static JSON as a "final" data source,
   no BaaS (Firebase/Supabase/Mongo), no skipping input validation, no direct SQL string concatenation, no
   committing secrets.
3. **This is a hiring hackathon, not a speed run.** Prefer clear, modular, well-named code over clever code.
   Every module should look like it was written by someone who wants to be hired for their engineering
   judgment, not just their typing speed.
4. **Follow the phase order** in `docs/07-roles-and-phase-plan.md` unless the user explicitly says otherwise.
   Don't build Phase 7 (Receipts/Delivery) before Phase 2's schema and Phase 3's auth exist and are merged.
5. **Every subphase ends with a real, working slice** — runnable, testable, and committed per
   `docs/08-git-workflow-and-contributions.md`, not a half-finished stub.

## 1. First-session checklist (run through this once, in order)

1. Read, in this order: `docs/01`, `docs/02`, `docs/03`, `docs/04`, `docs/05`, `docs/06`, `docs/07`, `docs/08`,
   `docs/09`, `docs/10`.
2. Confirm with the user: are we starting from zero, or resuming? If resuming, read
   `docs/08-git-workflow-and-contributions.md` §7 (the contribution tracker table) and `git log --oneline -20`
   to see what's already done before touching anything.
3. If starting from zero:
   a. Run the exact `git init` + file-creation sequence in `docs/08-git-workflow-and-contributions.md` §1–§2.
   b. Ask the user which real names/GitHub handles should replace "Person A / B / C" in `docs/07` and
      `docs/08`, and update those two files accordingly (small, direct edit — don't rewrite the docs).
   c. Ask which phase/subphase to start building, defaulting to **Phase 1** if the user has no preference.
4. Before starting any subphase, restate in one or two lines: which phase/subphase, which owner "lane" it
   belongs to (Backend/Frontend/Integration — see `docs/07` §1), and which doc sections govern it. This keeps
   the human in the loop about *why* something is being built a certain way.

## 2. Resuming an existing session (paste this style of prompt in a fresh chat)

> "Resume StockSense. Read `CLAUDE.md` and `docs/08-git-workflow-and-contributions.md` §7 for current status,
> check `git log --oneline -20` and the current branch, and continue with the next incomplete subphase in
> `docs/07-roles-and-phase-plan.md` for **[Person A / B / C]**. Don't touch phases outside that lane unless I
> ask."

## 3. How to work within a subphase

1. Re-read the relevant row in `docs/07-roles-and-phase-plan.md` plus whichever of `docs/02` / `docs/04` /
   `docs/05` / `docs/06` / `docs/09` it references.
2. Create a branch named exactly per `docs/08` §3 (`phase-<NN>/<subphase>-<owner>-<slug>`).
3. Implement in small commits, each matching the convention in `docs/08` §4 — don't squash your own work into
   one commit; the granularity is part of what's being judged.
4. Before calling a subphase "done," walk the checklist in `docs/10-testing-and-demo-script.md` §3.
5. Open a PR, fill in the template, tag the correct reviewer per the rotation in `docs/08` §5, and update the
   status in the contribution tracker (`docs/08` §7).

## 4. Ambiguity policy

- Wireframe silent on something (e.g. exact Products master screen, Adjustment screen)? Use the
  `[ASSUMPTION]` design already proposed in `docs/02`, and mention out loud that it's an assumption rather than
  presenting it as spec.
- Architecture/library choice not covered in `docs/03`? Prefer the smallest, most standard, free/open-source
  option that fits the existing stack — don't introduce a new framework, ORM, or state-management library
  without flagging it to the user first.
- If a task genuinely can't be completed within the current tech stack constraints (no BaaS, free-only), say so
  explicitly rather than quietly reaching for a disallowed shortcut.

## 5. Quick reference — stack & shell commands

```bash
# Postgres
docker compose up -d

# Backend (from /backend)
npm run dev            # dev server
npx prisma studio       # inspect the DB visually
npx prisma migrate dev --name <name>
npx prisma db seed

# Frontend (from /frontend)
npm run dev
npx shadcn@latest add <component>   # e.g. `sidebar`, `table`, `command`

# Tests
npm test                # backend: Jest+Supertest · frontend: Vitest+RTL
```

## 6. What "done" looks like for the whole project

The acceptance test is the end-to-end script in `docs/10-testing-and-demo-script.md` §2: sign up/log in →
receive 100kg Steel → internal-transfer it → deliver 20kg → adjust −3kg damaged → every step reflected correctly
in the Stock view, Move History, Dashboard KPIs, and a real-time low-stock notification — built by three people
whose individual contributions are visible in `git log`.

# 06 — Design System: LaunchDarkly-inspired, built on shadcn/ui

Goal stated by the team: *"Try to replicate LaunchDarkly's design and layout. Contents are ours. Use shadcn for
the dashboard, as if it's a very, very premium $10,000 highly-designed website."* This doc translates that into
concrete, buildable tokens and component choices — no hand-waving.

## 1. Source of truth for the palette

Pulled from LaunchDarkly's public brand assets (real, verifiable hex values — not guessed):

| Token | Hex | Role |
|---|---|---|
| `--brand-primary` | `#405BFF` (LaunchDarkly "Dodger Blue") | Primary actions, links, focus rings, active nav item |
| `--ink` | `#191919` (LaunchDarkly "Cod Gray") | Sidebar background, hero/dark surfaces, primary headings on light bg |
| `--surface` | `#FFFFFF` | Main canvas / cards |
| `--muted-1` | `#F7F7F8` | Page background (light mode) |
| `--muted-2` | `#E7E7E9` | Borders, dividers, table row hover |
| `--muted-3` | `#969696` | LaunchDarkly's documented mid-gray — secondary text, placeholders |
| `--muted-4` | `#6B6B6F` | Body text on light surfaces |
| `--accent-lime` | `#B4FF39`-family (LaunchDarkly secondary accent) | Sparingly: chart highlight, "new" badges — **never** for status semantics |

**Deliberate departure from LD:** LaunchDarkly's marketing site uses capability-specific accent colors (orange,
purple, magenta…) purely for illustration. StockSense is an operational app, not a marketing site, so we do
**not** reuse those as decoration. Semantic status colors are a fixed, separate palette (§3) so they are never
ambiguous with branding — this is a deliberate, documented UX decision, not an oversight.

```css
:root {
  --brand-primary: #405BFF;
  --brand-primary-hover: #3349D6;
  --ink: #191919;
  --surface: #FFFFFF;
  --muted-1: #F7F7F8;
  --muted-2: #E7E7E9;
  --muted-3: #969696;
  --muted-4: #6B6B6F;

  --success: #16A34A;   /* Done, "IN" moves */
  --warning: #D97706;   /* Waiting */
  --danger:  #DC2626;   /* Cancelled, "OUT" moves, out-of-stock line */
  --info:    #405BFF;   /* Ready — reuse brand blue, it reads as "in progress/primary" */
  --neutral: #969696;   /* Draft */

  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-pill: 9999px;
}
```

## 2. Typography

LaunchDarkly's real headline face ("Audimat 3000") is a licensed commercial font — not free, so we don't ship
it. We replicate the *spirit* (geometric sans, confident weight jumps 400→800) with a free equivalent:

- **Primary typeface:** `Inter` (variable font, free, Google Fonts) — body text, UI chrome, tables.
- **Display typeface:** `General Sans` or `Space Grotesk` (free, geometric, slightly more character for
  page titles like "Dashboard", "Receipts") — used only for `h1`/page-title scale.
- **Scale:** `12 / 14 / 16 (base) / 18 / 24 / 32 / 40px`, weights `400, 500, 600, 700, 800`.
- Page titles: 24–32px, weight 700–800, `--ink`. Table/body text: 14px, weight 400–500, `--muted-4`.

## 3. Status color mapping (applies everywhere a status badge appears)

| Status | Color token | Used on |
|---|---|---|
| `DRAFT` | `--neutral` (gray badge) | Receipt/Delivery/Transfer/Adjustment |
| `WAITING` | `--warning` (amber badge) | Delivery |
| `READY` | `--info` (blue badge) | All operation types |
| `DONE` | `--success` (green badge) | All operation types |
| `CANCELLED` | `--danger` (red badge, strikethrough reference) | All operation types |
| Move History **IN** | `--success` text/row accent | per wireframe: "In moves should be green" |
| Move History **OUT** | `--danger` text/row accent | per wireframe: "Out moves should be red" |
| Delivery line, insufficient stock | `--danger` background tint on the row | per wireframe: "mark the line red if product is not in stock" |

## 4. Layout, translated from LaunchDarkly's marketing-site moves into an app shell

LaunchDarkly's site uses a **dual-canvas strategy**: a near-black field up top, inverting to pure white below,
with a strict grid and generous negative space. For an authenticated dashboard app, that becomes:

- **Sidebar:** fixed, `--ink` (#191919) background, white/`--muted-3` text, `--brand-primary` for the active
  item (left accent bar + icon tint) — this is the "near-black canvas" half.
- **Main canvas:** `--muted-1` page background with `--surface` white cards — the "inverts to pure white" half.
- **Grid & spacing:** 8pt spacing scale (`4, 8, 12, 16, 24, 32, 48px`), content max-width `1440px`, 24px gutters.
- **Radius:** cards `--radius-lg` (16px), inputs/buttons `--radius-md` (10px), primary CTA buttons
  `--radius-pill` — LaunchDarkly's signature pill-shaped CTA — reserved for the single most important action
  per screen (e.g. **Validate**, **SIGN IN**, **NEW**).
- **Motion:** 150–200ms ease-out on hover/press, subtle shadow elevation on card hover — "dynamic movement,"
  never gratuitous.

## 5. shadcn/ui component mapping (per screen, from `02-wireframes-and-ux-flows.md`)

Install via the shadcn CLI, then re-theme (do not hand-roll components shadcn already provides):

| Wireframe element | shadcn/ui component(s) |
|---|---|
| App shell / left sidebar with sections | `sidebar` block (the official collapsible sidebar-07 pattern) + `separator` |
| Top bar search, profile menu | `command` (⌘K palette) for global search, `dropdown-menu` for the `A` avatar menu |
| Dashboard KPI cards | `card` + `badge` + Recharts sparkline inside |
| List views (Receipts/Delivery/Move History/Products) | `table` + `input` (search) + `tabs` (List/Kanban toggle) + `badge` (status) |
| Kanban view (grouped by status) | Custom board using `card` columns, drag optional (stretch) |
| New/Edit forms (Warehouse, Location, Product, Operation) | `form` (react-hook-form wrapper) + `input` + `select` + `textarea` + `date-picker` (popover + calendar) |
| Status stepper (Draft → Ready → Done) | Custom `Stepper` built from `separator` + `badge`, or `progress` with labeled steps |
| Validate / Print / Cancel action bar | `button` (primary pill for Validate, `outline` for Print, `ghost`/`destructive` for Cancel) |
| Add New Product row in an operation | `combobox` (searchable `popover` + `command`) for product SKU search |
| Out-of-stock alert on a line | `alert` (inline, `variant="destructive"`) + row background tint |
| Notification bell | `popover` + `scroll-area` + `badge` (unread count) |
| Toasts (validate success, low-stock alert) | `sonner` |
| Loading states | `skeleton` |
| Login / Sign up / Forgot Password | `card` centered on a `--ink` background (mirrors LD's dark hero), `input`, `button` (pill, `--brand-primary`) |

## 6. Accessibility & responsiveness baseline

- All interactive elements keyboard-reachable; shadcn/Radix gives this by default — do not override focus outlines, restyle them using `--brand-primary` instead.
- Color is never the only signal: status badges carry text, not just color; the red delivery-line alert also shows an `alert` icon + message, not just a red background.
- Tables collapse to stacked cards below `768px`; sidebar collapses to an icon rail below `1024px` (shadcn sidebar handles this out of the box).
- Minimum contrast: body text `--muted-4` on `--surface`/`--muted-1` meets WCAG AA; verify any new color pairing before shipping.

## 7. What "premium $10k site" actually means here (checklist for Phase 10 polish pass)

- No default shadcn gray theme left un-themed — every screen uses the tokens in §1, not shadcn's defaults.
- Empty states are designed, not blank ("No receipts yet — create your first one" with an illustration-free,
  icon + CTA pattern), loading states use `skeleton` not spinners-only, error states are specific.
- Consistent 24px page padding, consistent card radius/shadow across every screen.
- Real, correctly-formatted data everywhere (currency, dates, pluralization) — no lorem ipsum in the final build.
- Micro-interactions: hover states, pill buttons, subtle shadow-on-hover for cards — matches LD's "sharp,
  dynamic" visual language without copying their marketing illustrations (those are LaunchDarkly's IP; our
  *content* is entirely original per the team's own instruction).

# Plumbing App — Agent Guide

## Stack
- **Framework:** SvelteKit 2 + Svelte 5 (runes mode)
- **Styling:** Tailwind CSS v4 (CSS-first, no `tailwind.config.js`)
- **Database:** PostgreSQL + Drizzle ORM + `postgres` driver
- **Type checking:** `svelte-check` (not `tsc`)
- **Package manager:** npm
- **Adapter:** auto (auto-detects Vercel/Netlify/Cloudflare)

## Commands
| Command | Purpose |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build locally |
| `npm run check` | Type-check via `svelte-check` |
| `npm run db:generate` | Generate Drizzle migration from schema changes |
| `npm run db:push` | Push schema directly to DB (dev only) |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:studio` | Launch Drizzle Studio (GUI DB browser) |

Run **`npm run check`** before committing — it catches type errors that `tsc` would miss.

## Svelte 5 Runes (required in this project)
- `let { children } = $props()` for component props + `{@render children()}` for slots
- `let count = $state(0)` instead of `let count = 0`
- `$derived(...)` or `$derived.by(() => {...})` instead of `$:`
- `$effect(() => {...})` for reactive effects
- **Shared state across pages**: use `writable` from `svelte/store` (not `.svelte.ts` runes modules — `$lib/store.ts` with `booking.update()`, `booking.set()`, and `$booking` auto-subscription)
- Avoid `get()` inside `$derived` — use `$store` syntax directly in the derived expression

## Project structure
```
src/
  routes/              — SvelteKit pages / API routes
    +page.svelte       — Select Service (step 1)
    describe-problem/
      +page.svelte     — Describe Problem (step 2)
    location/
      +page.svelte     — Enter Location (step 3)
    schedule/
      +page.svelte     — Pick Date & Time (step 4)
    estimate/
      +page.svelte     — AI Price Estimate (step 5)
    +layout.svelte     — Root layout (step progress bar)
    layout.css         — Tailwind import + custom theme
  lib/
    types.ts           — Service, BookingState interfaces
    store.ts           — writable booking store
    StepProgress.svelte — Step indicator component
    db/
      index.ts         — DB client (`db` from `drizzle(postgres(DATABASE_URL))`)
      schema.ts        — Drizzle schema (`bookings` table)
    assets/            — Static assets (favicon)
  app.html             — HTML shell
  app.d.ts             — App namespace type declarations
static/                — Static assets (served at /)
docs/                  — Figma design screenshots (source of truth for UI)
```

## Routes flow
`/` → `/describe-problem` → `/location` → `/schedule` → `/estimate` → `/confirmation`

## Tailwind CSS v4
- Import via `@import "tailwindcss"` in CSS files (already in `src/routes/layout.css`)
- No `tailwind.config.js` — use CSS-first config (`@theme` in CSS) if custom theme needed
- No `@tailwind` directives

## Design files
Figma screenshots in `docs/` are the UI spec. Screens (all Desktop):
1. `Select Service (Desktop).png`
2. `Describe Problem (Desktop)-*.png` (4 service variants)
3. `Enter Location (Desktop).png`
4. `Pick Date & Time (Desktop).png`
5. `AI Price Estimate (Desktop).png`

## Coding conventions
- **TypeScript** everywhere (`.svelte` + `<script lang="ts">`)
- **Runes** required — never use legacy `export let`, `$:`, or `on:click`
- Use `$lib/` path alias for imports from `src/lib/`
- No semicolons (project convention from scaffold)
- `.npmrc` sets `engine-strict=true` — Node version must satisfy kit requirements
- No testing setup yet

## Database setup
1. Copy `.env.example` to `.env` and set your `DATABASE_URL`
2. Run `npm run db:push` to create tables (dev) or `npm run db:generate && npm run db:migrate` (production)
3. Schema lives in `src/lib/db/schema.ts` — any change there requires a new migration

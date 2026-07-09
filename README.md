# Sanitation Modernist

A bilingual (Khmer / English) plumbing & sanitation service booking app for the Cambodian market. Customers pick a service, describe the problem (with optional AI triage), set a location and time, get an itemized price estimate, and confirm a booking.

**Stack:** SvelteKit (Svelte 5 runes) · TypeScript · Tailwind CSS v4 · Drizzle ORM · Turso (LibSQL/SQLite) · deployed on Vercel.

## Features

- **6-step booking flow** — Select Service → Describe Problem → Location → Date & Time → AI Price Estimate → Confirmation.
- **Dynamic pricing** — total = base fee + district travel fee + urgency surcharge (routine $0 / urgent $5 / emergency $15) + parts (50% of base). Shown in KHR and USD.
- **AI problem triage** (`/api/analyze`) — powered by Claude (`claude-opus-4-8`) when an API key is configured, with a keyword heuristic fallback so it always works. Returns severity, a suggested urgency, a refined description for the technician, and likely causes. Reads uploaded photos.
- **Photo uploads** — downscaled client-side to lightweight JPEG thumbnails, then persisted with the booking.
- **Real slot availability** — the schedule page queries the DB and disables time slots already booked for the chosen date.
- **Technician assignment** — deterministic pick from a roster based on service specialty and district, with a tap-to-call action.
- **Location tools** — browser geolocation, district selection with live travel-fee display, and saved addresses (localStorage).
- **Booking history** (`/history`) — past bookings from the DB plus locally saved estimates.

## Prerequisites

- Node.js 20+
- A [Turso](https://turso.tech) database (LibSQL)

## Setup

```sh
npm install
cp .env.example .env   # then fill in the values below
```

Environment variables (`.env`):

| Variable | Required | Purpose |
| --- | --- | --- |
| `TURSO_DATABASE_URL` | yes | LibSQL connection URL (`libsql://…` or `file:local.db` for local dev) |
| `TURSO_AUTH_TOKEN` | yes* | Turso auth token (not needed for a local `file:` DB) |
| `ANTHROPIC_API_KEY` | no | Enables real Claude-powered problem analysis on the Describe Problem step. Without it, a built-in keyword heuristic is used. |

## Developing

```sh
npm run dev              # start the dev server
npm run dev -- --open    # …and open it in a browser
npm run check            # type-check with svelte-check
```

## Building

```sh
npm run build            # production build (Vercel adapter)
npm run preview          # preview the production build locally
```

## Database

The schema lives in `src/lib/db/schema.ts` (single `bookings` table). Drizzle scripts:

```sh
npm run db:generate      # generate a migration from schema changes
npm run db:push          # push the schema directly to the database
npm run db:studio        # open Drizzle Studio
```

> **Note:** `npm run db:migrate` does **not** work on this project — the table was originally created via `db:push`, so the initial `0000` migration's `CREATE TABLE` conflicts with the existing table and the run aborts. Apply schema changes with `db:push`, or run additive `ALTER TABLE … ADD COLUMN` statements directly against Turso.

## Project structure

```
src/
├── lib/
│   ├── data.ts            # technicians, districts + travel fees, support contacts
│   ├── pricing.ts         # estimate calculation (fees, surcharges, KHR conversion)
│   ├── store.ts           # booking state + service search query (Svelte stores)
│   ├── types.ts           # Service/BookingState types, SERVICES catalog, STEPS
│   ├── db/                # Drizzle schema + client
│   ├── StepProgress.svelte
│   └── TechnicianCard.svelte
└── routes/
    ├── +layout.svelte             # navbar (search, nav, contact) + footer
    ├── +page.svelte               # 1. Select Service
    ├── describe-problem/          # 2. Describe Problem (photos + AI Assist)
    ├── location/                  # 3. Location (map, geolocation, saved addresses)
    ├── schedule/                  # 4. Date & Time (real slot availability)
    ├── estimate/                  # 5. AI Price Estimate
    ├── confirmation/              # 6. Confirmation
    ├── history/                   # My Bookings
    └── api/
        ├── bookings/              # POST create · GET history · GET ?date= (slots)
        └── analyze/               # POST — AI problem triage
```

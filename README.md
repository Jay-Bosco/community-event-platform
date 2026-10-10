# Community Event Platform

48-hour challenge: customers suggest and upvote events; venue managers approve or reject suggestions for their venues.

Demo content is **Lagos-based** (Ikeja, Yaba, etc.).

```
community-event-platform/
  frontend/          # Next.js (App Router), Tailwind, TypeScript
  backend/           # Express + TypeScript + Zod + Supabase
  backend/supabase/  # schema.sql (already applied on the shared project)
  package.json       # root scripts: setup, seed, dev, test
  README.md
```

## Setup

Env files for the shared Supabase project are provided with the submission (`backend/.env` and `frontend/.env.local`). Drop them into place if they are not already in the repo, then from the root:

```bash
npm run setup
npm run seed
npm run dev
```

| Service | URL |
|---------|-----|
| API | http://localhost:4210 (`GET /health`) |
| UI | http://localhost:3000 (or whatever port Next prints, e.g. 3001 or 3002) |

Separate terminals if you prefer:

```bash
npm run dev:api
npm run dev:web
```

`frontend/.env.local` should contain:

```
NEXT_PUBLIC_API_URL=http://localhost:4210
```

The Next app talks **only** to Express. It does not write directly to Supabase tables.

### Seed accounts

Password for **all**: `Password123!`

| Email | Role | Notes |
|-------|------|--------|
| manager1@example.com | venue_manager | Ikeja City Mall Courtyard |
| manager2@example.com | venue_manager | Yaba Tech Hub Hall |
| customer1@example.com | customer | suggest / upvote |
| customer2@example.com | customer | |
| customer3@example.com | customer | |
| customer4@example.com | customer | |
| customer5@example.com | customer | |

Seed includes more Lagos events (pending / approved / rejected) with uneven upvote counts so the manager queue sort is obvious.

### Tests

```bash
npm test
```

Covers vote uniqueness, role guards, and status transitions.

## Architecture

- **Boundary:** Browser → Express REST API → Supabase (Auth + Postgres). Frontend never uses the service role or tables directly.
- **Auth:** Supabase email/password. Express checks `Authorization: Bearer` with `supabase.auth.getUser`. DB work uses the **service_role** client.
- **Roles:** `customer` \| `venue_manager` in `profiles`, enforced with `requireRole` on protected routes (not UI-only).
- **Queue:** Creating a suggestion sets `status = pending` immediately (automatic queue entry — no separate “submit” step).
- **Votes:** Unique `(user_id, event_id)` at DB level; `upvote_count` denormalized for fast queue sort.
- **Status lifecycle:** `pending → approved` or `pending → rejected`. Rejected events are **not** resubmitted; customer creates a new suggestion.
- **Venue ownership:** One manager per venue (`venues.manager_id`). Managers only see queues for venues they own.
- **Frontend session:** Tab-scoped `sessionStorage` ( a new tab must log in again). Idle logout after 15 minutes.

### Main API

| Method | Path | Who |
|--------|------|-----|
| POST | `/api/auth/register` | public |
| POST | `/api/auth/login` | public |
| POST | `/api/auth/refresh` | public |
| GET | `/api/auth/me` | auth |
| GET | `/api/venues` | auth |
| GET | `/api/events` | auth |
| POST | `/api/events` | customer |
| POST | `/api/events/:id/vote` | customer |
| DELETE | `/api/events/:id/vote` | customer |
| GET | `/api/manager/queue` | venue_manager |
| POST | `/api/manager/events/:id/approve` | venue_manager |
| POST | `/api/manager/events/:id/reject` | venue_manager |

### Frontend pages

| Path | Who |
|------|-----|
| `/login`, `/signup` | public (role chosen on signup) |
| `/events` | authenticated (customers upvote; managers can browse) |
| `/events/new` | customers |
| `/manager/queue` | venue managers |

## Assumptions

1. Creating a suggestion auto-enters the manager queue as `pending`.
2. Rejected events cannot be resubmitted — create a new suggestion.
3. Each venue has exactly one manager.
4. A manager with no venues gets an empty queue (200), not a 500.
5. Signup role is stored in `profiles` and enforced on every protected API route.

## Tradeoffs / cut for time

- **Supabase cloud** instead of local SQLite — real Postgres + Auth; shared project credentials are provided for evaluators.
- **Denormalized `upvote_count`** — simple sorting; a trigger/RPC would be stricter under concurrency.
- **No realtime** — refresh/poll
- **No Docker** in v1 — root `npm run setup && npm run seed && npm run dev` is the path.
- **UI** is usable, not pixel-perfect.

With more time I’d harden vote counting under concurrency, add clearer empty states for managers without venues, tighten validation messages, and polish UI and mobile layouts a bit more.

## Tools

I used Cursor for some scaffolding and boilerplate (routes and seed stub). Core decisions, authentication, and the flows were done and reviewed by me.

More detail: [`backend/README.md`](./backend/README.md), [`frontend/README.md`](./frontend/README.md).

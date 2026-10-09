# Backend (Express API)

Express + TypeScript + Zod, with Supabase Auth and Postgres.

Part of the `community-event-platform` monorepo — **prefer the [root README](../README.md)** for full setup.

## Run from this folder

Use the provided `backend/.env` (shared Supabase project). Then:

```bash
npm install
npm run seed
npm run dev
```

API: http://localhost:4210 — `GET /health`

Schema reference: [`supabase/schema.sql`](./supabase/schema.sql) (already applied on the shared project).

## Seed accounts

Password: `Password123!`

| Email | Role | Venue |
|-------|------|--------|
| manager1@example.com | venue_manager | Ikeja City Mall Courtyard |
| manager2@example.com | venue_manager | Yaba Tech Hub Hall |
| customer1@example.com | customer | |
| customer2@example.com | customer | |
| customer3@example.com | customer | |

## API

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/auth/register` | public |
| POST | `/api/auth/login` | public |
| POST | `/api/auth/refresh` | public |
| GET | `/api/auth/me` | authenticated |
| GET | `/api/venues` | authenticated |
| GET | `/api/events` | authenticated |
| POST | `/api/events` | customer |
| POST | `/api/events/:id/vote` | customer |
| DELETE | `/api/events/:id/vote` | customer |
| GET | `/api/manager/queue` | venue_manager |
| POST | `/api/manager/events/:id/approve` | venue_manager |
| POST | `/api/manager/events/:id/reject` | venue_manager |

Roles and venue scoping are enforced on the server.

## Tests

```bash
npm test
```

## Design notes

See root README for architecture, assumptions, tradeoffs, and AI note. 

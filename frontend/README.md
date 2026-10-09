# Frontend (Next.js)

Next.js (App Router) UI. Talks **only** to the Express API (`NEXT_PUBLIC_API_URL`) — no direct Supabase table access from the browser.

Part of the `community-event-platform` monorepo — **prefer the [root README](../README.md)** for full setup.

## Run from this folder

1. Start the backend first (`npm run seed` + `npm run dev` in `../backend`).
2. Use the provided `frontend/.env.local`, then:

```bash
npm install
npm run dev
```

`.env.local` should contain:

```
NEXT_PUBLIC_API_URL=http://localhost:4210
```

App: http://localhost:3000 (or the port Next prints).

## Seed logins

Password: `Password123!`

- `customer1@example.com` — browse, upvote, suggest
- `manager1@example.com` — Ikeja City Mall Courtyard queue

## Pages

| Path | Who |
|------|-----|
| `/login`, `/signup` | public |
| `/events` | authenticated |
| `/events/new` | customers |
| `/manager/queue` | venue managers |

Client-side route guards are for UX; **authorization is enforced by the API**.

## Session

- Tokens in **sessionStorage** (same-tab refresh OK; new tab must log in)
- 15-minute idle timeout
- `Authorization: Bearer` on API calls; refresh on 401

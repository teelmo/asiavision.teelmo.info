# Asiavision 2026 — friends-only voting app

A small Next.js app for running Eurovision-style voting among your friends.

## How voting works

- There are 11 participating countries (edit the list in `prisma/seed.ts` — see below).
- Each voter gives out exactly four scores: **12, 10, 8, and -4 points**, each to a
  different country. Every other country gets nothing from that voter.
- Each voter gets a unique, one-time voting link. They can't see anyone else's votes
  or vote twice.
- The **results page** (`/results`) is public and updates every few seconds, but
  while voting is open it only shows the current *ranking* — never the actual point
  totals, so nobody can reverse-engineer who voted for what.
- The host sets a "voters needed" threshold. Once that many people have voted, the
  poll **finalizes**: voting closes, and the results page flips to a "locked" screen
  that hides the ranking entirely.
- The host can then hit **Reveal** whenever they're ready for the big moment — the
  results page switches to the full scoreboard with points. Hitting it again hides
  the board, in case you want to re-run the reveal live.

## First-time setup

```bash
npm install
cp .env.example .env
```

Edit `.env`:
- `ADMIN_PASSWORD` — the password you (the host) use to log in at `/admin`.
- `ADMIN_SESSION_SECRET` — any random string; generate one with `openssl rand -hex 32`.

Then create and seed the database:

```bash
npm run db:push
npm run db:seed
```

Run it:

```bash
npm run dev
```

Open http://localhost:3000.

## Editing the country lineup

`prisma/seed.ts` currently ships with a **placeholder** list of 11 countries — swap
it for the real Asiavision 2026 lineup before you start collecting real votes:

```ts
const COUNTRIES = [
  { code: "JPN", name: "Japan", flag: "🇯🇵" },
  // ...
];
```

After editing, re-run `npm run db:seed` (it's idempotent — safe to re-run any time;
it won't touch existing votes).

## Running the show

1. Go to `/admin`, log in with `ADMIN_PASSWORD`.
2. Paste in your friends' names (one per line) and click **Add**. Each gets a unique
   voting link — click **Copy link** next to their name and send it to them (DM,
   group chat, whatever).
3. Set **"Voters needed to finalize"** to however many people need to vote before
   the poll locks (e.g. if you have 8 friends but expect 1-2 to flake, set it to 6).
   Leave it at 0 to never auto-finalize.
4. Share `/results` with the group so everyone can watch the live ranking as votes
   come in.
5. Once finalized, hit **Reveal final results** whenever you're ready — e.g. during
   a call, so everyone sees the scores drop live together.
6. **Reset poll** wipes all ballots and reopens voting (keeps the same voter list) —
   handy for a test run before the real thing.

## Deploying so your friends can reach it

This is a normal Next.js app with a local SQLite database — easiest options:

- **Fly.io / Railway / Render**: deploy with a persistent volume for the SQLite file
  (`prisma/dev.db`), set the env vars from `.env.example`.
- **Vercel**: works, but Vercel's filesystem is ephemeral — swap `DATABASE_URL` for a
  hosted Postgres/SQLite (e.g. Turso, Neon) instead of the local file in that case.

Whatever you choose, serve it over **HTTPS** — the admin login cookie is marked
`Secure` in production and won't be sent over plain HTTP (localhost is exempted by
browsers, so local testing works fine either way).

## Tech notes

- Next.js 14 (App Router) + TypeScript + Tailwind CSS.
- SQLite via Prisma — fine for a friend-group-sized poll; swap the Prisma
  datasource for Postgres if you outgrow it.
- Live results use polling (every 4s) rather than WebSockets — simple and plenty
  fast for this scale.
- Admin auth is a single shared password + signed cookie (`lib/admin-auth.ts`) —
  intentionally simple, not meant for anything beyond "keep randoms off your
  friend's voting admin panel."

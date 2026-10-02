# Asiavision 2026 — friends-only voting app

A small Next.js app for running Eurovision-style voting among your friends.

## How voting works

- There are 11 participating countries (edit the list in `lib/countries.ts` — see
  below).
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

## Storage: just a JSON file

No database to install. All voter/vote/settings state lives in a single file at
`data/db.json`, created automatically on first run. Writes go through a small
in-process lock (`lib/store.ts`) so two people voting at the same instant can't
corrupt the file.

That one simplification comes with one real constraint: **the app must run as a
single, long-lived Node process** (e.g. `npm start` on a VPS or always-on box) —
not spread across multiple serverless instances, which wouldn't share the lock or
necessarily share a writable disk. A normal `npm run dev` / `npm start` setup is
exactly that, so this only matters if you deploy to something like Vercel.

Backing up or inspecting state is just `cat data/db.json` or `cp` it somewhere.
Wiping everything (voters included) for a clean slate: `npm run data:wipe`.

## First-time setup

```bash
npm install
cp .env.example .env
```

Edit `.env`:
- `ADMIN_PASSWORD` — the password you (the host) use to log in at `/admin`.
- `ADMIN_SESSION_SECRET` — any random string; generate one with `openssl rand -hex 32`.

Run it:

```bash
npm run dev
```

Open http://localhost:3000.

## Editing the country lineup

`lib/countries.ts` currently ships with a **placeholder** list of 11 countries —
swap it for the real Asiavision 2026 lineup before you start collecting real votes:

```ts
export const COUNTRIES: Country[] = [
  { id: 1, code: "JPN", name: "Japan", flag: "🇯🇵" },
  // ...
];
```

Keep the `id` values stable once voting has started — they're what ties existing
votes in `data/db.json` to a country. Restart the app after editing this file.

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

This is a normal Next.js app with everything in a local JSON file — easiest options:

- **A VPS / home server / Fly.io / Railway / Render**: run `npm run build && npm
  start` as a persistent process, with `data/` on a persistent disk/volume.
- **Vercel or other serverless hosts**: avoid — the filesystem isn't guaranteed
  persistent or shared across instances, which breaks the whole point of this
  storage model. If you want serverless, you'd want a real database instead (see
  below).

Whatever you choose, serve it over **HTTPS** — the admin login cookie is marked
`Secure` in production and won't be sent over plain HTTP (localhost is exempted by
browsers, so local testing works fine either way).

### If you outgrow the JSON file

If this ever needs to run across multiple instances, or you'd just rather use a
real database you already run (e.g. a MariaDB/MySQL instance), swap `lib/store.ts`
for queries against that database — the rest of the app (API routes, pages) only
calls the handful of functions it exports (`getDB`, `mutate`, `newToken`), so the
storage layer is isolated from everything else.

## Tech notes

- Next.js 14 (App Router) + TypeScript + Tailwind CSS.
- State lives in `data/db.json`, read/written through `lib/store.ts`'s locked
  read-modify-write helper — no database server, no native dependencies.
- Live results use polling (every 4s) rather than WebSockets — simple and plenty
  fast for this scale.
- Admin auth is a single shared password + signed cookie (`lib/admin-auth.ts`) —
  intentionally simple, not meant for anything beyond "keep randoms off your
  friend's voting admin panel."

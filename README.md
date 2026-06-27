# World Cup 2026 — companion app

A fast, installable (PWA) web app for the FIFA World Cup 2026: fixtures in
**German time (CET/CEST)** with a clickable **match detail page** including
scorers when event data is available, group standings with W/D/L, Monte-Carlo
**advancement & title odds**, an auto-seeding knockout **bracket**, real country
flags, and follow-your-team favorites with kickoff reminders.

> Uses **live data from ESPN's public API** by default — fresher scores, no API
> key, no proxy. football-data.org and a bundled offline schedule are selectable
> fallbacks. All match times are shown in German time for every viewer,
> regardless of their location.

**Live:** https://madniabdulwahab.github.io/fifa26/ (deployed via GitHub Pages).

### Documentation

- **[ABOUT.md](ABOUT.md)** — full description of every feature and how it works.
- **[CLAUDE.md](CLAUDE.md)** — codebase map / context for AI assistants.
- This README — setup, scripts, architecture overview, and deployment.

## Tech stack

| Concern         | Choice                                 |
| --------------- | -------------------------------------- |
| UI              | React 18 + TypeScript + Vite           |
| Styling         | Tailwind CSS (light/dark)              |
| Data fetching   | TanStack Query                         |
| Routing         | React Router                           |
| Dates/times     | Day.js (UTC → fixed German timezone, Europe/Berlin) |
| Install/offline | vite-plugin-pwa (service worker)       |
| Tests           | Vitest                                 |

## Quick start

```bash
npm install
npm run icons   # generate PWA icons (one-time)
npm run dev     # http://localhost:5173
```

Other scripts: `npm run build`, `npm run preview`, `npm test`, `npm run lint`,
`npm run format`.

## Architecture

The app is layered so each piece can change independently:

```
src/
  domain/      Framework-free types (Team, Match, GroupStandings, …)
  data/        DataSource interface + implementations (static, live API)
  lib/         Pure logic: datetime, record, standings, bracket, advancement
  stores/      Observable state (favorites)
  hooks/       React glue (favorites, theme, reminders)
  components/   Reusable UI (MatchCard, StandingsTable, Bracket, OddsBar, …)
  pages/       Routed screens (Fixtures, Standings, Bracket, Team, Favorites)
  app/         App shell, navigation, TournamentContext (loads + derives data)
```

Key design choices:

- **`DataSource` boundary** (`src/data/DataSource.ts`): the UI only ever sees
  domain types. `createDataSource()` picks the implementation from config, so
  adding a new backend (GraphQL, your own API) is a one-file change.
- **Pure logic in `src/lib`** is fully unit-tested and reused everywhere —
  e.g. the Poisson `model.ts` powers the odds simulation.
- **Deterministic randomness** (`src/lib/rng.ts`) means odds are stable across
  reloads and reproducible in tests.

## Data sources

The main source is chosen by `VITE_DATA_SOURCE` (`espn` | `api` | `static`).

### ESPN (default)

`VITE_DATA_SOURCE=espn` reads fixtures, scores, statuses and stages from ESPN's
public site API (`site.api.espn.com`, competition `fifa.world`). It's **key-less
and CORS-enabled**, so it works in dev and on GitHub Pages with **no token and no
proxy**, and updates scores promptly. The fixed group draw + FIFA codes/ratings
come from the bundled `SEED_TEAMS` (ESPN doesn't tag the group letter).

> ESPN's API is **undocumented/unofficial** — no SLA and it could change. All
> ESPN-specific code is isolated in `src/data/espn/` and fails soft; the `api`
> and `static` sources below remain one env var away.

### football-data.org (`api`)

```bash
cp .env.example .env   # then set VITE_DATA_SOURCE=api
VITE_FOOTBALL_DATA_TOKEN=your_free_token   # https://www.football-data.org/client/register
```

Reads fixtures/results from football-data.org (competition `WC`). In dev, Vite
proxies `/football-data` to avoid CORS. **Production:** it sends no CORS headers
and the token must not ship in client code — deploy the proxy in
[`proxy/`](proxy/README.md) and set `VITE_FOOTBALL_DATA_BASE` to its URL. Note its
free tier has no scorers and may not cover the World Cup.

### Static (offline)

`VITE_DATA_SOURCE=static` (or leaving it unset) uses bundled fixture data: 48
teams in 12 groups and the group-stage pairing schedule. Useful for development,
demos and offline use without an API key.

> Static mode is a fixture schedule only: it does not include live scores,
> official results, lineups or scorer events.

### Match-feed overlay: scorers + live commentary

football-data.org's free tier has no scorers, so the match page pulls **goal
scorers** and **live text commentary** from a free overlay, queried one match at
a time (and re-polled while a match is live).

```bash
VITE_EVENTS_SOURCE=espn          # default
#   espn        ESPN's public API — complete scorers + live commentary, key-less
#               and CORS (no proxy). Undocumented/unofficial (no SLA).
#   thesportsdb documented but partial goal timelines, no commentary.
#   none        disable the feature.
# VITE_THESPORTSDB_KEY=123       # only for thesportsdb (public test key)
```

> **ESPN (default)** returns complete goals + ~full play-by-play commentary, with
> no key or proxy — but it's an undocumented API and could change. **TheSportsDB**
> is documented/sanctioned but its timelines are community-sourced and often
> incomplete, so the UI shows a **"Partial data"** badge when goals are missing.

## How the odds work

`src/lib/advancement.ts` runs a Monte-Carlo simulation (default 2000 runs).
Each run keeps real results, simulates the remaining group games with a Poisson
goal model based on team ratings, decides the 32 qualifiers (top two per group

- eight best third-placed), then plays out a single-elimination bracket.
  Aggregating the runs yields each team's chance to reach the knockouts and to win
  the trophy. It's an approximation for fun — not betting advice.

## Deploy

Any static host works (the build output is in `dist/`):

```bash
npm run build
```

### GitHub Pages (current setup)

This repo auto-deploys to **https://madniabdulwahab.github.io/fifa26/** on every
push to `main` via [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).
What makes a sub-path SPA work on Pages:

- `vite.config.ts` sets `base: '/fifa26/'` for the build (dev stays at `/`).
- The router `basename` comes from `import.meta.env.BASE_URL` (`src/main.tsx`).
- The workflow copies `index.html → 404.html` so deep-link refreshes don't 404.

One-time setup: the repo must be **Public** (free Pages), and **Settings → Pages
→ Source: GitHub Actions**. For a fork under a different repo name, change the
`base` in `vite.config.ts`.

### Vercel / Netlify (alternative)

Import the repo, build command `npm run build`, output `dist`. Add a SPA rewrite
(all routes → `/index.html`) and, for live data, a serverless proxy + the
`VITE_*` env vars. Served from root, so no base-path change needed.

## License

MIT

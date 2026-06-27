# CLAUDE.md — AI context for the World Cup 2026 app

Read this first. It's the fast path to understanding the repo without scanning
everything. Keep it up to date when the architecture changes.

## What this is

A React + TypeScript + Vite **PWA** for the FIFA World Cup 2026: fixtures in
**German time (Europe/Berlin)**, a clickable **match detail page** with scorers when event data is
available, group standings (W/D/L), Monte-Carlo advancement & title odds,
auto-seeded knockout bracket, real country flags, favorites + kickoff reminders.
Deployed to **GitHub Pages**. See [ABOUT.md](ABOUT.md) for the full feature
description.

**Keep the docs current:** when you change features/architecture, update
[ABOUT.md](ABOUT.md), [README.md](README.md) and this file in the same change.

## Commands

- `npm install` — install deps
- `npm run icons` — regenerate PWA PNG icons (pure-Node script, no deps)
- `npm run dev` — Vite dev server (http://localhost:5173)
- `npm run build` — `tsc -b && vite build` (type-checks, then bundles)
- `npm test` — Vitest (run mode); `npm run test:watch` for watch
- `npm run lint` / `npm run format`

Git/deploy: the repo is **public** at `MadniAbdulWahab/fifa26` and auto-deploys
to **GitHub Pages** via `.github/workflows/deploy.yml` on push to `main` (live at
https://madniabdulwahab.github.io/fifa26/). Commit/push only when asked; end
commit messages with the `Co-Authored-By: Claude` trailer.

## Directory map (under `src/`)

- `domain/types.ts` — the only place domain types live. Everything depends on
  these, they depend on nothing. `Team`, `Match`, `MatchEvent`,
  `GroupStandings`, etc.
- `data/`
  - `DataSource.ts` — the interface (`getTeams()`, `getMatches()`). **The single
    boundary between UI and any backend.**
  - `createDataSource.ts` — factory; picks implementation from `config`.
  - `static/` — `StaticDataSource` + bundled fixture data (`teams.ts` = 48 teams
    in 12 groups; `schedule.ts` generates scheduled group-stage fixtures from
    the draw positions, with no invented scores/events).
  - `espn/` — `EspnDataSource` (**default**, `VITE_DATA_SOURCE=espn`). ESPN's
    public site API: fresher scores, key-less + CORS (no proxy), but
    **undocumented** — all shapes isolated in `espnApiTypes.ts`, fails soft.
    ESPN supplies live ids/scores/schedule/stage; `SEED_TEAMS` supplies
    codes/flags/ratings and the **group letter** (ESPN doesn't tag groups —
    derived via `groupForTeam` + `matchesTeam`). Pure mappers are unit-tested.
  - `api/` — `ApiDataSource` for football-data.org + its response types.
  - `events/` — **match-feed overlay** (goals + commentary, separate from
    `DataSource`). football-data's free tier has no scorers, so a source fetches
    them for **one match at a time** via `getMatchFeed` → `{ goals, commentary }`.
    Implementations: `EspnEventsSource` (**default**, `VITE_EVENTS_SOURCE=espn`)
    — ESPN's public API, **complete** scorers + **live text commentary**,
    key-less + CORS (no proxy), but undocumented; `TheSportsDbEventsSource`
    (`thesportsdb`) — documented but partial goals, no commentary (shows a
    "Partial data" badge). `createEventsSource.ts` is the factory; `teamNames.ts`
    matches providers' team names (aliases + diacritic-insensitive normalize) to
    find the right fixture by date + teams; mapping fns are pure + unit-tested.
- `lib/` — **pure, framework-free, unit-tested logic.** No React imports here.
  - `rng.ts` — seeded PRNG (mulberry32), `hashString`, `poisson`.
  - `model.ts` — shared Poisson goal model (expected goals from rating gap).
  - `record.ts` — W/D/L/points from matches.
  - `standings.ts` — group tables, tie-breakers, best-thirds.
  - `bracket.ts` — knockout fixtures seeded from standings; `TBD_TEAM_ID`.
  - `advancement.ts` — Monte-Carlo sim → `{ advanceFromGroup, winTitle }` per team.
  - `datetime.ts` — UTC→German-time formatting (Day.js, fixed `Europe/Berlin`
    via `APP_TIME_ZONE`). All kickoff display goes here; `germanTimeZoneLabel()`
    gives the CET/CEST abbreviation for the "German time" UI note.
  - `matchTime.ts` — `isLiveNow`, `isFinished`, `findAnchorId` (today/next match
    for the fixtures auto-scroll). Unit-tested.
  - `flags.ts` — FIFA code → flagcdn URL (`flagUrl`); real flag images (emoji
    flags don't render on Windows).
  - `labels.ts`, `teamMatches.ts` — small helpers.
- `stores/favoritesStore.ts` — observable, localStorage-backed favorites
  (shaped for `useSyncExternalStore`).
- `hooks/` — React glue: `useFavorites`, `useTheme`, `useKickoffReminders`,
  `useMatchEvents` (on-demand goals + commentary for the open match, via the
  events overlay; React-Query cached, enabled once a match has started, and
  re-polls every 30s while it is live).
- `components/` — presentational UI (MatchCard, StandingsTable, Bracket,
  OddsBar, TitleOdds, TeamBadge, FavoriteStar, StatusBadge, ThemeToggle,
  NotificationButton).
- `pages/` — routed screens: Fixtures, Standings, Bracket, Team
  (`/team/:id`), **Match** (`/match/:id`, the match detail page), Favorites.
  `FixturesPage` holds the All/Groups/Knockouts tabs, the today/next auto-scroll
  (`useScrollToAnchor` — anchors to the live/next **match card** on first visit
  per tab, then **restores the prior scroll position** when you return from a
  match so it doesn't jerk back to "now"), and a floating "jump to current match"
  button. `MatchCard` links to `/match/:id`.
- `app/`
  - `App.tsx` — layout + routes + loading/error states; `ScrollToTopOnNavigate`
    resets scroll on route change (Fixtures keeps its own anchor scroll).
  - `Nav.tsx` — top nav (desktop) + bottom tabs (mobile).
  - `TournamentContext.tsx` — fetches teams+matches via React Query **once** and
    memoizes derived data (`teamsById`, `standings`, `odds`). Consume with
    `useTournament()`; loading/error via `useLoadState()`.
- `config.ts` — typed env access. `VITE_DATA_SOURCE` = `espn` (default) | `api`
  | `static`; plus football-data + events-overlay vars.
- `main.tsx` — providers: React Query → Router → TournamentProvider → App. The
  router `basename` comes from `import.meta.env.BASE_URL` so routing works under
  the Pages sub-path `/fifa26/`.

## How data flows

`createDataSource()` → `TournamentProvider` fetches teams+matches → memoizes
`standings` (`buildStandings`) and `odds` (`simulateAdvancement`) → pages/
components read them via `useTournament()`. Pages never call the data layer or
recompute heavy derived state themselves.

## Conventions / gotchas

- **Import alias:** `@/` → `src/` (configured in both `vite.config.ts` and
  `tsconfig.app.json`). Use it, e.g. `import { x } from '@/lib/record'`.
- **Strict TS**, incl. `noUncheckedIndexedAccess` — array access can be
  `undefined`; guard or use `!` only when truly safe.
- **No `Math.random()`** anywhere — use `lib/rng.ts` so output stays
  deterministic/testable. The sim accepts a `seed`.
- Times are **always** stored/passed as UTC ISO strings; format only via
  `lib/datetime.ts`, which renders a **fixed German timezone (Europe/Berlin)**
  for every viewer — not the browser's local zone.
- New backend? Implement `DataSource`, wire it in `createDataSource.ts`. Don't
  leak vendor shapes past the `data/` layer — map to `domain` types there.
- Two ESLint `react-refresh` warnings in `TournamentContext.tsx` are expected
  (hooks exported alongside the provider) and harmless.
- Bundled static data is a **fixture schedule only**. It does not include live
  scores, official results, lineups, scorers or match events.
- Favorites are **device-local** (`localStorage`, key `wc26:favorites`) — no
  accounts/backend, not synced across devices.
- **Goal scorers + commentary** come from the `data/events/` overlay, fetched
  per-match on the match page — *not* from the main `DataSource`. Default is ESPN
  (complete, with live commentary) but it's an **undocumented** API — isolate all
  ESPN shape knowledge in `EspnEventsSource`/`espnTypes.ts` and fail soft (empty
  feed). `thesportsdb` data is partial; `none` disables. The match page's
  Commentary tab only appears when commentary is available.

## Deployment (GitHub Pages)

- `vite.config.ts` sets `base = '/fifa26/'` **for the build only** (dev stays at
  `/`) and the PWA `manifest` `start_url`/`scope` use that base.
- `.github/workflows/deploy.yml` runs `npm ci && npm run build`, copies
  `dist/index.html → dist/404.html` (SPA fallback for deep-link refreshes), and
  publishes via `actions/deploy-pages`.
- **Default deploy needs no secrets/proxy:** the ESPN source is key-less + CORS,
  so production live data works out of the box.
- **Only if you switch to `api`** (football-data.org): it sends no CORS headers
  and the token must not ship to the client — deploy `proxy/cloudflare-worker.js`
  and set repo **Actions Variables** `VITE_DATA_SOURCE=api` +
  `VITE_FOOTBALL_DATA_BASE`. See [proxy/README.md](proxy/README.md).
- For a different host/repo name, change the base path, the router `basename`
  (auto from `BASE_URL`), and the workflow.

## Tests

Vitest, node environment. Co-located `*.test.ts` in `src/lib/`. Cover `record`,
`advancement` (incl. determinism) and `matchTime` (live/next anchor). Add tests
for new pure logic in `lib/`.

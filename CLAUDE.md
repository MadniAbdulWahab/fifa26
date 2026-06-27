# CLAUDE.md — AI context for the World Cup 2026 app

Read this first. It's the fast path to understanding the repo without scanning
everything. Keep it up to date when the architecture changes.

## What this is
A React + TypeScript + Vite **PWA** for the FIFA World Cup 2026: fixtures in
local time, a clickable **match detail page**, group standings (W/D/L),
Monte-Carlo advancement & title odds, auto-seeded knockout bracket, real country
flags, favorites + kickoff reminders. Deployed to **GitHub Pages**. See
[ABOUT.md](ABOUT.md) for the full feature description.

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
  these, they depend on nothing. `Team`, `Match`, `GroupStandings`, etc.
- `data/`
  - `DataSource.ts` — the interface (`getTeams()`, `getMatches()`). **The single
    boundary between UI and any backend.**
  - `createDataSource.ts` — factory; picks implementation from `config`.
  - `static/` — `StaticDataSource` + bundled sample data (`teams.ts` = 48 teams
    in 12 groups; `schedule.ts` generates group matches with seeded scores).
  - `api/` — `ApiDataSource` for football-data.org + its response types.
- `lib/` — **pure, framework-free, unit-tested logic.** No React imports here.
  - `rng.ts` — seeded PRNG (mulberry32), `hashString`, `poisson`.
  - `model.ts` — shared Poisson goal model (expected goals from rating gap).
  - `record.ts` — W/D/L/points from matches.
  - `standings.ts` — group tables, tie-breakers, best-thirds.
  - `bracket.ts` — knockout fixtures seeded from standings; `TBD_TEAM_ID`.
  - `advancement.ts` — Monte-Carlo sim → `{ advanceFromGroup, winTitle }` per team.
  - `datetime.ts` — UTC→local formatting (Day.js). All kickoff display goes here.
  - `matchTime.ts` — `isLiveNow`, `isFinished`, `findAnchorId` (today/next match
    for the fixtures auto-scroll). Unit-tested.
  - `flags.ts` — FIFA code → flagcdn URL (`flagUrl`); real flag images (emoji
    flags don't render on Windows).
  - `labels.ts`, `teamMatches.ts` — small helpers.
- `stores/favoritesStore.ts` — observable, localStorage-backed favorites
  (shaped for `useSyncExternalStore`).
- `hooks/` — React glue: `useFavorites`, `useTheme`, `useKickoffReminders`.
- `components/` — presentational UI (MatchCard, StandingsTable, Bracket,
  OddsBar, TitleOdds, TeamBadge, FavoriteStar, StatusBadge, ThemeToggle,
  NotificationButton).
- `pages/` — routed screens: Fixtures, Standings, Bracket, Team
  (`/team/:id`), **Match** (`/match/:id`, the match detail page), Favorites.
  `FixturesPage` holds the All/Groups/Knockouts tabs, the today/next auto-scroll
  (`useScrollToAnchor`), and a floating "jump to current match" button.
  `MatchCard` links to `/match/:id`.
- `app/`
  - `App.tsx` — layout + routes + loading/error states; `ScrollToTopOnNavigate`
    resets scroll on route change (Fixtures keeps its own anchor scroll).
  - `Nav.tsx` — top nav (desktop) + bottom tabs (mobile).
  - `TournamentContext.tsx` — fetches teams+matches via React Query **once** and
    memoizes derived data (`teamsById`, `standings`, `odds`). Consume with
    `useTournament()`; loading/error via `useLoadState()`.
- `config.ts` — typed env access (`VITE_DATA_SOURCE`, football-data vars).
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
  `lib/datetime.ts`.
- New backend? Implement `DataSource`, wire it in `createDataSource.ts`. Don't
  leak vendor shapes past the `data/` layer — map to `domain` types there.
- Two ESLint `react-refresh` warnings in `TournamentContext.tsx` are expected
  (hooks exported alongside the provider) and harmless.
- Bundled static data is **illustrative**, not the official 2026 schedule.
- Favorites are **device-local** (`localStorage`, key `wc26:favorites`) — no
  accounts/backend, not synced across devices.

## Deployment (GitHub Pages)
- `vite.config.ts` sets `base = '/fifa26/'` **for the build only** (dev stays at
  `/`) and the PWA `manifest` `start_url`/`scope` use that base.
- `.github/workflows/deploy.yml` runs `npm ci && npm run build`, copies
  `dist/index.html → dist/404.html` (SPA fallback for deep-link refreshes), and
  publishes via `actions/deploy-pages`.
- For a different host/repo name, change the base path, the router `basename`
  (auto from `BASE_URL`), and the workflow.

## Tests
Vitest, node environment. Co-located `*.test.ts` in `src/lib/`. Cover `record`,
`advancement` (incl. determinism) and `matchTime` (live/next anchor). Add tests
for new pure logic in `lib/`.

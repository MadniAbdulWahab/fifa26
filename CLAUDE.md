# CLAUDE.md — AI context for the World Cup 2026 app

Read this first. It's the fast path to understanding the repo without scanning
everything. Keep it up to date when the architecture changes.

## What this is
A React + TypeScript + Vite **PWA** for the FIFA World Cup 2026: fixtures in
local time, group standings (W/D/L), Monte-Carlo advancement & title odds,
auto-seeded knockout bracket, favorites + kickoff reminders. See
[ABOUT.md](ABOUT.md) for the full feature description.

## Commands
- `npm install` — install deps
- `npm run icons` — regenerate PWA PNG icons (pure-Node script, no deps)
- `npm run dev` — Vite dev server (http://localhost:5173)
- `npm run build` — `tsc -b && vite build` (type-checks, then bundles)
- `npm test` — Vitest (run mode); `npm run test:watch` for watch
- `npm run lint` / `npm run format`

There is **no git repo** by design — the user manages version control manually.
Do not run `git init`/commit/push unless explicitly asked.

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
  - `labels.ts`, `teamMatches.ts` — small helpers.
- `stores/favoritesStore.ts` — observable, localStorage-backed favorites
  (shaped for `useSyncExternalStore`).
- `hooks/` — React glue: `useFavorites`, `useTheme`, `useKickoffReminders`.
- `components/` — presentational UI (MatchCard, StandingsTable, Bracket,
  OddsBar, TitleOdds, TeamBadge, FavoriteStar, StatusBadge, ThemeToggle,
  NotificationButton).
- `pages/` — routed screens: Fixtures, Standings, Bracket, Team, Favorites.
- `app/`
  - `App.tsx` — layout + routes + loading/error states.
  - `Nav.tsx` — top nav (desktop) + bottom tabs (mobile).
  - `TournamentContext.tsx` — fetches teams+matches via React Query **once** and
    memoizes derived data (`teamsById`, `standings`, `odds`). Consume with
    `useTournament()`; loading/error via `useLoadState()`.
- `config.ts` — typed env access (`VITE_DATA_SOURCE`, football-data vars).
- `main.tsx` — providers: React Query → Router → TournamentProvider → App.

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

## Tests
Vitest, node environment. Co-located `*.test.ts` in `src/lib/`. Cover `record`
and `advancement` (incl. determinism). Add tests for new pure logic in `lib/`.

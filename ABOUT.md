# About — World Cup 2026 companion app

A complete description of what this app is, what it does, and how every part of
it works. For setup/commands see [README.md](README.md); for an AI-oriented
codebase map see [CLAUDE.md](CLAUDE.md).

---

## 1. What it is

A **Progressive Web App (PWA)** that follows the FIFA World Cup 2026 — the first
48-team tournament (12 groups of 4, then a 32-team knockout). It runs in any
modern browser on phone or desktop and can be installed to the home screen.

It was built to answer four questions at a glance:

1. **When and where is each match?** — in *your own* local time.
2. **How is each team doing?** — wins, draws, losses, goals, points.
3. **What are a team's chances of going through?** — and of winning it all.
4. **What does the knockout path look like?** — an auto-seeding bracket.

…plus the ability to follow favorite teams and get kickoff reminders.

It works **offline with bundled sample data out of the box** (no account, no API
key) and can be switched to **live data** with one environment variable.

---

## 2. Features in detail

### Fixtures (home screen)
- Every match as a card: both teams (flag + name), score or kickoff time, the
  stage/group, and a status badge (`LIVE` with a pulsing dot, or `FT`).
- **Times are shown in the viewer's local timezone.** Kickoffs are stored as
  UTC and converted with Day.js using the browser's detected timezone, so a
  16:00 UTC kickoff reads 18:00 in Berlin and 11:00 in New York.
- Matches are grouped by day and sorted chronologically. On open, the list
  **auto-scrolls to the live match (or the next upcoming one)** so you start on
  what matters; scroll up for past results.
- A **pinned filter bar** (stays fixed while scrolling): **All / Groups /
  Knockouts** tabs and a **Favorites-only** toggle. The **Groups** tab shows each
  group's standings table followed by its matches (distinct from the date-ordered
  All view).
- A floating **frosted-glass football button** (bottom-right) jumps you back to
  the live / next match from anywhere in the list.
- **Tap any match** to open its detail page (see below).

### Match detail page
- Opens when you click a fixture. A Google-style scoreboard: large flags, both
  teams, score or "vs" + local kickoff time, stage/group, venue, and a LIVE/FT
  badge (red ring when live).
- Below it, each team's record (W/D/L, points) and chance to reach the
  knockouts, and — for group matches — that group's standings table. Tap a team
  to open its full team page.

### Standings
- All 12 group tables, each with Played, Won, Drawn, Lost, Goal Difference and
  Points, sorted by the standard tie-breakers (points → GD → goals scored).
- The top two of each group are highlighted (qualify); third place is flagged as
  "best-third contention".
- Each row shows that team's **estimated chance to reach the knockouts**.

### Advancement & title odds (the standout feature)
- A **Monte-Carlo simulation** estimates two probabilities per team:
  - chance to **reach the knockout stage**, and
  - chance to **win the tournament**.
- How a single simulation run works:
  1. Keep all real/known results.
  2. Simulate every remaining group match with a Poisson goal model whose
     expected goals scale with the two teams' rating gap.
  3. Decide the 32 qualifiers (top two per group + the 8 best third-placed).
  4. Seed and play out a single-elimination bracket to a champion.
- Thousands of runs are aggregated into percentages. The randomness is
  **seeded/deterministic**, so the numbers are stable across reloads and
  reproducible in tests. It is an approximation for fun — not betting advice.

### Knockout bracket
- Columns for Round of 32 → Round of 16 → Quarter-finals → Semi-finals → Final.
- The Round of 32 is seeded from the group standings (ranked 1–32, paired
  1‑v‑32, 2‑v‑31, …). Later rounds show "TBD" until results decide them.
- A **Title contenders** panel ranks teams by simulated trophy odds.

### Favorites & reminders
- Tap the ☆ on any team to follow it. Favorites are saved in `localStorage`
  (**device-local** — no accounts/backend, so they don't sync across devices).
- The Favorites page shows each followed team's record, advancement bar and next
  match, and a button to **enable kickoff reminders** (browser notifications a
  few minutes before kickoff while the app is open).

### Team page
- Full record (P/W/D/L/GF/GA/GD/Pts), advancement + title odds bars, and the
  team's complete match list.

### Polish
- Mobile-first layout: bottom tab bar on phones, top nav on desktop.
- **Real country flags** (flag images via flagcdn, cached for offline) — emoji
  flags don't render on Windows, so images are used everywhere.
- **Light/dark mode** toggle (persisted).
- Installable PWA with offline caching via a service worker.

---

## 3. How it's built

| Concern         | Choice                                         |
| --------------- | ---------------------------------------------- |
| Language / UI   | TypeScript, React 18                           |
| Build tool      | Vite 5                                          |
| Styling         | Tailwind CSS (class-based dark mode)           |
| Data fetching   | TanStack Query (caching + periodic refetch)    |
| Routing         | React Router 6                                 |
| Dates / times   | Day.js (utc, timezone, advancedFormat plugins) |
| PWA             | vite-plugin-pwa (Workbox service worker)       |
| Tests           | Vitest                                         |
| Lint / format   | ESLint + Prettier                              |

### Layered architecture
```
domain  → framework-free types (Team, Match, GroupStandings…)
data    → DataSource interface + static and live-API implementations
lib     → pure logic: datetime, matchTime, flags, record, standings, bracket, advancement, rng, model
stores  → observable state (favorites)
hooks   → React glue (favorites, theme, reminders)
components → reusable UI (MatchCard, StandingsTable, Bracket, OddsBar…)
pages   → routed screens (Fixtures, Standings, Bracket, Team, Match, Favorites)
app     → shell, nav, TournamentContext (loads + derives all data once)
```

### Key design principles
- **One data boundary.** The UI only ever sees `domain` types. A `DataSource`
  interface hides the backend; `createDataSource()` chooses the implementation
  from config. Swapping or adding a backend is a single-file change.
- **Pure, tested logic.** Everything in `lib/` is side-effect-free and unit
  tested. The *same* goal model powers both the sample scores and the odds, so
  they stay consistent.
- **Deterministic randomness.** A small seeded PRNG (`lib/rng.ts`) makes sample
  data and odds reproducible.

### Data sources
- **Static (default):** bundled sample data — 48 teams in 12 groups, a generated
  group stage with plausible scores, and a bracket derived from the standings.
  Fully offline and deterministic. *The draw and results are illustrative, not
  the official schedule.*
- **Live API:** football-data.org (competition `WC`). Enabled via env vars; in
  dev, Vite proxies requests to avoid CORS. Production needs a small serverless
  proxy so the API token never ships to the browser (see README).

### Deployment
- Auto-deploys to **GitHub Pages** at
  https://madniabdulwahab.github.io/fifa26/ on every push to `main`
  (`.github/workflows/deploy.yml`). The build uses a `/fifa26/` base path, the
  router reads `basename` from it, and `index.html` is copied to `404.html` so
  deep-link refreshes work. Vercel/Netlify are easy alternatives (see README).

---

## 4. Project status & ideas

**Done:** core features, match detail page, real flags, favorites/reminders,
PWA, dark mode, unit tests, both data sources, GitHub Pages deploy.

**Possible next steps:**
- Plug in real WC2026 draw/schedule data (or the live API token).
- Official FIFA bracket-slotting rules for best-third placement.
- Head-to-head tie-breakers in standings.
- Service-worker Push for reminders when the app is closed.
- Goal-scorer / lineup details per match.

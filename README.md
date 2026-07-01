# World Cup 2026 Companion App

An installable World Cup 2026 web app for following fixtures, live scores,
group tables, match details, favorites, and knockout routes in one clean mobile
experience.

Live app: https://madniabdulwahab.github.io/fifa26/

## What It Does

- Shows the full World Cup 2026 fixture list in German time.
- Tracks live, upcoming, and finished matches.
- Opens each fixture into a match page with score, scorers, events,
  commentary when available, prediction, group context, and match info.
- Shows group standings with qualification indicators.
- Supports team favorites and kickoff reminders.
- Includes a knockout bracket (official FIFA 2026 tree layout, with a compact
  per-round view) and advancement/title odds.
- Works as a PWA, so it can be added to the phone home screen.
- Supports light and dark mode.

## Data

The app uses ESPN's public football API by default for fixtures, scores,
statuses, venues, goal events, and live commentary. The ESPN integration is
isolated in `src/data/espn/` and `src/data/events/` so it can be replaced if the
source changes.

There are also fallback data modes for development:

- `espn`: live ESPN data, default.
- `api`: football-data.org integration.
- `static`: bundled offline schedule.

## Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- TanStack Query
- React Router
- Day.js
- Vitest
- vite-plugin-pwa

## Project Structure

```text
src/
  app/          App shell, navigation, providers
  components/   Reusable UI
  data/         Data sources and API mapping
  domain/       Core app types
  hooks/        React hooks
  lib/          Pure tournament logic
  pages/        Route pages
  stores/       Local observable state
```

## Development

```bash
npm install
npm run dev
```

Useful scripts:

```bash
npm run build
npm run lint
npm test
npm run format
npm run icons
```

## Deployment

The app is deployed to GitHub Pages from `main` using GitHub Actions.

Important pieces:

- `vite.config.ts` sets the `/fifa26/` base path for production.
- `src/main.tsx` reads the router basename from `import.meta.env.BASE_URL`.
- The deploy workflow copies `index.html` to `404.html` so direct route
  refreshes work on GitHub Pages.

## Ownership

Copyright © Abdul Wahab Madni. All rights reserved.

This is a personal app. No open-source license is granted unless one is added
explicitly later.

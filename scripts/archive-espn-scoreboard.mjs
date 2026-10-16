// Snapshot every World Cup 2026 fixture from ESPN's scoreboard into a bundled
// JSON archive, so the app still shows results after the tournament ends.
//
// ESPN stopped accepting the whole-tournament `dates=START-END` range query
// once the tournament was over (HTTP 400), but single-day queries still work,
// so this walks the tournament one day at a time.
//
// Usage: node scripts/archive-espn-scoreboard.mjs

import { writeFile } from 'node:fs/promises';

const BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world';
const FIRST_DAY = '2026-06-11';
const LAST_DAY = '2026-07-19';
const OUT = new URL(
  '../src/data/espn/archive/scoreboard-2026.json',
  import.meta.url,
);

/** Keep only the fields `espnApiTypes.ts` describes. */
function trimEvent(e) {
  return {
    id: e.id,
    date: e.date,
    status: {
      displayClock: e.status?.displayClock,
      type: {
        state: e.status?.type?.state,
        shortDetail: e.status?.type?.shortDetail,
      },
    },
    season: { slug: e.season?.slug },
    competitions: (e.competitions ?? []).slice(0, 1).map((c) => ({
      venue: {
        fullName: c.venue?.fullName,
        address: {
          city: c.venue?.address?.city,
          state: c.venue?.address?.state,
          country: c.venue?.address?.country,
        },
      },
      competitors: (c.competitors ?? []).map((t) => ({
        homeAway: t.homeAway,
        score: t.score,
        winner: t.winner,
        team: {
          id: t.team?.id,
          abbreviation: t.team?.abbreviation,
          displayName: t.team?.displayName,
        },
      })),
    })),
  };
}

const byId = new Map();
for (
  let day = new Date(`${FIRST_DAY}T00:00:00Z`);
  day <= new Date(`${LAST_DAY}T00:00:00Z`);
  day.setUTCDate(day.getUTCDate() + 1)
) {
  const ymd = day.toISOString().slice(0, 10).replaceAll('-', '');
  const res = await fetch(`${BASE}/scoreboard?dates=${ymd}`);
  if (!res.ok) throw new Error(`ESPN ${ymd}: HTTP ${res.status}`);
  const data = await res.json();
  for (const e of data.events ?? []) byId.set(e.id, trimEvent(e));
}

const events = [...byId.values()].sort((a, b) => a.date.localeCompare(b.date));
const unfinished = events.filter((e) => e.status.type.state !== 'post');
if (events.length !== 104 || unfinished.length > 0) {
  throw new Error(
    `Expected 104 finished fixtures, got ${events.length} (${unfinished.length} unfinished)`,
  );
}

await writeFile(
  OUT,
  `${JSON.stringify({ archivedAt: new Date().toISOString(), events }, null, 1)}\n`,
);
console.log(`Archived ${events.length} fixtures to ${OUT.pathname}`);

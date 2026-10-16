import type { EspnApiEvent, EspnScoreboardApiResponse } from './espnApiTypes';

const BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world';
/** Whole-tournament window, so one request returns all 104 fixtures. */
const RANGE = '20260611-20260719';

/**
 * The day after the final. From here on the bundled archive is the source of
 * truth: ESPN rejects the whole-tournament range query once the tournament is
 * over (HTTP 400), which left the app with no fixtures at all.
 */
export const TOURNAMENT_OVER_AT = Date.parse('2026-07-20T12:00:00Z');

/** Every fixture with its final result, snapshotted by scripts/archive-espn-scoreboard.mjs. */
export async function loadArchivedEvents(): Promise<EspnApiEvent[]> {
  const archive = await import('./archive/scoreboard-2026.json');
  return archive.default.events as EspnApiEvent[];
}

async function fetchLiveEvents(
  fetchImpl: typeof fetch,
): Promise<EspnApiEvent[]> {
  try {
    const res = await fetchImpl(`${BASE}/scoreboard?dates=${RANGE}&limit=500`);
    if (!res.ok) return [];
    const data = (await res.json()) as EspnScoreboardApiResponse;
    return data.events ?? [];
  } catch {
    return [];
  }
}

/**
 * The tournament's scoreboard: live from ESPN while the tournament runs, and
 * from the bundled archive afterwards or whenever the live request comes back
 * empty, so the fixtures, standings and bracket never go blank.
 */
export async function loadScoreboardEvents(
  now: number = Date.now(),
  fetchImpl: typeof fetch = fetch,
): Promise<EspnApiEvent[]> {
  if (now >= TOURNAMENT_OVER_AT) return loadArchivedEvents();
  const live = await fetchLiveEvents(fetchImpl);
  return live.length > 0 ? live : loadArchivedEvents();
}

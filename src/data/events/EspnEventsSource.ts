import type {
  CommentaryEntry,
  Match,
  MatchEvent,
  Team,
} from '@/domain/types';
import type { MatchEventsSource, MatchFeed } from './MatchEventsSource';
import { matchesTeam } from './teamNames';
import type {
  EspnKeyEvent,
  EspnScoreboardEvent,
  EspnScoreboardResponse,
  EspnSummaryResponse,
} from './espnTypes';

const BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world';
/** Whole-tournament window for the one-shot fixture index. */
const RANGE = '20260611-20260719';

/** UTC calendar date (YYYY-MM-DD) of an ISO instant, shifted by `dayOffset`. */
function utcDateStr(iso: string, dayOffset = 0): string {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + dayOffset);
  return d.toISOString().slice(0, 10);
}

function homeName(e: EspnScoreboardEvent): string | undefined {
  return e.competitions[0]?.competitors.find((c) => c.homeAway === 'home')?.team
    .displayName;
}
function awayName(e: EspnScoreboardEvent): string | undefined {
  return e.competitions[0]?.competitors.find((c) => c.homeAway === 'away')?.team
    .displayName;
}

/** Find the ESPN event id for our match by date (±1 day) + both teams. */
export function findEspnEventId(
  events: EspnScoreboardEvent[],
  match: Match,
  home: Team,
  away: Team,
): string | undefined {
  const dates = new Set([
    utcDateStr(match.kickoff, 0),
    utcDateStr(match.kickoff, -1),
    utcDateStr(match.kickoff, 1),
  ]);
  const found = events.find((e) => {
    if (!dates.has(utcDateStr(e.date))) return false;
    const h = homeName(e);
    const a = awayName(e);
    return (
      (matchesTeam(h, home) && matchesTeam(a, away)) ||
      (matchesTeam(h, away) && matchesTeam(a, home))
    );
  });
  return found?.id;
}

/** Map ESPN `keyEvents` goals to our `MatchEvent`s. Pure for testing. */
export function mapEspnGoals(
  keyEvents: EspnKeyEvent[],
  match: Match,
  home: Team,
  away: Team,
): MatchEvent[] {
  return keyEvents
    .filter(
      (e) =>
        !e.shootout &&
        (e.scoringPlay === true || (e.type?.type ?? '').startsWith('goal')),
    )
    .map((e, i) => {
      const [scorer, assist] = e.participants ?? [];
      const teamName = e.team?.displayName;
      const teamId = matchesTeam(teamName, away)
        ? match.awayId
        : matchesTeam(teamName, home)
          ? match.homeId
          : match.homeId;
      return {
        id: `espn-${e.id ?? i}`,
        type: 'goal' as const,
        minute: (e.clock?.displayValue ?? '').replace(/'$/, '').trim(),
        teamId,
        playerName: scorer?.athlete?.displayName?.trim() || 'Unknown',
        assistName: assist?.athlete?.displayName?.trim() || undefined,
      };
    });
}

/** Map ESPN `commentary` to our `CommentaryEntry`s (newest first). Pure. */
export function mapEspnCommentary(
  commentary: EspnSummaryResponse['commentary'],
): CommentaryEntry[] {
  return (commentary ?? [])
    .map((c, i) => ({
      id: `espn-c-${c.sequence ?? i}`,
      minute: c.time?.displayValue?.trim() || undefined,
      text: (c.text ?? '').trim(),
      sequence: c.sequence ?? i,
    }))
    .filter((c) => c.text.length > 0)
    .sort((a, b) => b.sequence - a.sequence)
    .map(({ sequence: _seq, ...rest }) => rest);
}

/**
 * Goal scorers + live commentary from ESPN's public, key-less, CORS-enabled site
 * API (no proxy needed). Undocumented/unofficial: all shape knowledge is kept
 * here, and any failure degrades to an empty feed.
 */
export class EspnEventsSource implements MatchEventsSource {
  /** One request indexes every fixture; memoized for the page session. */
  private indexPromise: Promise<EspnScoreboardEvent[]> | null = null;

  private async fetchJson<T>(url: string): Promise<T | null> {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      return (await res.json()) as T;
    } catch {
      return null;
    }
  }

  private getIndex(): Promise<EspnScoreboardEvent[]> {
    if (!this.indexPromise) {
      this.indexPromise = this.fetchJson<EspnScoreboardResponse>(
        `${BASE}/scoreboard?dates=${RANGE}&limit=500`,
      ).then((d) => d?.events ?? []);
    }
    return this.indexPromise;
  }

  async getMatchFeed(match: Match, home: Team, away: Team): Promise<MatchFeed> {
    const events = await this.getIndex();
    const eventId = findEspnEventId(events, match, home, away);
    if (!eventId) return { goals: [], commentary: [] };

    const summary = await this.fetchJson<EspnSummaryResponse>(
      `${BASE}/summary?event=${eventId}`,
    );
    if (!summary) return { goals: [], commentary: [] };

    return {
      goals: mapEspnGoals(summary.keyEvents ?? [], match, home, away),
      commentary: mapEspnCommentary(summary.commentary),
    };
  }
}

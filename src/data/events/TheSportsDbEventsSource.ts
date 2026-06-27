import { config } from '@/config';
import type { Match, MatchEvent, Team } from '@/domain/types';
import type { MatchEventsSource, MatchFeed } from './MatchEventsSource';
import { matchesTeam } from './teamNames';
import type {
  TsdbEvent,
  TsdbEventsResponse,
  TsdbTimelineEntry,
  TsdbTimelineResponse,
} from './theSportsDbTypes';

/** TheSportsDB league id for the FIFA World Cup. */
const WC_LEAGUE_ID = '4429';

/** UTC calendar date (YYYY-MM-DD) of an ISO instant, shifted by `dayOffset`. */
function utcDateStr(iso: string, dayOffset = 0): string {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + dayOffset);
  return d.toISOString().slice(0, 10);
}

/** Whether a TheSportsDB fixture is our match (both teams, either orientation). */
export function fixtureMatches(e: TsdbEvent, home: Team, away: Team): boolean {
  return (
    (matchesTeam(e.strHomeTeam, home) && matchesTeam(e.strAwayTeam, away)) ||
    (matchesTeam(e.strHomeTeam, away) && matchesTeam(e.strAwayTeam, home))
  );
}

/**
 * Map a TheSportsDB timeline to our goal `MatchEvent`s. `homeIsOurHome` says
 * whether TheSportsDB's home side is our `match.homeId` (fixtures can be listed
 * in the opposite orientation). Pure + exported for unit testing.
 */
export function mapTimelineToGoals(
  timeline: TsdbTimelineEntry[],
  match: Match,
  home: Team,
  away: Team,
  homeIsOurHome: boolean,
): MatchEvent[] {
  const tsdbHomeId = homeIsOurHome ? match.homeId : match.awayId;
  const tsdbAwayId = homeIsOurHome ? match.awayId : match.homeId;

  const resolveTeamId = (t: TsdbTimelineEntry): string => {
    const flag = (t.strHome ?? '').toLowerCase();
    if (flag === 'yes') return tsdbHomeId;
    if (flag === 'no') return tsdbAwayId;
    if (matchesTeam(t.strTeam, home)) return match.homeId;
    if (matchesTeam(t.strTeam, away)) return match.awayId;
    return match.homeId;
  };

  return timeline
    .filter((t) => t.strTimeline === 'Goal')
    .map((t, i) => ({
      id: `tsdb-${t.idTimeline ?? i}`,
      type: 'goal' as const,
      minute: (t.intTime ?? '').toString().trim(),
      teamId: resolveTeamId(t),
      playerName: t.strPlayer?.trim() || 'Unknown',
      assistName: t.strAssist?.trim() || undefined,
    }))
    .sort((a, b) => (Number(a.minute) || 0) - (Number(b.minute) || 0));
}

/**
 * Goal scorers for a single match, sourced from TheSportsDB's public, free,
 * CORS-enabled API (no proxy needed). Timelines are community-sourced and can be
 * incomplete; callers compare the count to the score to flag partial data.
 */
export class TheSportsDbEventsSource implements MatchEventsSource {
  constructor(private readonly cfg = config.theSportsDb) {}

  private get apiBase(): string {
    return `${this.cfg.baseUrl}/${this.cfg.key}`;
  }

  private async fetchJson<T>(path: string): Promise<T | null> {
    try {
      const res = await fetch(`${this.apiBase}${path}`);
      if (!res.ok) return null;
      return (await res.json()) as T;
    } catch {
      return null;
    }
  }

  private async fetchDay(date: string): Promise<TsdbEvent[]> {
    const data = await this.fetchJson<TsdbEventsResponse>(
      `/eventsday.php?d=${date}&l=${WC_LEAGUE_ID}`,
    );
    return data?.events ?? [];
  }

  /** Find the fixture by kickoff date (also checking ±1 day for tz drift). */
  private async findEvent(
    match: Match,
    home: Team,
    away: Team,
  ): Promise<TsdbEvent | undefined> {
    for (const offset of [0, -1, 1]) {
      const events = await this.fetchDay(utcDateStr(match.kickoff, offset));
      const found = events.find((e) => fixtureMatches(e, home, away));
      if (found) return found;
    }
    return undefined;
  }

  async getMatchFeed(match: Match, home: Team, away: Team): Promise<MatchFeed> {
    const event = await this.findEvent(match, home, away);
    if (!event) return { goals: [], commentary: [] };

    const homeIsOurHome = matchesTeam(event.strHomeTeam, home);
    const data = await this.fetchJson<TsdbTimelineResponse>(
      `/lookuptimeline.php?id=${event.idEvent}`,
    );
    const goals = mapTimelineToGoals(
      data?.timeline ?? [],
      match,
      home,
      away,
      homeIsOurHome,
    );
    // TheSportsDB has no text commentary feed.
    return { goals, commentary: [] };
  }
}

import type { Match, MatchEvent, Team } from '@/domain/types';

/**
 * An overlay that supplies in-match events (currently goals/scorers) for a
 * single match. Kept separate from `DataSource` because football-data.org's free
 * tier provides fixtures/scores but not scorers, so a second free provider
 * (TheSportsDB) fills only this gap, fetched on demand per match.
 *
 * Receives the match plus its resolved `home`/`away` teams so the implementation
 * can locate the corresponding fixture by kickoff date + team names and map
 * event sides back to `homeId`/`awayId`.
 */
export interface MatchEventsSource {
  getMatchEvents(match: Match, home: Team, away: Team): Promise<MatchEvent[]>;
}

import type { CommentaryEntry, Match, MatchEvent, Team } from '@/domain/types';

/** Per-match detail an overlay can supply: goals and/or text commentary. */
export interface MatchFeed {
  goals: MatchEvent[];
  commentary: CommentaryEntry[];
}

/**
 * An overlay that supplies in-match detail (goal scorers + commentary) for a
 * single match. Kept separate from `DataSource` because football-data.org's free
 * tier provides fixtures/scores but not scorers, so a free provider (ESPN, or
 * TheSportsDB) fills only this gap, fetched on demand per match.
 *
 * Receives the match plus its resolved `home`/`away` teams so the implementation
 * can locate the corresponding fixture by kickoff date + team names and map
 * event sides back to `homeId`/`awayId`.
 */
export interface MatchEventsSource {
  getMatchFeed(match: Match, home: Team, away: Team): Promise<MatchFeed>;
}

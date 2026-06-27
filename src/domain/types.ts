/**
 * Core domain types for the World Cup 2026 app.
 *
 * These types are deliberately decoupled from any specific data provider.
 * Each `DataSource` implementation is responsible for mapping its own API
 * shapes into these types, so the rest of the app never depends on a vendor.
 */

export type TeamId = string;

export interface Team {
  id: TeamId;
  /** Full display name, e.g. "Argentina". */
  name: string;
  /** Three-letter code, e.g. "ARG". */
  code: string;
  /** URL or emoji flag used as a lightweight crest. */
  flag: string;
  /**
   * Relative strength rating used only by the advancement simulation.
   * Higher is stronger. Roughly an Elo-style number (1500 = average).
   */
  rating: number;
}

/** The twelve first-round groups, A–L. */
export type GroupId =
  | 'A'
  | 'B'
  | 'C'
  | 'D'
  | 'E'
  | 'F'
  | 'G'
  | 'H'
  | 'I'
  | 'J'
  | 'K'
  | 'L';

export type MatchStage =
  | 'group'
  | 'round-of-32'
  | 'round-of-16'
  | 'quarter-final'
  | 'semi-final'
  | 'third-place'
  | 'final';

export type MatchStatus = 'scheduled' | 'live' | 'finished';

export interface Match {
  id: string;
  stage: MatchStage;
  /** Present only for group-stage matches. */
  group?: GroupId;
  /** Kickoff time as an ISO-8601 string in UTC. */
  kickoff: string;
  status: MatchStatus;
  venue?: string;
  homeId: TeamId;
  awayId: TeamId;
  /** Goals; null until the match has a score. */
  homeGoals: number | null;
  awayGoals: number | null;
}

/** A team's accumulated win/draw/loss record. */
export interface TeamRecord {
  teamId: TeamId;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

/** A single row within a group standings table. */
export interface StandingRow {
  team: Team;
  record: TeamRecord;
  /** 1-based rank within the group after tie-breakers. */
  position: number;
}

export interface GroupStandings {
  group: GroupId;
  rows: StandingRow[];
}

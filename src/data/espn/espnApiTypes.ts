/**
 * Minimal subset of ESPN's public soccer scoreboard API (undocumented) used as
 * the main data source. All ESPN shape knowledge lives here.
 */

export interface EspnApiTeam {
  id: string;
  abbreviation?: string;
  displayName?: string;
}

export interface EspnApiCompetitor {
  homeAway: 'home' | 'away';
  score?: string;
  team: EspnApiTeam;
}

export interface EspnApiCompetition {
  venue?: { fullName?: string };
  competitors: EspnApiCompetitor[];
}

export interface EspnApiStatus {
  type?: {
    /** "pre" | "in" | "post" */
    state?: string;
  };
}

export interface EspnApiEvent {
  id: string;
  date: string; // ISO instant (UTC)
  status?: EspnApiStatus;
  /** season.slug carries the stage, e.g. "group-stage", "round-of-32", "final". */
  season?: { slug?: string };
  competitions: EspnApiCompetition[];
}

export interface EspnScoreboardApiResponse {
  events: EspnApiEvent[] | null;
}

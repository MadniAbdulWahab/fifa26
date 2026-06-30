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
  winner?: boolean;
  team: EspnApiTeam;
}

export interface EspnApiCompetition {
  venue?: {
    fullName?: string;
    address?: {
      city?: string;
      state?: string;
      country?: string;
    };
  };
  competitors: EspnApiCompetitor[];
}

export interface EspnApiStatus {
  /** Running match clock while live, e.g. "72'". */
  displayClock?: string;
  type?: {
    /** "pre" | "in" | "post" */
    state?: string;
    /** Short human label, e.g. "72'", "HT", "FT". */
    shortDetail?: string;
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

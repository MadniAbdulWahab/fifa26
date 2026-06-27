/** Minimal subset of ESPN's public soccer site API we consume (undocumented). */

export interface EspnCompetitor {
  homeAway: 'home' | 'away';
  team: { displayName: string; abbreviation?: string };
}

export interface EspnScoreboardEvent {
  id: string;
  date: string; // ISO instant
  competitions: { competitors: EspnCompetitor[] }[];
}

export interface EspnScoreboardResponse {
  events: EspnScoreboardEvent[] | null;
}

export interface EspnKeyEvent {
  id?: string;
  type?: { type?: string; text?: string };
  /** True for any goal (incl. headers/penalties/own goals). */
  scoringPlay?: boolean;
  /** True for penalty-shootout entries, which are not match goals. */
  shootout?: boolean;
  clock?: { displayValue?: string };
  team?: { displayName?: string };
  participants?: { athlete?: { displayName?: string } }[];
}

export interface EspnCommentaryItem {
  sequence?: number;
  time?: { displayValue?: string };
  text?: string;
}

export interface EspnSummaryResponse {
  keyEvents?: EspnKeyEvent[] | null;
  commentary?: EspnCommentaryItem[] | null;
}

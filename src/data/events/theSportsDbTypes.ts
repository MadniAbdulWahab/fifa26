/** Minimal subset of the TheSportsDB v1 response shapes we consume. */

export interface TsdbEvent {
  idEvent: string;
  dateEvent: string | null;
  strHomeTeam: string | null;
  strAwayTeam: string | null;
  intHomeScore: string | null;
  intAwayScore: string | null;
}

export interface TsdbEventsResponse {
  events: TsdbEvent[] | null;
}

export interface TsdbTimelineEntry {
  idTimeline: string;
  strTimeline: string | null; // "Goal" | "Card" | "subst" | ...
  strTimelineDetail: string | null; // "Normal Goal" | "Penalty" | "Own Goal" | ...
  /** "Yes" when the event belongs to the home team, "No" for the away team. */
  strHome: string | null;
  strPlayer: string | null;
  strAssist: string | null;
  strTeam: string | null;
  intTime: string | null;
}

export interface TsdbTimelineResponse {
  timeline: TsdbTimelineEntry[] | null;
}

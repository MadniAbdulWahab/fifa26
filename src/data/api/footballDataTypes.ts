/** Minimal subset of the football-data.org v4 response shapes we consume. */

export interface FdTeam {
  id: number;
  name: string;
  tla: string | null;
  crest: string | null;
}

export interface FdMatch {
  id: number;
  utcDate: string;
  status: string;
  stage: string;
  group: string | null;
  homeTeam: { id: number; name: string; tla: string | null };
  awayTeam: { id: number; name: string; tla: string | null };
  score: { fullTime: { home: number | null; away: number | null } };
}

export interface FdTeamsResponse {
  teams: FdTeam[];
}

export interface FdMatchesResponse {
  matches: FdMatch[];
}

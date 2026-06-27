import type { DataSource } from '@/data/DataSource';
import type {
  GroupId,
  Match,
  MatchStage,
  MatchStatus,
  Team,
} from '@/domain/types';
import { SEED_TEAMS } from '@/data/static/teams';
import { flagUrl } from '@/lib/flags';
import type {
  FdMatch,
  FdMatchesResponse,
  FdTeam,
  FdTeamsResponse,
} from './footballDataTypes';

const DEFAULT_RATING = 1700;

/** Ratings by team code, reused from the seed data so odds stay meaningful. */
const RATING_BY_CODE = new Map(
  SEED_TEAMS.map((t) => [t.code.toUpperCase(), t.rating]),
);

const STAGE_MAP: Record<string, MatchStage> = {
  GROUP_STAGE: 'group',
  LAST_32: 'round-of-32',
  ROUND_OF_32: 'round-of-32',
  LAST_16: 'round-of-16',
  ROUND_OF_16: 'round-of-16',
  QUARTER_FINALS: 'quarter-final',
  SEMI_FINALS: 'semi-final',
  THIRD_PLACE: 'third-place',
  FINAL: 'final',
};

function mapStatus(status: string): MatchStatus {
  switch (status) {
    case 'IN_PLAY':
    case 'PAUSED':
    case 'LIVE':
      return 'live';
    case 'FINISHED':
      return 'finished';
    default:
      return 'scheduled';
  }
}

function mapGroup(group: string | null): GroupId | undefined {
  if (!group) return undefined;
  const letter = group.replace(/[^A-L]/gi, '').toUpperCase();
  return (letter || undefined) as GroupId | undefined;
}

function ratingFor(code: string | null): number {
  if (!code) return DEFAULT_RATING;
  return RATING_BY_CODE.get(code.toUpperCase()) ?? DEFAULT_RATING;
}

function mapTeam(t: FdTeam): Team {
  const code = t.tla ?? t.name.slice(0, 3).toUpperCase();
  return {
    id: String(t.id),
    name: t.name,
    code,
    flag: flagUrl(code),
    rating: ratingFor(code),
  };
}

function mapMatch(m: FdMatch): Match {
  return {
    id: String(m.id),
    stage: STAGE_MAP[m.stage] ?? 'group',
    group: mapGroup(m.group),
    kickoff: m.utcDate,
    status: mapStatus(m.status),
    homeId: String(m.homeTeam.id),
    awayId: String(m.awayTeam.id),
    homeGoals: m.score.fullTime.home,
    awayGoals: m.score.fullTime.away,
  };
}

export interface ApiConfig {
  /** Base URL for the football-data proxy/endpoint. */
  baseUrl: string;
  /** API token (sent as X-Auth-Token). */
  token: string;
}

/**
 * Live data source backed by football-data.org (competition code "WC").
 *
 * Because football-data.org does not send CORS headers, browser requests must
 * go through a proxy. In dev, vite.config proxies "/football-data". In
 * production, point `baseUrl` at your own serverless proxy so the token is
 * never shipped to the client.
 */
export class ApiDataSource implements DataSource {
  constructor(private readonly config: ApiConfig) {}

  private async fetchJson<T>(path: string): Promise<T> {
    const res = await fetch(`${this.config.baseUrl}${path}`, {
      headers: this.config.token
        ? { 'X-Auth-Token': this.config.token }
        : undefined,
    });
    if (!res.ok) {
      throw new Error(`football-data request failed: ${res.status} ${path}`);
    }
    return (await res.json()) as T;
  }

  async getTeams(): Promise<Team[]> {
    const data = await this.fetchJson<FdTeamsResponse>(
      '/v4/competitions/WC/teams',
    );
    return data.teams.map(mapTeam);
  }

  async getMatches(): Promise<Match[]> {
    const data = await this.fetchJson<FdMatchesResponse>(
      '/v4/competitions/WC/matches',
    );
    return data.matches.map(mapMatch);
  }
}

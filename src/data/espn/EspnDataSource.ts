import type { DataSource } from '@/data/DataSource';
import type {
  GroupId,
  Match,
  MatchStage,
  MatchStatus,
  Team,
} from '@/domain/types';
import { SEED_TEAMS } from '@/data/static/teams';
import { matchesTeam } from '@/data/events/teamNames';
import { flagUrl } from '@/lib/flags';
import type {
  EspnApiEvent,
  EspnApiTeam,
  EspnScoreboardApiResponse,
} from './espnApiTypes';

const BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world';
/** Whole-tournament window — one request returns all 104 fixtures. */
const RANGE = '20260611-20260719';
const DEFAULT_RATING = 1700;

/** ESPN `season.slug` → our stage. */
const STAGE_BY_SLUG: Record<string, MatchStage> = {
  'group-stage': 'group',
  'round-of-32': 'round-of-32',
  'round-of-16': 'round-of-16',
  quarterfinals: 'quarter-final',
  semifinals: 'semi-final',
  '3rd-place-match': 'third-place',
  final: 'final',
};

export function mapStage(slug: string | undefined): MatchStage {
  return STAGE_BY_SLUG[slug ?? ''] ?? 'group';
}

/** ESPN `status.type.state` (pre/in/post) → our status. */
export function mapState(state: string | undefined): MatchStatus {
  if (state === 'post') return 'finished';
  if (state === 'in') return 'live';
  return 'scheduled';
}

/** The fixed WC draw lives in SEED_TEAMS; ESPN doesn't tag the group letter. */
export function groupForTeam(name: string | undefined): GroupId | undefined {
  if (!name) return undefined;
  return SEED_TEAMS.find((t) => matchesTeam(name, t))?.group;
}

/**
 * Build a domain `Team` from an ESPN team, borrowing FIFA code / rating / flag
 * from the matching seed team (ESPN abbreviations aren't always FIFA codes, and
 * `flagUrl` keys on FIFA codes). Falls back to ESPN's own values when unmatched.
 */
export function resolveEspnTeam(t: EspnApiTeam): Team {
  const seed = t.displayName
    ? SEED_TEAMS.find((s) => matchesTeam(t.displayName, s))
    : undefined;
  const code = (seed?.code ?? t.abbreviation ?? '').toUpperCase();
  return {
    id: t.id,
    name: t.displayName ?? seed?.name ?? code,
    code,
    flag: flagUrl(code),
    rating: seed?.rating ?? DEFAULT_RATING,
  };
}

/** Map one ESPN scoreboard event to a `Match`, or null if malformed. */
export function mapEspnEvent(e: EspnApiEvent): Match | null {
  const comp = e.competitions[0];
  const home = comp?.competitors.find((c) => c.homeAway === 'home');
  const away = comp?.competitors.find((c) => c.homeAway === 'away');
  if (!comp || !home || !away) return null;

  const status = mapState(e.status?.type?.state);
  const stage = mapStage(e.season?.slug);
  const goals = (score: string | undefined): number | null => {
    if (status === 'scheduled') return null;
    const n = Number(score);
    return Number.isFinite(n) ? n : null;
  };
  const group =
    stage === 'group'
      ? (groupForTeam(home.team.displayName) ??
        groupForTeam(away.team.displayName))
      : undefined;

  return {
    id: e.id,
    stage,
    ...(group ? { group } : {}),
    kickoff: e.date,
    status,
    ...(comp.venue?.fullName ? { venue: comp.venue.fullName } : {}),
    homeId: home.team.id,
    awayId: away.team.id,
    homeGoals: goals(home.score),
    awayGoals: goals(away.score),
  };
}

/**
 * Main data source backed by ESPN's public, key-less, CORS-enabled site API.
 * Fresher scores than football-data's free tier and needs no proxy/token — but
 * the API is undocumented, so all shape knowledge stays in this module and any
 * failure degrades to empty (handled by the app's loading/error states).
 */
export class EspnDataSource implements DataSource {
  private scoreboard: Promise<EspnApiEvent[]> | null = null;

  private load(): Promise<EspnApiEvent[]> {
    if (!this.scoreboard) {
      this.scoreboard = fetch(`${BASE}/scoreboard?dates=${RANGE}&limit=500`)
        .then((r) =>
          r.ok
            ? (r.json() as Promise<EspnScoreboardApiResponse>)
            : Promise.resolve({ events: [] }),
        )
        .then((d) => d.events ?? [])
        .catch(() => []);
    }
    return this.scoreboard;
  }

  async getMatches(): Promise<Match[]> {
    const events = await this.load();
    return events
      .map(mapEspnEvent)
      .filter((m): m is Match => m !== null)
      .sort((a, b) => a.kickoff.localeCompare(b.kickoff));
  }

  async getTeams(): Promise<Team[]> {
    const events = await this.load();
    const byId = new Map<string, Team>();
    // Build the 48 teams from group-stage fixtures only, so undecided knockout
    // placeholders don't leak into the team list.
    for (const e of events) {
      if (mapStage(e.season?.slug) !== 'group') continue;
      for (const c of e.competitions[0]?.competitors ?? []) {
        if (!byId.has(c.team.id)) byId.set(c.team.id, resolveEspnTeam(c.team));
      }
    }
    return [...byId.values()];
  }
}

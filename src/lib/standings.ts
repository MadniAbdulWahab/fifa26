import type {
  GroupId,
  GroupStandings,
  Match,
  StandingRow,
  Team,
  TeamId,
  TeamRecord,
} from '@/domain/types';
import { computeRecords } from './record';

/** Map each team to its group, derived from its group-stage matches. */
export function groupByTeam(matches: Match[]): Map<TeamId, GroupId> {
  const map = new Map<TeamId, GroupId>();
  for (const match of matches) {
    if (match.stage === 'group' && match.group) {
      map.set(match.homeId, match.group);
      map.set(match.awayId, match.group);
    }
  }
  return map;
}

/**
 * Compare two records by the standard group tie-breakers:
 * points → goal difference → goals scored.
 *
 * Head-to-head (FIFA's first tie-breaker after points) is intentionally
 * omitted for simplicity; this covers the vast majority of cases.
 */
export function compareRecords(a: TeamRecord, b: TeamRecord): number {
  if (b.points !== a.points) return b.points - a.points;
  if (b.goalDifference !== a.goalDifference) {
    return b.goalDifference - a.goalDifference;
  }
  return b.goalsFor - a.goalsFor;
}

/** Build sorted standings for every group found in the match list. */
export function buildStandings(
  teams: Team[],
  matches: Match[],
): GroupStandings[] {
  const records = computeRecords(teams, matches);
  const teamGroup = groupByTeam(matches);
  const teamsById = new Map(teams.map((t) => [t.id, t]));

  const byGroup = new Map<GroupId, StandingRow[]>();
  for (const [teamId, group] of teamGroup) {
    const team = teamsById.get(teamId);
    const record = records.get(teamId);
    if (!team || !record) continue;
    const rows = byGroup.get(group) ?? [];
    rows.push({ team, record, position: 0 });
    byGroup.set(group, rows);
  }

  const result: GroupStandings[] = [];
  for (const [group, rows] of byGroup) {
    rows.sort((a, b) => compareRecords(a.record, b.record));
    rows.forEach((row, i) => (row.position = i + 1));
    result.push({ group, rows });
  }
  result.sort((a, b) => a.group.localeCompare(b.group));
  return result;
}

/**
 * Rank the third-placed teams across all groups. In the 48-team format the
 * eight best third-placed teams advance, so the first eight rows here qualify.
 */
export function thirdPlacedRanking(standings: GroupStandings[]): StandingRow[] {
  const thirds = standings
    .map((g) => g.rows.find((r) => r.position === 3))
    .filter((r): r is StandingRow => Boolean(r));
  thirds.sort((a, b) => compareRecords(a.record, b.record));
  return thirds;
}

export function bestThirdIds(
  standings: GroupStandings[],
  count = 8,
): Set<TeamId> {
  return new Set(
    thirdPlacedRanking(standings)
      .slice(0, count)
      .map((r) => r.team.id),
  );
}

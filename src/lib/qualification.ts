import type { GroupStandings, Match, TeamId } from '@/domain/types';
import { bestThirdIds } from './standings';

export type QualificationStatus =
  | { kind: 'qualified'; label: string }
  | { kind: 'eliminated'; label: string }
  | { kind: 'pending'; label: string };

export function qualificationStatus(
  teamId: TeamId,
  matches: Match[],
  standings: GroupStandings[],
): QualificationStatus {
  if (
    matches.some(
      (match) =>
        match.stage !== 'group' &&
        (match.homeId === teamId || match.awayId === teamId),
    )
  ) {
    return { kind: 'qualified', label: 'Qualified for knockouts' };
  }

  const group = standings.find((standing) =>
    standing.rows.some((row) => row.team.id === teamId),
  );
  const row = group?.rows.find((standingRow) => standingRow.team.id === teamId);
  if (!group || !row) return { kind: 'pending', label: 'Group stage pending' };

  const groupComplete = isGroupComplete(group.group, matches);
  if (!groupComplete) return { kind: 'pending', label: 'Group stage pending' };

  if (row.position <= 2) {
    return { kind: 'qualified', label: 'Qualified for knockouts' };
  }

  if (row.position === 3 && allGroupsComplete(standings, matches)) {
    return bestThirdIds(standings).has(teamId)
      ? { kind: 'qualified', label: 'Qualified for knockouts' }
      : { kind: 'eliminated', label: 'Eliminated in group stage' };
  }

  if (row.position === 3) {
    return { kind: 'pending', label: 'Best-third race' };
  }

  return { kind: 'eliminated', label: 'Eliminated in group stage' };
}

function isGroupComplete(group: string, matches: Match[]): boolean {
  const groupMatches = matches.filter(
    (match) => match.stage === 'group' && match.group === group,
  );
  return (
    groupMatches.length > 0 &&
    groupMatches.every(
      (match) => match.homeGoals !== null && match.awayGoals !== null,
    )
  );
}

function allGroupsComplete(
  standings: GroupStandings[],
  matches: Match[],
): boolean {
  return standings.every((standing) =>
    isGroupComplete(standing.group, matches),
  );
}

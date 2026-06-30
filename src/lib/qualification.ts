import type { GroupStandings, Match, MatchStage, TeamId } from '@/domain/types';
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
  const knockoutStatus = knockoutQualificationStatus(teamId, matches);
  if (knockoutStatus) return knockoutStatus;

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

export function eliminatedTeamIds(matches: Match[]): Set<TeamId> {
  const eliminated = new Set<TeamId>();
  for (const match of matches) {
    const loser = knockoutLoser(match);
    if (loser) eliminated.add(loser);
  }
  return eliminated;
}

function knockoutQualificationStatus(
  teamId: TeamId,
  matches: Match[],
): QualificationStatus | null {
  const knockoutMatches = matches
    .filter(
      (match) =>
        match.stage !== 'group' &&
        (match.homeId === teamId || match.awayId === teamId),
    )
    .sort((a, b) => a.kickoff.localeCompare(b.kickoff));

  let lostMatch: Match | undefined;
  for (let i = knockoutMatches.length - 1; i >= 0; i--) {
    const match = knockoutMatches[i]!;
    if (knockoutLoser(match) === teamId) {
      lostMatch = match;
      break;
    }
  }
  if (lostMatch) {
    return {
      kind: 'eliminated',
      label: eliminatedLabel(lostMatch.stage),
    };
  }

  const wonFinal = knockoutMatches.some(
    (match) => match.stage === 'final' && knockoutWinner(match) === teamId,
  );
  if (wonFinal) return { kind: 'qualified', label: 'Won the World Cup' };

  if (knockoutMatches.length > 0) {
    return { kind: 'qualified', label: 'Still alive in knockouts' };
  }

  return null;
}

function knockoutWinner(match: Match): TeamId | null {
  if (match.stage === 'group' || match.status !== 'finished') {
    return null;
  }

  if (match.winnerId === match.homeId || match.winnerId === match.awayId) {
    return match.winnerId;
  }

  if (
    match.homeGoals === null ||
    match.awayGoals === null ||
    match.homeGoals === match.awayGoals
  ) {
    return null;
  }

  return match.homeGoals > match.awayGoals ? match.homeId : match.awayId;
}

function knockoutLoser(match: Match): TeamId | null {
  const winner = knockoutWinner(match);
  if (!winner) return null;
  return winner === match.homeId ? match.awayId : match.homeId;
}

function eliminatedLabel(stage: MatchStage): string {
  if (stage === 'group') return 'Eliminated in group stage';
  if (stage === 'final') return 'Eliminated in final';
  if (stage === 'third-place') return 'Finished fourth';
  return `Eliminated in ${KNOCKOUT_STAGE_LABELS[stage]}`;
}

const KNOCKOUT_STAGE_LABELS: Record<Exclude<MatchStage, 'group'>, string> = {
  'round-of-32': 'Round of 32',
  'round-of-16': 'Round of 16',
  'quarter-final': 'Quarter-finals',
  'semi-final': 'semi-finals',
  'third-place': 'third-place play-off',
  final: 'final',
};

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

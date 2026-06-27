import type { Match, TeamId } from '@/domain/types';

export function matchesForTeam(teamId: TeamId, matches: Match[]): Match[] {
  return matches
    .filter((m) => m.homeId === teamId || m.awayId === teamId)
    .sort((a, b) => a.kickoff.localeCompare(b.kickoff));
}

/** The team's next not-yet-finished match, if any. */
export function nextMatchForTeam(
  teamId: TeamId,
  matches: Match[],
): Match | undefined {
  return matchesForTeam(teamId, matches).find((m) => m.status !== 'finished');
}

import type { Match, Team, TeamId, TeamRecord } from '@/domain/types';

const POINTS_WIN = 3;
const POINTS_DRAW = 1;

function emptyRecord(teamId: TeamId): TeamRecord {
  return {
    teamId,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
  };
}

function isPlayed(match: Match): match is Match & {
  homeGoals: number;
  awayGoals: number;
} {
  return match.homeGoals !== null && match.awayGoals !== null;
}

/** Apply one finished match to a record (the team must be home or away). */
function applyMatch(record: TeamRecord, match: Match): void {
  if (!isPlayed(match)) return;
  const isHome = match.homeId === record.teamId;
  const isAway = match.awayId === record.teamId;
  if (!isHome && !isAway) return;

  const gf = isHome ? match.homeGoals : match.awayGoals;
  const ga = isHome ? match.awayGoals : match.homeGoals;

  record.played += 1;
  record.goalsFor += gf;
  record.goalsAgainst += ga;
  record.goalDifference = record.goalsFor - record.goalsAgainst;

  if (gf > ga) {
    record.wins += 1;
    record.points += POINTS_WIN;
  } else if (gf === ga) {
    record.draws += 1;
    record.points += POINTS_DRAW;
  } else {
    record.losses += 1;
  }
}

/**
 * Build a team's win/draw/loss record from the given matches.
 * Only finished matches (both scores present) count.
 */
export function computeRecord(teamId: TeamId, matches: Match[]): TeamRecord {
  const record = emptyRecord(teamId);
  for (const match of matches) {
    applyMatch(record, match);
  }
  return record;
}

/** Records for every team, keyed by team id. */
export function computeRecords(
  teams: Team[],
  matches: Match[],
): Map<TeamId, TeamRecord> {
  const records = new Map<TeamId, TeamRecord>();
  for (const team of teams) {
    records.set(team.id, emptyRecord(team.id));
  }
  for (const match of matches) {
    const home = records.get(match.homeId);
    const away = records.get(match.awayId);
    if (home) applyMatch(home, match);
    if (away) applyMatch(away, match);
  }
  return records;
}

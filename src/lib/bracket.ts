import type {
  GroupStandings,
  Match,
  MatchStage,
  StandingRow,
  TeamId,
} from '@/domain/types';
import { bestThirdIds, compareRecords } from './standings';

/** Sentinel id used for knockout slots whose team is not yet decided. */
export const TBD_TEAM_ID: TeamId = 'tbd';

/** Knockout rounds in playing order, with how many matches each contains. */
export const KNOCKOUT_ROUNDS: { stage: MatchStage; count: number }[] = [
  { stage: 'round-of-32', count: 16 },
  { stage: 'round-of-16', count: 8 },
  { stage: 'quarter-final', count: 4 },
  { stage: 'semi-final', count: 2 },
  { stage: 'third-place', count: 1 },
  { stage: 'final', count: 1 },
];

/** First kickoff date (UTC) for each knockout round. */
const ROUND_START: Record<string, string> = {
  'round-of-32': '2026-06-28',
  'round-of-16': '2026-07-04',
  'quarter-final': '2026-07-09',
  'semi-final': '2026-07-14',
  'third-place': '2026-07-18',
  final: '2026-07-19',
};

function kickoffFor(stage: MatchStage, index: number): string {
  const start = ROUND_START[stage] ?? '2026-07-01';
  const day = new Date(`${start}T19:00:00Z`);
  day.setUTCDate(day.getUTCDate() + index);
  return day.toISOString();
}

function tbdMatch(stage: MatchStage, index: number): Match {
  return {
    id: `ko-${stage}-${index + 1}`,
    stage,
    kickoff: kickoffFor(stage, index),
    status: 'scheduled',
    homeId: TBD_TEAM_ID,
    awayId: TBD_TEAM_ID,
    homeGoals: null,
    awayGoals: null,
  };
}

/**
 * Collect the 32 qualified teams: every group winner and runner-up, plus the
 * eight best third-placed teams, ranked overall by group performance.
 *
 * Returns the qualifiers seeded strongest-first. Empty until the group stage
 * has produced standings.
 */
export function seedQualifiers(standings: GroupStandings[]): StandingRow[] {
  const thirds = bestThirdIds(standings);
  const qualified: StandingRow[] = [];
  for (const group of standings) {
    for (const row of group.rows) {
      if (row.position <= 2) qualified.push(row);
      else if (row.position === 3 && thirds.has(row.team.id)) {
        qualified.push(row);
      }
    }
  }
  qualified.sort((a, b) => compareRecords(a.record, b.record));
  return qualified;
}

/**
 * Build all knockout fixtures from the group standings.
 *
 * Seeding is simplified for clarity: the 32 qualifiers are ranked by group
 * performance and paired 1-v-32, 2-v-31, … so stronger sides meet weaker ones.
 * (This is not FIFA's official bracket map.) Later rounds are created as
 * "to be decided" until results arrive.
 */
export function buildKnockoutMatches(standings: GroupStandings[]): Match[] {
  const matches: Match[] = [];

  // Later rounds are always placeholders here (no knockout results modelled).
  for (const round of KNOCKOUT_ROUNDS) {
    if (round.stage === 'round-of-32') continue;
    for (let i = 0; i < round.count; i++) {
      matches.push(tbdMatch(round.stage, i));
    }
  }

  const seeds = seedQualifiers(standings);
  if (seeds.length < 32) {
    // Group stage not complete yet — show an empty Round of 32.
    for (let i = 0; i < 16; i++) matches.push(tbdMatch('round-of-32', i));
    return matches;
  }

  for (let i = 0; i < 16; i++) {
    const home = seeds[i];
    const away = seeds[31 - i];
    matches.push({
      id: `ko-round-of-32-${i + 1}`,
      stage: 'round-of-32',
      kickoff: kickoffFor('round-of-32', i),
      status: 'scheduled',
      homeId: home!.team.id,
      awayId: away!.team.id,
      homeGoals: null,
      awayGoals: null,
    });
  }

  return matches;
}

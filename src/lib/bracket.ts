import type {
  GroupId,
  GroupStandings,
  Match,
  MatchStage,
  StandingRow,
  TeamId,
  TeamRecord,
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

/** A definite group placement (group winner or runner-up). */
export interface SeedRef {
  group: GroupId;
  position: 1 | 2;
}

/** A best-third placement: one of several allowed groups (decided late). */
export interface ThirdRef {
  /** Groups whose third-placed team may fill this slot. */
  thirdOf: GroupId[];
}

export type SlotSeed = SeedRef | ThirdRef;

export interface R32Slot {
  home: SlotSeed;
  away: SlotSeed;
}

export function isSeedRef(seed: SlotSeed): seed is SeedRef {
  return 'group' in seed;
}

/**
 * The 16 Round-of-32 matches in official top-to-bottom bracket order
 * (FIFA World Cup 2026, matches 73–88). The order is chosen so adjacent slots
 * feed the same Round-of-16 match — (73,75)(77,79)(74,76)(78,80)(81,83)(85,86)
 * (82,84)(87,88) — so the whole bracket lines up as a connected tree where each
 * later round follows by `slot = floor(feederSlot / 2)`.
 *
 * Source: FIFA / Wikipedia "2026 FIFA World Cup knockout stage".
 */
export const OFFICIAL_R32_SLOTS: R32Slot[] = [
  // slot 0 — M73
  { home: { group: 'A', position: 2 }, away: { group: 'B', position: 2 } },
  // slot 1 — M75
  { home: { group: 'F', position: 1 }, away: { group: 'C', position: 2 } },
  // slot 2 — M77
  { home: { group: 'I', position: 1 }, away: { thirdOf: ['C', 'D', 'F', 'G', 'H'] } },
  // slot 3 — M79
  { home: { group: 'A', position: 1 }, away: { thirdOf: ['C', 'E', 'F', 'H', 'I'] } },
  // slot 4 — M74
  { home: { group: 'E', position: 1 }, away: { thirdOf: ['A', 'B', 'C', 'D', 'F'] } },
  // slot 5 — M76
  { home: { group: 'C', position: 1 }, away: { group: 'F', position: 2 } },
  // slot 6 — M78
  { home: { group: 'E', position: 2 }, away: { group: 'I', position: 2 } },
  // slot 7 — M80
  { home: { group: 'L', position: 1 }, away: { thirdOf: ['E', 'H', 'I', 'J', 'K'] } },
  // slot 8 — M81
  { home: { group: 'D', position: 1 }, away: { thirdOf: ['B', 'E', 'F', 'I', 'J'] } },
  // slot 9 — M83
  { home: { group: 'K', position: 2 }, away: { group: 'L', position: 2 } },
  // slot 10 — M85
  { home: { group: 'B', position: 1 }, away: { thirdOf: ['E', 'F', 'G', 'I', 'J'] } },
  // slot 11 — M86
  { home: { group: 'J', position: 1 }, away: { group: 'H', position: 2 } },
  // slot 12 — M82
  { home: { group: 'G', position: 1 }, away: { thirdOf: ['A', 'E', 'H', 'I', 'J'] } },
  // slot 13 — M84
  { home: { group: 'H', position: 1 }, away: { group: 'J', position: 2 } },
  // slot 14 — M87
  { home: { group: 'K', position: 1 }, away: { thirdOf: ['D', 'E', 'I', 'J', 'L'] } },
  // slot 15 — M88
  { home: { group: 'D', position: 2 }, away: { group: 'G', position: 2 } },
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

interface ThirdEntry {
  group: GroupId;
  id: TeamId;
  record: TeamRecord;
}

/** The eight qualified best-third teams, strongest first, tagged with group. */
function qualifiedThirds(standings: GroupStandings[]): ThirdEntry[] {
  return standings
    .map((g) => {
      const row = g.rows.find((r) => r.position === 3);
      return row ? { group: g.group, id: row.team.id, record: row.record } : null;
    })
    .filter((t): t is ThirdEntry => t !== null)
    .sort((a, b) => compareRecords(a.record, b.record))
    .slice(0, 8);
}

/**
 * Build all knockout fixtures from the group standings.
 *
 * The 32 qualifiers are placed into the official FIFA 2026 Round-of-32 slots
 * (`OFFICIAL_R32_SLOTS`, top-to-bottom) so the bracket lines up like the real
 * tournament. Best-third opponents are assigned greedily — the strongest
 * available third from an allowed group — a reasonable stand-in for FIFA's
 * published allocation table. Later rounds are created as "to be decided" until
 * results arrive.
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

  const teamAt = (group: GroupId, position: 1 | 2): TeamId =>
    standings
      .find((g) => g.group === group)
      ?.rows.find((r) => r.position === position)?.team.id ?? TBD_TEAM_ID;

  const thirdsPool = qualifiedThirds(standings);
  const usedThirds = new Set<TeamId>();
  const takeThird = (allowed: GroupId[]): TeamId => {
    const pick =
      thirdsPool.find((t) => !usedThirds.has(t.id) && allowed.includes(t.group)) ??
      thirdsPool.find((t) => !usedThirds.has(t.id));
    if (pick) usedThirds.add(pick.id);
    return pick?.id ?? TBD_TEAM_ID;
  };
  const resolve = (seed: SlotSeed): TeamId =>
    isSeedRef(seed) ? teamAt(seed.group, seed.position) : takeThird(seed.thirdOf);

  OFFICIAL_R32_SLOTS.forEach((slot, i) => {
    matches.push({
      id: `ko-round-of-32-${i + 1}`,
      stage: 'round-of-32',
      kickoff: kickoffFor('round-of-32', i),
      status: 'scheduled',
      homeId: resolve(slot.home),
      awayId: resolve(slot.away),
      homeGoals: null,
      awayGoals: null,
    });
  });

  return matches;
}

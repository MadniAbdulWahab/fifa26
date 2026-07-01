import type { GroupStandings, Match, MatchStage, TeamId } from '@/domain/types';
import { isSeedRef, OFFICIAL_R32_SLOTS, TBD_TEAM_ID } from './bracket';

/**
 * Visual layout of the knockout bracket.
 *
 * The Bracket page only "lines up like the actual tournament" if every knockout
 * match knows its **slot** — its top-to-bottom position within its round, taken
 * from the official FIFA 2026 bracket tree rather than from kickoff time.
 *
 * The tree topology is regular: round N+1 slot `s` is fed by round N slots `2s`
 * and `2s+1`, so once the Round of 32 order is fixed every later round follows
 * by `slot = floor(feederSlot / 2)`.
 */

/** Knockout stages in bracket order, left to right. */
export const COLUMN_STAGES: MatchStage[] = [
  'round-of-32',
  'round-of-16',
  'quarter-final',
  'semi-final',
  'final',
];

/** `"A1"`, `"H2"`, … → Round-of-32 slot index, built from the official map. */
const R32_SLOT_BY_SEED: Map<string, number> = (() => {
  const map = new Map<string, number>();
  OFFICIAL_R32_SLOTS.forEach((slot, i) => {
    for (const seed of [slot.home, slot.away]) {
      if (isSeedRef(seed)) map.set(`${seed.group}${seed.position}`, i);
    }
  });
  return map;
})();

/** Static-source ids encode their slot, e.g. `ko-round-of-16-3` → slot 2. */
const BUILT_ID = /^ko-.+-(\d+)$/;
const WINNER_REF_ID =
  /^winner:(round-of-32|round-of-16|quarter-final|semi-final):(\d+)$/;

const PREVIOUS_STAGE: Partial<Record<MatchStage, MatchStage>> = {
  'round-of-16': 'round-of-32',
  'quarter-final': 'round-of-16',
  'semi-final': 'quarter-final',
  final: 'semi-final',
};

function winnerOf(match: Match): TeamId | undefined {
  if (match.winnerId) return match.winnerId;
  if (match.homeGoals != null && match.awayGoals != null) {
    if (match.homeGoals > match.awayGoals) return match.homeId;
    if (match.awayGoals > match.homeGoals) return match.awayId;
  }
  return undefined;
}

function winnerRef(
  teamId: TeamId,
): { stage: MatchStage; ordinal: number } | null {
  const match = WINNER_REF_ID.exec(teamId);
  if (!match) return null;
  return { stage: match[1] as MatchStage, ordinal: Number(match[2]) };
}

function matchForWinnerRef(
  teamId: TeamId,
  previousStage: MatchStage,
  previousMatches: Match[],
): Match | undefined {
  const ref = winnerRef(teamId);
  if (ref?.stage !== previousStage) return undefined;
  return previousMatches[ref.ordinal - 1];
}

/**
 * Resolve a knockout match to its bracket slot (0-based, top-to-bottom).
 *
 * - Built ids carry the slot directly (static source).
 * - Round of 32 is located by either team's group placement.
 * - Later rounds chain up the tree: a team that won a previous-round slot `p`
 *   plays in slot `floor(p / 2)` of the next round.
 * - Returns `null` when nothing resolves (caller falls back to kickoff order).
 */
function resolveSlot(
  match: Match,
  stage: MatchStage,
  seedByTeam: Map<TeamId, string>,
  prevWinnerSlot: Map<TeamId, number>,
): number | null {
  const built = BUILT_ID.exec(match.id);
  if (built) return Number(built[1]) - 1;

  if (stage === 'round-of-32') {
    for (const teamId of [match.homeId, match.awayId]) {
      const seed = seedByTeam.get(teamId);
      const slot = seed != null ? R32_SLOT_BY_SEED.get(seed) : undefined;
      if (slot != null) return slot;
    }
    return null;
  }

  for (const teamId of [match.homeId, match.awayId]) {
    const feeder = prevWinnerSlot.get(teamId);
    if (feeder != null) return Math.floor(feeder / 2);
  }
  return null;
}

/**
 * Compute the bracket slot for every knockout match, so columns can be ordered
 * and aligned as a connected tree regardless of data source.
 */
export function bracketSlots(
  matches: Match[],
  standings: GroupStandings[],
): Map<string, number> {
  const seedByTeam = new Map<TeamId, string>();
  for (const group of standings) {
    for (const row of group.rows) {
      if (row.position === 1 || row.position === 2) {
        seedByTeam.set(row.team.id, `${group.group}${row.position}`);
      }
    }
  }

  const byStage = new Map<MatchStage, Match[]>();
  const fallbackByStage = new Map<MatchStage, Match[]>();
  for (const match of matches) {
    if (!COLUMN_STAGES.includes(match.stage)) continue;
    const arr = byStage.get(match.stage) ?? [];
    arr.push(match);
    byStage.set(match.stage, arr);
  }

  for (const stage of COLUMN_STAGES) {
    const stageMatches = byStage.get(stage) ?? [];
    fallbackByStage.set(
      stage,
      [...stageMatches].sort((a, b) =>
        a.kickoff === b.kickoff
          ? a.id.localeCompare(b.id, undefined, { numeric: true })
          : a.kickoff.localeCompare(b.kickoff),
      ),
    );
  }

  const slotHints = new Map<string, number>();
  for (let i = COLUMN_STAGES.length - 1; i > 0; i -= 1) {
    const stage = COLUMN_STAGES[i]!;
    const previousStage = PREVIOUS_STAGE[stage];
    if (!previousStage) continue;

    const stageMatches = fallbackByStage.get(stage) ?? [];
    const previousMatches = fallbackByStage.get(previousStage) ?? [];

    const previousByTeam = new Map<TeamId, Match>();
    for (const previousMatch of previousMatches) {
      for (const teamId of [
        previousMatch.homeId,
        previousMatch.awayId,
        winnerOf(previousMatch),
      ]) {
        if (teamId && teamId !== TBD_TEAM_ID) {
          previousByTeam.set(teamId, previousMatch);
        }
      }
    }

    for (const [matchIndex, match] of stageMatches.entries()) {
      const slot = slotHints.get(match.id) ?? matchIndex;
      for (const [sideIndex, teamId] of [
        match.homeId,
        match.awayId,
      ].entries()) {
        const feeder =
          matchForWinnerRef(teamId, previousStage, previousMatches) ??
          previousByTeam.get(teamId);
        if (feeder) slotHints.set(feeder.id, slot * 2 + sideIndex);
      }
    }
  }

  const result = new Map<string, number>();
  let prevWinnerSlot = new Map<TeamId, number>();

  for (const stage of COLUMN_STAGES) {
    const stageMatches = byStage.get(stage) ?? [];
    const fallback = [...stageMatches].sort((a, b) =>
      a.kickoff === b.kickoff
        ? a.id.localeCompare(b.id, undefined, { numeric: true })
        : a.kickoff.localeCompare(b.kickoff),
    );

    const winnerSlot = new Map<TeamId, number>();
    for (const match of stageMatches) {
      const slot =
        slotHints.get(match.id) ??
        resolveSlot(match, stage, seedByTeam, prevWinnerSlot) ??
        fallback.indexOf(match);
      result.set(match.id, slot);

      // Record who carries this slot forward. When undecided, map both teams so
      // the next round can still chain; never propagate the TBD placeholder.
      const winner = winnerOf(match);
      const carriers = winner ? [winner] : [match.homeId, match.awayId];
      for (const teamId of carriers) {
        if (teamId !== TBD_TEAM_ID) winnerSlot.set(teamId, slot);
      }
    }
    prevWinnerSlot = winnerSlot;
  }

  return result;
}

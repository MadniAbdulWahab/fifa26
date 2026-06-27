import type { GroupId, Match } from '@/domain/types';
import { SEED_TEAMS, type SeedTeam } from './teams';

/** Standard four-team group pattern after the draw positions are known. */
const GROUP_PAIRINGS: [number, number][][] = [
  [
    [0, 1],
    [2, 3],
  ],
  [
    [0, 2],
    [3, 1],
  ],
  [
    [3, 0],
    [1, 2],
  ],
];

/**
 * Group-stage dates in UTC, based on the published FIFA schedule-by-group
 * pattern. Some matchdays span adjacent dates; where exact kickoff slots are
 * not represented here, we keep the group pairing/date correct and use stable
 * evening UTC kickoff slots.
 */
const GROUP_DATES: Record<GroupId, [string, string, string]> = {
  A: ['2026-06-11', '2026-06-18', '2026-06-24'],
  B: ['2026-06-12', '2026-06-18', '2026-06-24'],
  C: ['2026-06-13', '2026-06-19', '2026-06-24'],
  D: ['2026-06-12', '2026-06-19', '2026-06-25'],
  E: ['2026-06-14', '2026-06-20', '2026-06-25'],
  F: ['2026-06-14', '2026-06-20', '2026-06-25'],
  G: ['2026-06-15', '2026-06-21', '2026-06-26'],
  H: ['2026-06-15', '2026-06-21', '2026-06-26'],
  I: ['2026-06-16', '2026-06-22', '2026-06-26'],
  J: ['2026-06-16', '2026-06-22', '2026-06-27'],
  K: ['2026-06-17', '2026-06-23', '2026-06-27'],
  L: ['2026-06-17', '2026-06-23', '2026-06-27'],
};

const KICKOFF_HOURS_UTC = [16, 19];

function teamsOfGroup(group: GroupId): SeedTeam[] {
  return SEED_TEAMS.filter((t) => t.group === group);
}

function kickoff(group: GroupId, matchday: number, slot: number): string {
  const day = GROUP_DATES[group][matchday];
  return `${day}T${String(KICKOFF_HOURS_UTC[slot] ?? 16).padStart(2, '0')}:00:00.000Z`;
}

/**
 * Generate the 72 group-stage fixtures from the current group draw.
 *
 * Unlike the old demo data, these matches are not pre-scored. The bundled
 * static source is now a fixture schedule; scores and scorer events should come
 * from a real live feed or a manually maintained results file.
 */
export function generateGroupMatches(): Match[] {
  const groups = [
    ...new Set(SEED_TEAMS.map((t) => t.group)),
  ].sort() as GroupId[];

  return groups.flatMap((group) => {
    const teams = teamsOfGroup(group);

    return GROUP_PAIRINGS.flatMap((round, matchday) =>
      round.map(([homeIndex, awayIndex], slot) => {
        const home = teams[homeIndex]!;
        const away = teams[awayIndex]!;

        return {
          id: `g-${group}-md${matchday + 1}-m${slot + 1}`,
          stage: 'group',
          group,
          kickoff: kickoff(group, matchday, slot),
          status: 'scheduled',
          homeId: home.id,
          awayId: away.id,
          homeGoals: null,
          awayGoals: null,
        };
      }),
    );
  });
}

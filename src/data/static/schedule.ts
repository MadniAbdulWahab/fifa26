import type { GroupId, Match } from '@/domain/types';
import { simulateScore } from '@/lib/model';
import { hashString, mulberry32 } from '@/lib/rng';
import { SEED_TEAMS, type SeedTeam } from './teams';

/** Single round-robin schedule for four teams (indices 0–3). */
const ROUND_ROBIN: [number, number][][] = [
  [
    [0, 1],
    [2, 3],
  ],
  [
    [0, 2],
    [1, 3],
  ],
  [
    [0, 3],
    [1, 2],
  ],
];

/** First kickoff date (UTC) for each matchday. */
const MATCHDAY_START = ['2026-06-11', '2026-06-16', '2026-06-21'];
const KICKOFF_HOURS_UTC = [16, 19];

function teamsOfGroup(group: GroupId): SeedTeam[] {
  return SEED_TEAMS.filter((t) => t.group === group);
}

function kickoff(matchday: number, groupIndex: number, slot: number): string {
  const base = new Date(`${MATCHDAY_START[matchday]}T00:00:00Z`);
  base.setUTCDate(base.getUTCDate() + Math.floor(groupIndex / 3));
  base.setUTCHours(KICKOFF_HOURS_UTC[slot] ?? 16);
  return base.toISOString();
}

/**
 * Generate all 72 group-stage matches with deterministic sample scores.
 *
 * Scores come from the shared Poisson model seeded by match id, so they are
 * stable across reloads and look plausible given each team's rating.
 */
export function generateGroupMatches(): Match[] {
  const matches: Match[] = [];
  const groups = [...new Set(SEED_TEAMS.map((t) => t.group))].sort();

  groups.forEach((group, groupIndex) => {
    const teams = teamsOfGroup(group);
    ROUND_ROBIN.forEach((round, matchday) => {
      round.forEach(([a, b], slot) => {
        const home = teams[a]!;
        const away = teams[b]!;
        const id = `g-${group}-md${matchday + 1}-m${slot + 1}`;
        const rng = mulberry32(hashString(id));
        const score = simulateScore(home, away, rng);
        matches.push({
          id,
          stage: 'group',
          group,
          kickoff: kickoff(matchday, groupIndex, slot),
          status: 'finished',
          venue: `Group ${group} venue`,
          homeId: home.id,
          awayId: away.id,
          homeGoals: score.home,
          awayGoals: score.away,
        });
      });
    });
  });

  return matches;
}

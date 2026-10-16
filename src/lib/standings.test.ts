import { describe, expect, it } from 'vitest';
import type { Match, MatchStage, Team } from '@/domain/types';
import { buildStandings } from './standings';

function team(id: string): Team {
  return { id, name: id, code: id.toUpperCase(), flag: '', rating: 1700 };
}

function match(
  homeId: string,
  awayId: string,
  homeGoals: number,
  awayGoals: number,
  stage: MatchStage = 'group',
): Match {
  return {
    id: `${stage}-${homeId}-${awayId}`,
    stage,
    ...(stage === 'group' ? { group: 'A' as const } : {}),
    kickoff: '2026-06-11T16:00:00Z',
    status: 'finished',
    homeId,
    awayId,
    homeGoals,
    awayGoals,
  };
}

describe('buildStandings', () => {
  it('ignores knockout matches when building group records', () => {
    const teams = ['a', 'b', 'c', 'd'].map(team);
    const matches = [
      match('a', 'b', 2, 0),
      match('c', 'd', 1, 1),
      match('a', 'c', 0, 1),
      match('b', 'd', 3, 0),
      match('a', 'd', 1, 0),
      match('b', 'c', 0, 0),
      // Later knockout games for the same teams must not count.
      match('a', 'x', 4, 0, 'round-of-32'),
      match('c', 'y', 0, 2, 'round-of-32'),
    ];
    const [groupA] = buildStandings(teams, matches);
    expect(groupA?.rows.map((r) => r.record.played)).toEqual([3, 3, 3, 3]);
    const a = groupA?.rows.find((r) => r.team.id === 'a');
    expect(a?.record.points).toBe(6);
    expect(a?.record.goalsFor).toBe(3);
  });
});

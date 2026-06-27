import { describe, expect, it } from 'vitest';
import type { Match } from '@/domain/types';
import { computeRecord } from './record';

function match(
  homeId: string,
  awayId: string,
  homeGoals: number | null,
  awayGoals: number | null,
): Match {
  return {
    id: `${homeId}-${awayId}`,
    stage: 'group',
    group: 'A',
    kickoff: '2026-06-11T16:00:00Z',
    status: homeGoals === null ? 'scheduled' : 'finished',
    homeId,
    awayId,
    homeGoals,
    awayGoals,
  };
}

describe('computeRecord', () => {
  it('counts a win, a draw and a loss correctly', () => {
    const matches = [
      match('a', 'b', 2, 0), // a win
      match('a', 'c', 1, 1), // a draw
      match('d', 'a', 3, 1), // a loss
    ];
    const record = computeRecord('a', matches);
    expect(record.played).toBe(3);
    expect(record.wins).toBe(1);
    expect(record.draws).toBe(1);
    expect(record.losses).toBe(1);
    expect(record.goalsFor).toBe(4);
    expect(record.goalsAgainst).toBe(4);
    expect(record.goalDifference).toBe(0);
    expect(record.points).toBe(4);
  });

  it('ignores matches without a score', () => {
    const record = computeRecord('a', [match('a', 'b', null, null)]);
    expect(record.played).toBe(0);
    expect(record.points).toBe(0);
  });
});

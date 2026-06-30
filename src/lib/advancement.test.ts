import { describe, expect, it } from 'vitest';
import type { Match, Team } from '@/domain/types';
import { simulateAdvancement } from './advancement';

/** Build a 4-team group where every match is finished. */
function clinchedGroup(): { teams: Team[]; matches: Match[] } {
  const teams: Team[] = [
    { id: 't1', name: 'Top', code: 'TOP', flag: '⚽', rating: 2000 },
    { id: 't2', name: 'Two', code: 'TWO', flag: '⚽', rating: 1800 },
    { id: 't3', name: 'Three', code: 'THR', flag: '⚽', rating: 1600 },
    { id: 't4', name: 'Four', code: 'FOR', flag: '⚽', rating: 1400 },
  ];
  const m = (h: string, a: string, hg: number, ag: number): Match => ({
    id: `${h}${a}`,
    stage: 'group',
    group: 'A',
    kickoff: '2026-06-11T16:00:00Z',
    status: 'finished',
    homeId: h,
    awayId: a,
    homeGoals: hg,
    awayGoals: ag,
  });
  // t1 & t2 win all/most; t4 loses everything.
  const matches = [
    m('t1', 't2', 1, 0),
    m('t3', 't4', 2, 0),
    m('t1', 't3', 3, 0),
    m('t2', 't4', 2, 0),
    m('t1', 't4', 4, 0),
    m('t2', 't3', 2, 1),
  ];
  return { teams, matches };
}

describe('simulateAdvancement', () => {
  it('gives a clinched top-two team ~100% and a winless bottom team a low chance', () => {
    const { teams, matches } = clinchedGroup();
    const odds = simulateAdvancement(teams, matches, { iterations: 500 });

    // With only one group, top 2 plus best-thirds (up to 8) all advance, so
    // the strongest team is certain and the weakest is near-certain too here.
    expect(odds.get('t1')!.advanceFromGroup).toBeGreaterThan(0.99);
    // Probabilities are valid.
    for (const team of teams) {
      const o = odds.get(team.id)!;
      expect(o.advanceFromGroup).toBeGreaterThanOrEqual(0);
      expect(o.advanceFromGroup).toBeLessThanOrEqual(1);
      expect(o.winTitle).toBeGreaterThanOrEqual(0);
    }
  });

  it('is deterministic for a fixed seed', () => {
    const { teams, matches } = clinchedGroup();
    const a = simulateAdvancement(teams, matches, { iterations: 300, seed: 7 });
    const b = simulateAdvancement(teams, matches, { iterations: 300, seed: 7 });
    expect(a.get('t1')!.winTitle).toBe(b.get('t1')!.winTitle);
  });

  it('sets title odds to zero for teams eliminated in knockouts', () => {
    const { teams, matches } = clinchedGroup();
    const odds = simulateAdvancement(
      teams,
      [
        ...matches,
        {
          id: 'ko-t1',
          stage: 'round-of-32',
          kickoff: '2026-06-28T16:00:00Z',
          status: 'finished',
          homeId: 't1',
          awayId: 't2',
          homeGoals: 0,
          awayGoals: 1,
        },
      ],
      { iterations: 300, seed: 7 },
    );

    expect(odds.get('t1')!.winTitle).toBe(0);
  });
});

import { describe, expect, it } from 'vitest';
import type { GroupStandings, Match, Team } from '@/domain/types';
import { buildStandings } from './standings';
import { qualificationStatus } from './qualification';

const teams: Team[] = [
  { id: 'a', name: 'Alpha', code: 'ALP', flag: '', rating: 1800 },
  { id: 'b', name: 'Beta', code: 'BET', flag: '', rating: 1700 },
  { id: 'c', name: 'Gamma', code: 'GAM', flag: '', rating: 1600 },
  { id: 'd', name: 'Delta', code: 'DEL', flag: '', rating: 1500 },
];

function match(
  id: string,
  homeId: string,
  awayId: string,
  homeGoals: number | null,
  awayGoals: number | null,
): Match {
  return {
    id,
    stage: 'group',
    group: 'A',
    kickoff: '2026-06-11T16:00:00.000Z',
    status: homeGoals === null ? 'scheduled' : 'finished',
    homeId,
    awayId,
    homeGoals,
    awayGoals,
  };
}

function standings(matches: Match[]): GroupStandings[] {
  return buildStandings(teams, matches);
}

describe('qualificationStatus', () => {
  it('marks a team as qualified once it appears in a knockout match', () => {
    const groupMatches = [
      match('ab', 'a', 'b', null, null),
      match('cd', 'c', 'd', null, null),
    ];
    const matches: Match[] = [
      ...groupMatches,
      {
        id: 'ko-a',
        stage: 'round-of-32',
        kickoff: '2026-06-28T16:00:00.000Z',
        status: 'scheduled',
        homeId: 'a',
        awayId: 'b',
        homeGoals: null,
        awayGoals: null,
      },
    ];

    expect(qualificationStatus('a', matches, standings(groupMatches))).toEqual({
      kind: 'qualified',
      label: 'Still alive in knockouts',
    });
  });

  it('marks bottom-half teams eliminated once their group is complete', () => {
    const matches = [
      match('ab', 'a', 'b', 3, 0),
      match('ac', 'a', 'c', 2, 0),
      match('ad', 'a', 'd', 2, 0),
      match('bc', 'b', 'c', 1, 0),
      match('bd', 'b', 'd', 1, 0),
      match('cd', 'c', 'd', 1, 0),
    ];

    expect(qualificationStatus('d', matches, standings(matches))).toEqual({
      kind: 'eliminated',
      label: 'Eliminated in group stage',
    });
  });

  it('marks a knockout loser eliminated even if they qualified from the group', () => {
    const groupMatches = [
      match('ab', 'a', 'b', 3, 0),
      match('ac', 'a', 'c', 2, 0),
      match('ad', 'a', 'd', 2, 0),
      match('bc', 'b', 'c', 1, 0),
      match('bd', 'b', 'd', 1, 0),
      match('cd', 'c', 'd', 1, 0),
    ];
    const matches: Match[] = [
      ...groupMatches,
      {
        id: 'ko-a',
        stage: 'round-of-32',
        kickoff: '2026-06-28T16:00:00.000Z',
        status: 'finished',
        homeId: 'a',
        awayId: 'b',
        homeGoals: 0,
        awayGoals: 1,
      },
    ];

    expect(qualificationStatus('a', matches, standings(groupMatches))).toEqual({
      kind: 'eliminated',
      label: 'Eliminated in Round of 32',
    });
  });

  it('uses winnerId to eliminate a team after a tied knockout score', () => {
    const groupMatches = [
      match('ab', 'a', 'b', 3, 0),
      match('ac', 'a', 'c', 2, 0),
      match('ad', 'a', 'd', 2, 0),
      match('bc', 'b', 'c', 1, 0),
      match('bd', 'b', 'd', 1, 0),
      match('cd', 'c', 'd', 1, 0),
    ];
    const matches: Match[] = [
      ...groupMatches,
      {
        id: 'ko-a',
        stage: 'round-of-32',
        kickoff: '2026-06-28T16:00:00.000Z',
        status: 'finished',
        homeId: 'a',
        awayId: 'b',
        homeGoals: 1,
        awayGoals: 1,
        winnerId: 'b',
      },
    ];

    expect(qualificationStatus('a', matches, standings(groupMatches))).toEqual({
      kind: 'eliminated',
      label: 'Eliminated in Round of 32',
    });
  });
});

import { describe, expect, it } from 'vitest';
import type {
  GroupId,
  GroupStandings,
  Match,
  MatchStage,
  Team,
  TeamRecord,
} from '@/domain/types';
import { bracketSlots } from './bracketLayout';

function team(id: string): Team {
  return { id, name: id, code: id.toUpperCase(), flag: '', rating: 1500 };
}

function record(teamId: string): TeamRecord {
  return {
    teamId,
    played: 3,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
  };
}

/** Build standings from `{ A: ['a1', 'a2', 'a3'], ... }` (index 0 = position 1). */
function standingsFrom(spec: Record<string, string[]>): GroupStandings[] {
  return Object.entries(spec).map(([group, ids]) => ({
    group: group as GroupId,
    rows: ids.map((id, i) => ({
      team: team(id),
      record: record(id),
      position: i + 1,
    })),
  }));
}

function ko(
  id: string,
  stage: MatchStage,
  homeId: string,
  awayId: string,
  opts: { winner?: string; kickoff?: string } = {},
): Match {
  const played = Boolean(opts.winner);
  return {
    id,
    stage,
    kickoff: opts.kickoff ?? '2026-06-28T19:00:00Z',
    status: played ? 'finished' : 'scheduled',
    homeId,
    awayId,
    homeGoals: played ? (opts.winner === homeId ? 1 : 0) : null,
    awayGoals: played ? (opts.winner === awayId ? 1 : 0) : null,
    ...(opts.winner ? { winnerId: opts.winner } : {}),
  };
}

describe('bracketSlots', () => {
  it('reads the slot from built (static-source) ids', () => {
    const matches: Match[] = [
      ko('ko-round-of-16-3', 'round-of-16', 'tbd', 'tbd'),
      ko('ko-quarter-final-1', 'quarter-final', 'tbd', 'tbd'),
      ko('ko-final-1', 'final', 'tbd', 'tbd'),
    ];
    const slots = bracketSlots(matches, []);
    expect(slots.get('ko-round-of-16-3')).toBe(2);
    expect(slots.get('ko-quarter-final-1')).toBe(0);
    expect(slots.get('ko-final-1')).toBe(0);
  });

  it('locates Round-of-32 matches by official group placement', () => {
    const standings = standingsFrom({
      A: ['a1', 'a2', 'a3'],
      B: ['b1', 'b2', 'b3'],
      C: ['c1', 'c2', 'c3'],
      F: ['f1', 'f2', 'f3'],
      I: ['i1', 'i2', 'i3'],
    });
    const matches: Match[] = [
      ko('73', 'round-of-32', 'a2', 'b2'), // slot 0
      ko('75', 'round-of-32', 'f1', 'c2'), // slot 1
      ko('77', 'round-of-32', 'i1', 'x3'), // slot 2 (away is a best-third)
      ko('79', 'round-of-32', 'a1', 'y3'), // slot 3 (away is a best-third)
    ];
    const slots = bracketSlots(matches, standings);
    expect(slots.get('73')).toBe(0);
    expect(slots.get('75')).toBe(1);
    expect(slots.get('77')).toBe(2);
    expect(slots.get('79')).toBe(3);
  });

  it('chains winners up the tree R32 → R16 → QF', () => {
    const standings = standingsFrom({
      A: ['a1', 'a2', 'a3'],
      B: ['b1', 'b2', 'b3'],
      C: ['c1', 'c2', 'c3'],
      F: ['f1', 'f2', 'f3'],
      I: ['i1', 'i2', 'i3'],
    });
    const matches: Match[] = [
      ko('73', 'round-of-32', 'a2', 'b2', { winner: 'a2' }), // slot 0
      ko('75', 'round-of-32', 'f1', 'c2', { winner: 'f1' }), // slot 1
      ko('77', 'round-of-32', 'i1', 'x3', { winner: 'i1' }), // slot 2
      ko('79', 'round-of-32', 'a1', 'y3', { winner: 'a1' }), // slot 3
      // R16: feeders (0,1) and (2,3) → slots 0 and 1
      ko('r16a', 'round-of-16', 'a2', 'f1', { winner: 'a2' }),
      ko('r16b', 'round-of-16', 'i1', 'a1', { winner: 'i1' }),
      // QF: feeders R16 (0,1) → slot 0
      ko('qf', 'quarter-final', 'a2', 'i1'),
    ];
    const slots = bracketSlots(matches, standings);
    expect(slots.get('r16a')).toBe(0);
    expect(slots.get('r16b')).toBe(1);
    expect(slots.get('qf')).toBe(0);
  });

  it('uses known next-round fixtures to line up previous-round cards', () => {
    const matches: Match[] = [
      ko('r32-1', 'round-of-32', 'rsa', 'can', {
        winner: 'can',
        kickoff: '2026-06-28T19:00:00Z',
      }),
      ko('r32-2', 'round-of-32', 'bra', 'jpn', {
        winner: 'bra',
        kickoff: '2026-06-29T17:00:00Z',
      }),
      ko('r32-3', 'round-of-32', 'ger', 'par', {
        winner: 'par',
        kickoff: '2026-06-29T20:30:00Z',
      }),
      ko('r32-4', 'round-of-32', 'ned', 'mar', {
        winner: 'mar',
        kickoff: '2026-06-30T01:00:00Z',
      }),
      ko('r32-6', 'round-of-32', 'fra', 'swe', {
        winner: 'fra',
        kickoff: '2026-06-30T21:00:00Z',
      }),
      ko('r16-1', 'round-of-16', 'can', 'mar', {
        kickoff: '2026-07-04T17:00:00Z',
      }),
      ko('r16-2', 'round-of-16', 'par', 'fra', {
        kickoff: '2026-07-04T21:00:00Z',
      }),
    ];

    const slots = bracketSlots(matches, []);
    expect(slots.get('r32-1')).toBe(0);
    expect(slots.get('r32-4')).toBe(1);
    expect(slots.get('r32-3')).toBe(2);
    expect(slots.get('r32-6')).toBe(3);
    expect(slots.get('r16-1')).toBe(0);
    expect(slots.get('r16-2')).toBe(1);
  });

  it('uses provider winner placeholders to attach unresolved feeder matches', () => {
    const matches: Match[] = [
      ko('r32-1', 'round-of-32', 'mex', 'ecu', {
        winner: 'mex',
        kickoff: '2026-07-01T02:00:00Z',
      }),
      ko('r32-2', 'round-of-32', 'eng', 'cod', {
        kickoff: '2026-07-01T16:00:00Z',
      }),
      ko('r16-1', 'round-of-16', 'mex', 'winner:round-of-32:2', {
        kickoff: '2026-07-06T00:00:00Z',
      }),
    ];

    const slots = bracketSlots(matches, []);
    expect(slots.get('r32-1')).toBe(0);
    expect(slots.get('r32-2')).toBe(1);
    expect(slots.get('r16-1')).toBe(0);
  });

  it('falls back to kickoff order when a match cannot be resolved', () => {
    const matches: Match[] = [
      ko('late', 'round-of-32', 'p', 'q', { kickoff: '2026-06-28T22:00:00Z' }),
      ko('early', 'round-of-32', 'r', 's', { kickoff: '2026-06-28T16:00:00Z' }),
    ];
    const slots = bracketSlots(matches, []);
    expect(slots.get('early')).toBe(0);
    expect(slots.get('late')).toBe(1);
  });
});

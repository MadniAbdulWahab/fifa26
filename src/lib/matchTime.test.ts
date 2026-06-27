import { describe, expect, it } from 'vitest';
import type { Match, MatchStatus } from '@/domain/types';
import { findAnchorId, isLiveNow } from './matchTime';

const HOUR = 60 * 60 * 1000;

function match(
  id: string,
  kickoff: string,
  status: MatchStatus,
): Match {
  return {
    id,
    stage: 'group',
    group: 'A',
    kickoff,
    status,
    homeId: 'h',
    awayId: 'a',
    homeGoals: status === 'finished' ? 1 : null,
    awayGoals: status === 'finished' ? 0 : null,
  };
}

const iso = (ms: number) => new Date(ms).toISOString();

describe('isLiveNow', () => {
  it('is true within the kickoff window for a non-finished match', () => {
    const now = Date.parse('2026-06-27T18:00:00Z');
    expect(isLiveNow(match('m', iso(now - HOUR), 'scheduled'), now)).toBe(true);
  });

  it('is false before kickoff and after the window', () => {
    const now = Date.parse('2026-06-27T18:00:00Z');
    expect(isLiveNow(match('m', iso(now + HOUR), 'scheduled'), now)).toBe(false);
    expect(isLiveNow(match('m', iso(now - 3 * HOUR), 'scheduled'), now)).toBe(
      false,
    );
  });

  it('always trusts an explicit live status', () => {
    const now = Date.parse('2026-06-27T18:00:00Z');
    expect(isLiveNow(match('m', iso(now + 10 * HOUR), 'live'), now)).toBe(true);
  });
});

describe('findAnchorId', () => {
  const now = Date.parse('2026-06-27T18:00:00Z');

  it('prefers a live match', () => {
    const matches = [
      match('a', iso(now - 5 * HOUR), 'finished'),
      match('b', iso(now - HOUR), 'scheduled'), // in window -> live
      match('c', iso(now + 5 * HOUR), 'scheduled'),
    ];
    expect(findAnchorId(matches, now)).toBe('b');
  });

  it('falls back to the next upcoming match', () => {
    const matches = [
      match('a', iso(now - 5 * HOUR), 'finished'),
      match('b', iso(now + 5 * HOUR), 'scheduled'),
    ];
    expect(findAnchorId(matches, now)).toBe('b');
  });

  it('falls back to the last match when all are finished', () => {
    const matches = [
      match('a', iso(now - 10 * HOUR), 'finished'),
      match('b', iso(now - 5 * HOUR), 'finished'),
    ];
    expect(findAnchorId(matches, now)).toBe('b');
  });
});

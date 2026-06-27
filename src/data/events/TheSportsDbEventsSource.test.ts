import { describe, expect, it } from 'vitest';
import type { Match, Team } from '@/domain/types';
import type { TsdbEvent, TsdbTimelineEntry } from './theSportsDbTypes';
import { fixtureMatches, mapTimelineToGoals } from './TheSportsDbEventsSource';
import { matchesTeam } from './teamNames';

const team = (id: string, name: string, code: string): Team => ({
  id,
  name,
  code,
  flag: '',
  rating: 1700,
});

const home = team('kor', 'Korea Republic', 'KOR'); // TheSportsDB: "South Korea"
const away = team('cze', 'Czechia', 'CZE'); // TheSportsDB: "Czech Republic"

const match: Match = {
  id: 'g-A-md1-m1',
  stage: 'group',
  group: 'A',
  kickoff: '2026-06-12T16:00:00.000Z',
  status: 'finished',
  homeId: 'kor',
  awayId: 'cze',
  homeGoals: 2,
  awayGoals: 1,
};

const goal = (over: Partial<TsdbTimelineEntry>): TsdbTimelineEntry => ({
  idTimeline: Math.random().toString(),
  strTimeline: 'Goal',
  strTimelineDetail: 'Normal Goal',
  strHome: 'Yes',
  strPlayer: 'Player',
  strAssist: null,
  strTeam: 'South Korea',
  intTime: '10',
  ...over,
});

describe('matchesTeam (cross-provider aliases)', () => {
  it('matches aliased names', () => {
    expect(matchesTeam('South Korea', home)).toBe(true);
    expect(matchesTeam('Czech Republic', away)).toBe(true);
  });
  it('rejects unrelated names', () => {
    expect(matchesTeam('Mexico', home)).toBe(false);
    expect(matchesTeam('', home)).toBe(false);
  });
});

describe('fixtureMatches', () => {
  const ev = (h: string, a: string): TsdbEvent => ({
    idEvent: '1',
    dateEvent: '2026-06-12',
    strHomeTeam: h,
    strAwayTeam: a,
    intHomeScore: '2',
    intAwayScore: '1',
  });
  it('matches in normal orientation', () => {
    expect(fixtureMatches(ev('South Korea', 'Czech Republic'), home, away)).toBe(
      true,
    );
  });
  it('matches in swapped orientation', () => {
    expect(fixtureMatches(ev('Czech Republic', 'South Korea'), home, away)).toBe(
      true,
    );
  });
  it('rejects a different fixture', () => {
    expect(fixtureMatches(ev('Mexico', 'South Africa'), home, away)).toBe(false);
  });
});

describe('mapTimelineToGoals', () => {
  it('maps goal side via strHome, sorts, keeps assists, drops non-goals', () => {
    const timeline: TsdbTimelineEntry[] = [
      goal({ strHome: 'No', strTeam: 'Czech Republic', intTime: '59', strPlayer: 'Krejci' }),
      goal({ strHome: 'Yes', strTeam: 'South Korea', intTime: '10', strPlayer: 'Son', strAssist: 'Lee' }),
      { ...goal({}), strTimeline: 'Card', strPlayer: 'Booked' },
    ];
    const goals = mapTimelineToGoals(timeline, match, home, away, true);

    expect(goals).toHaveLength(2);
    // Sorted by minute.
    expect(goals[0]!.playerName).toBe('Son');
    expect(goals[0]!.teamId).toBe('kor');
    expect(goals[0]!.assistName).toBe('Lee');
    expect(goals[1]!.teamId).toBe('cze');
  });

  it('respects flipped fixture orientation', () => {
    const timeline = [goal({ strHome: 'Yes', strTeam: 'Czech Republic' })];
    // homeIsOurHome=false → TheSportsDB home is our away team.
    const goals = mapTimelineToGoals(timeline, match, home, away, false);
    expect(goals[0]!.teamId).toBe('cze');
  });
});

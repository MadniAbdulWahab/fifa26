import { describe, expect, it } from 'vitest';
import type { Match, Team } from '@/domain/types';
import type {
  EspnKeyEvent,
  EspnScoreboardEvent,
  EspnCommentaryItem,
} from './espnTypes';
import {
  findEspnEventId,
  mapEspnCommentary,
  mapEspnGoals,
} from './EspnEventsSource';

const team = (id: string, name: string, code: string): Team => ({
  id,
  name,
  code,
  flag: '',
  rating: 1700,
});

const home = team('kor', 'Korea Republic', 'KOR'); // ESPN: "South Korea"
const away = team('cze', 'Czechia', 'CZE');

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

const sbEvent = (
  id: string,
  date: string,
  h: string,
  a: string,
): EspnScoreboardEvent => ({
  id,
  date,
  competitions: [
    {
      competitors: [
        { homeAway: 'home', team: { displayName: h } },
        { homeAway: 'away', team: { displayName: a } },
      ],
    },
  ],
});

describe('findEspnEventId', () => {
  it('matches by date + both teams (aliased names)', () => {
    const events = [
      sbEvent('1', '2026-06-11T19:00Z', 'Mexico', 'South Africa'),
      sbEvent('2', '2026-06-12T16:00Z', 'South Korea', 'Czechia'),
    ];
    expect(findEspnEventId(events, match, home, away)).toBe('2');
  });

  it('matches with swapped home/away orientation', () => {
    const events = [sbEvent('9', '2026-06-12T16:00Z', 'Czechia', 'South Korea')];
    expect(findEspnEventId(events, match, home, away)).toBe('9');
  });

  it('tolerates a ±1 day kickoff/date drift', () => {
    const events = [sbEvent('3', '2026-06-13T01:00Z', 'South Korea', 'Czechia')];
    expect(findEspnEventId(events, match, home, away)).toBe('3');
  });

  it('returns undefined when no fixture matches', () => {
    const events = [sbEvent('4', '2026-06-12T16:00Z', 'Brazil', 'Morocco')];
    expect(findEspnEventId(events, match, home, away)).toBeUndefined();
  });
});

describe('mapEspnGoals', () => {
  const goal = (over: Partial<EspnKeyEvent>): EspnKeyEvent => ({
    id: Math.random().toString(),
    type: { type: 'goal', text: 'Goal' },
    scoringPlay: true,
    clock: { displayValue: "10'" },
    team: { displayName: 'South Korea' },
    participants: [{ athlete: { displayName: 'Son' } }],
    ...over,
  });

  it('maps scorer/assist/minute and assigns the right side', () => {
    const keyEvents: EspnKeyEvent[] = [
      goal({
        // Header: not typed "goal" but flagged scoringPlay — must still count.
        type: { type: 'goal---header', text: 'Goal - Header' },
        team: { displayName: 'South Korea' },
        clock: { displayValue: "10'" },
        participants: [
          { athlete: { displayName: 'Son' } },
          { athlete: { displayName: 'Lee' } },
        ],
      }),
      goal({
        team: { displayName: 'Czechia' },
        clock: { displayValue: "59'" },
        participants: [{ athlete: { displayName: 'Krejci' } }],
      }),
      { type: { type: 'yellow-card' }, team: { displayName: 'Czechia' } },
      { scoringPlay: true, shootout: true, team: { displayName: 'Czechia' } },
    ];
    const goals = mapEspnGoals(keyEvents, match, home, away);

    expect(goals).toHaveLength(2);
    expect(goals[0]).toMatchObject({
      minute: '10',
      teamId: 'kor',
      playerName: 'Son',
      assistName: 'Lee',
    });
    expect(goals[1]).toMatchObject({ teamId: 'cze', playerName: 'Krejci' });
    expect(goals[1]!.assistName).toBeUndefined();
  });
});

describe('mapEspnCommentary', () => {
  it('sorts newest first and drops empty lines', () => {
    const items: EspnCommentaryItem[] = [
      { sequence: 0, time: { displayValue: '' }, text: 'Kickoff.' },
      { sequence: 5, time: { displayValue: "23'" }, text: 'GOAL!' },
      { sequence: 3, time: { displayValue: "10'" }, text: '' },
    ];
    const out = mapEspnCommentary(items);
    expect(out.map((c) => c.text)).toEqual(['GOAL!', 'Kickoff.']);
    expect(out[0]).toMatchObject({ minute: "23'", text: 'GOAL!' });
  });
});

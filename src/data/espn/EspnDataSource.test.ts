import { describe, expect, it } from 'vitest';
import type { EspnApiEvent } from './espnApiTypes';
import {
  groupForTeam,
  mapEspnEvent,
  mapStage,
  mapState,
  resolveEspnTeam,
} from './EspnDataSource';

describe('mapStage / mapState', () => {
  it('maps ESPN season slugs to our stages', () => {
    expect(mapStage('group-stage')).toBe('group');
    expect(mapStage('quarterfinals')).toBe('quarter-final');
    expect(mapStage('3rd-place-match')).toBe('third-place');
    expect(mapStage('final')).toBe('final');
    expect(mapStage(undefined)).toBe('group');
  });
  it('maps ESPN status state to our status', () => {
    expect(mapState('pre')).toBe('scheduled');
    expect(mapState('in')).toBe('live');
    expect(mapState('post')).toBe('finished');
  });
});

describe('groupForTeam (derived from the seed draw)', () => {
  it('resolves via name and aliases', () => {
    expect(groupForTeam('Mexico')).toBe('A');
    expect(groupForTeam('South Korea')).toBe('A'); // alias of Korea Republic
    expect(groupForTeam('Czech Republic')).toBe('A'); // alias of Czechia
    expect(groupForTeam('England')).toBe('L');
  });
  it('returns undefined for unknown teams', () => {
    expect(groupForTeam('Narnia')).toBeUndefined();
    expect(groupForTeam(undefined)).toBeUndefined();
  });
});

describe('resolveEspnTeam', () => {
  it('borrows FIFA code / flag / rating from the seed team', () => {
    const t = resolveEspnTeam({
      id: '203',
      abbreviation: 'MEX',
      displayName: 'Mexico',
    });
    expect(t).toMatchObject({ id: '203', code: 'MEX', rating: 1840 });
    expect(t.flag).toBe('https://flagcdn.com/mx.svg');
  });
  it('maps differently-named teams to the right seed (flag stays correct)', () => {
    const t = resolveEspnTeam({
      id: '10',
      abbreviation: 'KOR',
      displayName: 'South Korea',
    });
    expect(t.code).toBe('KOR');
    expect(t.flag).toBe('https://flagcdn.com/kr.svg');
  });
});

const event = (over: Partial<EspnApiEvent> = {}): EspnApiEvent => ({
  id: '760415',
  date: '2026-06-11T19:00Z',
  status: { type: { state: 'post' } },
  season: { slug: 'group-stage' },
  competitions: [
    {
      venue: {
        fullName: 'Estadio Banorte',
        address: { city: 'Monterrey' },
      },
      competitors: [
        {
          homeAway: 'home',
          score: '2',
          team: { id: '203', displayName: 'Mexico' },
        },
        {
          homeAway: 'away',
          score: '0',
          team: { id: '99', displayName: 'South Africa' },
        },
      ],
    },
  ],
  ...over,
});

describe('mapEspnEvent', () => {
  it('maps a finished group match with score, group and venue', () => {
    const m = mapEspnEvent(event())!;
    expect(m).toMatchObject({
      id: '760415',
      stage: 'group',
      group: 'A',
      status: 'finished',
      venue: 'Estadio Banorte',
      venueCity: 'Monterrey',
      homeId: '203',
      awayId: '99',
      homeGoals: 2,
      awayGoals: 0,
    });
  });

  it('nulls scores for unplayed matches', () => {
    const m = mapEspnEvent(event({ status: { type: { state: 'pre' } } }))!;
    expect(m.status).toBe('scheduled');
    expect(m.homeGoals).toBeNull();
    expect(m.awayGoals).toBeNull();
  });

  it('carries the live clock minute only while in progress', () => {
    const liveM = mapEspnEvent(
      event({
        status: { displayClock: "72'", type: { state: 'in' } },
      }),
    )!;
    expect(liveM.status).toBe('live');
    expect(liveM.minute).toBe("72'");
    // Finished/scheduled carry no live minute.
    expect(mapEspnEvent(event())!.minute).toBeUndefined();
  });

  it('omits group for knockout matches', () => {
    const m = mapEspnEvent(event({ season: { slug: 'round-of-16' } }))!;
    expect(m.stage).toBe('round-of-16');
    expect(m.group).toBeUndefined();
  });
});

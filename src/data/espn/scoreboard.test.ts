import { describe, expect, it, vi } from 'vitest';
import { mapEspnEvent } from './EspnDataSource';
import {
  TOURNAMENT_OVER_AT,
  loadArchivedEvents,
  loadScoreboardEvents,
} from './scoreboard';

const DURING_TOURNAMENT = Date.parse('2026-06-20T12:00:00Z');

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

describe('results archive', () => {
  it('holds all 104 fixtures, every one finished and mappable', async () => {
    const events = await loadArchivedEvents();
    expect(events).toHaveLength(104);
    const matches = events.map(mapEspnEvent);
    expect(matches.every((m) => m !== null)).toBe(true);
    expect(matches.every((m) => m?.status === 'finished')).toBe(true);
    expect(matches.filter((m) => m?.stage === 'group')).toHaveLength(72);
    expect(matches.filter((m) => m?.stage === 'final')).toHaveLength(1);
  });
});

describe('loadScoreboardEvents', () => {
  it('serves the archive after the tournament without calling ESPN', async () => {
    const fetchImpl = vi.fn<typeof fetch>();
    const events = await loadScoreboardEvents(TOURNAMENT_OVER_AT, fetchImpl);
    expect(events).toHaveLength(104);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('uses the live scoreboard while the tournament runs', async () => {
    const live = [
      { id: 'live-1', date: '2026-06-20T19:00Z', competitions: [] },
    ];
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      jsonResponse({ events: live }),
    );
    const events = await loadScoreboardEvents(DURING_TOURNAMENT, fetchImpl);
    expect(events).toEqual(live);
  });

  it('falls back to the archive when ESPN rejects the request', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      jsonResponse(
        { code: 400, message: 'Failed to get events endpoint.' },
        400,
      ),
    );
    const events = await loadScoreboardEvents(DURING_TOURNAMENT, fetchImpl);
    expect(events).toHaveLength(104);
  });

  it('falls back to the archive when the network fails', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => {
      throw new TypeError('Failed to fetch');
    });
    const events = await loadScoreboardEvents(DURING_TOURNAMENT, fetchImpl);
    expect(events).toHaveLength(104);
  });
});

import { config } from '@/config';
import type { MatchEventsSource } from './MatchEventsSource';
import { EspnEventsSource } from './EspnEventsSource';
import { TheSportsDbEventsSource } from './TheSportsDbEventsSource';

/**
 * Picks the match-feed overlay implementation from config, or `null` when the
 * feature is disabled (`VITE_EVENTS_SOURCE=none`). Mirrors `createDataSource`.
 */
export function createEventsSource(): MatchEventsSource | null {
  switch (config.eventsSource) {
    case 'espn':
      return new EspnEventsSource();
    case 'thesportsdb':
      return new TheSportsDbEventsSource();
    default:
      return null;
  }
}

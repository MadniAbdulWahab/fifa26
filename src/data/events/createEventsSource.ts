import { config } from '@/config';
import type { MatchEventsSource } from './MatchEventsSource';
import { TheSportsDbEventsSource } from './TheSportsDbEventsSource';

/**
 * Picks the goal-events overlay implementation from config, or `null` when the
 * feature is disabled (`VITE_EVENTS_SOURCE=none`). Mirrors `createDataSource`.
 */
export function createEventsSource(): MatchEventsSource | null {
  if (config.eventsSource === 'thesportsdb') {
    return new TheSportsDbEventsSource();
  }
  return null;
}

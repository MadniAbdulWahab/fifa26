import type { Match, Team } from '@/domain/types';

/**
 * A `DataSource` is the single boundary between the app and wherever match
 * data lives (a bundled JSON file, a live REST API, a future GraphQL backend…).
 *
 * UI and business logic depend only on this interface, never on a concrete
 * provider, so adding or swapping a backend is a one-line change in
 * `createDataSource`.
 */
export interface DataSource {
  /** All 48 participating teams. */
  getTeams(): Promise<Team[]>;
  /** Every match in the tournament (group stage + knockouts). */
  getMatches(): Promise<Match[]>;
}

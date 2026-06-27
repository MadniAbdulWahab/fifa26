/** Typed access to build-time environment configuration. */

/**
 * Main data source:
 * - `espn`   (default) ESPN's public site API — fresher scores, key-less + CORS
 *            (no proxy), but undocumented.
 * - `api`    football-data.org (needs a token + a CORS proxy in production).
 * - `static` bundled offline fixture schedule (no scores).
 */
export type DataSourceKind = 'espn' | 'api' | 'static';

/**
 * Optional overlay that supplies goal scorers (and, for ESPN, live commentary)
 * for a single match, since football-data.org's free tier omits them. `none`
 * disables the feature.
 *
 * - `espn`        — ESPN's public site API: complete scorers + commentary,
 *                   key-less and CORS-enabled (no proxy), but undocumented.
 * - `thesportsdb` — documented/sanctioned but often-partial goal timelines.
 */
export type EventsSourceKind = 'espn' | 'thesportsdb' | 'none';

export interface AppConfig {
  dataSource: DataSourceKind;
  footballData: {
    baseUrl: string;
    token: string;
  };
  eventsSource: EventsSourceKind;
  theSportsDb: {
    baseUrl: string;
    key: string;
  };
}

function readDataSource(value: string | undefined): DataSourceKind {
  if (value === 'api') return 'api';
  if (value === 'static') return 'static';
  return 'espn';
}

function readEventsSource(value: string | undefined): EventsSourceKind {
  if (value === 'none') return 'none';
  if (value === 'thesportsdb') return 'thesportsdb';
  return 'espn';
}

export const config: AppConfig = {
  dataSource: readDataSource(import.meta.env.VITE_DATA_SOURCE),
  footballData: {
    // In dev this is proxied by Vite (see vite.config.ts). In production,
    // override with your own proxy URL.
    baseUrl: import.meta.env.VITE_FOOTBALL_DATA_BASE ?? '/football-data',
    token: import.meta.env.VITE_FOOTBALL_DATA_TOKEN ?? '',
  },
  // Default ESPN (complete scorers + live commentary, key-less, CORS, no proxy —
  // but undocumented). `thesportsdb` is the documented fallback; `none` disables.
  eventsSource: readEventsSource(import.meta.env.VITE_EVENTS_SOURCE),
  theSportsDb: {
    baseUrl:
      import.meta.env.VITE_THESPORTSDB_BASE ??
      'https://www.thesportsdb.com/api/v1/json',
    key: import.meta.env.VITE_THESPORTSDB_KEY ?? '123',
  },
};

/** Typed access to build-time environment configuration. */

export type DataSourceKind = 'static' | 'api';

/**
 * Optional overlay that supplies goal scorers/minutes for a single match, since
 * football-data.org's free tier omits them. `none` disables the feature.
 */
export type EventsSourceKind = 'thesportsdb' | 'none';

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
  return value === 'api' ? 'api' : 'static';
}

function readEventsSource(value: string | undefined): EventsSourceKind {
  return value === 'none' ? 'none' : 'thesportsdb';
}

export const config: AppConfig = {
  dataSource: readDataSource(import.meta.env.VITE_DATA_SOURCE),
  footballData: {
    // In dev this is proxied by Vite (see vite.config.ts). In production,
    // override with your own proxy URL.
    baseUrl: import.meta.env.VITE_FOOTBALL_DATA_BASE ?? '/football-data',
    token: import.meta.env.VITE_FOOTBALL_DATA_TOKEN ?? '',
  },
  // TheSportsDB is a public, CORS-enabled API; the shared free key "123" works
  // from the browser with no proxy. Scorer timelines are community-sourced and
  // can be incomplete, so the UI flags partial data.
  eventsSource: readEventsSource(import.meta.env.VITE_EVENTS_SOURCE),
  theSportsDb: {
    baseUrl:
      import.meta.env.VITE_THESPORTSDB_BASE ??
      'https://www.thesportsdb.com/api/v1/json',
    key: import.meta.env.VITE_THESPORTSDB_KEY ?? '123',
  },
};

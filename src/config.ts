/** Typed access to build-time environment configuration. */

export type DataSourceKind = 'static' | 'api';

export interface AppConfig {
  dataSource: DataSourceKind;
  footballData: {
    baseUrl: string;
    token: string;
  };
}

function readDataSource(value: string | undefined): DataSourceKind {
  return value === 'api' ? 'api' : 'static';
}

export const config: AppConfig = {
  dataSource: readDataSource(import.meta.env.VITE_DATA_SOURCE),
  footballData: {
    // In dev this is proxied by Vite (see vite.config.ts). In production,
    // override with your own proxy URL.
    baseUrl: import.meta.env.VITE_FOOTBALL_DATA_BASE ?? '/football-data',
    token: import.meta.env.VITE_FOOTBALL_DATA_TOKEN ?? '',
  },
};

import { config } from '@/config';
import { ApiDataSource } from './api/ApiDataSource';
import type { DataSource } from './DataSource';
import { StaticDataSource } from './static/StaticDataSource';

/**
 * Single place that decides which backend the app talks to. Swap the data
 * layer by changing VITE_DATA_SOURCE — no UI code needs to change.
 */
export function createDataSource(): DataSource {
  if (config.dataSource === 'api') {
    return new ApiDataSource({
      baseUrl: config.footballData.baseUrl,
      token: config.footballData.token,
    });
  }
  return new StaticDataSource();
}

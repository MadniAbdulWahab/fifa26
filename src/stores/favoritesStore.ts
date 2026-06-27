import type { TeamId } from '@/domain/types';
import { readJson, writeJson } from '@/lib/storage';

/**
 * A tiny observable store for the user's favorite teams, backed by
 * localStorage. Exposed in the shape `useSyncExternalStore` expects so React
 * components re-render when favorites change.
 */
const STORAGE_KEY = 'wc26:favorites';

let favorites: ReadonlySet<TeamId> = new Set(
  readJson<TeamId[]>(STORAGE_KEY, []),
);
const listeners = new Set<() => void>();

function emit(): void {
  writeJson(STORAGE_KEY, [...favorites]);
  for (const listener of listeners) listener();
}

export const favoritesStore = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot(): ReadonlySet<TeamId> {
    return favorites;
  },
  isFavorite(id: TeamId): boolean {
    return favorites.has(id);
  },
  toggle(id: TeamId): void {
    const next = new Set(favorites);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    favorites = next;
    emit();
  },
};

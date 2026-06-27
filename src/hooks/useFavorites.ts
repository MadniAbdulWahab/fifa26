import { useSyncExternalStore } from 'react';
import { favoritesStore } from '@/stores/favoritesStore';
import type { TeamId } from '@/domain/types';

/** Reactive access to the favorites store. */
export function useFavorites() {
  const favorites = useSyncExternalStore(
    favoritesStore.subscribe,
    favoritesStore.getSnapshot,
  );
  return {
    favorites,
    isFavorite: (id: TeamId) => favorites.has(id),
    toggle: favoritesStore.toggle,
  };
}

import type { TeamId } from '@/domain/types';
import { useFavorites } from '@/hooks/useFavorites';

export function FavoriteStar({ teamId }: { teamId: TeamId }) {
  const { isFavorite, toggle } = useFavorites();
  const active = isFavorite(teamId);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(teamId);
      }}
      aria-pressed={active}
      aria-label={active ? 'Remove from favorites' : 'Add to favorites'}
      className={`rounded p-1 text-lg leading-none transition-transform hover:scale-110 ${
        active ? 'text-amber-400' : 'text-slate-400'
      }`}
    >
      {active ? '★' : '☆'}
    </button>
  );
}

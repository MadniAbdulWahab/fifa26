import { useEffect } from 'react';
import { useTournament } from '@/app/TournamentContext';
import { useFavorites } from './useFavorites';
import { scheduleKickoffReminder } from '@/lib/reminders';

/**
 * While mounted, schedule in-session kickoff reminders for upcoming matches
 * involving any favorite team. Reschedules whenever favorites or data change.
 */
export function useKickoffReminders(): void {
  const { matches, getTeam } = useTournament();
  const { favorites } = useFavorites();

  useEffect(() => {
    const cancels: Array<() => void> = [];
    for (const match of matches) {
      if (match.status !== 'scheduled') continue;
      const involvesFavorite =
        favorites.has(match.homeId) || favorites.has(match.awayId);
      if (!involvesFavorite) continue;

      const home = getTeam(match.homeId);
      const away = getTeam(match.awayId);
      if (!home || !away) continue;

      const cancel = scheduleKickoffReminder(match, home, away);
      if (cancel) cancels.push(cancel);
    }
    return () => cancels.forEach((c) => c());
  }, [matches, favorites, getTeam]);
}

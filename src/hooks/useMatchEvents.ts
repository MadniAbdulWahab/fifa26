import { useQuery } from '@tanstack/react-query';
import type { Match, MatchEvent, Team } from '@/domain/types';
import { createEventsSource } from '@/data/events/createEventsSource';
import { isLiveNow } from '@/lib/matchTime';

/** One overlay instance for the app (cheap, stateless). */
const eventsSource = createEventsSource();

export interface MatchEventsResult {
  events: MatchEvent[];
  isLoading: boolean;
  /** True once we have data but fewer goals than the final score (TheSportsDB
   *  timelines are community-sourced and often incomplete). */
  partial: boolean;
}

/**
 * Fetches goal scorers for a single match on demand (only when it has started),
 * keeping the heavy fixtures feed on football-data.org. Falls back to any events
 * already on the match. Cached by React Query, so revisiting is free.
 */
export function useMatchEvents(
  match: Match | undefined,
  home: Team | undefined,
  away: Team | undefined,
): MatchEventsResult {
  const played =
    !!match && match.homeGoals !== null && match.awayGoals !== null;
  const started = !!match && (played || isLiveNow(match));
  const enabled = Boolean(eventsSource && match && home && away && started);

  const query = useQuery({
    queryKey: ['match-events', match?.id ?? 'none'],
    queryFn: () => eventsSource!.getMatchEvents(match!, home!, away!),
    enabled,
    staleTime: 60_000,
  });

  const fetched = query.data ?? [];
  const fallback = match?.events ?? [];
  const events = fetched.length > 0 ? fetched : fallback;

  const totalGoals = (match?.homeGoals ?? 0) + (match?.awayGoals ?? 0);
  const goalCount = events.filter((e) => e.type === 'goal').length;
  const partial = played && goalCount < totalGoals;

  return { events, isLoading: enabled && query.isLoading, partial };
}

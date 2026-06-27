import { useQuery } from '@tanstack/react-query';
import type {
  CommentaryEntry,
  Match,
  MatchEvent,
  Team,
} from '@/domain/types';
import { createEventsSource } from '@/data/events/createEventsSource';
import { isLiveNow } from '@/lib/matchTime';

/** One overlay instance for the app (cheap, stateless). */
const eventsSource = createEventsSource();

const EMPTY_FEED = { goals: [] as MatchEvent[], commentary: [] as CommentaryEntry[] };

export interface MatchEventsResult {
  goals: MatchEvent[];
  commentary: CommentaryEntry[];
  isLoading: boolean;
  /** True once we have goals but fewer than the final score (some sources, e.g.
   *  TheSportsDB, are community-sourced and often incomplete). */
  partial: boolean;
}

/**
 * Fetches goal scorers + commentary for a single match on demand (only once it
 * has started), keeping the heavy fixtures feed on football-data.org. While the
 * match is live it re-polls so the score/commentary update. Cached by React
 * Query, so revisiting is free.
 */
export function useMatchEvents(
  match: Match | undefined,
  home: Team | undefined,
  away: Team | undefined,
): MatchEventsResult {
  const played =
    !!match && match.homeGoals !== null && match.awayGoals !== null;
  const live = !!match && isLiveNow(match);
  const enabled = Boolean(eventsSource && match && home && away && (played || live));

  const query = useQuery({
    queryKey: ['match-events', match?.id ?? 'none'],
    queryFn: () => eventsSource!.getMatchFeed(match!, home!, away!),
    enabled,
    staleTime: 60_000,
    // Keep live commentary/scores fresh while the match is in progress.
    refetchInterval: live ? 30_000 : false,
  });

  const feed = query.data ?? EMPTY_FEED;
  const goals = feed.goals.length > 0 ? feed.goals : match?.events ?? [];

  const totalGoals = (match?.homeGoals ?? 0) + (match?.awayGoals ?? 0);
  const goalCount = goals.filter((e) => e.type === 'goal').length;
  const partial = played && goalCount < totalGoals;

  return {
    goals,
    commentary: feed.commentary,
    isLoading: enabled && query.isLoading,
    partial,
  };
}

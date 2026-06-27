import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import { useQuery } from '@tanstack/react-query';
import { createDataSource } from '@/data/createDataSource';
import type {
  GroupStandings,
  Match,
  Team,
  TeamId,
} from '@/domain/types';
import {
  simulateAdvancement,
  type AdvancementOdds,
} from '@/lib/advancement';
import { buildStandings } from '@/lib/standings';

const dataSource = createDataSource();

interface TournamentData {
  teams: Team[];
  matches: Match[];
  teamsById: Map<TeamId, Team>;
  standings: GroupStandings[];
  odds: Map<TeamId, AdvancementOdds>;
  getTeam: (id: TeamId) => Team | undefined;
}

const TournamentContext = createContext<TournamentData | null>(null);

interface LoadState {
  isLoading: boolean;
  error: Error | null;
}

const LoadStateContext = createContext<LoadState>({
  isLoading: true,
  error: null,
});

export function TournamentProvider({ children }: { children: ReactNode }) {
  const teamsQuery = useQuery({
    queryKey: ['teams'],
    queryFn: () => dataSource.getTeams(),
  });
  const matchesQuery = useQuery({
    queryKey: ['matches'],
    queryFn: () => dataSource.getMatches(),
    // Refetch live scores periodically when using a live source.
    refetchInterval: 60_000,
  });

  const teams = useMemo(() => teamsQuery.data ?? [], [teamsQuery.data]);
  const matches = useMemo(() => matchesQuery.data ?? [], [matchesQuery.data]);

  const value = useMemo<TournamentData>(() => {
    const teamsById = new Map(teams.map((t) => [t.id, t]));
    const standings = buildStandings(teams, matches);
    const odds =
      teams.length > 0
        ? simulateAdvancement(teams, matches)
        : new Map<TeamId, AdvancementOdds>();
    return {
      teams,
      matches,
      teamsById,
      standings,
      odds,
      getTeam: (id) => teamsById.get(id),
    };
  }, [teams, matches]);

  const loadState = useMemo<LoadState>(
    () => ({
      isLoading: teamsQuery.isLoading || matchesQuery.isLoading,
      error: (teamsQuery.error ?? matchesQuery.error) as Error | null,
    }),
    [
      teamsQuery.isLoading,
      matchesQuery.isLoading,
      teamsQuery.error,
      matchesQuery.error,
    ],
  );

  return (
    <LoadStateContext.Provider value={loadState}>
      <TournamentContext.Provider value={value}>
        {children}
      </TournamentContext.Provider>
    </LoadStateContext.Provider>
  );
}

export function useTournament(): TournamentData {
  const ctx = useContext(TournamentContext);
  if (!ctx) {
    throw new Error('useTournament must be used within a TournamentProvider');
  }
  return ctx;
}

export function useLoadState(): LoadState {
  return useContext(LoadStateContext);
}

import { useTournament } from '@/app/TournamentContext';
import { StandingsTable } from '@/components/StandingsTable';

export function StandingsPage() {
  const { standings } = useTournament();

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-bold">Group standings</h1>
        <p className="text-sm text-slate-500">
          Wins, draws, losses and estimated chance of reaching the knockouts.
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        {standings.map((group) => (
          <StandingsTable key={group.group} group={group} />
        ))}
      </div>
    </div>
  );
}

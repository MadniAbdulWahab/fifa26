import { useTournament } from '@/app/TournamentContext';
import { Bracket } from '@/components/Bracket';
import { TitleOdds } from '@/components/TitleOdds';

export function BracketPage() {
  const { matches } = useTournament();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold">Knockout bracket</h1>
        <p className="text-sm text-slate-500">
          Seeded from the group standings. Later rounds fill in as results come
          in.
        </p>
      </header>
      <Bracket matches={matches} />
      <TitleOdds />
    </div>
  );
}

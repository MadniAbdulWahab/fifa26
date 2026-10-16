import { useMemo } from 'react';
import { useTournament } from '@/app/TournamentContext';
import { championId } from '@/lib/qualification';
import { OddsBar } from './OddsBar';
import { TeamBadge } from './TeamBadge';

/**
 * Top contenders ranked by simulated probability of winning the trophy. Once
 * the final has been played it shows the champion instead.
 */
export function TitleOdds({ limit = 10 }: { limit?: number }) {
  const { teams, odds, matches } = useTournament();
  const champion = championId(matches);

  const ranked = useMemo(() => {
    return teams
      .map((team) => ({ team, win: odds.get(team.id)?.winTitle ?? 0 }))
      .filter((row) => row.win > 0)
      .sort((a, b) => b.win - a.win)
      .slice(0, limit);
  }, [teams, odds, limit]);

  if (ranked.length === 0) return null;

  return (
    <section className="card p-4">
      <h2 className="mb-3 font-bold">
        🏆 {champion ? 'World champion' : 'Title contenders'}
      </h2>
      <ul className="space-y-3">
        {ranked.map(({ team, win }) => (
          <li key={team.id} className="flex items-center gap-3">
            <div className="w-28 shrink-0">
              <TeamBadge team={team} full link />
            </div>
            <div className="flex-1">
              <OddsBar value={win} tone="title" />
            </div>
            <span className="w-12 text-right text-sm font-semibold tabular-nums">
              {(win * 100).toFixed(win < 0.1 ? 1 : 0)}%
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-slate-400">
        {champion
          ? 'Decided by the result of the final.'
          : 'Estimated by Monte Carlo simulation. Just for fun, not betting advice.'}
      </p>
    </section>
  );
}

import { Link } from 'react-router-dom';
import { useTournament } from '@/app/TournamentContext';
import { useFavorites } from '@/hooks/useFavorites';
import { useKickoffReminders } from '@/hooks/useKickoffReminders';
import { MatchCard } from '@/components/MatchCard';
import { NotificationButton } from '@/components/NotificationButton';
import { OddsBar } from '@/components/OddsBar';
import { TeamBadge } from '@/components/TeamBadge';
import { computeRecord } from '@/lib/record';
import { nextMatchForTeam } from '@/lib/teamMatches';

export function FavoritesPage() {
  const { teams, matches, odds } = useTournament();
  const { favorites } = useFavorites();
  useKickoffReminders();

  const favTeams = teams.filter((t) => favorites.has(t.id));

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">Your teams</h1>
          <p className="text-sm text-slate-500">
            Follow teams to highlight their matches and get kickoff reminders.
          </p>
        </div>
        <NotificationButton />
      </header>

      {favTeams.length === 0 ? (
        <div className="card p-6 text-center text-slate-500">
          <p>No favorites yet.</p>
          <p className="mt-1 text-sm">
            Tap the ☆ next to any team on the{' '}
            <Link to="/" className="text-brand">
              Fixtures
            </Link>{' '}
            page.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {favTeams.map((team) => {
            const record = computeRecord(team.id, matches);
            const advance = odds.get(team.id)?.advanceFromGroup ?? 0;
            const next = nextMatchForTeam(team.id, matches);
            return (
              <section key={team.id} className="card p-4">
                <div className="flex items-center justify-between">
                  <TeamBadge team={team} full link className="text-lg" />
                  <span className="text-sm text-slate-500">
                    {record.wins}W · {record.draws}D · {record.losses}L
                  </span>
                </div>
                <div className="mt-3">
                  <OddsBar value={advance} label="Chance to reach knockouts" />
                </div>
                {next && (
                  <div className="mt-3">
                    <p className="mb-1 text-xs font-medium text-slate-500">
                      Next match
                    </p>
                    <MatchCard match={next} />
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

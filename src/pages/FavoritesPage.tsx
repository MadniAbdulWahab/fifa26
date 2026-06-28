import { Link } from 'react-router-dom';
import { useTournament } from '@/app/TournamentContext';
import { useFavorites } from '@/hooks/useFavorites';
import { useKickoffReminders } from '@/hooks/useKickoffReminders';
import { MatchCard } from '@/components/MatchCard';
import { NotificationButton } from '@/components/NotificationButton';
import { OddsBar } from '@/components/OddsBar';
import { TeamBadge } from '@/components/TeamBadge';
import {
  qualificationStatus,
  type QualificationStatus,
} from '@/lib/qualification';
import { computeRecord } from '@/lib/record';
import { nextMatchForTeam } from '@/lib/teamMatches';

export function FavoritesPage() {
  const { teams, matches, odds, standings } = useTournament();
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
            const status = qualificationStatus(team.id, matches, standings);
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
                  {status.kind !== 'pending' ? (
                    <QualificationBadge status={status} />
                  ) : (
                    <OddsBar
                      value={advance}
                      label="Chance to reach knockouts"
                    />
                  )}
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

function QualificationBadge({ status }: { status: QualificationStatus }) {
  const tone =
    status.kind === 'qualified'
      ? 'bg-brand/10 text-brand'
      : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400';

  return (
    <div className={`rounded-lg px-3 py-2 text-sm font-semibold ${tone}`}>
      {status.label}
    </div>
  );
}

import { Link, useParams } from 'react-router-dom';
import { useTournament } from '@/app/TournamentContext';
import { FavoriteStar } from '@/components/FavoriteStar';
import { MatchCard } from '@/components/MatchCard';
import { OddsBar } from '@/components/OddsBar';
import { TeamBadge } from '@/components/TeamBadge';
import {
  qualificationStatus,
  type QualificationStatus,
} from '@/lib/qualification';
import { computeRecord } from '@/lib/record';
import { matchesForTeam } from '@/lib/teamMatches';

export function TeamPage() {
  const { id } = useParams<{ id: string }>();
  const { getTeam, matches, odds, standings } = useTournament();
  const team = id ? getTeam(id) : undefined;

  if (!team) {
    return (
      <div className="card p-6 text-center text-slate-500">
        <p>Team not found.</p>
        <Link to="/" className="mt-2 inline-block text-brand">
          Back to fixtures
        </Link>
      </div>
    );
  }

  const record = computeRecord(team.id, matches);
  const teamOdds = odds.get(team.id);
  const status = qualificationStatus(team.id, matches, standings);
  const teamMatches = matchesForTeam(team.id, matches);

  return (
    <div className="space-y-5">
      <header className="card flex items-center justify-between p-4">
        <TeamBadge team={team} full className="text-2xl" />
        <FavoriteStar teamId={team.id} />
      </header>

      <section className="card p-4">
        <h2 className="mb-3 font-bold">Record</h2>
        <div className="grid grid-cols-4 gap-2 text-center">
          <Stat label="Played" value={record.played} />
          <Stat label="Won" value={record.wins} />
          <Stat label="Drawn" value={record.draws} />
          <Stat label="Lost" value={record.losses} />
          <Stat label="GF" value={record.goalsFor} />
          <Stat label="GA" value={record.goalsAgainst} />
          <Stat
            label="GD"
            value={
              record.goalDifference > 0
                ? `+${record.goalDifference}`
                : record.goalDifference
            }
          />
          <Stat label="Pts" value={record.points} />
        </div>
      </section>

      {teamOdds && (
        <section className="card space-y-3 p-4">
          <h2 className="font-bold">Outlook</h2>
          {status.kind !== 'pending' ? (
            <QualificationBadge status={status} />
          ) : (
            <OddsBar
              value={teamOdds.advanceFromGroup}
              label="Reach the knockouts"
            />
          )}
          {status.kind !== 'eliminated' && (
            <OddsBar
              value={teamOdds.winTitle}
              label="Win the trophy"
              tone="title"
            />
          )}
        </section>
      )}

      <section className="space-y-2">
        <h2 className="font-bold">Matches</h2>
        {teamMatches.map((m) => (
          <MatchCard key={m.id} match={m} />
        ))}
      </section>
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

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg bg-slate-100 py-2 dark:bg-slate-800">
      <div className="text-lg font-bold tabular-nums">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}

import { Link, useParams } from 'react-router-dom';
import { useTournament } from '@/app/TournamentContext';
import { FavoriteStar } from '@/components/FavoriteStar';
import { OddsBar } from '@/components/OddsBar';
import { StandingsTable } from '@/components/StandingsTable';
import { StatusBadge } from '@/components/StatusBadge';
import { TeamBadge } from '@/components/TeamBadge';
import type { Match, Team } from '@/domain/types';
import { formatDay, formatTime } from '@/lib/datetime';
import { matchStageLabel } from '@/lib/labels';
import { isLiveNow } from '@/lib/matchTime';
import { computeRecord } from '@/lib/record';

export function MatchPage() {
  const { id } = useParams<{ id: string }>();
  const { matches, getTeam, standings } = useTournament();
  const match = matches.find((m) => m.id === id);

  if (!match) {
    return (
      <div className="card p-6 text-center text-slate-500">
        <p>Match not found.</p>
        <Link to="/" className="mt-2 inline-block text-brand">
          Back to fixtures
        </Link>
      </div>
    );
  }

  const home = getTeam(match.homeId);
  const away = getTeam(match.awayId);
  const played = match.homeGoals !== null && match.awayGoals !== null;
  const live = isLiveNow(match);
  const group =
    match.group !== undefined
      ? standings.find((g) => g.group === match.group)
      : undefined;

  return (
    <div className="space-y-5">
      <Link to="/" className="inline-block text-sm text-brand">
        ← Fixtures
      </Link>

      {/* Scoreboard */}
      <section
        className={`card p-5 ${live ? 'ring-2 ring-red-500' : ''}`}
      >
        <p className="text-center text-xs font-medium text-slate-500">
          {matchStageLabel(match)} · {formatDay(match.kickoff)}
          {match.venue ? ` · ${match.venue}` : ''}
        </p>

        <div className="mt-4 grid grid-cols-3 items-center gap-2">
          <TeamColumn team={home} />
          <div className="flex flex-col items-center gap-1">
            {played || live ? (
              <div className="text-3xl font-extrabold tabular-nums">
                {match.homeGoals ?? 0}
                <span className="mx-1 text-slate-400">–</span>
                {match.awayGoals ?? 0}
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold text-slate-400">vs</div>
                <div className="text-sm font-semibold">
                  {formatTime(match.kickoff)}
                </div>
              </>
            )}
            {live ? (
              <StatusBadge status="live" />
            ) : played ? (
              <StatusBadge status="finished" />
            ) : null}
          </div>
          <TeamColumn team={away} />
        </div>
      </section>

      {/* Outlook for both teams */}
      <section className="grid gap-3 sm:grid-cols-2">
        {[home, away].map((team, i) =>
          team ? (
            <TeamOutlook key={team.id} team={team} matches={matches} />
          ) : (
            <div key={i} className="card p-4 text-center text-slate-500">
              To be decided
            </div>
          ),
        )}
      </section>

      {group && (
        <section>
          <h2 className="mb-2 font-bold">Group {group.group} standings</h2>
          <StandingsTable group={group} />
        </section>
      )}
    </div>
  );
}

function TeamColumn({ team }: { team: Team | undefined }) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      {team && team.flag.startsWith('http') ? (
        <img
          src={team.flag}
          alt=""
          className="h-10 w-14 rounded object-cover shadow ring-1 ring-black/10"
          loading="lazy"
        />
      ) : (
        <span className="text-4xl" aria-hidden>
          {team?.flag || '⚪'}
        </span>
      )}
      <Link
        to={team ? `/team/${team.id}` : '#'}
        className="text-sm font-semibold hover:text-brand"
      >
        {team ? team.name : 'TBD'}
      </Link>
      {team && <FavoriteStar teamId={team.id} />}
    </div>
  );
}

function TeamOutlook({ team, matches }: { team: Team; matches: Match[] }) {
  const { odds } = useTournament();
  const record = computeRecord(team.id, matches);
  const teamOdds = odds.get(team.id);

  return (
    <div className="card space-y-3 p-4">
      <Link
        to={`/team/${team.id}`}
        className="flex items-center gap-2 font-semibold hover:text-brand"
      >
        <TeamBadge team={team} full />
      </Link>
      <p className="text-sm text-slate-500">
        {record.wins}W · {record.draws}D · {record.losses}L · {record.points}{' '}
        pts
      </p>
      {teamOdds && (
        <OddsBar value={teamOdds.advanceFromGroup} label="Reach knockouts" />
      )}
    </div>
  );
}

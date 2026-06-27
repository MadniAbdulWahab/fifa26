import type { ReactNode } from 'react';
import type { Match } from '@/domain/types';
import { useTournament } from '@/app/TournamentContext';
import { formatKickoff } from '@/lib/datetime';
import { matchStageLabel } from '@/lib/labels';
import { TeamBadge } from './TeamBadge';
import { FavoriteStar } from './FavoriteStar';
import { StatusBadge } from './StatusBadge';

export function MatchCard({ match }: { match: Match }) {
  const { getTeam } = useTournament();
  const home = getTeam(match.homeId);
  const away = getTeam(match.awayId);
  const played = match.homeGoals !== null && match.awayGoals !== null;

  const homeWon =
    played && match.homeGoals! > match.awayGoals!;
  const awayWon =
    played && match.awayGoals! > match.homeGoals!;

  return (
    <article className="card flex items-center gap-3 p-3">
      <div className="flex flex-1 flex-col gap-2">
        <TeamRow
          teamId={match.homeId}
          name={<TeamBadge team={home} full link />}
          goals={match.homeGoals}
          winner={homeWon}
          played={played}
        />
        <TeamRow
          teamId={match.awayId}
          name={<TeamBadge team={away} full link />}
          goals={match.awayGoals}
          winner={awayWon}
          played={played}
        />
      </div>

      <div className="flex w-28 shrink-0 flex-col items-end gap-1 text-right">
        <span className="text-xs text-slate-500">
          {matchStageLabel(match)}
        </span>
        {played || match.status === 'live' ? (
          <StatusBadge status={match.status} />
        ) : (
          <span className="text-xs font-medium text-slate-500">
            {formatKickoff(match.kickoff)}
          </span>
        )}
      </div>
    </article>
  );
}

function TeamRow({
  teamId,
  name,
  goals,
  winner,
  played,
}: {
  teamId: string;
  name: ReactNode;
  goals: number | null;
  winner: boolean;
  played: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <FavoriteStar teamId={teamId} />
      <span className={`flex-1 ${winner ? 'font-bold' : ''}`}>{name}</span>
      {played && (
        <span
          className={`w-6 text-center tabular-nums ${
            winner ? 'font-bold' : 'text-slate-500'
          }`}
        >
          {goals}
        </span>
      )}
    </div>
  );
}

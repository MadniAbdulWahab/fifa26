import { useRef, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Match } from '@/domain/types';
import { useNow } from '@/app/NowContext';
import { useTournament } from '@/app/TournamentContext';
import { formatKickoff } from '@/lib/datetime';
import { isLiveNow } from '@/lib/matchTime';
import { matchStageLabel } from '@/lib/labels';
import { TeamBadge } from './TeamBadge';
import { FavoriteStar } from './FavoriteStar';
import { StatusBadge } from './StatusBadge';

export function MatchCard({ match }: { match: Match }) {
  const { getTeam } = useTournament();
  const now = useNow();
  const home = getTeam(match.homeId);
  const away = getTeam(match.awayId);
  const played = match.homeGoals !== null && match.awayGoals !== null;
  const live = isLiveNow(match, now);

  const homeWon = played && match.homeGoals! > match.awayGoals!;
  const awayWon = played && match.awayGoals! > match.homeGoals!;
  const matchLabel = `${home?.name ?? 'Home team'} vs ${away?.name ?? 'Away team'}`;

  // Suppress navigation when the tap was really a scroll (finger moved).
  const start = useRef<{ x: number; y: number } | null>(null);
  const moved = useRef(false);

  return (
    <div
      className={`card relative isolate flex items-center gap-3 p-3 transition-colors hover:border-brand/50 ${
        live ? 'ring-2 ring-red-500 ring-offset-1 ring-offset-transparent' : ''
      }`}
    >
      <Link
        to={`/match/${match.id}`}
        aria-label={`Open ${matchLabel}`}
        className="absolute inset-0 z-10 rounded-lg touch-manipulation"
        onTouchStart={(e) => {
          const t = e.touches[0];
          start.current = t ? { x: t.clientX, y: t.clientY } : null;
          moved.current = false;
        }}
        onTouchMove={(e) => {
          const s = start.current;
          const t = e.touches[0];
          if (s && t && Math.hypot(t.clientX - s.x, t.clientY - s.y) > 10) {
            moved.current = true;
          }
        }}
        onClick={(e) => {
          if (moved.current) e.preventDefault();
        }}
      />
      <div className="flex flex-1 flex-col gap-2">
        <TeamRow
          teamId={match.homeId}
          name={<TeamBadge team={home} full />}
          goals={match.homeGoals}
          winner={homeWon}
          played={played}
        />
        <TeamRow
          teamId={match.awayId}
          name={<TeamBadge team={away} full />}
          goals={match.awayGoals}
          winner={awayWon}
          played={played}
        />
      </div>

      <div className="flex w-28 shrink-0 flex-col items-end gap-1 text-right">
        <span className="text-xs text-slate-500">{matchStageLabel(match)}</span>
        {live ? (
          <StatusBadge status="live" minute={match.minute} />
        ) : played ? (
          <StatusBadge status={match.status} />
        ) : (
          <span className="text-xs font-medium text-slate-500">
            {formatKickoff(match.kickoff)}
          </span>
        )}
      </div>
    </div>
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
      <span className="relative z-20">
        <FavoriteStar teamId={teamId} />
      </span>
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

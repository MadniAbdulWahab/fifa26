import type { ReactNode } from 'react';
import type { Match, MatchStage } from '@/domain/types';
import { useTournament } from '@/app/TournamentContext';
import { formatKickoff } from '@/lib/datetime';
import { stageLabel } from '@/lib/labels';
import { TeamBadge } from './TeamBadge';

const COLUMN_STAGES: MatchStage[] = [
  'round-of-32',
  'round-of-16',
  'quarter-final',
  'semi-final',
  'final',
];

export function Bracket({ matches }: { matches: Match[] }) {
  const byStage = new Map<MatchStage, Match[]>();
  for (const stage of COLUMN_STAGES) {
    byStage.set(
      stage,
      matches
        .filter((m) => m.stage === stage)
        .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true })),
    );
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex min-w-max gap-4">
        {COLUMN_STAGES.map((stage) => (
          <div key={stage} className="flex w-48 flex-col gap-3">
            <h3 className="text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
              {stageLabel(stage)}
            </h3>
            <div className="flex flex-1 flex-col justify-around gap-3">
              {(byStage.get(stage) ?? []).map((match) => (
                <BracketMatch key={match.id} match={match} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BracketMatch({ match }: { match: Match }) {
  const { getTeam } = useTournament();
  const played = match.homeGoals !== null && match.awayGoals !== null;

  return (
    <div className="card p-2 text-sm">
      <BracketSide
        name={<TeamBadge team={getTeam(match.homeId)} link />}
        goals={match.homeGoals}
        played={played}
      />
      <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
      <BracketSide
        name={<TeamBadge team={getTeam(match.awayId)} link />}
        goals={match.awayGoals}
        played={played}
      />
      {!played && (
        <p className="mt-1 text-center text-[10px] text-slate-400">
          {formatKickoff(match.kickoff)}
        </p>
      )}
    </div>
  );
}

function BracketSide({
  name,
  goals,
  played,
}: {
  name: ReactNode;
  goals: number | null;
  played: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      {name}
      {played && <span className="tabular-nums text-slate-500">{goals}</span>}
    </div>
  );
}

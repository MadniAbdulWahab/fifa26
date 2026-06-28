import type { ReactNode } from 'react';
import type { GroupStandings } from '@/domain/types';
import { useTournament } from '@/app/TournamentContext';
import { formatPercent } from '@/lib/labels';
import { qualificationStatus } from '@/lib/qualification';
import { TeamBadge } from './TeamBadge';

export function StandingsTable({ group }: { group: GroupStandings }) {
  const { odds, matches, standings } = useTournament();

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-slate-200 px-3 py-2 font-bold dark:border-slate-800">
        Group {group.group}
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-slate-500">
            <th className="py-2 pl-3 font-medium">#</th>
            <th className="py-2 font-medium">Team</th>
            <Th>P</Th>
            <Th>W</Th>
            <Th>D</Th>
            <Th>L</Th>
            <Th>GD</Th>
            <Th>Pts</Th>
            <th className="py-2 pr-3 text-right font-medium">Advance</th>
          </tr>
        </thead>
        <tbody>
          {group.rows.map((row) => {
            const r = row.record;
            const advance = odds.get(row.team.id)?.advanceFromGroup ?? 0;
            const status = qualificationStatus(row.team.id, matches, standings);
            const qualifies = row.position <= 2;
            return (
              <tr
                key={row.team.id}
                className={`border-t border-slate-100 dark:border-slate-800/60 ${
                  qualifies ? 'bg-brand/5' : ''
                }`}
              >
                <td className="py-2 pl-3">
                  <span
                    className={`inline-block h-5 w-1 rounded ${
                      qualifies
                        ? 'bg-brand'
                        : row.position === 3
                          ? 'bg-amber-400'
                          : 'bg-transparent'
                    }`}
                  />
                  <span className="ml-2 tabular-nums">{row.position}</span>
                </td>
                <td className="py-2">
                  <TeamBadge team={row.team} full link />
                </td>
                <Td>{r.played}</Td>
                <Td>{r.wins}</Td>
                <Td>{r.draws}</Td>
                <Td>{r.losses}</Td>
                <Td>
                  {r.goalDifference > 0
                    ? `+${r.goalDifference}`
                    : r.goalDifference}
                </Td>
                <td className="py-2 text-center font-bold tabular-nums">
                  {r.points}
                </td>
                <td className="py-2 pr-3 text-right tabular-nums text-slate-500">
                  {status.kind === 'qualified'
                    ? 'Q'
                    : status.kind === 'eliminated'
                      ? 'Out'
                      : formatPercent(advance)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="px-3 py-2 text-xs text-slate-400">
        <span className="text-brand">▌</span> qualifies&nbsp;&nbsp;
        <span className="text-amber-400">▌</span> best-third contention
      </p>
    </div>
  );
}

function Th({ children }: { children: ReactNode }) {
  return <th className="py-2 text-center font-medium">{children}</th>;
}

function Td({ children }: { children: ReactNode }) {
  return <td className="py-2 text-center tabular-nums">{children}</td>;
}

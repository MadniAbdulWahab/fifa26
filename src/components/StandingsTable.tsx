import type { ReactNode } from 'react';
import type { GroupStandings } from '@/domain/types';
import { useTournament } from '@/app/TournamentContext';
import { formatPercent } from '@/lib/labels';
import { qualificationStatus } from '@/lib/qualification';
import { TeamBadge } from './TeamBadge';

export function StandingsTable({ group }: { group: GroupStandings }) {
  const { odds, matches, standings } = useTournament();
  const rows = group.rows.map((row) => {
    const status = qualificationStatus(row.team.id, matches, standings);
    return {
      row,
      status,
      inTopTwoPlace: row.position <= 2,
      isQualified: status.kind === 'qualified',
      inThirdPlaceRoute: row.position === 3 && status.kind === 'pending',
    };
  });
  const hasTopTwoMarker = rows.some(({ inTopTwoPlace }) => inTopTwoPlace);
  const hasThirdPlaceRouteMarker = rows.some(
    ({ inThirdPlaceRoute }) => inThirdPlaceRoute,
  );
  const hasQualifiedStatus = rows.some(({ isQualified }) => isQualified);

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
          {rows.map(
            ({
              row,
              status,
              inTopTwoPlace,
              isQualified,
              inThirdPlaceRoute,
            }) => {
              const r = row.record;
              const advance = odds.get(row.team.id)?.advanceFromGroup ?? 0;
              return (
                <tr
                  key={row.team.id}
                  className={`border-t border-slate-100 dark:border-slate-800/60 ${
                    inTopTwoPlace ? 'bg-brand/5' : ''
                  }`}
                >
                  <td className="py-2 pl-3">
                    <span className="inline-flex h-5 w-2.5 items-center gap-0.5 align-middle">
                      {inTopTwoPlace && (
                        <span className="h-5 w-1 rounded bg-brand" />
                      )}
                      {isQualified && (
                        <span className="h-5 w-1 rounded bg-sky-400" />
                      )}
                      {inThirdPlaceRoute && (
                        <span className="h-5 w-1 rounded bg-amber-400" />
                      )}
                    </span>
                    <span className="ml-1.5 tabular-nums">{row.position}</span>
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
                  <td className="py-2 pr-3 text-right tabular-nums">
                    {status.kind === 'qualified' ? (
                      <span className="font-semibold text-sky-400">Q</span>
                    ) : status.kind === 'eliminated' ? (
                      <span className="text-slate-500">Out</span>
                    ) : (
                      <span className="text-slate-500">
                        {formatPercent(advance)}
                      </span>
                    )}
                  </td>
                </tr>
              );
            },
          )}
        </tbody>
      </table>
      {(hasTopTwoMarker || hasThirdPlaceRouteMarker || hasQualifiedStatus) && (
        <p className="flex flex-wrap gap-x-3 gap-y-1 px-3 py-2 text-xs text-slate-400">
          {hasTopTwoMarker && (
            <span>
              <span className="text-brand">▌</span> top-two place
            </span>
          )}
          {hasThirdPlaceRouteMarker && (
            <span>
              <span className="text-amber-400">▌</span> third-place route
            </span>
          )}
          {hasQualifiedStatus && (
            <span>
              <span className="text-sky-400">▌</span> qualified
            </span>
          )}
        </p>
      )}
    </div>
  );
}

function Th({ children }: { children: ReactNode }) {
  return <th className="py-2 text-center font-medium">{children}</th>;
}

function Td({ children }: { children: ReactNode }) {
  return <td className="py-2 text-center tabular-nums">{children}</td>;
}

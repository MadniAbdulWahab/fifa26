import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Match, MatchStage } from '@/domain/types';
import { useTournament } from '@/app/TournamentContext';
import { formatKickoff } from '@/lib/datetime';
import { bracketSlots, COLUMN_STAGES } from '@/lib/bracketLayout';
import { stageLabel } from '@/lib/labels';
import { TeamBadge } from './TeamBadge';

const ROUND_PAIRS: { stage: MatchStage; label: string }[] = [
  { stage: 'round-of-32', label: 'R32-R16' },
  { stage: 'round-of-16', label: 'R16-QF' },
  { stage: 'quarter-final', label: 'QF-SF' },
  { stage: 'semi-final', label: 'SF-Final' },
];

/** Tree-mode height per Round-of-32 slot; tight but leaves connector room. */
const SLOT_REM = 6.75;

export function Bracket({ matches }: { matches: Match[] }) {
  const { standings } = useTournament();
  const [activeStage, setActiveStage] = useState<MatchStage>('round-of-32');
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const columnRefs = useRef(new Map<MatchStage, HTMLDivElement>());

  const byStage = useMemo(() => {
    const slots = bracketSlots(matches, standings);
    const grouped = new Map<MatchStage, Match[]>();
    for (const stage of COLUMN_STAGES) {
      grouped.set(
        stage,
        matches
          .filter((m) => m.stage === stage)
          .sort((a, b) => (slots.get(a.id) ?? 0) - (slots.get(b.id) ?? 0)),
      );
    }
    return grouped;
  }, [matches, standings]);

  const focusStage = (stage: MatchStage) => {
    setActiveStage(stage);
    columnRefs.current.get(stage)?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'start',
    });
    window.requestAnimationFrame(() => {
      const column = columnRefs.current.get(stage);
      if (column) {
        const stickyOffset = 112;
        const target =
          column.getBoundingClientRect().top + window.scrollY - stickyOffset;
        window.scrollTo({ top: Math.max(target, 0), behavior: 'smooth' });
      }
    });
  };

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    let frame = 0;
    const syncActiveStage = () => {
      frame = 0;
      const scrollerRect = scroller.getBoundingClientRect();
      let nearestStage = ROUND_PAIRS[0]!.stage;
      let nearestDistance = Number.POSITIVE_INFINITY;
      const viewportLeft = scrollerRect.left;

      for (const { stage } of ROUND_PAIRS) {
        const column = columnRefs.current.get(stage);
        if (!column) continue;
        const rect = column.getBoundingClientRect();
        const distance = Math.abs(rect.left - viewportLeft);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestStage = stage;
        }
      }

      setActiveStage((current) =>
        current === nearestStage ? current : nearestStage,
      );
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(syncActiveStage);
    };

    syncActiveStage();
    scroller.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      scroller.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [byStage]);

  const lastColumn = COLUMN_STAGES.length - 1;
  const activeColumnIndex = Math.max(COLUMN_STAGES.indexOf(activeStage), 0);
  const activeMatchCount = byStage.get(activeStage)?.length || 1;
  const treeHeight = `${Math.max(activeMatchCount, 1) * SLOT_REM + 2}rem`;

  return (
    <div className="space-y-3">
      <div className="sticky top-14 z-10 -mx-4 border-b border-slate-200 bg-slate-50/95 px-4 py-2 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <div className="flex gap-2 overflow-x-auto py-0.5">
          {ROUND_PAIRS.map(({ stage, label }) => (
            <button
              key={stage}
              type="button"
              onClick={() => focusStage(stage)}
              aria-label={`Jump to ${stageLabel(stage)}`}
              aria-pressed={activeStage === stage}
              className={`flex h-8 shrink-0 items-center justify-center rounded-full px-3 text-xs font-bold transition-colors ${
                activeStage === stage
                  ? 'bg-brand/10 text-brand ring-1 ring-brand/30'
                  : 'bg-slate-200/70 text-slate-500 dark:bg-slate-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain scroll-smooth pb-4"
      >
        <div
          className="flex min-w-max items-stretch gap-4"
          style={{ height: treeHeight }}
        >
          {COLUMN_STAGES.map((stage, columnIndex) => {
            const slotSpan = 2 ** (columnIndex - activeColumnIndex);
            return (
              <div
                key={stage}
                ref={(node) => {
                  if (node) columnRefs.current.set(stage, node);
                  else columnRefs.current.delete(stage);
                }}
                className="flex w-[calc((100vw-3rem)/2)] snap-start snap-always flex-col gap-3 sm:w-64 md:w-72"
              >
                <h3 className="text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {stageLabel(stage)}
                </h3>
                <div className="flex flex-col">
                  {(byStage.get(stage) ?? []).map((match, matchIndex) => (
                    <div
                      key={match.id}
                      className={[
                        'relative flex flex-col justify-center',
                        // Horizontal stub linking this card back to its feeders.
                        columnIndex > activeColumnIndex
                          ? "before:absolute before:right-full before:top-1/2 before:h-px before:w-4 before:bg-slate-300 before:content-[''] dark:before:bg-slate-700"
                          : '',
                        // Vertical line joining each feeder pair to the next round.
                        columnIndex < lastColumn && matchIndex % 2 === 0
                          ? "after:absolute after:left-full after:top-1/2 after:h-full after:w-px after:bg-slate-300 after:content-[''] dark:after:bg-slate-700"
                          : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      style={{ height: `${slotSpan * SLOT_REM}rem` }}
                    >
                      <BracketMatch match={match} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function BracketMatch({ match }: { match: Match }) {
  const { getTeam } = useTournament();
  const played = match.homeGoals !== null && match.awayGoals !== null;
  const homeWon = match.winnerId
    ? match.winnerId === match.homeId
    : played && match.homeGoals! > match.awayGoals!;
  const awayWon = match.winnerId
    ? match.winnerId === match.awayId
    : played && match.awayGoals! > match.homeGoals!;

  return (
    <div className="card min-h-[5.25rem] p-2 text-sm">
      <BracketSide
        name={<TeamBadge team={getTeam(match.homeId)} link />}
        goals={match.homeGoals}
        played={played}
        winner={homeWon}
      />
      <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
      <BracketSide
        name={<TeamBadge team={getTeam(match.awayId)} link />}
        goals={match.awayGoals}
        played={played}
        winner={awayWon}
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
  winner,
}: {
  name: ReactNode;
  goals: number | null;
  played: boolean;
  winner: boolean;
}) {
  return (
    <div
      className={`grid min-h-6 grid-cols-[minmax(0,1fr)_1.75rem] items-center gap-2 ${
        winner ? 'font-bold text-slate-900 dark:text-white' : ''
      }`}
    >
      <div className="min-w-0 truncate">{name}</div>
      <span
        className={`text-right tabular-nums ${
          played
            ? winner
              ? 'font-bold text-slate-900 dark:text-white'
              : 'text-slate-500'
            : 'text-transparent'
        }`}
      >
        {played ? goals : 0}
      </span>
    </div>
  );
}

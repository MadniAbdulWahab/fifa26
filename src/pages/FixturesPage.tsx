import { useEffect, useMemo, useRef, useState } from 'react';
import { useTournament } from '@/app/TournamentContext';
import { useFavorites } from '@/hooks/useFavorites';
import { MatchCard } from '@/components/MatchCard';
import { StandingsTable } from '@/components/StandingsTable';
import { dayKey, formatDay } from '@/lib/datetime';
import { findAnchorId, isFinished, isLiveNow } from '@/lib/matchTime';
import type { GroupStandings, Match } from '@/domain/types';

type Tab = 'all' | 'group' | 'knockout';

export function FixturesPage() {
  const { matches, standings } = useTournament();
  const { favorites } = useFavorites();
  const [tab, setTab] = useState<Tab>('all');
  const [favOnly, setFavOnly] = useState(false);

  const isFav = useMemo(
    () => (m: Match) =>
      !favOnly || favorites.has(m.homeId) || favorites.has(m.awayId),
    [favOnly, favorites],
  );

  return (
    <div className="space-y-4">
      {/* Sticky filter bar — pinned directly under the nav (no travel). */}
      <div className="sticky top-14 z-10 -mx-4 -mt-4 flex items-center gap-2 border-b border-slate-200 bg-slate-50/95 px-4 py-2 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <Segmented tab={tab} onChange={setTab} />
        <button
          type="button"
          onClick={() => setFavOnly((v) => !v)}
          aria-pressed={favOnly}
          className={`ml-auto shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium ${
            favOnly
              ? 'bg-amber-400/20 text-amber-500'
              : 'text-slate-500 hover:bg-slate-200/60 dark:hover:bg-slate-800'
          }`}
        >
          ⭐ Favorites
        </button>
      </div>

      {tab === 'group' ? (
        <GroupsView standings={standings} matches={matches} isFav={isFav} />
      ) : (
        <DateList tab={tab} matches={matches} isFav={isFav} />
      )}
    </div>
  );
}

/** All / Knockouts: a chronological, date-grouped list anchored to today/next. */
function DateList({
  tab,
  matches,
  isFav,
}: {
  tab: Tab;
  matches: Match[];
  isFav: (m: Match) => boolean;
}) {
  const filtered = useMemo(
    () =>
      matches
        .filter((m) => (tab === 'knockout' ? m.stage !== 'group' : true))
        .filter(isFav)
        .sort((a, b) => a.kickoff.localeCompare(b.kickoff)),
    [matches, tab, isFav],
  );

  const days = useMemo(() => groupByDay(filtered), [filtered]);
  const anchorId = useMemo(() => findAnchorId(filtered), [filtered]);
  const anchor = filtered.find((m) => m.id === anchorId);
  const anchorDay = anchor ? dayKey(anchor.kickoff) : undefined;
  const anchorIsUpcoming = Boolean(
    anchor && !isFinished(anchor) && !isLiveNow(anchor),
  );
  const hasLive = filtered.some((m) => isLiveNow(m));

  const anchorRef = useScrollToAnchor(`${tab}`, matches.length > 0);

  if (days.length === 0) {
    return (
      <p className="card p-6 text-center text-slate-500">No matches to show.</p>
    );
  }

  const jumpToCurrent = () =>
    anchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className="space-y-4">
      {days.map(([key, dayMatches]) => (
        <section
          key={key}
          ref={key === anchorDay ? anchorRef : undefined}
          className="scroll-mt-28 space-y-2"
        >
          <h2 className="flex items-center gap-2 py-1 text-sm font-semibold text-slate-500">
            {formatDay(dayMatches[0]!.kickoff)}
            {key === anchorDay && !hasLive && anchorIsUpcoming && (
              <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-semibold text-brand">
                Up next
              </span>
            )}
          </h2>
          {dayMatches.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </section>
      ))}

      {anchorId && <JumpToCurrentButton onClick={jumpToCurrent} live={hasLive} />}
    </div>
  );
}

/** Floating, frosted-glass button that scrolls back to the live / next match. */
function JumpToCurrentButton({
  onClick,
  live,
}: {
  onClick: () => void;
  live: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Jump to current match"
      title="Jump to today’s match"
      className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-white/30 text-xl shadow-lg ring-1 ring-white/40 backdrop-blur-md transition-transform hover:scale-110 active:scale-95 dark:bg-white/10 dark:ring-white/20 sm:bottom-6"
    >
      <span aria-hidden>⚽</span>
      {live && (
        <span className="absolute right-0 top-0 h-3 w-3 animate-pulse-live rounded-full bg-red-500 ring-2 ring-slate-50 dark:ring-slate-950" />
      )}
    </button>
  );
}

/** Groups: each group's standings table followed by its matches. */
function GroupsView({
  standings,
  matches,
  isFav,
}: {
  standings: GroupStandings[];
  matches: Match[];
  isFav: (m: Match) => boolean;
}) {
  // Scroll to top whenever this tab is opened.
  useScrollToAnchor('group', standings.length > 0, true);

  if (standings.length === 0) {
    return (
      <p className="card p-6 text-center text-slate-500">
        Group standings aren’t available yet.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {standings.map((group) => {
        const groupMatches = matches
          .filter((m) => m.stage === 'group' && m.group === group.group)
          .filter(isFav)
          .sort((a, b) => a.kickoff.localeCompare(b.kickoff));
        return (
          <section key={group.group} className="space-y-2">
            <StandingsTable group={group} />
            <div className="space-y-2">
              {groupMatches.map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

/**
 * Returns a ref to attach to the anchor element. On each new view (keyed by
 * `viewKey`) once data is ready, scrolls that element into view — or to the top
 * when `toTop` is set. Won't re-fire on background refetches within a view.
 */
function useScrollToAnchor(viewKey: string, ready: boolean, toTop = false) {
  const ref = useRef<HTMLElement | null>(null);
  const lastView = useRef<string | null>(null);

  useEffect(() => {
    if (!ready || lastView.current === viewKey) return;
    lastView.current = viewKey;
    requestAnimationFrame(() => {
      if (!toTop && ref.current) {
        ref.current.scrollIntoView({ block: 'start' });
      } else {
        window.scrollTo({ top: 0 });
      }
    });
  }, [viewKey, ready, toTop]);

  return ref;
}

function groupByDay(matches: Match[]): [string, Match[]][] {
  const map = new Map<string, Match[]>();
  for (const m of matches) {
    const key = dayKey(m.kickoff);
    const list = map.get(key) ?? [];
    list.push(m);
    map.set(key, list);
  }
  return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'group', label: 'Groups' },
  { key: 'knockout', label: 'Knockouts' },
];

function Segmented({
  tab,
  onChange,
}: {
  tab: Tab;
  onChange: (t: Tab) => void;
}) {
  return (
    <div className="inline-flex rounded-lg bg-slate-200/60 p-0.5 dark:bg-slate-800">
      {TABS.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => onChange(t.key)}
          className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
            tab === t.key
              ? 'bg-white text-brand shadow-sm dark:bg-slate-700'
              : 'text-slate-500'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

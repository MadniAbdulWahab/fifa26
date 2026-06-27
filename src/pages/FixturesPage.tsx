import { useEffect, useMemo, useRef, useState } from 'react';
import { useTournament } from '@/app/TournamentContext';
import { useFavorites } from '@/hooks/useFavorites';
import { MatchCard } from '@/components/MatchCard';
import { StandingsTable } from '@/components/StandingsTable';
import { dayKey, formatDay, germanTimeZoneLabel } from '@/lib/datetime';
import { findAnchorId, isFinished, isLiveNow } from '@/lib/matchTime';
import type { GroupId, GroupStandings, Match } from '@/domain/types';

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

      {tab !== 'group' && (
        <p className="-mt-2 text-xs text-slate-400 dark:text-slate-500">
          🕒 All times shown in German time ({germanTimeZoneLabel()})
        </p>
      )}

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
        <section key={key} className="space-y-2">
          <h2 className="flex items-center gap-2 py-1 text-sm font-semibold text-slate-500">
            {formatDay(dayMatches[0]!.kickoff)}
            {key === anchorDay && !hasLive && anchorIsUpcoming && (
              <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-semibold text-brand">
                Up next
              </span>
            )}
          </h2>
          {dayMatches.map((m) => (
            <div
              key={m.id}
              ref={m.id === anchorId ? anchorRef : undefined}
              className={m.id === anchorId ? 'scroll-mt-28' : undefined}
            >
              <MatchCard match={m} />
            </div>
          ))}
        </section>
      ))}

      {anchorId && (
        <JumpToCurrentButton onClick={jumpToCurrent} live={hasLive} />
      )}
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
  const groups = useMemo(
    () => standings.map((group) => group.group),
    [standings],
  );
  const [selectedGroup, setSelectedGroup] = useState<GroupId | undefined>(
    groups[0],
  );

  useEffect(() => {
    if (groups.length === 0) return;
    if (!selectedGroup || !groups.includes(selectedGroup)) {
      setSelectedGroup(groups[0]);
    }
  }, [groups, selectedGroup]);

  const group =
    standings.find((standing) => standing.group === selectedGroup) ??
    standings[0];

  const groupMatches = useMemo(
    () =>
      group
        ? matches
            .filter((m) => m.stage === 'group' && m.group === group.group)
            .filter(isFav)
            .sort((a, b) => a.kickoff.localeCompare(b.kickoff))
        : [],
    [group, matches, isFav],
  );

  // Place each selected group at the top the first time it is opened.
  useScrollToAnchor(`group-${group?.group ?? 'none'}`, Boolean(group), true);

  if (standings.length === 0) {
    return (
      <p className="card p-6 text-center text-slate-500">
        Group standings aren’t available yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <GroupSelector
        groups={groups}
        selectedGroup={group?.group}
        onSelect={setSelectedGroup}
      />

      {group && (
        <section className="space-y-2">
          <StandingsTable group={group} />
          <div className="space-y-2">
            {groupMatches.length > 0 ? (
              groupMatches.map((m) => <MatchCard key={m.id} match={m} />)
            ) : (
              <p className="card p-4 text-center text-sm text-slate-500">
                No matches to show for Group {group.group}.
              </p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function GroupSelector({
  groups,
  selectedGroup,
  onSelect,
}: {
  groups: GroupId[];
  selectedGroup: GroupId | undefined;
  onSelect: (group: GroupId) => void;
}) {
  return (
    <div className="relative grid grid-cols-6 gap-x-1 gap-y-2 rounded-lg bg-slate-200/60 p-0.5 dark:bg-slate-800 sm:grid-cols-12 sm:gap-y-1">
      <span
        aria-hidden
        className="pointer-events-none absolute left-2 right-2 top-1/2 h-px -translate-y-1/2 bg-slate-300/70 dark:bg-slate-700 sm:hidden"
      />
      {groups.map((group) => (
        <button
          key={group}
          type="button"
          onClick={() => onSelect(group)}
          aria-label={`Show Group ${group}`}
          aria-pressed={selectedGroup === group}
          className={`relative z-10 flex h-8 items-center justify-center rounded-md text-xs font-bold transition-colors ${
            selectedGroup === group
              ? 'bg-white text-brand shadow-sm dark:bg-slate-700'
              : 'text-slate-500 hover:bg-white/60 dark:hover:bg-slate-700/60'
          }`}
        >
          {group}
        </button>
      ))}
    </div>
  );
}

// Module-level so they survive FixturesPage unmounting (e.g. opening a match):
// which views have already had their one-time placement, and the last scroll
// position per view, so returning restores where the user was.
const placedViews = new Set<string>();
const savedScrollByView = new Map<string, number>();

/**
 * Returns a ref to attach to the anchor element. The **first** time a view
 * (keyed by `viewKey`) is shown in a session, it places the scroll — to the
 * anchor match, or to the top when `toTop` is set. On later visits (e.g. after
 * opening a match and coming back) it **restores the previous scroll position**
 * instead of jerking back to the current match. Won't re-fire on background
 * refetches within a view.
 */
function useScrollToAnchor(viewKey: string, ready: boolean, toTop = false) {
  const ref = useRef<HTMLDivElement | null>(null);
  const lastView = useRef<string | null>(null);

  // Remember the scroll position for the active view as the user scrolls.
  useEffect(() => {
    if (!ready) return;
    const onScroll = () => savedScrollByView.set(viewKey, window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [viewKey, ready]);

  useEffect(() => {
    if (!ready || lastView.current === viewKey) return;
    lastView.current = viewKey;
    requestAnimationFrame(() => {
      if (placedViews.has(viewKey)) {
        // Returning to a view we've shown before: restore the user's position.
        window.scrollTo({ top: savedScrollByView.get(viewKey) ?? 0 });
        return;
      }
      placedViews.add(viewKey);
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

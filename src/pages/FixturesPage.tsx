import { useMemo, useState } from 'react';
import { useTournament } from '@/app/TournamentContext';
import { useFavorites } from '@/hooks/useFavorites';
import { MatchCard } from '@/components/MatchCard';
import { dayKey, formatDay } from '@/lib/datetime';
import type { Match } from '@/domain/types';

type Scope = 'all' | 'group' | 'knockout';

export function FixturesPage() {
  const { matches } = useTournament();
  const { favorites } = useFavorites();
  const [scope, setScope] = useState<Scope>('all');
  const [favOnly, setFavOnly] = useState(false);

  const filtered = useMemo(() => {
    return matches
      .filter((m) => {
        if (scope === 'group') return m.stage === 'group';
        if (scope === 'knockout') return m.stage !== 'group';
        return true;
      })
      .filter((m) =>
        favOnly
          ? favorites.has(m.homeId) || favorites.has(m.awayId)
          : true,
      )
      .sort((a, b) => a.kickoff.localeCompare(b.kickoff));
  }, [matches, scope, favOnly, favorites]);

  const days = useMemo(() => groupByDay(filtered), [filtered]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <SegmentedControl value={scope} onChange={setScope} />
        <button
          type="button"
          onClick={() => setFavOnly((v) => !v)}
          className={`ml-auto rounded-lg px-3 py-1.5 text-sm font-medium ${
            favOnly
              ? 'bg-amber-400/20 text-amber-500'
              : 'text-slate-500 hover:bg-slate-200/60 dark:hover:bg-slate-800'
          }`}
        >
          ⭐ Favorites
        </button>
      </div>

      {days.length === 0 && (
        <p className="card p-6 text-center text-slate-500">
          No matches to show.
        </p>
      )}

      {days.map(([key, dayMatches]) => (
        <section key={key} className="space-y-2">
          <h2 className="sticky top-14 z-[1] bg-slate-50/90 py-1 text-sm font-semibold text-slate-500 backdrop-blur dark:bg-slate-950/90">
            {formatDay(dayMatches[0]!.kickoff)}
          </h2>
          {dayMatches.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </section>
      ))}
    </div>
  );
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

const SCOPES: { value: Scope; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'group', label: 'Groups' },
  { value: 'knockout', label: 'Knockouts' },
];

function SegmentedControl({
  value,
  onChange,
}: {
  value: Scope;
  onChange: (s: Scope) => void;
}) {
  return (
    <div className="inline-flex rounded-lg bg-slate-200/60 p-0.5 dark:bg-slate-800">
      {SCOPES.map((s) => (
        <button
          key={s.value}
          type="button"
          onClick={() => onChange(s.value)}
          className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
            value === s.value
              ? 'bg-white text-brand shadow-sm dark:bg-slate-700'
              : 'text-slate-500'
          }`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}

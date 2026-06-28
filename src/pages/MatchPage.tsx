import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTournament } from '@/app/TournamentContext';
import { FavoriteStar } from '@/components/FavoriteStar';
import { OddsBar } from '@/components/OddsBar';
import { StandingsTable } from '@/components/StandingsTable';
import { StatusBadge } from '@/components/StatusBadge';
import { TeamBadge } from '@/components/TeamBadge';
import type { CommentaryEntry, Match, MatchEvent, Team } from '@/domain/types';
import { formatDay, formatTime, germanTimeZoneLabel } from '@/lib/datetime';
import { formatPercent } from '@/lib/labels';
import { isFinished, isLiveNow } from '@/lib/matchTime';
import { expectedGoals } from '@/lib/model';
import {
  qualificationStatus,
  type QualificationStatus,
} from '@/lib/qualification';
import { computeRecord } from '@/lib/record';
import { useMatchEvents } from '@/hooks/useMatchEvents';

export function MatchPage() {
  const { id } = useParams<{ id: string }>();
  const { matches, getTeam, standings } = useTournament();
  const match = matches.find((m) => m.id === id);
  const [detailTab, setDetailTab] = useState<DetailTab>('events');

  const home = match ? getTeam(match.homeId) : undefined;
  const away = match ? getTeam(match.awayId) : undefined;
  const {
    goals,
    commentary,
    partial: partialEvents,
    isLoading: eventsLoading,
  } = useMatchEvents(match, home, away);

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

  const hasScore = match.homeGoals !== null && match.awayGoals !== null;
  const finished = isFinished(match);
  const live = isLiveNow(match);
  const goalEvents = goals.filter((event) => event.type === 'goal');
  const group =
    match.group !== undefined
      ? standings.find((standing) => standing.group === match.group)
      : undefined;

  return (
    <div className="space-y-5">
      <Link to="/" className="inline-block text-sm text-brand">
        ← Fixtures
      </Link>

      {/* Scoreboard */}
      <section className={`card p-5 ${live ? 'ring-2 ring-red-500' : ''}`}>
        <div className="grid grid-cols-3 items-start gap-2">
          <TeamColumn
            team={home}
            scorers={goalEvents.filter((event) => event.teamId === home?.id)}
          />
          <div className="flex flex-col items-center gap-1">
            {hasScore || live ? (
              <div className="text-3xl font-extrabold tabular-nums">
                {match.homeGoals ?? 0}
                <span className="mx-1 text-slate-400">–</span>
                {match.awayGoals ?? 0}
              </div>
            ) : (
              <div className="mt-7 text-2xl font-bold text-slate-400">vs</div>
            )}
            {live ? (
              <StatusBadge status="live" minute={match.minute} />
            ) : finished ? (
              <StatusBadge status="finished" />
            ) : null}
          </div>
          <TeamColumn
            team={away}
            scorers={goalEvents.filter((event) => event.teamId === away?.id)}
          />
        </div>
      </section>

      {finished || live ? (
        <MatchDetailsTabs
          activeTab={detailTab}
          onTabChange={setDetailTab}
          home={home}
          away={away}
          matches={matches}
          goalEvents={goalEvents}
          commentary={commentary}
          partial={partialEvents}
          loading={eventsLoading}
          live={live}
          finished={finished}
          homeGoals={match.homeGoals}
          awayGoals={match.awayGoals}
        />
      ) : (
        <PredictionCard home={home} away={away} />
      )}

      {group && (
        <section>
          <h2 className="mb-2 font-bold">Group {group.group} standings</h2>
          <StandingsTable group={group} />
        </section>
      )}

      <MatchInfoCard match={match} />
    </div>
  );
}

function MatchInfoCard({ match }: { match: Match }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white/70 p-3 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900/60">
      <h2 className="font-semibold uppercase tracking-wide text-slate-400">
        Match info
      </h2>
      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2">
        <InfoItem label="Date" value={formatDay(match.kickoff)} />
        <InfoItem
          label="Kickoff"
          value={`${formatTime(match.kickoff)} ${germanTimeZoneLabel(
            match.kickoff,
          )}`}
        />
        <InfoItem label="Stadium" value={match.venue ?? 'To be announced'} />
        <InfoItem
          label="City"
          value={
            match.venueCity ?? cityFromVenue(match.venue) ?? 'To be announced'
          }
        />
      </dl>
    </section>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="font-medium text-slate-400">{label}</dt>
      <dd className="mt-0.5 break-words font-semibold text-slate-600 dark:text-slate-300">
        {value}
      </dd>
    </div>
  );
}

function cityFromVenue(venue: string | undefined): string | undefined {
  if (!venue?.includes(',')) return undefined;
  return venue.split(',').at(-1)?.trim() || undefined;
}

function PredictionCard({
  home,
  away,
}: {
  home: Team | undefined;
  away: Team | undefined;
}) {
  if (!home || !away) {
    return (
      <section className="card p-4">
        <h2 className="font-bold">Prediction</h2>
        <p className="mt-2 text-sm text-slate-500">
          Prediction will appear once both teams are confirmed.
        </p>
      </section>
    );
  }

  const probabilities = predictMatch(home, away);
  const outcomes = [
    {
      key: 'home',
      label: `${home.name} win`,
      value: probabilities.homeWin,
    },
    { key: 'draw', label: 'Draw', value: probabilities.draw },
    {
      key: 'away',
      label: `${away.name} win`,
      value: probabilities.awayWin,
    },
  ].sort((a, b) => b.value - a.value);

  return (
    <section className="card p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-bold">Prediction</h2>
        <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-semibold text-brand">
          {outcomes[0]!.label}
        </span>
      </div>
      <div className="mt-4 space-y-3">
        <PredictionRow
          label={`${home.name} win`}
          value={probabilities.homeWin}
        />
        <PredictionRow label="Draw" value={probabilities.draw} />
        <PredictionRow
          label={`${away.name} win`}
          value={probabilities.awayWin}
        />
      </div>
      <p className="mt-3 text-xs text-slate-400">
        Estimate based on team ratings and a simple goal model.
      </p>
    </section>
  );
}

function PredictionRow({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between gap-3 text-sm">
        <span className="min-w-0 truncate text-slate-600 dark:text-slate-300">
          {label}
        </span>
        <span className="shrink-0 font-semibold tabular-nums">
          {formatPercent(value)}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div
          className="h-full rounded-full bg-brand transition-all"
          style={{ width: `${Math.round(value * 100)}%` }}
        />
      </div>
    </div>
  );
}

function predictMatch(home: Team, away: Team) {
  const xg = expectedGoals(home, away);
  const maxGoals = 10;
  let homeWin = 0;
  let draw = 0;
  let awayWin = 0;

  for (let h = 0; h <= maxGoals; h++) {
    for (let a = 0; a <= maxGoals; a++) {
      const p = poissonProbability(h, xg.home) * poissonProbability(a, xg.away);
      if (h > a) homeWin += p;
      else if (h === a) draw += p;
      else awayWin += p;
    }
  }

  const total = homeWin + draw + awayWin;
  return {
    homeWin: homeWin / total,
    draw: draw / total,
    awayWin: awayWin / total,
  };
}

function poissonProbability(k: number, lambda: number): number {
  return (Math.exp(-lambda) * lambda ** k) / factorial(k);
}

function factorial(n: number): number {
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

type DetailTab = 'events' | 'commentary' | 'outlook';

function MatchDetailsTabs({
  activeTab,
  onTabChange,
  home,
  away,
  matches,
  goalEvents,
  commentary,
  partial,
  loading,
  live,
  finished,
  homeGoals,
  awayGoals,
}: {
  activeTab: DetailTab;
  onTabChange: (tab: DetailTab) => void;
  home: Team | undefined;
  away: Team | undefined;
  matches: Match[];
  goalEvents: MatchEvent[];
  commentary: CommentaryEntry[];
  partial: boolean;
  loading: boolean;
  live: boolean;
  finished: boolean;
  homeGoals: number | null;
  awayGoals: number | null;
}) {
  const tabs: { key: DetailTab; label: string }[] = [
    { key: 'events', label: 'Events' },
    ...(commentary.length > 0
      ? [{ key: 'commentary' as const, label: 'Commentary' }]
      : []),
    { key: 'outlook', label: 'Team outlook' },
  ];
  // Commentary may disappear (source change); fall back so no blank panel shows.
  const current = tabs.some((t) => t.key === activeTab) ? activeTab : 'events';

  return (
    <section className="card overflow-hidden">
      <div
        className="grid border-b border-slate-200 text-sm font-semibold dark:border-slate-800"
        style={{
          gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))`,
        }}
      >
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => onTabChange(t.key)}
            className={`px-3 py-3 ${
              current === t.key
                ? 'border-b-2 border-brand text-brand'
                : 'text-slate-500'
            }`}
          >
            {t.label}
            {t.key === 'commentary' && live && (
              <span className="ml-1.5 inline-block h-2 w-2 animate-pulse-live rounded-full bg-red-500 align-middle" />
            )}
          </button>
        ))}
      </div>

      <div className="p-4">
        {current === 'events' ? (
          <MatchEvents
            events={goalEvents}
            home={home}
            away={away}
            partial={partial}
            loading={loading}
            finished={finished}
            homeGoals={homeGoals}
            awayGoals={awayGoals}
          />
        ) : current === 'commentary' ? (
          <MatchCommentary commentary={commentary} live={live} />
        ) : (
          <TeamOutlookGrid home={home} away={away} matches={matches} flush />
        )}
      </div>
    </section>
  );
}

function MatchCommentary({
  commentary,
  live,
}: {
  commentary: CommentaryEntry[];
  live: boolean;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-bold">Commentary</h2>
        {live && (
          <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-semibold text-red-500">
            LIVE
          </span>
        )}
      </div>
      <ol className="mt-3 space-y-3">
        {commentary.map((c) => (
          <li key={c.id} className="flex gap-3">
            <span className="w-10 shrink-0 text-sm font-semibold tabular-nums text-brand">
              {c.minute ?? ''}
            </span>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {c.text}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}

function MatchEvents({
  events,
  home,
  away,
  partial,
  loading,
  finished,
  homeGoals,
  awayGoals,
}: {
  events: MatchEvent[];
  home: Team | undefined;
  away: Team | undefined;
  partial: boolean;
  loading: boolean;
  finished: boolean;
  homeGoals: number | null;
  awayGoals: number | null;
}) {
  const teamName = (teamId: string) => {
    if (teamId === home?.id) return home.name;
    if (teamId === away?.id) return away.name;
    return 'Team';
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-bold">Match events</h2>
        {partial && events.length > 0 && (
          <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-xs font-semibold text-amber-500">
            Partial data
          </span>
        )}
      </div>
      {loading ? (
        <p className="mt-2 text-sm text-slate-500">Loading scorers…</p>
      ) : events.length > 0 ? (
        <>
          <ol className="mt-3 space-y-3">
            {events.map((event) => (
              <li key={event.id} className="flex gap-3">
                <span className="w-12 shrink-0 text-sm font-semibold tabular-nums text-brand">
                  {event.minute}'
                </span>
                <div>
                  <p className="font-medium">
                    {event.playerName}
                    <span className="ml-2 text-sm font-normal text-slate-500">
                      {teamName(event.teamId)}
                    </span>
                  </p>
                  {event.assistName && (
                    <p className="text-sm text-slate-500">
                      Assist: {event.assistName}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
          {partial && (
            <p className="mt-3 text-xs text-slate-400">
              Scorer data is community-sourced and may be incomplete.
            </p>
          )}
        </>
      ) : (
        <p className="mt-2 text-sm text-slate-500">
          {emptyEventsMessage({ finished, homeGoals, awayGoals })}
        </p>
      )}
    </div>
  );
}

function emptyEventsMessage({
  finished,
  homeGoals,
  awayGoals,
}: {
  finished: boolean;
  homeGoals: number | null;
  awayGoals: number | null;
}): string {
  if (!finished) return 'No goals have been scored in this match yet.';
  const totalGoals = (homeGoals ?? 0) + (awayGoals ?? 0);
  if (totalGoals === 0) return 'No goals were scored in this match.';
  return 'Scorer details are not available for this finished match.';
}

function TeamColumn({
  team,
  scorers,
}: {
  team: Team | undefined;
  scorers: MatchEvent[];
}) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-2 text-center">
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
      <div className="flex items-center justify-center gap-1">
        <Link
          to={team ? `/team/${team.id}` : '#'}
          className="text-sm font-semibold hover:text-brand"
        >
          {team ? team.name : 'TBD'}
        </Link>
        {team && <FavoriteStar teamId={team.id} />}
      </div>
      <GoalScorers scorers={scorers} />
    </div>
  );
}

function GoalScorers({ scorers }: { scorers: MatchEvent[] }) {
  if (scorers.length === 0) return null;

  return (
    <ul className="mt-1 w-full max-w-[9rem] space-y-1 text-xs text-slate-500">
      {scorers.map((event) => (
        <li key={event.id} className="leading-tight">
          <span className="font-medium text-slate-700 dark:text-slate-300">
            {event.playerName}
          </span>{' '}
          <span className="tabular-nums">{event.minute}'</span>
        </li>
      ))}
    </ul>
  );
}

function TeamOutlookGrid({
  home,
  away,
  matches,
  flush = false,
}: {
  home: Team | undefined;
  away: Team | undefined;
  matches: Match[];
  flush?: boolean;
}) {
  return (
    <section className="grid gap-3 sm:grid-cols-2">
      {[home, away].map((team, i) =>
        team ? (
          <TeamOutlook
            key={team.id}
            team={team}
            matches={matches}
            framed={!flush}
          />
        ) : (
          <div
            key={i}
            className={`p-4 text-center text-slate-500 ${
              flush ? 'rounded-lg bg-slate-100/70 dark:bg-slate-950/50' : 'card'
            }`}
          >
            To be decided
          </div>
        ),
      )}
    </section>
  );
}

function TeamOutlook({
  team,
  matches,
  framed = true,
}: {
  team: Team;
  matches: Match[];
  framed?: boolean;
}) {
  const { odds, standings } = useTournament();
  const record = computeRecord(team.id, matches);
  const teamOdds = odds.get(team.id);
  const status = qualificationStatus(team.id, matches, standings);

  return (
    <div
      className={`space-y-3 p-4 ${
        framed ? 'card' : 'rounded-lg bg-slate-100/70 dark:bg-slate-950/50'
      }`}
    >
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
      {status.kind !== 'pending' ? (
        <QualificationBadge status={status} />
      ) : teamOdds ? (
        <OddsBar value={teamOdds.advanceFromGroup} label="Reach knockouts" />
      ) : null}
    </div>
  );
}

function QualificationBadge({ status }: { status: QualificationStatus }) {
  const tone =
    status.kind === 'qualified'
      ? 'bg-brand/10 text-brand'
      : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400';

  return (
    <div className={`rounded-lg px-3 py-2 text-sm font-semibold ${tone}`}>
      {status.label}
    </div>
  );
}

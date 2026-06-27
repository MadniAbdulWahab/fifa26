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
import { matchStageLabel } from '@/lib/labels';
import { isLiveNow } from '@/lib/matchTime';
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

  const played = match.homeGoals !== null && match.awayGoals !== null;
  const live = isLiveNow(match);
  const goalEvents = goals.filter((event) => event.type === 'goal');
  const group =
    match.group !== undefined
      ? standings.find((g) => g.group === match.group)
      : undefined;

  return (
    <div className="space-y-5">
      <Link to="/" className="inline-block text-sm text-brand">
        ← Fixtures
      </Link>

      {/* Scoreboard */}
      <section className={`card p-5 ${live ? 'ring-2 ring-red-500' : ''}`}>
        <p className="text-center text-xs font-medium text-slate-500">
          {matchStageLabel(match)} · {formatDay(match.kickoff)}
          {match.venue ? ` · ${match.venue}` : ''}
        </p>

        <div className="mt-4 grid grid-cols-3 items-start gap-2">
          <TeamColumn
            team={home}
            scorers={goalEvents.filter((event) => event.teamId === home?.id)}
          />
          <div className="flex flex-col items-center gap-1">
            {played || live ? (
              <div className="text-3xl font-extrabold tabular-nums">
                {match.homeGoals ?? 0}
                <span className="mx-1 text-slate-400">–</span>
                {match.awayGoals ?? 0}
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold text-slate-400">vs</div>
                <div className="text-sm font-semibold">
                  {formatTime(match.kickoff)}
                </div>
                <div className="text-[10px] font-medium text-slate-400">
                  {germanTimeZoneLabel(match.kickoff)} · German time
                </div>
              </>
            )}
            {live ? (
              <StatusBadge status="live" minute={match.minute} />
            ) : played ? (
              <StatusBadge status="finished" />
            ) : null}
          </div>
          <TeamColumn
            team={away}
            scorers={goalEvents.filter((event) => event.teamId === away?.id)}
          />
        </div>
      </section>

      {played || live ? (
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
        />
      ) : (
        <TeamOutlookGrid home={home} away={away} matches={matches} />
      )}

      {group && (
        <section>
          <h2 className="mb-2 font-bold">Group {group.group} standings</h2>
          <StandingsTable group={group} />
        </section>
      )}
    </div>
  );
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
        style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
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
            <p className="text-sm text-slate-600 dark:text-slate-300">{c.text}</p>
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
}: {
  events: MatchEvent[];
  home: Team | undefined;
  away: Team | undefined;
  partial: boolean;
  loading: boolean;
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
          Scorer details aren’t available for this match yet.
        </p>
      )}
    </div>
  );
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
  const { odds } = useTournament();
  const record = computeRecord(team.id, matches);
  const teamOdds = odds.get(team.id);

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
      {teamOdds && (
        <OddsBar value={teamOdds.advanceFromGroup} label="Reach knockouts" />
      )}
    </div>
  );
}

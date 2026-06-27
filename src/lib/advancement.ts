import type { GroupId, Match, Team, TeamId } from '@/domain/types';
import { expectedGoals, simulateScore } from './model';
import { mulberry32, poisson, type Rng } from './rng';

/**
 * Monte Carlo estimate of each team's tournament fortunes.
 *
 * For each iteration we replay the group stage (keeping real results, then
 * simulating the rest), decide who advances, seed a knockout bracket and play
 * it out. Aggregating thousands of iterations yields stable probabilities.
 */
export interface AdvancementOdds {
  /** P(reach the knockout stage). */
  advanceFromGroup: number;
  /** P(win the tournament). */
  winTitle: number;
}

export interface SimOptions {
  iterations?: number;
  seed?: number;
}

interface WorkRecord {
  teamId: TeamId;
  group: GroupId;
  points: number;
  gd: number;
  gf: number;
}

const BEST_THIRDS = 8;

function byStanding(a: WorkRecord, b: WorkRecord): number {
  if (b.points !== a.points) return b.points - a.points;
  if (b.gd !== a.gd) return b.gd - a.gd;
  return b.gf - a.gf;
}

export function simulateAdvancement(
  teams: Team[],
  matches: Match[],
  options: SimOptions = {},
): Map<TeamId, AdvancementOdds> {
  const iterations = options.iterations ?? 2000;
  const rng = mulberry32(options.seed ?? 0xc0ffee);

  const teamsById = new Map(teams.map((t) => [t.id, t]));
  const groupMatches = matches.filter((m) => m.stage === 'group' && m.group);

  // Which group each team belongs to.
  const groupOf = new Map<TeamId, GroupId>();
  for (const m of groupMatches) {
    groupOf.set(m.homeId, m.group!);
    groupOf.set(m.awayId, m.group!);
  }

  const groupTeams = new Map<GroupId, TeamId[]>();
  for (const [teamId, group] of groupOf) {
    const list = groupTeams.get(group) ?? [];
    list.push(teamId);
    groupTeams.set(group, list);
  }

  const finished = groupMatches.filter(
    (m) => m.homeGoals !== null && m.awayGoals !== null,
  );
  const remaining = groupMatches.filter(
    (m) => m.homeGoals === null || m.awayGoals === null,
  );

  // Tallies.
  const advanceCount = new Map<TeamId, number>();
  const titleCount = new Map<TeamId, number>();
  for (const team of teams) {
    advanceCount.set(team.id, 0);
    titleCount.set(team.id, 0);
  }

  for (let i = 0; i < iterations; i++) {
    const work = baseRecords(groupOf, finished);
    simulateRemainingGroupGames(work, remaining, teamsById, rng);
    const advancing = resolveAdvancing(work, groupTeams);
    for (const id of advancing) {
      advanceCount.set(id, (advanceCount.get(id) ?? 0) + 1);
    }
    const champion = simulateKnockout(advancing, work, teamsById, rng);
    if (champion) titleCount.set(champion, (titleCount.get(champion) ?? 0) + 1);
  }

  const odds = new Map<TeamId, AdvancementOdds>();
  for (const team of teams) {
    odds.set(team.id, {
      advanceFromGroup: (advanceCount.get(team.id) ?? 0) / iterations,
      winTitle: (titleCount.get(team.id) ?? 0) / iterations,
    });
  }
  return odds;
}

/** Seed working records from the real finished group results. */
function baseRecords(
  groupOf: Map<TeamId, GroupId>,
  finished: Match[],
): Map<TeamId, WorkRecord> {
  const work = new Map<TeamId, WorkRecord>();
  for (const [teamId, group] of groupOf) {
    work.set(teamId, { teamId, group, points: 0, gd: 0, gf: 0 });
  }
  for (const m of finished) {
    applyResult(work, m.homeId, m.awayId, m.homeGoals!, m.awayGoals!);
  }
  return work;
}

function applyResult(
  work: Map<TeamId, WorkRecord>,
  homeId: TeamId,
  awayId: TeamId,
  hg: number,
  ag: number,
): void {
  const home = work.get(homeId);
  const away = work.get(awayId);
  if (!home || !away) return;
  home.gf += hg;
  away.gf += ag;
  home.gd += hg - ag;
  away.gd += ag - hg;
  if (hg > ag) home.points += 3;
  else if (hg < ag) away.points += 3;
  else {
    home.points += 1;
    away.points += 1;
  }
}

function simulateRemainingGroupGames(
  work: Map<TeamId, WorkRecord>,
  remaining: Match[],
  teamsById: Map<TeamId, Team>,
  rng: Rng,
): void {
  for (const m of remaining) {
    const home = teamsById.get(m.homeId);
    const away = teamsById.get(m.awayId);
    if (!home || !away) continue;
    const score = simulateScore(home, away, rng);
    applyResult(work, m.homeId, m.awayId, score.home, score.away);
  }
}

/** Top two of each group plus the eight best third-placed teams. */
function resolveAdvancing(
  work: Map<TeamId, WorkRecord>,
  groupTeams: Map<GroupId, TeamId[]>,
): TeamId[] {
  const advancing: TeamId[] = [];
  const thirds: WorkRecord[] = [];

  for (const [, ids] of groupTeams) {
    const rows = ids
      .map((id) => work.get(id))
      .filter((r): r is WorkRecord => Boolean(r))
      .sort(byStanding);
    if (rows[0]) advancing.push(rows[0].teamId);
    if (rows[1]) advancing.push(rows[1].teamId);
    if (rows[2]) thirds.push(rows[2]);
  }

  thirds.sort(byStanding);
  for (const t of thirds.slice(0, BEST_THIRDS)) advancing.push(t.teamId);
  return advancing;
}

/** Play a single-elimination bracket and return the champion's id. */
function simulateKnockout(
  advancing: TeamId[],
  work: Map<TeamId, WorkRecord>,
  teamsById: Map<TeamId, Team>,
  rng: Rng,
): TeamId | null {
  if (advancing.length < 2) return advancing[0] ?? null;

  // Seed strongest-first by group performance, then pair 1-v-last.
  const seeds = [...advancing].sort((a, b) => {
    const ra = work.get(a);
    const rb = work.get(b);
    if (!ra || !rb) return 0;
    return byStanding(ra, rb);
  });

  let round = seeds;
  while (round.length > 1) {
    const next: TeamId[] = [];
    for (let i = 0; i < round.length / 2; i++) {
      const a = round[i]!;
      const b = round[round.length - 1 - i]!;
      next.push(playKnockoutTie(a, b, teamsById, rng));
    }
    round = next;
  }
  return round[0] ?? null;
}

function playKnockoutTie(
  aId: TeamId,
  bId: TeamId,
  teamsById: Map<TeamId, Team>,
  rng: Rng,
): TeamId {
  const a = teamsById.get(aId);
  const b = teamsById.get(bId);
  if (!a || !b) return a ? aId : bId;

  const xg = expectedGoals(a, b);
  const ag = poisson(xg.home, rng);
  const bg = poisson(xg.away, rng);
  if (ag > bg) return aId;
  if (bg > ag) return bId;
  // Draw → decide by expected-goals share (penalty-shootout proxy).
  const pA = xg.home / (xg.home + xg.away);
  return rng() < pA ? aId : bId;
}

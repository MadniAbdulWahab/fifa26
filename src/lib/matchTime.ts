import type { Match } from '@/domain/types';

/**
 * Time/status helpers shared by the fixtures list and the match card so they
 * always agree on what counts as "live" or "next".
 */

/** Approximate length of a match window (90' + half-time + stoppage). */
export const MATCH_WINDOW_MS = 2 * 60 * 60 * 1000;

export function isFinished(match: Match): boolean {
  return match.status === 'finished';
}

/**
 * Whether a match is in progress *right now*.
 *
 * Trusts an explicit `live` status (the live API sets this), and also treats a
 * not-yet-finished match as live when the clock falls inside its kickoff window
 * — so sample fixtures light up during their real time slot without faking a
 * score.
 */
export function isLiveNow(match: Match, now: number = Date.now()): boolean {
  if (match.status === 'live') return true;
  if (match.status === 'finished') return false;
  const start = new Date(match.kickoff).getTime();
  return now >= start && now < start + MATCH_WINDOW_MS;
}

/**
 * Pick the match the fixtures list should open on, relative to *now*: a live
 * match if one is on, otherwise today's / the next upcoming match (earliest
 * kickoff at or after now), otherwise the most recent (last) match.
 * `matches` is expected sorted oldest-first.
 */
export function findAnchorId(
  matches: Match[],
  now: number = Date.now(),
): string | undefined {
  if (matches.length === 0) return undefined;

  const live = matches.find((m) => isLiveNow(m, now));
  if (live) return live.id;

  const next = matches.find((m) => new Date(m.kickoff).getTime() >= now);
  if (next) return next.id;

  return matches[matches.length - 1]!.id;
}

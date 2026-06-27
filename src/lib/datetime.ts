import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import advancedFormat from 'dayjs/plugin/advancedFormat';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(advancedFormat);

/**
 * All kickoff times arrive as UTC ISO strings. These helpers render them in
 * the viewer's own timezone, which is the whole point of "correct dates and
 * times" — a match at 16:00 UTC shows as 18:00 for a user in Berlin.
 */

/** The user's IANA timezone (e.g. "Europe/Berlin"), best-effort. */
export const localTimeZone: string =
  Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

export function toLocal(isoUtc: string) {
  return dayjs.utc(isoUtc).tz(localTimeZone);
}

/** "Sat, 27 Jun 2026" */
export function formatDay(isoUtc: string): string {
  return toLocal(isoUtc).format('ddd, D MMM YYYY');
}

/** "18:00" */
export function formatTime(isoUtc: string): string {
  return toLocal(isoUtc).format('HH:mm');
}

/** "Sat, 27 Jun · 18:00" — compact label for cards. */
export function formatKickoff(isoUtc: string): string {
  return toLocal(isoUtc).format('ddd, D MMM · HH:mm');
}

/** Stable key for grouping matches by local calendar day. */
export function dayKey(isoUtc: string): string {
  return toLocal(isoUtc).format('YYYY-MM-DD');
}

export function isSameLocalDay(isoUtc: string, reference = dayjs()): boolean {
  return toLocal(isoUtc).isSame(reference, 'day');
}

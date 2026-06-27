import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import advancedFormat from 'dayjs/plugin/advancedFormat';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(advancedFormat);

/**
 * All kickoff times arrive as UTC ISO strings. These helpers render them in a
 * fixed German timezone (Europe/Berlin) for every viewer, regardless of where
 * they are — a match at 16:00 UTC always shows as 18:00 (CEST) in the app.
 */

/** The timezone every kickoff is displayed in: German time (CET/CEST). */
export const APP_TIME_ZONE = 'Europe/Berlin';

/**
 * Kept for backward compatibility with existing imports — now always the fixed
 * app timezone rather than the viewer's own.
 */
export const localTimeZone: string = APP_TIME_ZONE;

export function toLocal(isoUtc: string) {
  return dayjs.utc(isoUtc).tz(APP_TIME_ZONE);
}

/** German timezone abbreviation for the current/given moment ("CET" or "CEST"). */
export function germanTimeZoneLabel(
  reference: string | number | Date = Date.now(),
): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: APP_TIME_ZONE,
    timeZoneName: 'short',
  }).formatToParts(new Date(reference));
  return parts.find((p) => p.type === 'timeZoneName')?.value ?? 'CET';
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

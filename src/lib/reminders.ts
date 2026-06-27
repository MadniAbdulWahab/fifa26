import type { Match, Team } from '@/domain/types';
import { formatKickoff } from './datetime';

/**
 * Lightweight kickoff reminders via the browser Notification API.
 *
 * This schedules an in-session notification (setTimeout) a few minutes before
 * kickoff while the app is open. A production app would use the service worker
 * Push API for delivery when closed; that is intentionally out of scope here.
 */
const LEAD_MINUTES = 15;
const MAX_TIMEOUT_MS = 24 * 60 * 60 * 1000; // setTimeout caps out beyond ~24.8 days

export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function notificationPermission(): NotificationPermission {
  return notificationsSupported() ? Notification.permission : 'denied';
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!notificationsSupported()) return 'denied';
  if (Notification.permission !== 'default') return Notification.permission;
  return Notification.requestPermission();
}

/**
 * Schedule a reminder for one upcoming match. Returns a cancel function, or
 * null if there is nothing to schedule (past match, no permission, too far off).
 */
export function scheduleKickoffReminder(
  match: Match,
  home: Team,
  away: Team,
): (() => void) | null {
  if (notificationPermission() !== 'granted') return null;

  const remindAt = new Date(match.kickoff).getTime() - LEAD_MINUTES * 60_000;
  const delay = remindAt - Date.now();
  if (delay <= 0 || delay > MAX_TIMEOUT_MS) return null;

  const timer = setTimeout(() => {
    new Notification(`${home.code} vs ${away.code} starts soon`, {
      body: `Kickoff ${formatKickoff(match.kickoff)}`,
      tag: match.id,
    });
  }, delay);

  return () => clearTimeout(timer);
}

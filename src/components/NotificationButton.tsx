import { useState } from 'react';
import {
  notificationPermission,
  notificationsSupported,
  requestNotificationPermission,
} from '@/lib/reminders';

export function NotificationButton() {
  const [permission, setPermission] = useState(notificationPermission());

  if (!notificationsSupported()) return null;

  if (permission === 'granted') {
    return (
      <span className="text-sm text-brand">🔔 Reminders on</span>
    );
  }

  if (permission === 'denied') {
    return (
      <span className="text-sm text-slate-400">
        Reminders blocked in browser settings
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={async () => setPermission(await requestNotificationPermission())}
      className="rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark"
    >
      🔔 Enable kickoff reminders
    </button>
  );
}

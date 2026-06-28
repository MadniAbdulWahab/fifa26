import type { MatchStatus } from '@/domain/types';

/**
 * `minute` is the live clock (e.g. "72'"); when present it replaces the "LIVE"
 * text so the badge shows how far into the match we are.
 */
export function StatusBadge({
  status,
  minute,
}: {
  status: MatchStatus;
  minute?: string;
}) {
  if (status === 'live') {
    if (minute === 'HT') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-0.5 text-xs font-semibold text-amber-500">
          HT · Break
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-semibold tabular-nums text-red-500">
        <span className="h-2 w-2 animate-pulse-live rounded-full bg-red-500" />
        {minute || 'LIVE'}
      </span>
    );
  }
  if (status === 'finished') {
    return (
      <span className="rounded-full bg-slate-500/10 px-2 py-0.5 text-xs font-medium text-slate-500">
        FT
      </span>
    );
  }
  return null;
}

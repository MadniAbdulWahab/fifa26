import type { MatchStatus } from '@/domain/types';

export function StatusBadge({ status }: { status: MatchStatus }) {
  if (status === 'live') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-semibold text-red-500">
        <span className="h-2 w-2 animate-pulse-live rounded-full bg-red-500" />
        LIVE
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

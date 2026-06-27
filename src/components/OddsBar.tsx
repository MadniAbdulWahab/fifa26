import { formatPercent } from '@/lib/labels';

interface OddsBarProps {
  /** Probability in the range 0–1. */
  value: number;
  label?: string;
  tone?: 'advance' | 'title';
}

export function OddsBar({ value, label, tone = 'advance' }: OddsBarProps) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  const barColor = tone === 'title' ? 'bg-amber-400' : 'bg-brand';

  return (
    <div className="w-full">
      {label && (
        <div className="mb-1 flex justify-between text-xs text-slate-500">
          <span>{label}</span>
          <span className="font-semibold tabular-nums">
            {formatPercent(value)}
          </span>
        </div>
      )}
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`h-full rounded-full ${barColor} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

import type { Match, MatchStage } from '@/domain/types';

const STAGE_LABELS: Record<MatchStage, string> = {
  group: 'Group',
  'round-of-32': 'Round of 32',
  'round-of-16': 'Round of 16',
  'quarter-final': 'Quarter-final',
  'semi-final': 'Semi-final',
  'third-place': 'Third-place play-off',
  final: 'Final',
};

export function stageLabel(stage: MatchStage): string {
  return STAGE_LABELS[stage];
}

/** "Group A" for group games, otherwise the stage name. */
export function matchStageLabel(match: Match): string {
  if (match.stage === 'group' && match.group) return `Group ${match.group}`;
  return STAGE_LABELS[match.stage];
}

export function formatPercent(value: number): string {
  if (value > 0 && value < 0.01) return '<1%';
  if (value < 1 && value > 0.99) return '>99%';
  return `${Math.round(value * 100)}%`;
}

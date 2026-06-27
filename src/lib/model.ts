import type { Team } from '@/domain/types';
import { poisson, type Rng } from './rng';

/**
 * A simple Poisson goal model shared by the sample-schedule generator and the
 * advancement simulation, so both speak the same statistical language.
 *
 * Expected goals scale with the rating gap between the two sides. It is a
 * deliberate approximation — good enough to make odds feel reasonable, not a
 * betting model.
 */
const BASE_GOALS = 1.35;
const RATING_SCALE = 0.0025; // ~0.25 goals per 100 rating points

export interface ExpectedGoals {
  home: number;
  away: number;
}

export function expectedGoals(home: Team, away: Team): ExpectedGoals {
  const diff = (home.rating - away.rating) * RATING_SCALE;
  return {
    home: clamp(BASE_GOALS + diff, 0.2, 5),
    away: clamp(BASE_GOALS - diff, 0.2, 5),
  };
}

export interface SimScore {
  home: number;
  away: number;
}

/** Simulate a single scoreline from the model using the supplied RNG. */
export function simulateScore(home: Team, away: Team, rng: Rng): SimScore {
  const xg = expectedGoals(home, away);
  return {
    home: poisson(xg.home, rng),
    away: poisson(xg.away, rng),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

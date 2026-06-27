import type { Team } from '@/domain/types';

/**
 * Cross-provider team-name matching. TheSportsDB names several nations
 * differently from our FIFA-based names (e.g. "South Korea" vs "Korea Republic"),
 * so we normalize (strip case/diacritics/punctuation) and keep a small alias
 * table keyed by FIFA code for the ones that still differ after normalizing.
 *
 * Matching requires BOTH teams of a fixture to match, so a missing alias yields
 * no match (and no scorers) rather than a wrong match.
 */
export function normalizeName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip combining diacritical marks
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/** Extra accepted names per FIFA code, beyond the team's own `name`. */
const ALIASES: Record<string, string[]> = {
  KOR: ['South Korea', 'Korea'],
  CZE: ['Czech Republic'],
  BIH: ['Bosnia-Herzegovina', 'Bosnia'],
  USA: ['USA', 'United States of America'],
  TUR: ['Turkey', 'Turkiye'],
  CIV: ['Ivory Coast', "Cote d'Ivoire"],
  CUW: ['Curacao'],
  KSA: ['Saudi Arabia'],
  COD: ['DR Congo', 'Congo DR', 'Democratic Republic of the Congo'],
  CPV: ['Cabo Verde'],
  IRN: ['IR Iran'],
};

/** Whether a provider-supplied name refers to the given team. */
export function matchesTeam(
  candidate: string | null | undefined,
  team: Team,
): boolean {
  const norm = normalizeName(candidate ?? '');
  if (!norm) return false;
  const accepted = new Set([
    normalizeName(team.name),
    ...(ALIASES[team.code.toUpperCase()] ?? []).map(normalizeName),
  ]);
  return accepted.has(norm);
}
